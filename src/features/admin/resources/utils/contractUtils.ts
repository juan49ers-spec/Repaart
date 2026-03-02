/**
 * Detects placeholders in format [PLACEHOLDER] within a text.
 */
export const extractPlaceholders = (text: string): string[] => {
    const regex = /\[([A-Z0-9_\s/]+)\]/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
        matches.add(match[1]);
    }
    return Array.from(matches);
};

/**
 * Replaces placeholders in a text with actual values.
 */
export const fillTemplate = (template: string, data: Record<string, string>): string => {
    let result = template;
    Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`\\[${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
        result = result.replace(regex, value || `[${key}]`);
    });
    return result;
};

export interface Restaurant {
    id: string;
    fiscalName: string;
    cif: string;
    address?: {
        street: string;
        city: string;
        province: string;
        postalCode?: string;
    };
    legalRepresentative?: string;
    phone?: string;
    email?: string;
}

/**
 * Maps restaurant data to template placeholder keys.
 */
export const mapRestaurantToPlaceholders = (restaurant: Restaurant, adminData: Record<string, any>): Record<string, string> => {
    const now = new Date();

    return {
        // Fecha
        'LOCALIDAD': restaurant.address?.city || '',
        'DÍA': now.getDate().toString(),
        'MES': new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(now),
        'AÑO': now.getFullYear().toString(),

        // Franquiciado (Emisor)
        'NOMBRE_DEL_FRANQUICIADO': adminData.legalName || adminData.displayName || '',
        'CIF_FRANQUICIA': adminData.cif || adminData.taxId || '',
        'DIRECCIÓN_FRANQUICIA': adminData.fiscalAddress || adminData.address || '',
        'CIUDAD_FRANQUICIA': adminData.city || '',
        'PROVINCIA_FRANQUICIA': adminData.province || '',
        'CP_FRANQUICIA': adminData.postalCode || adminData.zipCode || '',
        'REPRESENTANTE_LEGAL': adminData.legalRepresentative || adminData.representative || '',
        'DNI_REPRESENTANTE': adminData.dniRepresentative || adminData.representativeDni || '',
        'TELÉFONO_FRANQUICIA': adminData.phone || '',
        'EMAIL_FRANQUICIA': adminData.email || '',

        // Legacy (compatibilidad)
        'NOMBRE DEL FRANQUICIADO': adminData.displayName || adminData.legalName || '',
        'DNI': adminData.dni || adminData.cif || '',
        'DIRECCIÓN DE TU OFICINA/BASE': adminData.address || '',

        // Restaurante (Cliente)
        'NOMBRE_RESTAURANTE': restaurant.fiscalName || '',
        'CIF_RESTAURANTE': restaurant.cif || '',
        'DIRECCIÓN_RESTAURANTE': `${restaurant.address?.street || ''}, ${restaurant.address?.city || ''}`,
        'REPRESENTANTE_RESTAURANTE': restaurant.legalRepresentative || '',
        'TELÉFONO_RESTAURANTE': restaurant.phone || '',

        // Legacy restaurante
        'NOMBRE RESTAURANTE / RAZÓN SOCIAL': restaurant.fiscalName || '',
        'CIF': restaurant.cif || '',
        'NOMBRE DEL ADMINISTRADOR': restaurant.legalRepresentative || '',

        // Valores por defecto
        'X': '5',
        'RADIO_KM': '5',
        'CANTIDAD, EJ: 200': '200',
        'CANTIDAD, Ej: 150': '150',
        'INDICAR CANTIDAD': '150'
    };
};

// --- Variable Metadata for Smart UI ---

export type VariableGroup = 'fecha' | 'franquicia' | 'restaurante' | 'condiciones';
export type VariableInputType = 'text' | 'number' | 'currency';

export interface VariableMeta {
    label: string;
    group: VariableGroup;
    hint: string;
    autoFill: boolean;
    type: VariableInputType;
}

export const VARIABLE_GROUPS: Record<VariableGroup, { label: string; icon: string; description: string }> = {
    fecha: { label: 'Fecha y Lugar', icon: '📅', description: 'Datos de fecha y localización del contrato' },
    franquicia: { label: 'Datos de la Franquicia', icon: '🏢', description: 'Información fiscal y legal del franquiciado' },
    restaurante: { label: 'Datos del Restaurante', icon: '🍽️', description: 'Información del cliente/restaurante' },
    condiciones: { label: 'Condiciones del Servicio', icon: '⚙️', description: 'Parámetros operativos y económicos' },
};

export const VARIABLE_METADATA: Record<string, VariableMeta> = {
    // Fecha
    'LOCALIDAD': { label: 'Ciudad', group: 'fecha', hint: 'Ej: Madrid', autoFill: true, type: 'text' },
    'DÍA': { label: 'Día', group: 'fecha', hint: 'Día del mes', autoFill: true, type: 'text' },
    'MES': { label: 'Mes', group: 'fecha', hint: 'Ej: marzo', autoFill: true, type: 'text' },
    'AÑO': { label: 'Año', group: 'fecha', hint: 'Ej: 2026', autoFill: true, type: 'text' },

    // Franquicia
    'NOMBRE_DEL_FRANQUICIADO': { label: 'Nombre del Franquiciado', group: 'franquicia', hint: 'Razón social del franquiciado', autoFill: true, type: 'text' },
    'CIF_FRANQUICIA': { label: 'CIF de la Franquicia', group: 'franquicia', hint: 'Ej: B12345678', autoFill: true, type: 'text' },
    'DIRECCIÓN_BASE': { label: 'Dirección Base', group: 'franquicia', hint: 'Dirección fiscal del franquiciado', autoFill: true, type: 'text' },
    'DIRECCIÓN_FRANQUICIA': { label: 'Dirección Fiscal', group: 'franquicia', hint: 'Dirección fiscal del franquiciado', autoFill: true, type: 'text' },
    'REPRESENTANTE_LEGAL': { label: 'Representante Legal', group: 'franquicia', hint: 'Nombre completo', autoFill: true, type: 'text' },
    'DNI_REPRESENTANTE': { label: 'DNI del Representante', group: 'franquicia', hint: 'Ej: 12345678A', autoFill: true, type: 'text' },
    'TELÉFONO_FRANQUICIA': { label: 'Teléfono', group: 'franquicia', hint: 'Ej: 612345678', autoFill: true, type: 'text' },
    'EMAIL_FRANQUICIA': { label: 'Email', group: 'franquicia', hint: 'email@ejemplo.com', autoFill: true, type: 'text' },
    // Legacy
    'NOMBRE DEL FRANQUICIADO': { label: 'Nombre del Franquiciado', group: 'franquicia', hint: 'Razón social', autoFill: true, type: 'text' },
    'DNI': { label: 'DNI / CIF', group: 'franquicia', hint: 'Documento de identidad', autoFill: true, type: 'text' },
    'DIRECCIÓN DE TU OFICINA/BASE': { label: 'Dirección de la Oficina', group: 'franquicia', hint: 'Dirección base del franquiciado', autoFill: true, type: 'text' },

    // Restaurante
    'NOMBRE_RESTAURANTE': { label: 'Nombre del Restaurante', group: 'restaurante', hint: 'Razón social del restaurante', autoFill: true, type: 'text' },
    'CIF_RESTAURANTE': { label: 'CIF del Restaurante', group: 'restaurante', hint: 'Ej: B87654321', autoFill: true, type: 'text' },
    'DIRECCIÓN_RESTAURANTE': { label: 'Dirección del Restaurante', group: 'restaurante', hint: 'Calle, número, ciudad', autoFill: true, type: 'text' },
    'REPRESENTANTE_RESTAURANTE': { label: 'Representante del Restaurante', group: 'restaurante', hint: 'Nombre del responsable', autoFill: true, type: 'text' },
    'TELÉFONO_RESTAURANTE': { label: 'Teléfono del Restaurante', group: 'restaurante', hint: 'Ej: 612345678', autoFill: true, type: 'text' },
    // Legacy
    'NOMBRE RESTAURANTE / RAZÓN SOCIAL': { label: 'Razón Social', group: 'restaurante', hint: 'Denominación legal', autoFill: true, type: 'text' },
    'CIF': { label: 'CIF', group: 'restaurante', hint: 'CIF del restaurante', autoFill: true, type: 'text' },
    'NOMBRE DEL ADMINISTRADOR': { label: 'Administrador', group: 'restaurante', hint: 'Nombre del administrador', autoFill: true, type: 'text' },

    // Condiciones
    'PEDIDOS_MINIMOS': { label: 'Pedidos Mínimos', group: 'condiciones', hint: 'Pedidos mensuales garantizados', autoFill: false, type: 'number' },
    'PRECIO_BASE': { label: 'Precio Base (€)', group: 'condiciones', hint: 'Precio por pedido estándar', autoFill: false, type: 'currency' },
    'PRECIO_KM_EXTRA': { label: 'Precio Km Extra (€)', group: 'condiciones', hint: 'Suplemento por km adicional', autoFill: false, type: 'currency' },
    'RADIO_KM': { label: 'Radio de Cobertura (km)', group: 'condiciones', hint: 'Distancia máxima de reparto', autoFill: false, type: 'number' },
    'X': { label: 'Radio Operativo (km)', group: 'condiciones', hint: 'Radio máximo', autoFill: false, type: 'number' },
    'CANTIDAD, EJ: 200': { label: 'Cantidad Pedidos', group: 'condiciones', hint: 'Ej: 200', autoFill: false, type: 'number' },
    'CANTIDAD, Ej: 150': { label: 'Cantidad Pedidos', group: 'condiciones', hint: 'Ej: 150', autoFill: false, type: 'number' },
    'INDICAR CANTIDAD': { label: 'Cantidad', group: 'condiciones', hint: 'Indicar cantidad', autoFill: false, type: 'number' },
};

/** Returns metadata for a placeholder, with a sensible fallback for unknown keys */
export const getVariableMeta = (key: string): VariableMeta => {
    return VARIABLE_METADATA[key] || {
        label: key.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()),
        group: 'condiciones' as VariableGroup,
        hint: `Valor para ${key}`,
        autoFill: false,
        type: 'text' as VariableInputType,
    };
};
