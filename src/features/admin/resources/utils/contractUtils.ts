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
