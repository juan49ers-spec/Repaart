/**
 * Orders History Service
 * 
 * Servicio para gestionar y consultar el historial completo de pedidos
 * sincronizados desde la API de Flyder
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Order {
  id: string;
  riderId: string;
  riderName?: string;
  franchiseId: string;
  franchiseName?: string;
  storeId?: string;
  storeName?: string;
  distance: number; // km
  status: 'pending' | 'in_progress' | 'finished' | 'cancelled';
  amount: number;
  platform?: 'glovo' | 'uber' | 'justeat' | 'other';
  createdAt: Timestamp;
  finishedAt?: Timestamp;
  deliveryTime?: number; // minutos
  customerAddress?: string;
  orderNumber?: string;
}

export interface OrdersFilter {
  franchiseId?: string;
  storeId?: string;
  riderId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: Order['status'];
  platform?: Order['platform'];
}

export interface OrdersSummary {
  totalOrders: number;
  totalDistance: number;
  totalAmount: number;
  averageDistance: number;
  averageAmount: number;
  finishedOrders: number;
  cancelledOrders: number;
  byPlatform: Record<string, number>;
  byStatus: Record<string, number>;
  byDay: Record<string, number>;
  byHour: Record<number, number>;
  topRiders: Array<{ riderId: string; riderName?: string; totalOrders: number; totalAmount: number }>;
  topFranchises: Array<{ franchiseId: string; franchiseName?: string; totalOrders: number; totalAmount: number }>;
}

export interface PaginatedOrders {
  orders: Order[];
  hasMore: boolean;
  lastDoc?: any;
}

class OrdersHistoryService {
  private readonly ordersCollection = 'orders';
  private readonly pageSize = 50;

  /**
   * Obtener pedidos con filtros
   */
  async getOrders(filter?: OrdersFilter, pageSize: number = this.pageSize): Promise<Order[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // Aplicar filtros
      if (filter?.franchiseId) {
        constraints.push(where('franchiseId', '==', filter.franchiseId));
      }

      if (filter?.storeId) {
        constraints.push(where('storeId', '==', filter.storeId));
      }

      if (filter?.riderId) {
        constraints.push(where('riderId', '==', filter.riderId));
      }

      if (filter?.status) {
        constraints.push(where('status', '==', filter.status));
      }

      if (filter?.platform) {
        constraints.push(where('platform', '==', filter.platform));
      }

      // Filtro de fechas
      if (filter?.startDate) {
        constraints.push(where('createdAt', '>=', Timestamp.fromDate(filter.startDate)));
      }

      if (filter?.endDate) {
        constraints.push(where('createdAt', '<=', Timestamp.fromDate(filter.endDate)));
      }

      // Ordenar por fecha descendente
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(pageSize));

      const q = query(collection(db, this.ordersCollection), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('[OrdersHistory] Error getting orders:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los pedidos (para admin)
   */
  async getAllOrders(limit_count: number = 100): Promise<Order[]> {
    try {
      const q = query(
        collection(db, this.ordersCollection),
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      console.error('[OrdersHistory] Error getting all orders:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de pedidos con análisis avanzado
   */
  async getOrdersSummary(filter?: OrdersFilter): Promise<OrdersSummary> {
    try {
      const orders = await this.getOrders(filter, 1000);

      const summary: OrdersSummary = {
        totalOrders: orders.length,
        totalDistance: 0,
        totalAmount: 0,
        averageDistance: 0,
        averageAmount: 0,
        finishedOrders: 0,
        cancelledOrders: 0,
        byPlatform: {},
        byStatus: {},
        byDay: {},
        byHour: {},
        topRiders: [],
        topFranchises: []
      };

      const riderStats = new Map<string, { riderId: string; riderName?: string; totalOrders: number; totalAmount: number }>();
      const franchiseStats = new Map<string, { franchiseId: string; franchiseName?: string; totalOrders: number; totalAmount: number }>();

      orders.forEach(order => {
        summary.totalDistance += order.distance || 0;
        summary.totalAmount += order.amount || 0;

        // Contar por estado
        summary.byStatus[order.status] = (summary.byStatus[order.status] || 0) + 1;
        if (order.status === 'finished') summary.finishedOrders++;
        if (order.status === 'cancelled') summary.cancelledOrders++;

        // Contar por plataforma
        const platform = order.platform || 'other';
        summary.byPlatform[platform] = (summary.byPlatform[platform] || 0) + 1;

        // Contar por día
        const date = order.createdAt?.toDate?.();
        if (date) {
          const dayKey = date.toISOString().split('T')[0];
          summary.byDay[dayKey] = (summary.byDay[dayKey] || 0) + 1;
          
          // Contar por hora
          const hour = date.getHours();
          summary.byHour[hour] = (summary.byHour[hour] || 0) + 1;
        }

        // Stats por rider
        if (order.riderId) {
          const existing = riderStats.get(order.riderId);
          if (existing) {
            existing.totalOrders++;
            existing.totalAmount += order.amount || 0;
          } else {
            riderStats.set(order.riderId, {
              riderId: order.riderId,
              riderName: order.riderName,
              totalOrders: 1,
              totalAmount: order.amount || 0
            });
          }
        }

        // Stats por franquicia
        if (order.franchiseId) {
          const existing = franchiseStats.get(order.franchiseId);
          if (existing) {
            existing.totalOrders++;
            existing.totalAmount += order.amount || 0;
          } else {
            franchiseStats.set(order.franchiseId, {
              franchiseId: order.franchiseId,
              franchiseName: order.franchiseName,
              totalOrders: 1,
              totalAmount: order.amount || 0
            });
          }
        }
      });

      // Calcular promedios
      if (orders.length > 0) {
        summary.averageDistance = summary.totalDistance / orders.length;
        summary.averageAmount = summary.totalAmount / orders.length;
      }

      // Top 5 riders y franquicias
      summary.topRiders = Array.from(riderStats.values())
        .sort((a, b) => b.totalOrders - a.totalOrders)
        .slice(0, 5);
      
      summary.topFranchises = Array.from(franchiseStats.values())
        .sort((a, b) => b.totalOrders - a.totalOrders)
        .slice(0, 5);

      return summary;
    } catch (error) {
      console.error('[OrdersHistory] Error getting summary:', error);
      throw error;
    }
  }

  /**
   * Obtener pedidos por franquicia
   */
  async getOrdersByFranchise(franchiseId: string, limit_count: number = 100): Promise<Order[]> {
    return this.getOrders({ franchiseId }, limit_count);
  }

  /**
   * Obtener pedidos por rider
   */
  async getOrdersByRider(riderId: string, limit_count: number = 100): Promise<Order[]> {
    return this.getOrders({ riderId }, limit_count);
  }

  /**
   * Obtener pedidos por rango de fechas
   */
  async getOrdersByDateRange(startDate: Date, endDate: Date, franchiseId?: string): Promise<Order[]> {
    return this.getOrders({ startDate, endDate, franchiseId }, 500);
  }
}

export const ordersHistoryService = new OrdersHistoryService();
export default ordersHistoryService;
