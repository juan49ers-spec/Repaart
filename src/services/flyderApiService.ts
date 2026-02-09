/**
 * Flyder API Service
 * 
 * Servicio para integración con API real de Flyder
 * Maneja autenticación, requests y sincronización de datos
 */

import { Timestamp } from 'firebase/firestore';

// Configuración desde variables de entorno
const FLYDER_CONFIG = {
  host: import.meta.env.VITE_FLYDER_API_HOST || 'api.flyder.app',
  database: import.meta.env.VITE_FLYDER_DATABASE || 'flyder_prod',
  user: import.meta.env.VITE_FLYDER_USER || 'repaart_dashboard',
  password: import.meta.env.VITE_FLYDER_PASSWORD || '',
  baseUrl: `https://${import.meta.env.VITE_FLYDER_API_HOST || 'api.flyder.app'}/api/v1`
};

// Interfaces de la API Flyder
export interface FlyderApiShift {
  id: string;
  rider_id: string;
  rider_name: string;
  franchise_id: string;
  start_at: string; // ISO 8601
  end_at: string; // ISO 8601
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: string;
  moto_id: string | null;
  moto_plate: string;
  created_at: string;
  updated_at: string;
}

export interface FlyderApiOrder {
  id: string;
  rider_id: string;
  franchise_id: string;
  distance: number; // km
  status: 'pending' | 'in_progress' | 'finished' | 'cancelled';
  finished_at: string | null;
  amount: number;
  created_at: string;
}

export interface FlyderApiRider {
  id: string;
  name: string;
  email: string;
  phone: string;
  franchise_id: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface FlyderApiAuthResponse {
  token: string;
  expires_at: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

class FlyderApiService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  /**
   * Autenticar con la API de Flyder
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${FLYDER_CONFIG.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          database: FLYDER_CONFIG.database,
          user: FLYDER_CONFIG.user,
          password: FLYDER_CONFIG.password
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data: FlyderApiAuthResponse = await response.json();
      this.token = data.token;
      this.tokenExpiry = new Date(data.expires_at);
      
      console.log('[Flyder API] Authenticated successfully');
      return true;
    } catch (error) {
      console.error('[Flyder API] Authentication error:', error);
      return false;
    }
  }

  /**
   * Verificar si el token es válido
   */
  private isTokenValid(): boolean {
    if (!this.token || !this.tokenExpiry) return false;
    // Considerar expirado 5 minutos antes
    const expiryBuffer = new Date(this.tokenExpiry.getTime() - 5 * 60 * 1000);
    return new Date() < expiryBuffer;
  }

  /**
   * Asegurar autenticación antes de requests
   */
  private async ensureAuth(): Promise<void> {
    if (!this.isTokenValid()) {
      const success = await this.authenticate();
      if (!success) {
        throw new Error('Failed to authenticate with Flyder API');
      }
    }
  }

  /**
   * Realizar request con retry logic
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    await this.ensureAuth();

    const url = `${FLYDER_CONFIG.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        // Si es 401, intentar re-autenticar
        if (response.status === 401 && retryCount < this.maxRetries) {
          this.token = null;
          await this.ensureAuth();
          return this.request(endpoint, options, retryCount + 1);
        }

        const error: ApiError = await response.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`
        }));

        throw new Error(error.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.warn(`[Flyder API] Retry ${retryCount + 1}/${this.maxRetries} for ${endpoint}`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.request(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // ENDPOINTS - SHIFTS
  // ============================================

  /**
   * Obtener turnos por franquicia y rango de fechas
   */
  async getShifts(
    franchiseId: string,
    startDate: string,
    endDate: string
  ): Promise<FlyderApiShift[]> {
    return this.request<FlyderApiShift[]>(
      `/shifts?franchise_id=${franchiseId}&start_date=${startDate}&end_date=${endDate}`
    );
  }

  /**
   * Obtener turnos activos en este momento
   */
  async getActiveShifts(franchiseId?: string): Promise<FlyderApiShift[]> {
    const query = franchiseId ? `?franchise_id=${franchiseId}` : '';
    return this.request<FlyderApiShift[]>(`/shifts/active${query}`);
  }

  /**
   * Obtener detalle de un turno específico
   */
  async getShiftById(shiftId: string): Promise<FlyderApiShift> {
    return this.request<FlyderApiShift>(`/shifts/${shiftId}`);
  }

  // ============================================
  // ENDPOINTS - ORDERS
  // ============================================

  /**
   * Obtener pedidos por franquicia y rango de fechas
   */
  async getOrders(
    franchiseId: string,
    startDate: string,
    endDate: string,
    status?: string
  ): Promise<FlyderApiOrder[]> {
    let url = `/orders?franchise_id=${franchiseId}&start_date=${startDate}&end_date=${endDate}`;
    if (status) url += `&status=${status}`;
    return this.request<FlyderApiOrder[]>(url);
  }

  /**
   * Obtener pedidos por rider
   */
  async getOrdersByRider(
    riderId: string,
    startDate: string,
    endDate: string
  ): Promise<FlyderApiOrder[]> {
    return this.request<FlyderApiOrder[]>(
      `/orders?rider_id=${riderId}&start_date=${startDate}&end_date=${endDate}`
    );
  }

  // ============================================
  // ENDPOINTS - RIDERS
  // ============================================

  /**
   * Obtener riders por franquicia
   */
  async getRiders(franchiseId: string): Promise<FlyderApiRider[]> {
    return this.request<FlyderApiRider[]>(`/riders?franchise_id=${franchiseId}`);
  }

  /**
   * Obtener detalle de un rider
   */
  async getRiderById(riderId: string): Promise<FlyderApiRider> {
    return this.request<FlyderApiRider>(`/riders/${riderId}`);
  }

  // ============================================
  // SYNC METHODS
  // ============================================

  /**
   * Sincronizar turnos desde Flyder a formato Firestore
   */
  async syncShifts(
    franchiseId: string,
    date: string
  ): Promise<Array<{
    id: string;
    riderId: string;
    riderName: string;
    franchiseId: string;
    startAt: Timestamp;
    endAt: Timestamp;
    status: string;
    type: string;
    motoId: string | null;
    motoPlate: string;
    source: 'flyder';
    lastSync: Timestamp;
  }>> {
    const shifts = await this.getShifts(franchiseId, date, date);
    
    return shifts.map(shift => ({
      id: shift.id,
      riderId: shift.rider_id,
      riderName: shift.rider_name,
      franchiseId: shift.franchise_id,
      startAt: Timestamp.fromDate(new Date(shift.start_at)),
      endAt: Timestamp.fromDate(new Date(shift.end_at)),
      status: shift.status,
      type: shift.type,
      motoId: shift.moto_id,
      motoPlate: shift.moto_plate,
      source: 'flyder' as const,
      lastSync: Timestamp.now()
    }));
  }

  /**
   * Sincronizar pedidos desde Flyder
   */
  async syncOrders(
    franchiseId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{
    id: string;
    riderId: string;
    distance: number;
    status: string;
    finishedAt?: Timestamp;
    amount: number;
  }>> {
    const orders = await this.getOrders(franchiseId, startDate, endDate, 'finished');
    
    return orders.map(order => ({
      id: order.id,
      riderId: order.rider_id,
      distance: order.distance,
      status: order.status,
      finishedAt: order.finished_at 
        ? Timestamp.fromDate(new Date(order.finished_at))
        : undefined,
      amount: order.amount
    }));
  }

  /**
   * Verificar estado de la API
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    return this.request<{ status: string; version: string }>('/health');
  }
}

export const flyderApiService = new FlyderApiService();
export default flyderApiService;
