import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import mysql from 'mysql2/promise';

const getFlyderConnection = async () => {
  const host = process.env.FLYDER_HOST;
  const user = process.env.FLYDER_USER;
  const password = process.env.FLYDER_PASSWORD;
  const database = process.env.FLYDER_DATABASE;

  if (!host || !user || !password || !database) {
    throw new Error('Missing Flyder database configuration');
  }

  console.log('[Flyder] Connecting to database:', { host, user, database });

  return await mysql.createConnection({
    host,
    user,
    password,
    database,
    connectTimeout: 10000,
    // Configure to return dates as strings instead of Date objects
    dateStrings: true
  });
};

const mapFlyderStatusToStandard = (flyderStatus: string): string => {
  const statusMap: { [key: string]: string } = {
    'new': 'pending',
    'processing': 'in_progress',
    'retrying': 'in_progress',
    'assigned': 'in_progress',
    'finished': 'completed',
    'cancelled': 'cancelled',
    'exhausted': 'cancelled',
    'assign_error': 'cancelled'
  };
  return statusMap[flyderStatus] || flyderStatus;
};

export const getFlyderOrders = functions.https.onCall(async (data, context) => {
  console.log('[Flyder] getFlyderOrders called');

  const auth = context.auth;
  if (!auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debes estar autenticado para acceder a los datos de Flyder'
    );
  }

  try {
    const user = await admin.auth().getUser(auth.uid);
    const userRole = user.customClaims?.role;

    if (userRole !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'No tienes permisos para acceder a los datos de Flyder'
      );
    }

    const limit = data?.limit || 50;
    const offset = data?.offset || 0;
    const franchiseId = data?.franchiseId;
    const status = data?.status;

    console.log('[Flyder] Fetching orders with params:', { limit, offset, franchiseId, status });

    const connection = await getFlyderConnection();

    try {
      let query = `
        SELECT 
          o.id,
          o.sku,
          o.status,
          o.cancelled_by,
          o.cancel_reason,
          o.cancel_details,
          o.amount,
          o.payment_method,
          o.final_payment_method,
          o.distance,
          o.duration,
          o.scheduled,
          o.ready_time,
          o.ready_to_pick_up,
          o.ready_to_pick_up_time,
          o.created_at,
          o.updated_at,
          o.ext_order_id,
          o.ext_order_sku,
          o.ext_order_timestamp,
          o.order_number,
          o.customer_name,
          o.customer_phone,
          o.customer_addr_street,
          o.customer_addr_no,
          o.customer_addr_floor,
          o.customer_addr_door,
          o.customer_addr_postal_code,
          o.customer_addr_prov,
          o.customer_addr_city,
          o.customer_addr_other,
          o.customer_latitude,
          o.customer_longitude,
          o.customer_place_id,
          o.cold,
          o.size,
          o.comments,
          o.details,
          o.urgent,
          o.assignment_attempts,
          o.source,
          o.source_id,
          o.store_id,
          o.shift_id,
          s.name as store_name,
          b.id as franchise_id,
          b.name as franchise_name,
          r.id as rider_id,
          r.name as rider_name,
          r.surname as rider_surname
        FROM orders o
        LEFT JOIN stores s ON o.store_id = s.id
        LEFT JOIN businesses b ON s.business_id = b.id
        LEFT JOIN services svc ON o.id = svc.order_id
        LEFT JOIN riders r ON svc.rider_id = r.id
      `;
      
      const conditions: string[] = [];
      const params: any[] = [];

      if (franchiseId) {
        conditions.push('b.id = ?');
        params.push(franchiseId);
      }

      if (status) {
        conditions.push('o.status = ?');
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      console.log('[Flyder] Executing query:', query, 'with params:', params);

      const [rows] = await connection.execute(query, params);

      const mappedRows = (rows as any[]).map(row => {
        const riderName = row.rider_name && row.rider_surname 
          ? `${row.rider_name} ${row.rider_surname}` 
          : row.rider_name || null;
        
        return {
          ...row,
          status: mapFlyderStatusToStandard(row.status),
          total: parseFloat(row.amount) || 0,
          rider_name: riderName
        };
      });

      console.log('[Flyder] Query successful, rows:', mappedRows.length);

      return {
        success: true,
        data: mappedRows,
        count: mappedRows.length
      };
    } finally {
      await connection.end();
      console.log('[Flyder] Connection closed');
    }
  } catch (error) {
    console.error('[Flyder] Error fetching orders:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      `Error al obtener los pedidos de Flyder: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

export const getFlyderOrdersStats = functions.https.onCall(async (data, context) => {
  console.log('[Flyder] getFlyderOrdersStats called');

  const auth = context.auth;
  if (!auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debes estar autenticado'
    );
  }

  try {
    const user = await admin.auth().getUser(auth.uid);
    const userRole = user.customClaims?.role;

    if (userRole !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'No tienes permisos'
      );
    }

    console.log('[Flyder] Fetching stats');

    const connection = await getFlyderConnection();

    try {
      const [stats] = await connection.execute(`
        SELECT
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'finished' THEN 1 END) as completed,
          COUNT(CASE WHEN status IN ('new', 'processing', 'retrying', 'assigned') THEN 1 END) as pending,
          COUNT(CASE WHEN status IN ('cancelled', 'exhausted', 'assign_error') THEN 1 END) as cancelled,
          COALESCE(SUM(amount), 0) as total_revenue
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);

      console.log('[Flyder] Stats query successful');

      const statsRow = (stats as any)[0];
      return {
        success: true,
        stats: {
          ...statsRow,
          total_revenue: Number(statsRow.total_revenue || 0)
        }
      };
    } finally {
      await connection.end();
      console.log('[Flyder] Connection closed');
    }
  } catch (error) {
    console.error('[Flyder] Error fetching stats:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      `Error al obtener estadísticas de Flyder: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});