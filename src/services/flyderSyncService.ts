/**
 * Flyder Sync Service
 * 
 * Servicio para sincronización continua entre Flyder API y Firestore
 * Incluye polling, webhooks y manejo de conflictos
 */

import { 
  collection, 
  doc, 
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { flyderApiService } from './flyderApiService';

interface SyncConfig {
  franchiseId: string;
  pollInterval: number; // ms
  enabled: boolean;
}

interface SyncStatus {
  lastSync: Timestamp | null;
  isSyncing: boolean;
  error: string | null;
  totalRecords: number;
}

class FlyderSyncService {
  private syncConfigs = new Map<string, SyncConfig>();
  private syncIntervals = new Map<string, NodeJS.Timeout>();
  private syncStatus = new Map<string, SyncStatus>();

  /**
   * Iniciar sincronización para una franquicia
   */
  startSync(config: SyncConfig): void {
    const { franchiseId, pollInterval } = config;
    
    // Detener sincronización existente si hay
    this.stopSync(franchiseId);
    
    this.syncConfigs.set(franchiseId, config);
    this.syncStatus.set(franchiseId, {
      lastSync: null,
      isSyncing: false,
      error: null,
      totalRecords: 0
    });

    // Realizar sync inicial
    this.performSync(franchiseId);

    // Configurar intervalo de polling
    const interval = setInterval(() => {
      this.performSync(franchiseId);
    }, pollInterval);

    this.syncIntervals.set(franchiseId, interval);
    
    console.log(`[Flyder Sync] Started for franchise ${franchiseId}`);
  }

  /**
   * Detener sincronización
   */
  stopSync(franchiseId: string): void {
    const interval = this.syncIntervals.get(franchiseId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(franchiseId);
      console.log(`[Flyder Sync] Stopped for franchise ${franchiseId}`);
    }
  }

  /**
   * Realizar sincronización manual
   */
  async performSync(franchiseId: string): Promise<void> {
    const config = this.syncConfigs.get(franchiseId);
    if (!config || !config.enabled) return;

    const status = this.syncStatus.get(franchiseId);
    if (status?.isSyncing) {
      console.log(`[Flyder Sync] Already syncing for ${franchiseId}, skipping...`);
      return;
    }

    this.updateStatus(franchiseId, { isSyncing: true, error: null });

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Sync shifts
      await this.syncShifts(franchiseId, today);
      
      // Sync orders
      await this.syncOrders(franchiseId, today);
      
      this.updateStatus(franchiseId, {
        lastSync: Timestamp.now(),
        isSyncing: false,
        error: null
      });

      console.log(`[Flyder Sync] Completed for franchise ${franchiseId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateStatus(franchiseId, {
        isSyncing: false,
        error: errorMessage
      });
      console.error(`[Flyder Sync] Error for franchise ${franchiseId}:`, error);
    }
  }

  /**
   * Sincronizar turnos
   */
  private async syncShifts(franchiseId: string, date: string): Promise<void> {
    const shifts = await flyderApiService.syncShifts(franchiseId, date);
    
    if (shifts.length === 0) return;

    // Usar batch para operaciones atómicas
    const batch = writeBatch(db);
    const shiftsRef = collection(db, 'work_shifts');

    for (const shift of shifts) {
      const shiftDoc = doc(shiftsRef, shift.id);
      batch.set(shiftDoc, shift, { merge: true });
    }

    await batch.commit();
    
    const status = this.syncStatus.get(franchiseId);
    if (status) {
      status.totalRecords += shifts.length;
    }

    console.log(`[Flyder Sync] Synced ${shifts.length} shifts`);
  }

  /**
   * Sincronizar pedidos
   */
  private async syncOrders(franchiseId: string, date: string): Promise<void> {
    const orders = await flyderApiService.syncOrders(franchiseId, date, date);
    
    if (orders.length === 0) return;

    const batch = writeBatch(db);
    const ordersRef = collection(db, 'orders');

    for (const order of orders) {
      const orderDoc = doc(ordersRef, order.id);
      batch.set(orderDoc, {
        ...order,
        franchiseId,
        createdAt: order.finishedAt || Timestamp.now()
      }, { merge: true });
    }

    await batch.commit();
    
    const status = this.syncStatus.get(franchiseId);
    if (status) {
      status.totalRecords += orders.length;
    }

    console.log(`[Flyder Sync] Synced ${orders.length} orders`);
  }

  /**
   * Actualizar estado de sincronización
   */
  private updateStatus(
    franchiseId: string, 
    updates: Partial<SyncStatus>
  ): void {
    const current = this.syncStatus.get(franchiseId);
    if (current) {
      this.syncStatus.set(franchiseId, { ...current, ...updates });
    }
  }

  /**
   * Obtener estado de sincronización
   */
  getStatus(franchiseId: string): SyncStatus | null {
    return this.syncStatus.get(franchiseId) || null;
  }

  /**
   * Verificar si hay sincronización activa
   */
  isSyncing(franchiseId: string): boolean {
    return this.syncIntervals.has(franchiseId);
  }

  /**
   * Detener todas las sincronizaciones
   */
  stopAll(): void {
    for (const [franchiseId] of this.syncIntervals) {
      this.stopSync(franchiseId);
    }
  }

  /**
   * Forzar sincronización inmediata
   */
  async forceSync(franchiseId: string): Promise<void> {
    await this.performSync(franchiseId);
  }

  /**
   * Sincronización histórica (para backfill)
   */
  async syncHistorical(
    franchiseId: string,
    startDate: string,
    endDate: string,
    onProgress?: (progress: number) => void
  ): Promise<{ shifts: number; orders: number }> {
    console.log(`[Flyder Sync] Starting historical sync for ${franchiseId} from ${startDate} to ${endDate}`);
    
    let totalShifts = 0;
    let totalOrders = 0;
    
    // Obtener rango de fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      try {
        // Sync shifts del día
        const shifts = await flyderApiService.syncShifts(franchiseId, dateStr);
        if (shifts.length > 0) {
          const batch = writeBatch(db);
          const shiftsRef = collection(db, 'work_shifts');
          
          for (const shift of shifts) {
            const shiftDoc = doc(shiftsRef, shift.id);
            batch.set(shiftDoc, shift, { merge: true });
          }
          
          await batch.commit();
          totalShifts += shifts.length;
        }
        
        // Sync orders del día
        const orders = await flyderApiService.syncOrders(franchiseId, dateStr, dateStr);
        if (orders.length > 0) {
          const batch = writeBatch(db);
          const ordersRef = collection(db, 'orders');
          
          for (const order of orders) {
            const orderDoc = doc(ordersRef, order.id);
            batch.set(orderDoc, {
              ...order,
              franchiseId,
              createdAt: order.finishedAt || Timestamp.now()
            }, { merge: true });
          }
          
          await batch.commit();
          totalOrders += orders.length;
        }
        
        // Reportar progreso
        if (onProgress) {
          onProgress(Math.round((i / days) * 100));
        }
        
      } catch (error) {
        console.error(`[Flyder Sync] Error syncing ${dateStr}:`, error);
      }
    }
    
    console.log(`[Flyder Sync] Historical sync completed. Shifts: ${totalShifts}, Orders: ${totalOrders}`);
    
    return { shifts: totalShifts, orders: totalOrders };
  }
}

export const flyderSyncService = new FlyderSyncService();
export default flyderSyncService;
