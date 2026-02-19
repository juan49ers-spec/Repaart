import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export interface FlyderOrder {
  id: number;
  sku?: string;
  status: string;
  cancelled_by?: number;
  cancel_reason?: string;
  cancel_details?: string;
  total: number;
  payment_method?: string;
  final_payment_method?: string;
  distance?: number;
  duration?: number;
  scheduled?: number;
  ready_time?: string;
  ready_to_pick_up?: number;
  ready_to_pick_up_time?: string;
  created_at: string;
  updated_at?: string;
  ext_order_id?: string;
  ext_order_sku?: string;
  ext_order_timestamp?: string;
  order_number?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_addr_street?: string;
  customer_addr_no?: string;
  customer_addr_floor?: string;
  customer_addr_door?: string;
  customer_addr_postal_code?: string;
  customer_addr_prov?: string;
  customer_addr_city?: string;
  customer_addr_other?: string;
  customer_latitude?: number;
  customer_longitude?: number;
  customer_place_id?: string;
  cold?: number;
  size?: string;
  comments?: string;
  details?: string;
  urgent?: number;
  assignment_attempts?: number;
  source?: string;
  source_id?: string;
  store_id?: number;
  shift_id?: number;
  store_name?: string;
  franchise_id?: number;
  franchise_name?: string;
  rider_id?: number;
  rider_name?: string;
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