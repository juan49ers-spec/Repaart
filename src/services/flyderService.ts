import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export interface FlyderOrder {
  id: number;
  order_id: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_address?: string;
  rider_name?: string;
  franchise_id?: string;
  platform?: string;
}

export interface FlyderOrdersResponse {
  success: boolean;
  data: FlyderOrder[];
  count: number;
}

export interface FlyderStatsResponse {
  success: boolean;
  stats: {
    total_orders: number;
    completed: number;
    pending: number;
    cancelled: number;
    total_revenue: number;
  };
}

export const flyderService = {
  async getOrders(params?: {
    limit?: number;
    offset?: number;
    franchiseId?: string;
    status?: string;
  }): Promise<FlyderOrdersResponse> {
    try {
      const getFlyderOrdersFn = httpsCallable(functions, 'getFlyderOrders');
      const result = await getFlyderOrdersFn(params || {});

      return result.data as FlyderOrdersResponse;
    } catch (error) {
      console.error('[FlyderService] Error getting orders:', error);
      throw error;
    }
  },

  async getStats(): Promise<FlyderStatsResponse> {
    try {
      const getFlyderOrdersStatsFn = httpsCallable(functions, 'getFlyderOrdersStats');
      const result = await getFlyderOrdersStatsFn({});

      return result.data as FlyderStatsResponse;
    } catch (error) {
      console.error('[FlyderService] Error getting stats:', error);
      throw error;
    }
  }
};