export interface ClauseSnippet {
    id: string;
    category: string;
    title: string;
    content: string;
    description: string;
    tags: string[];
    isFavorite?: boolean;
}

export const SNIPPET_CATEGORIES = [
    { id: 'exclusivity', label: 'Exclusividad', color: 'indigo' },
    { id: 'penalties', label: 'Penalizaciones', color: 'rose' },
    { id: 'privacy', label: 'Protección de Datos', color: 'emerald' },
    { id: 'confidentiality', label: 'Confidencialidad', color: 'amber' },
    { id: 'liability', label: 'Responsabilidad', color: 'purple' },
    { id: 'termination', label: 'Rescisión', color: 'slate' },
    { id: 'payment', label: 'Pagos y Facturación', color: 'blue' },
    { id: 'rider', label: 'Ley Rider', color: 'orange' }
];

export const DEFAULT_SNIPPETS: ClauseSnippet[] = [
    {
        id: 'exclusivity-1',
        category: 'exclusivity',
        title: 'Exclusividad Total del Servicio',
        description: 'Obligación del cliente de confiar el 100% de su reparto a Repaart',
        tags: ['exclusividad', '100%', 'total'],
        content: `## CLÁUSULA [X]. EXCLUSIVIDAD

EL CLIENTE se compromete a confiar el **100% de su servicio de reparto a domicilio** a LA COMPAÑÍA. El incumplimiento de esta exclusividad por parte del CLIENTE sin autorización expresa y previa por escrito de LA COMPAÑÍA será considerado incumplimiento grave y será causa de resolución contractual inmediata.`
    },
    {
        id: 'exclusivity-2',
        category: 'exclusivity',
        title: 'Exclusividad Territorial (Radio)',
        description: 'Exclusividad operativa en un radio kilométrico definido',
        tags: ['exclusividad', 'radio', 'territorio', 'km'],
        content: `## CLÁUSULA [X]. EXCLUSIVIDAD TERRITORIAL

Se establece como zona de exclusividad un radio de **[RADIO_KM] kilómetros** desde la ubicación del establecimiento de **[NOMBRE_RESTAURANTE]**. LA COMPAÑÍA se compromete a no prestar servicios similares a establecimientos de la misma categoría gastronómica dentro de la zona definida durante la vigencia de este contrato.`
    },
    {
        id: 'penalties-1',
        category: 'penalties',
        title: 'Penalización por Retraso en Restaurante (Tiempo de Espera)',
        description: 'Sanción económica si el pedido no está listo tras 10 minutos',
        tags: ['penalización', 'espera', '10 minutos', 'retraso restaurante'],
        content: `## CLÁUSULA [X]. TIEMPOS DE ESPERA Y PENALIZACIONES

El repartidor asignado por LA COMPAÑÍA esperará un máximo de **10 minutos** en el establecimiento del CLIENTE. Si transcurrido este plazo el pedido no está listo para su recogida, se aplicará un recargo de **2,00€** por la demora ocasionada, o bien LA COMPAÑÍA podrá cancelar el servicio cobrándolo íntegramente.`
    },
    {
        id: 'penalties-2',
        category: 'penalties',
        title: 'Cargo por Cancelación en Ruta',
        description: 'Coste por cancelar el pedido cuando el rider ya está de camino',
        tags: ['cancelación', 'en ruta', 'cargo', '50%', '100%'],
        content: `## CLÁUSULA [X]. CANCELACIONES EN RUTA

En caso de que EL CLIENTE cancele un pedido cuando el repartidor ya se encuentra en ruta hacia el establecimiento o hacia el cliente final, se cobrará el **50% o el 100%** de la tarifa de reparto correspondiente, en función del desplazamiento ya realizado por el repartidor.`
    },
    {
        id: 'penalties-3',
        category: 'penalties',
        title: 'Doble Viaje por Error del Restaurante',
        description: 'Penalización por información incorrecta u omisión en el pedido',
        tags: ['penalización', 'doble viaje', 'error', 'recargo'],
        content: `## CLÁUSULA [X]. RECARGO POR DOBLE VIAJE

En caso de ser necesario realizar un segundo desplazamiento (doble viaje) motivado por un error originado por el restaurante (ej. omisión de productos, información de entrega incorrecta), el nuevo servicio será facturado como un servicio independiente, sumando además una **penalización disuasoria de 2,00€**.`
    },
    {
        id: 'liability-1',
        category: 'liability',
        title: 'Límite de Responsabilidad de Mercancía',
        description: 'Responsabilidad máxima de Repaart ante daños o pérdida del pedido',
        tags: ['responsabilidad', 'límite', 'daños', 'pérdida', '50€'],
        content: `## CLÁUSULA [X]. RESPONSABILIDAD SOBRE LA MERCANCÍA

La responsabilidad de LA COMPAÑÍA por los daños o la pérdida total o parcial del pedido durante su transporte queda expresamente limitada a un importe máximo de **50,00€ (cincuenta euros) por ticket**, previa justificación del valor de coste del producto por parte del CLIENTE.`
    },
    {
        id: 'liability-2',
        category: 'liability',
        title: 'Protocolo de Cliente Ausente',
        description: 'Actuación cuando el cliente final no es localizable en 5 minutos',
        tags: ['cliente ausente', '5 minutos', 'cobro íntegro', 'devolución'],
        content: `## CLÁUSULA [X]. PROTOCOLO DE CLIENTE AUSENTE

Si en el momento de la entrega el destinatario final no está localizable en el domicilio indicado tras un tiempo de espera de **5 minutos** y posterior llamada telefónica sin respuesta, el pedido será devuelto al establecimiento del CLIENTE y el servicio de reparto se facturará de forma íntegra.`
    },
    {
        id: 'liability-3',
        category: 'liability',
        title: 'Condiciones de Packaging (Embalaje)',
        description: 'Obligación del restaurante de usar embalaje apto para delivery',
        tags: ['packaging', 'embalaje', 'delivery', 'responsabilidad'],
        content: `## CLÁUSULA [X]. CONDICIONES DE EMPAQUETADO (PACKAGING)

EL CLIENTE está obligado a entregar los productos debidamente embalados y acondicionados en recipientes aptos y seguros para el transporte en motocicleta o bicicleta (delivery). LA COMPAÑÍA no se hará responsable del deterioro de aquellos productos cuyo empaquetado sea deficiente o inapropiado para este fin.`
    },
    {
        id: 'payment-1',
        category: 'payment',
        title: 'Pedidos Mínimos Garantizados',
        description: 'Cláusula de seguridad que exige un volumen fijo mensual',
        tags: ['pedidos mínimos', 'garantía', 'mensual', 'facturación fija'],
        content: `## CLÁUSULA [X]. PEDIDOS MÍNIMOS GARANTIZADOS

EL CLIENTE garantiza a LA COMPAÑÍA un volumen mínimo de **[CANTIDAD_MINIMA] pedidos mensuales**. Si no se alcanza esta cifra al término del mes natural, EL CLIENTE abonará la diferencia resultante hasta alcanzar el cobro mínimo pactado, lo cual se verá reflejado en la última factura del mes.`
    },
    {
        id: 'payment-2',
        category: 'payment',
        title: 'Plazos de Facturación y Recargos por Impago',
        description: 'Fechas de facturación quincenal y penalización del 10% por retraso',
        tags: ['facturación', 'quincenal', 'impagos', 'recargo', '10%'],
        content: `## CLÁUSULA [X]. FACTURACIÓN E IMPAGOS

LA COMPAÑÍA emitirá factura los días **15 y 30 de cada mes**. El pago se realizará mediante Domiciliación Bancaria (SEPA) en un plazo máximo de 5 días. El retraso en el abono devengará automáticamente un recargo del **10%** en concepto de gastos de gestión de cobro. El impago reiterado facultará a LA COMPAÑÍA a suspender el servicio inmediatamente.`
    },
    {
        id: 'rider-1',
        category: 'rider',
        title: 'Régimen Laboral (Ley Rider española)',
        description: 'Aclaración de la relación laboral, desligando al cliente de los riders',
        tags: ['ley rider', 'relación laboral', 'indemnidad', 'repartidores'],
        content: `## CLÁUSULA [X]. RÉGIMEN LABORAL (LEY RIDER)

Las partes hacen constar expresamente que **LA COMPAÑÍA es la única empleadora de los repartidores (riders)** asumiendo todas sus obligaciones laborales. EL CLIENTE carece de cualquier poder de dirección, organización o potestad sancionadora sobre los mismos. LA COMPAÑÍA mantendrá indemne a EL CLIENTE frente a cualquier reclamación de índole laboral o de Seguridad Social.`
    },
    {
        id: 'termination-1',
        category: 'termination',
        title: 'Resolución Anticipada y Penalización',
        description: 'Penalización si el restaurante rescinde antes de tiempo sin causa',
        tags: ['resolución', 'anticipada', 'penalización', 'permanencia'],
        content: `## CLÁUSULA [X]. RESOLUCIÓN ANTICIPADA Y PENALIZACIÓN DE PERMANENCIA

Se estipula una duración mínima del presente contrato de **[DURACION_MESES] meses**. En caso de resolución anticipada del mismo por voluntad unilateral del CLIENTE y sin causa justificada, éste deberá abonar una indemnización equivalente a **dos (2) mensualidades** del volumen de pedidos mínimos garantizados, correspondientes a los meses restantes hasta la finalización pactada.`
    },
    {
        id: 'privacy-1',
        category: 'privacy',
        title: 'Protección de Datos Generales (RGPD)',
        description: 'Manejo de datos exclusivo para la ejecución del servicio logístico',
        tags: ['rgpd', 'privacidad', 'protección de datos', 'consumidor final'],
        content: `## CLÁUSULA [X]. PROTECCIÓN DE DATOS OBLIGATORIA

Conforme al Reglamento (UE) 2016/679 (RGPD), las partes acuerdan que los datos personales de los consumidores finales transmitidos por EL CLIENTE a LA COMPAÑÍA serán tratados con la exclusiva finalidad material de ejecutar el servicio de entrega domiciliaria, no pudiendo ser utilizados para fines distintos o de marketing comercial ajeno.`
    },
    {
        id: 'confidentiality-1',
        category: 'confidentiality',
        title: 'Confidencialidad Operativa Comercial',
        description: 'Deber de secreto sobre operativas y estrategia comercial',
        tags: ['confidencialidad', 'secreto', 'know-how', 'estrategia'],
        content: `## CLÁUSULA [X]. CONFIDENCIALIDAD COMERCIAL Y OPERATIVA

Las partes se obligan recíprocamente a mantener riguroso secreto y estricta confidencialidad respecto al *Know-how*, modelos de precios, tecnología subyacente de la plataforma Flyder, y toda información técnica, financiera o estratégica revelada en el marco de la negociación y ejecución del presente acuerdo.`
    }
];

// Función para búsqueda fuzzy
export const searchSnippets = (snippets: ClauseSnippet[], query: string): ClauseSnippet[] => {
    if (!query.trim()) return snippets;

    const searchTerm = query.toLowerCase();

    return snippets.filter(snippet => {
        const searchableText = `${snippet.title} ${snippet.description} ${snippet.tags.join(' ')}`.toLowerCase();
        return searchableText.includes(searchTerm);
    }).sort((a, b) => {
        // Priorizar coincidencias en el título
        const aTitleMatch = a.title.toLowerCase().includes(searchTerm);
        const bTitleMatch = b.title.toLowerCase().includes(searchTerm);
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        return 0;
    });
};

export default DEFAULT_SNIPPETS;
