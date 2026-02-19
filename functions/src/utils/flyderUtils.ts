import * as mysql from 'mysql2/promise';

/**
 * Establece conexión con Flyder DB
 */
export const getFlyderConnection = async () => {
    const host = process.env.FLYDER_HOST;
    const user = process.env.FLYDER_USER;
    const password = process.env.FLYDER_PASSWORD;
    const database = process.env.FLYDER_DATABASE;

    if (!host || !user || !password || !database) {
        throw new Error('Missing Flyder DB credentials in environment variables');
    }

    return await mysql.createConnection({
        host,
        user,
        password,
        database,
        connectTimeout: 10000,
        dateStrings: true
    });
};

/**
 * Mapea estados de Flyder a Repaart
 */
export const mapFlyderStatusToStandard = (flyderStatus: string): string => {
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

/**
 * Detecta anomalías en el pedido para Quality Gate
 */
export const detectAnomalies = (order: any): string[] => {
    const anomalies: string[] = [];

    // 1. Duración sospechosamente corta (< 5 min)
    if (order.duration && order.duration < 300) {
        anomalies.push('suspicious_duration');
    }

    // 2. Distancia sospechosamente larga (> 15km)
    if (order.distance && order.distance > 15000) {
        anomalies.push('extreme_distance');
    }

    // 3. Sin coordenadas (Geolocalización fallida)
    if (!order.customer_latitude || !order.customer_longitude) {
        anomalies.push('missing_geolocation');
    }

    return anomalies;
};

/**
 * Calcula Unit Economics básicos del pedido
 */
export const calculateUnitEconomics = (order: any) => {
    // Tarifas hardcodeadas por defecto (mejorar con config en DB futuramente)
    const BASE_DELIVERY_FEE = 3.50; // € cobrado al cliente/restaurante
    const RIDER_COST_PER_ORDER = 2.00; // € coste driver aprox
    const PLATFORM_FEE = 0.50; // € coste tech/stripe

    // Si tuviéramos datos reales de coste en Flyder, los usaríamos.
    // Por ahora, estimación para MVP.
    // const revenue = parseFloat(order.amount) || 0; // Ojo: amount suele ser valor comida, no fee.
    // Asumiremos que el revenue de logística es fijo por ahora si no viene desglosado.

    // TODO: Refinar lógica de pricing real de Repaart
    const estimatedMargin = BASE_DELIVERY_FEE - (RIDER_COST_PER_ORDER + PLATFORM_FEE);

    return {
        revenue: BASE_DELIVERY_FEE,
        cost: RIDER_COST_PER_ORDER + PLATFORM_FEE,
        profit: estimatedMargin,
        currency: 'EUR'
    };
};
