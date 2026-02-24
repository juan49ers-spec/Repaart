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

/**
 * Maps restaurant data to template placeholder keys.
 */
export const mapRestaurantToPlaceholders = (restaurant: Restaurant, adminData: any): Record<string, string> => {
    return {
        'LOCALIDAD': restaurant.address?.city || '',
        'DÍA': new Date().getDate().toString(),
        'MES': new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date()),
        'NOMBRE DEL FRANQUICIADO': adminData.displayName || '',
        'DNI': adminData.dni || '',
        'DIRECCIÓN DE TU OFICINA/BASE': adminData.address || '',
        'NOMBRE RESTAURANTE / RAZÓN SOCIAL': restaurant.fiscalName || '',
        'CIF': restaurant.cif || '',
        'DIRECCIÓN DEL RESTAURANTE': `${restaurant.address?.street || ''}, ${restaurant.address?.city || ''}`,
        'NOMBRE DEL ADMINISTRADOR': restaurant.legalRepresentative || '',
        'X': '5', // Default zone radius
        'CANTIDAD, EJ: 200': '200',
        'CANTIDAD, Ej: 150': '150',
        'INDICAR CANTIDAD': '150'
    };
};
