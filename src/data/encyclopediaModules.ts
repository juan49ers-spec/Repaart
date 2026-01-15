// Enciclopedia Repaart 2.0 - Módulos Completos
// Organizado por categorías con contenido educativo enriquecido

export interface EncyclopediaModule {
    id: string;
    title: string;
    category: string;
    content: string;
    action: string;
    example?: string;
    order: number;
}

// CATEGORÍA: ESTRATEGIA (Módulos 1-25)
export const estrategiaModules: EncyclopediaModule[] = [
    {
        id: "est-001",
        title: "Visión y Modelo de Negocio Repaart",
        category: "Estrategia",
        content: "El ecosistema del Food Delivery necesita una corrección urgente. Las plataformas como Glovo y Uber han erosionado los márgenes de los restaurantes (comisiones del 30%+) y precarizado el servicio con riders autónomos sin formación.\n\n**Repaart NO es una ETT de repartidores.** Somos una Operadora Logística Descentralizada que transforma emprendedores en Directores de Flota Local. Ofrecemos estructura 'llave en mano': vehículos profesionales + software Flyder + know-how operativo para dar servicio B2B Premium.\n\n**Matriz Competitiva:**\n- Coste: Tarifa plana baja vs Comisiones 30%+\n- Control: Total y dedicado vs Aleatorio\n- Fiabilidad: Riders en nómina vs Autónomos libres\n- Imagen: Uniformada y profesional vs Genérica",
        action: "Define tu propuesta de valor en 30 segundos: 'Somos la alternativa profesional a las plataformas, con riders formados, flota dedicada y coste predecible.'",
        example: "Un restaurante con 300 pedidos/mes ahorra 750€/mes con Repaart vs plataformas (9.000€/año directo al EBITDA).",
        order: 1
    },
    {
        id: "est-002",
        title: "Pack Básico vs Pack Premium",
        category: "Estrategia",
        content: "**PACK BÁSICO (1.500€ + IVA)**\nDirigido a riders con experiencia que quieren profesionalizar su flota.\n- Canon: 1.500€ + IVA\n- Royalty: 1% facturación neta mensual\n- Incluye: Licencia de marca, manuales, APP Flyder, central de compras Yamimoto, formación online básica, reunión inicial 2h\n- Sin soporte continuado (solo servicios a la carta)\n\n**PACK PREMIUM (3.000€ + IVA)**\nPara gestores que quieren trabajar con las mejores marcas de delivery.\n- Canon: 3.000€ + IVA\n- Royalty: 3% facturación neta mensual\n- Incluye: Todo el Pack Básico + Mentoring Quincenal\n- Sesión estratégica 1h cada 15 días (revisión KPIs, rutas, incidencias)\n- Horario exclusivo: Lunes-Jueves 17:00-20:00 vía Calendly",
        action: "Calcula tu inversión inicial: Pack Básico ~4.000€ total (canon + activación + fianzas + fondo maniobra). Pack Premium ~6.000€ total.",
        example: "Un franquiciado Premium que aprovecha el mentoring puede detectar ineficiencias que le ahorran 300-500€/mes en costes operativos.",
        order: 2
    },
    {
        id: "est-003",
        title: "Estructura de Tarifas por Zonas",
        category: "Estrategia",
        content: "La rentabilidad se basa en una **Matriz de Tarifas Escalonada** que protege el margen penalizando distancias largas.\n\n**TARIFAS ACTUALIZADAS:**\n- **Zona A (0-4 km):** 6€ - Alta densidad, objetivo 80% del volumen\n- **Zona B (4.1-5 km):** 7€ - Cobertura estándar\n- **Zona C (5.1-6 km):** 8€ - Menor margen\n- **Zona D (6.1-7 km):** 9€ - Tarifa disuasoria\n- **Zona E (7.1-8 km):** 10€ - Máximo alcance\n\n**Estrategia por Zona:**\n- Zona A: 'La Mina de Oro' - Prioriza siempre estos restaurantes\n- Zona D/E: Precio alto a propósito. Si pagan, alto margen. Si no piden, liberas rider para Zona A.",
        action: "Mapea tus restaurantes actuales por zona. Si más del 30% están en Zona C/D/E, estás perdiendo rentabilidad por desplazamientos.",
        example: "Un pedido Zona D (9€) consume 35-40 min ida/vuelta. En ese tiempo podrías hacer 2 pedidos Zona A (12€ total). Usa Zona D solo en horas valle.",
        order: 3
    },
    {
        id: "est-004",
        title: "Argumentario de Venta B2B",
        category: "Estrategia",
        content: "**El Ahorro Real para el Restaurante:**\n\nEjemplo: Restaurante con 300 pedidos/mes, ticket medio 30€\n- Con Plataformas (25% comisión): 2.550€/mes\n- Con REPAART (Tarifa Plana 6€): 1.800€/mes\n- **Ahorro: 750€/mes = 9.000€/año directo al EBITDA**\n\n**Battle Card Anti-Competencia:**\n\n| Aspecto | Plataformas | REPAART |\n|---------|-------------|----------|\n| Control | Aleatorio | Total |\n| Riesgo Laboral | Alto (Ley Rider) | Cero para restaurante |\n| Imagen | Mochila genérica | Uniforme profesional |\n| Coste | Variable 25-35% | Fijo y predecible |",
        action: "Prepara una simulación de ahorro personalizada para cada prospecto. Lleva los números calculados a la reunión.",
        example: "Restaurante 'La Brasería' pasó de pagar 3.200€/mes en comisiones a 2.100€/mes con Repaart. Ahorro anual: 13.200€.",
        order: 4
    },
    {
        id: "est-005",
        title: "Cronograma de Apertura (6 Semanas)",
        category: "Estrategia",
        content: "**El proceso prioriza la validación comercial ANTES del gasto fijo.**\n\n**Semana 1 - VALIDACIÓN:**\nFirma Pre-Contrato + Estudio de Zona geográfica\n\n**Semanas 2-3 - COMERCIALIZACIÓN (CRÍTICO):**\nObjetivo: Cerrar 700 pedidos garantizados en contratos\n⚠️ SIN ESTO, NO SE AUTORIZA ACTIVACIÓN DE COSTES\n\n**Semanas 4-5 - DESPLIEGUE:**\nSolicitud flota Yamimoto (tardan 1-2 semanas)\nPago activación Flyder (200€)\nAlta y formación de riders\n\n**Semana 6 - GO LIVE:**\nInicio oficial de operaciones",
        action: "No actives costes fijos (motos, riders) hasta tener 700 pedidos firmados. Es la regla de oro de supervivencia.",
        example: "Franquicia Navalmoral arrancó con solo 300 pedidos 'y ya creceremos'. Quemó su caja en 2 meses y cerró. No repitas el error.",
        order: 5
    },
    {
        id: "est-006",
        title: "La Regla del No-Go (700 Pedidos)",
        category: "Estrategia",
        content: "**Por qué 700 pedidos es el mínimo:**\n\nEs el punto de equilibrio operativo donde los ingresos cubren costes fijos mínimos:\n- Renting motos: ~600€/mes\n- Nóminas base: ~2.000€/mes\n- Software + seguros: ~300€/mes\n- Combustible: ~300€/mes\n\n**Total costes fijos: ~3.200€/mes**\n700 pedidos x 6€ (Zona A) = 4.200€/mes\n\n**Margen operativo mínimo: ~1.000€**\n\n**La Tentación Mortal:**\nMuchos quieren empezar con 300 pedidos 'e ir creciendo'. ERROR: Tienes la misma estructura de costes pero facturas la mitad. Muerte financiera en 60 días.",
        action: "Antes de firmar contratos de flota, cuenta tus pedidos comprometidos por escrito. Si no llegas a 700, sigue vendiendo.",
        example: "Parar 2 semanas más para conseguir 200 pedidos extra es mejor que arrancar con déficit y cerrar en 2 meses.",
        order: 6
    },
    {
        id: "est-007",
        title: "Estrategia Mancha de Aceite (Crecimiento)",
        category: "Estrategia",
        content: "**No saltes a la otra punta de la ciudad al crecer.**\n\nCrece calle a calle, barrio a barrio, como una mancha de aceite expandiéndose.\n\n**La Lógica Operativa:**\n- Si abres zona desconectada: Necesitas flota exclusiva nueva\n- Si creces pegado a zona actual: Tus riders 'fluyen' según demanda\n\n**Beneficios:**\n- Optimización de recursos existentes\n- Menor inversión en flota adicional\n- Riders conocen mejor las calles\n- Restaurantes se recomiendan entre vecinos\n\n**La Estrategia de Densificación:**\nSi tienes un cliente fuerte en una calle, visita los 3 restaurantes de al lado. Si el rider ya va a esa calle, recoger otro pedido del local contiguo tiene coste marginal cero.",
        action: "Dibuja un círculo de 500m alrededor de cada cliente actual. Los restaurantes dentro de ese círculo son tu siguiente objetivo comercial.",
        example: "Franquicia Zamora creció de 15 a 45 restaurantes en 6 meses sin añadir motos, solo densificando su Zona A.",
        order: 7
    },
    {
        id: "est-008",
        title: "El Caso Navalmoral (Lección Aprendida)",
        category: "Estrategia",
        content: "**En los negocios se aprende más de los errores que de los aciertos.**\n\n**El Error Estratégico:**\nEn Navalmoral de la Mata, la franquicia dependía casi exclusivamente de un gran colaborador (Burger King vía Catcher).\n\n**El Desastre:**\nDe un día para otro, la marca decidió poner su propia flota de riders interna. Sin cartera diversificada de restaurantes locales, la franquicia se quedó 'tirada' y tuvo que cerrar.\n\n**LA LECCIÓN DE ORO:**\n⚠️ Nunca bases más del 30% de tu facturación en un solo cliente, por muy grande que sea.\n\nUsa a los gigantes (Catcher/Partners) para arrancar, pero tu supervivencia depende de la suma de muchos restaurantes pequeños y medianos locales que fidelices TÚ MISMO.",
        action: "Revisa tu cartera: calcula qué % representa tu mayor cliente. Si supera el 30%, activa comercial para diversificar urgentemente.",
        example: "Si Burger King representa 40% de tu facturación y mañana rescinden, pierdes 40% de ingresos pero mantienes 100% de costes fijos.",
        order: 8
    },
    {
        id: "est-009",
        title: "Protocolo de Salida (Traspaso/Cese)",
        category: "Estrategia",
        content: "**Si decides cerrar o vender, hay protocolos claros:**\n\n**OPCIÓN A: TRASPASO (Recomendada)**\n- Venta autorizada a otro inversor\n- La Central puede ayudar a encontrar comprador\n- Mantienes valor de lo construido\n- Proceso ordenado de transición\n\n**OPCIÓN B: CESE DE ACTIVIDAD**\n- Preaviso obligatorio: 3-6 meses\n- Permite reubicación ordenada de clientes\n- Devolución de activos según contrato\n- Liquidación de compromisos pendientes\n\n**Documentación Necesaria:**\n- Inventario de activos\n- Listado de contratos vigentes\n- Estado de cuentas actualizado\n- Nóminas y finiquitos riders",
        action: "Ten siempre documentado el valor de tu negocio: contratos activos, volumen mensual, margen neto. Facilita un traspaso rápido si surge oportunidad.",
        example: "Franquicia Valencia se traspasó en 45 días a precio premium porque tenía toda la documentación preparada y KPIs claros.",
        order: 9
    },
    {
        id: "est-010",
        title: "Escalabilidad: La Figura del COM",
        category: "Estrategia",
        content: "**Llegará un momento en que no podrás hacer todo tú.**\n\nVisitar restaurantes + entrevistar riders + vigilar Flyder + gestionar tesorería = Burnout del gerente.\n\n**¿Cuándo contratar un COM (Comercial & Operation Manager)?**\n- Al superar 1.500 pedidos/mes\n- Al querer abrir segunda zona\n- Cuando tu tiempo vale más gestionando que operando\n\n**El Split 50/50 del COM:**\n- 50% VENTAS: Objetivo 3 nuevos contratos/mes\n- 50% OPERACIONES: Supervisar riders, visitar clientes\n\n**El Salto de Categoría:**\nPasas de 'Autoempleado' a 'Empresario'. Tú te enfocas en estrategia financiera, el COM ejecuta el terreno.",
        action: "Calcula: ¿Cuántas horas/semana dedicas a tareas operativas vs estratégicas? Si >70% es operativo, necesitas delegar.",
        example: "Franquicia con COM dedicado creció 40% en 6 meses porque el gerente pudo enfocarse en alianzas estratégicas y nuevas zonas.",
        order: 10
    }
];

// Continúa en el siguiente archivo...
export const getEstrategiaModules = () => estrategiaModules;
