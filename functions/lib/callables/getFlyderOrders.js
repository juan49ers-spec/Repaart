"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFlyderOrdersStats = exports.getFlyderOrders = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const promise_1 = __importDefault(require("mysql2/promise"));
const getFlyderConnection = async () => {
    const host = process.env.FLYDER_HOST;
    const user = process.env.FLYDER_USER;
    const password = process.env.FLYDER_PASSWORD;
    const database = process.env.FLYDER_DATABASE;
    if (!host || !user || !password || !database) {
        throw new Error('Missing Flyder database configuration');
    }
    console.log('[Flyder] Connecting to database:', { host, user, database });
    return await promise_1.default.createConnection({
        host,
        user,
        password,
        database,
        connectTimeout: 10000
    });
};
exports.getFlyderOrders = functions.https.onCall(async (data, context) => {
    var _a;
    console.log('[Flyder] getFlyderOrders called');
    const auth = context.auth;
    if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado para acceder a los datos de Flyder');
    }
    try {
        const user = await admin.auth().getUser(auth.uid);
        const userRole = (_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.role;
        if (userRole !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para acceder a los datos de Flyder');
        }
        const limit = (data === null || data === void 0 ? void 0 : data.limit) || 50;
        const offset = (data === null || data === void 0 ? void 0 : data.offset) || 0;
        const franchiseId = data === null || data === void 0 ? void 0 : data.franchiseId;
        const status = data === null || data === void 0 ? void 0 : data.status;
        console.log('[Flyder] Fetching orders with params:', { limit, offset, franchiseId, status });
        const connection = await getFlyderConnection();
        try {
            let query = 'SELECT * FROM orders';
            const conditions = [];
            const params = [];
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
            console.log('[Flyder] Query successful, rows:', rows.length);
            return {
                success: true,
                data: rows,
                count: rows.length
            };
        }
        finally {
            await connection.end();
            console.log('[Flyder] Connection closed');
        }
    }
    catch (error) {
        console.error('[Flyder] Error fetching orders:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', `Error al obtener los pedidos de Flyder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
exports.getFlyderOrdersStats = functions.https.onCall(async (data, context) => {
    var _a;
    console.log('[Flyder] getFlyderOrdersStats called');
    const auth = context.auth;
    if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado');
    }
    try {
        const user = await admin.auth().getUser(auth.uid);
        const userRole = (_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.role;
        if (userRole !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'No tienes permisos');
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
                stats: stats[0]
            };
        }
        finally {
            await connection.end();
            console.log('[Flyder] Connection closed');
        }
    }
    catch (error) {
        console.error('[Flyder] Error fetching stats:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', `Error al obtener estadísticas de Flyder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
//# sourceMappingURL=getFlyderOrders.js.map