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
    connectTimeout: 10000
  });
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
      let query = 'SELECT * FROM orders';
      const conditions: string[] = [];
      const params: any[] = [];

      if (franchiseId) {
        conditions.push('franchise_id = ?');
        params.push(franchiseId);
      }

      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      console.log('[Flyder] Executing query:', query, 'with params:', params);

      const [rows] = await connection.execute(query, params);

      console.log('[Flyder] Query successful, rows:', (rows as any[]).length);

      return {
        success: true,
        data: rows,
        count: (rows as any[]).length
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
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          SUM(total) as total_revenue
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);

      console.log('[Flyder] Stats query successful');

      return {
        success: true,
        stats: (stats as any)[0]
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