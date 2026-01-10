export interface KnowledgeArticle {
    id: string;
    title: string;
    excerpt: string;
    keywords: string[];
    link: string;
}

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
    {
        id: 'invoice_guide',
        title: 'Cómo descargar tus facturas',
        excerpt: 'Pasos para descargar las facturas de comisiones y servicios desde el panel.',
        keywords: ['factura', 'cobro', 'dinero', 'pago', 'impuesto', 'iva'],
        link: '#' // In real app, this would be a URL
    },
    {
        id: 'wifi_issues',
        title: 'Problemas de Conexión / WiFi',
        excerpt: 'Guía rápida para reiniciar el router y reconectar las PDAs.',
        keywords: ['internet', 'wifi', 'red', 'conexión', 'offline', 'lento'],
        link: '#'
    },
    {
        id: 'accident_protocol',
        title: 'Protocolo de Accidentes',
        excerpt: 'Qué hacer en caso de accidente con un vehículo de la flota.',
        keywords: ['accidente', 'golpe', 'choque', 'siniestro', 'seguro', 'herido'],
        link: '#'
    },
    {
        id: 'password_reset',
        title: 'Recuperar Contraseña',
        excerpt: 'No puedo entrar a mi cuenta o he olvidado la clave.',
        keywords: ['clave', 'contraseña', 'password', 'acceso', 'login', 'entrar'],
        link: '#'
    },
    {
        id: 'order_cancel',
        title: 'Cancelar un Pedido',
        excerpt: 'Cuándo y cómo se puede cancelar un pedido en curso.',
        keywords: ['cancelar', 'anular', 'pedido', 'order', 'equivocación'],
        link: '#'
    }
];

/**
 * Returns articles that match the given text based on keywords.
 * @param {string} text 
 * @returns {Array} - Array of matching articles
 */
export const getSuggestions = (text: string): KnowledgeArticle[] => {
    if (!text || text.length < 3) return [];

    const lowerText = text.toLowerCase();

    return KNOWLEDGE_ARTICLES.filter(article => {
        return article.keywords.some(keyword => lowerText.includes(keyword));
    });
};
