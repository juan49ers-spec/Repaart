// Enciclopedia Repaart 2.0 - Módulos Operativa
import { EncyclopediaModule } from './encyclopediaModules';

// CATEGORÍA: OPERATIVA (Módulos 21-50)
export const operativaModules: EncyclopediaModule[] = [
    {
        id: "ope-001",
        title: "Tecnología Flyder (El Cerebro)",
        category: "Operativa",
        content: "**Flyder es el sistema nervioso central de tu operación.**\n\n**Costes:**\n- Activación: 200€ + IVA (pago único)\n- Variable: 0.35€ + IVA por pedido (Pay-as-you-grow)\n\n**Funcionalidades Clave:**\n- Optimización de rutas con IA\n- Asignación automática de riders\n- Trazabilidad GPS en tiempo real\n- Panel de control para gerente\n- Histórico de entregas y tiempos\n\n**Instalación iOS (TestFlight):**\n1. Invitar Apple ID del rider\n2. Rider descarga TestFlight\n3. Rider descarga Flyder desde TestFlight\n4. Gerente da de alta en panel",
        action: "Antes del GO LIVE, haz 5 pedidos de prueba un martes a las 11:00. Verifica que todo fluye antes del viernes noche.",
        example: "Franquicia que no probó Flyder antes de arrancar descubrió el viernes a las 21:00 que los pedidos no llegaban a los riders. Caos total.",
        order: 21
    },
    {
        id: "ope-002",
        title: "Flota Yamimoto (El Músculo)",
        category: "Operativa",
        content: "**Scooters profesionales estandarizados para máxima eficiencia.**\n\n**Activo:** Scooter 125cc profesional (ej. Piaggio Liberty)\n\n**Costes Renting:**\n- Cuota: 154€/mes + IVA\n- Fianza: 200€ por moto (reducida vs mercado 300-600€)\n\n**Incluye:**\n- Seguro a terceros\n- Mantenimiento total\n- Revisiones: 1.000km, 5.000km, 10.000km\n- Vehículo sustitución si inmovilización >10 días\n\n**Gestión de la Brecha de 10 Días:**\n⚠️ Si la moto está 8 días en taller, Yamimoto NO da sustitución.\nSolución: Ten 1 moto propia de reserva por cada 4-5 de renting.",
        action: "Agenda en calendario las revisiones obligatorias de cada moto. Saltarse una puede invalidar garantía.",
        example: "Moto sin revisión de 5.000km tuvo avería de motor. Yamimoto no cubrió porque se saltó el mantenimiento. Coste: 800€.",
        order: 22
    },
    {
        id: "ope-003",
        title: "Zonificación Inteligente",
        category: "Operativa",
        content: "**No todos los pedidos valen lo mismo. El 80% debe estar en Zona A.**\n\n**Estructura de Zonas:**\n- **Zona A (0-4km):** 6€ - 'La Mina de Oro'\n- **Zona B (4.1-5km):** 7€ - Cobertura estándar\n- **Zona C (5.1-6km):** 8€ - Menor margen\n- **Zona D (6.1-7km):** 9€ - Disuasoria\n- **Zona E (7.1-8km):** 10€ - Máximo alcance\n\n**Poda de Zona D en Hora Punta:**\nSi un restaurante manda sistemáticamente pedidos a Zona D el viernes a las 21:00, estás perdiendo dinero por coste de oportunidad.\n\n**Protocolo de Restricción:**\n'Viernes y sábados 20:00-22:30 solo operamos hasta Zona B. Fuera de ese horario, llegamos donde quieras.'",
        action: "Genera mapa de calor de tus entregas. Si ves muchos puntos en Zona C/D, renegocia tarifas o restringe horarios.",
        example: "Franquicia restringió Zona D en horas pico. Productividad de riders subió 18% sin perder facturación total.",
        order: 23
    },
    {
        id: "ope-004",
        title: "Checklist Pre-Servicio",
        category: "Operativa",
        content: "**Antes de cada turno, verifica sistemáticamente:**\n\n**RIDER:**\n☐ Uniforme limpio y completo\n☐ Higiene personal correcta\n☐ Móvil cargado >80%\n☐ Flyder funcionando\n☐ Conoce zona asignada\n\n**MOTO:**\n☐ Depósito lleno (estación designada)\n☐ Luces funcionando (freno, intermitentes)\n☐ Presión neumáticos correcta\n☐ Espejos ajustados\n☐ Documentación bajo asiento\n\n**EQUIPAMIENTO:**\n☐ Cajón limpio y seco\n☐ Casco en buen estado\n☐ Powerbank cargado disponible\n☐ Caja de 50€ en cambio",
        action: "Imprime este checklist y pégalo en la pared de salida. El rider debe verificar ANTES de arrancar, no después.",
        example: "Rider salió sin verificar luces. Le pararon, multa de 200€ a la empresa. El checklist de 2 min habría evitado esto.",
        order: 24
    },
    {
        id: "ope-005",
        title: "Protocolo Cliente No Responde",
        category: "Operativa",
        content: "**Un pedido no entregado es un agujero negro de costes.**\n\n**LA REGLA DE LOS 3 INTENTOS:**\n1. Rider llama al cliente (1ª vez)\n2. Espera 2 min, llama de nuevo (2ª vez)\n3. Llama al restaurante para que contacten ellos\n4. Último intento del rider (3ª vez)\n\n**SI NO HAY RESPUESTA TRAS 5 MINUTOS:**\n1. Rider hace foto del portal/interfono con hora visible\n2. Envía foto al grupo WhatsApp de Tráfico\n3. La comida se devuelve al restaurante OBLIGATORIAMENTE\n\n**⚠️ IMPORTANTE:**\nSi el rider se queda la comida o la tira, es HURTO.\nEl restaurante decide el destino final.",
        action: "Graba un audio de 30 seg explicando este protocolo. Envíalo a todo rider nuevo el primer día.",
        example: "Cliente reclamó 'nunca llegó mi pedido'. La foto del portal con timestamp demostró que el rider estuvo 8 min esperando. Reclamación rechazada.",
        order: 25
    },
    {
        id: "ope-006",
        title: "Ingeniería de Carga (Tetris Alimentario)",
        category: "Operativa",
        content: "**La mayoría de quejas por 'comida en mal estado' son por mala estiba, no por cocina.**\n\n**SEPARACIÓN TÉRMICA:**\nJamás mezclar frío (bebidas, helados) con caliente (pizzas) en mismo compartimento sin separador.\n- El calor de la pizza derrite el helado\n- La bebida enfría la pizza\n\n**FÍSICA DE FLUIDOS:**\nSopas y salsas SIEMPRE van abajo y bloqueadas.\n\n**TRUCO PRO:**\nLleva toallas o espumas en el cajón para rellenar huecos. Una Coca-Cola sola en cajón de 90L se volcará en la primera curva.\n\n**REGLA DE ORO:**\nInmovilizar la carga es OBLIGATORIO.",
        action: "Compra 4-5 bloques de espuma por cajón. Coste: 5€. Ahorro en reclamaciones: 200€/mes.",
        example: "Pizza llegó con todo el queso pegado en un lado. Causa: rider no bloqueó la caja y frenó bruscamente. Reembolso + cliente perdido.",
        order: 26
    },
    {
        id: "ope-007",
        title: "Auditoría de Tiempos (Caja Negra)",
        category: "Operativa",
        content: "**Flyder guarda datos que valen ORO. Una vez al mes, haz análisis forense.**\n\n**DESGLOSE DEL CICLO DE PEDIDO:**\n\n**1. Camino al Restaurante (Pickup):**\nSi tarda mucho → Riders mal posicionados en zona de espera\n\n**2. Espera en Restaurante:**\nSi es alto → Restaurante lento (aplica presión comercial)\n\n**3. Trayecto al Cliente (Delivery):**\nSi es alto → Rider se pierde o va lento (formación) o rutas ineficientes (zona amplia)\n\n**ACCIÓN CORRECTIVA:**\nUsa estos datos para:\n- Renegociar con restaurantes lentos\n- Premiar riders más rápidos\n- Optimizar puntos de espera",
        action: "Exporta datos de Flyder, calcula media de cada tramo. Identifica los 3 restaurantes más lentos y visítalos esta semana.",
        example: "Restaurante 'La Parrilla' tenía 12 min de espera media. Tras reunión, bajó a 6 min. Productividad de esa ruta subió 25%.",
        order: 27
    },
    {
        id: "ope-008",
        title: "Minimización de Kilómetros Basura",
        category: "Operativa",
        content: "**Los 'Dead Miles' son kilómetros sin facturar que te cuestan dinero.**\n\n**EL ERROR DEL REGRESO A BASE:**\nMuchos riders, tras entregar, vuelven automáticamente al local o punto de encuentro.\n\n**LA TÁCTICA DE ESPERA ACTIVA:**\nTras entregar en zona densa (Zona A), esperar 2-3 min IN SITU antes de moverse.\n\n**¿POR QUÉ?**\nSi sale un pedido cerca, te ahorras el viaje de ida.\nVolver de vacío a la base para que Flyder te mande al mismo sitio 5 min después = Quemar gasolina inútilmente.\n\n**POSICIONAMIENTO ESTRATÉGICO:**\nDefine 3-4 puntos de espera óptimos en tu zona según densidad de restaurantes.",
        action: "Identifica las 3 calles con más restaurantes. Esos son tus puntos de espera. Instruye a riders para posicionarse ahí tras entregas.",
        example: "Franquicia definió punto de espera en Plaza Mayor (8 restaurantes en 200m). Tiempo medio de pickup bajó 4 minutos.",
        order: 28
    },
    {
        id: "ope-009",
        title: "Gestión de Interfaz Restaurante",
        category: "Operativa",
        content: "**A veces el retraso no es culpa del rider, sino del restaurante que usa mal la tecnología.**\n\n**EL PROBLEMA DEL 'LISTO PARA RECOGER':**\nMuchos restaurantes marcan 'Listo' cuando EMPIEZAN a cocinar, no cuando está terminado.\n\nFlyder manda al rider antes de tiempo → Espera muerta de 15 min.\n\n**LA SOLUCIÓN EDUCATIVA:**\nDetecta qué restaurantes hacen esto (mirando tiempos de espera en Flyder).\n\nVisítalos y corrige el hábito:\n'Por favor, dadle al botón solo cuando la bolsa esté cerrada. Si mi rider espera 15 min en tu puerta, es tiempo que no está repartiendo tu siguiente pedido.'",
        action: "Lista los 5 restaurantes con mayor tiempo de espera. Programa visita educativa esta semana.",
        example: "Pizzería marcaba 'listo' al meter la pizza al horno. Tras formación, espera media bajó de 14 a 4 minutos.",
        order: 29
    },
    {
        id: "ope-010",
        title: "Protocolo Apocalipsis Digital",
        category: "Operativa",
        content: "**¿Qué pasa si Flyder, Google Maps o AWS se caen un viernes a las 21:00?**\n\n**LA OPERATIVA ANALÓGICA:**\nTen impresos en el local:\n- Mapas físicos de la ciudad cuadriculados\n- Bloques de albaranes en papel\n\n**MODO RADIO-TAXI:**\n1. Pedidos entran por teléfono al restaurante\n2. Restaurante te llama\n3. Tú asignas por WhatsApp/Walkie\n4. Rider se guía por mapa/memoria\n\n**LA VENTAJA COMPETITIVA:**\nMientras Glovo/Uber están paralizados porque su App no va, TÚ SIGUES REPARTIENDO.\n\nEso te convierte en leyenda ante los restaurantes.",
        action: "Imprime 5 mapas de tu zona, compra un bloc de albaranes. Guárdalos en cajón 'EMERGENCIA'. Haz simulacro 1 vez al año.",
        example: "Caída de AWS en 2021 paralizó Glovo 2 horas. Franquicia con protocolo analógico siguió operando y ganó 3 clientes nuevos esa noche.",
        order: 30
    },
    {
        id: "ope-011",
        title: "Kit MacGyver (Reparaciones de Trinchera)",
        category: "Operativa",
        content: "**A veces la moto se 'desmonta' a mitad de servicio y la grúa tarda 1 hora.**\n\n**DOTACIÓN DE EMERGENCIA (bajo asiento):**\n- Bridas de plástico (pack de 20)\n- Cinta Americana (rollo pequeño)\n- Destornillador reversible\n\n**USOS COMUNES:**\n- Espejo flojo tras golpe\n- Matrícula que vibra\n- Carenado suelto\n- Soporte de móvil despegado\n\n**FILOSOFÍA:**\nSe arregla en 2 min con bridas para terminar el turno.\nMañana va al taller, pero HOY la facturación no para.",
        action: "Compra kit de emergencia para cada moto. Inversión: 15€. Valor: Evitar perder 3h de servicio por una tontería.",
        example: "Espejo se soltó tras roce. Con brida, aguantó 4 horas hasta final de turno. Sin brida, rider parado esperando grúa.",
        order: 31
    },
    {
        id: "ope-012",
        title: "Relevo en Caliente (Pit Stop)",
        category: "Operativa",
        content: "**Tener moto parada mientras rider del turno siguiente llega 15 min tarde es ineficiencia pura.**\n\n**SOLAPE DE TURNOS:**\nEl turno de tarde entra 15 min ANTES de que salga el de mañana.\n\n**PROTOCOLO DE INTERCAMBIO:**\n1. Rider saliente entrega llaves\n2. Revisión visual conjunta de daños\n3. Chequeo nivel de gasolina\n4. Rider entrante arranca inmediatamente\n\n**COMO EN FÓRMULA 1:**\nCambio de 'piloto' con motor casi en marcha.\nCero tiempo muerto de moto parada.",
        action: "Ajusta horarios de contrato: Si turno tarde empieza a las 19:00, cita al rider a las 18:45.",
        example: "Franquicia perdía 30 min/día por relevos lentos. Con solape de 15 min, ganó 2.5h semanales de productividad.",
        order: 32
    },
    {
        id: "ope-013",
        title: "Auditoría de Falsos OK",
        category: "Operativa",
        content: "**Flyder monitoriza GPS en tiempo real, pero riders listos saben trucarlo.**\n\n**EL TRUCO DEL PRE-CHECK:**\nAlgunos riders marcan 'Entregado' 200m antes de llegar para mejorar sus estadísticas de tiempo.\n\n**EL RIESGO:**\nSi el cliente mira la app y ve 'Entregado' pero nadie ha llamado → Pánico, queja, llamada a restaurante.\n\n**LA AUDITORÍA:**\nCruza aleatoriamente la hora del check en Flyder con la posición GPS real en ese momento.\n\nSi marcó 'Entregado' estando en la calle de atrás = **Falta Grave por falsificación de datos.**",
        action: "Una vez por semana, revisa 5 entregas aleatorias: hora de check vs posición GPS. Sanciona inconsistencias.",
        example: "Rider tenía tiempos excelentes. Auditoría reveló que marcaba 'entregado' 3 min antes de llegar sistemáticamente. Despido procedente.",
        order: 33
    },
    {
        id: "ope-014",
        title: "GPS como Notario (Defensa Digital)",
        category: "Operativa",
        content: "**El cliente a veces miente: 'No me han entregado el pedido' para conseguir comida gratis.**\n\n**FLYDER ES TU ESCUDO LEGAL:**\nRegistra posición exacta del rider y hora del check de entrega.\n\n**PROTOCOLO DE DISPUTA:**\n1. Cliente reclama 'pedido no entregado'\n2. NO devuelvas dinero automáticamente\n3. Descarga log del pedido en Flyder\n4. Demuestra que rider estuvo en coordenadas exactas a hora marcada\n5. Presenta prueba al restaurante\n\n**BENEFICIO:**\nProtege tu facturación y reputación de tu rider ante acusaciones falsas.",
        action: "Ante cualquier reclamación de 'no entregado', primer paso es SIEMPRE revisar GPS en Flyder antes de dar la razón al cliente.",
        example: "Cliente reclamó reembolso de 45€ 'porque nunca llegó'. GPS demostró rider en su portal 8 min. Reclamación rechazada, cliente marcado como 'riesgo'.",
        order: 34
    },
    {
        id: "ope-015",
        title: "Protocolo de Higiene APPCC",
        category: "Operativa",
        content: "**No transportamos paquetes. Transportamos COMIDA.**\n\n**RUTINA DE DESINFECCIÓN:**\n\n**DIARIA:**\nRider pasa paño desinfectante por interior del cajón al inicio del turno.\n\n**SEMANAL (Lunes):**\nLimpieza profunda de cajones y mochilas térmicas con productos específicos (no abrasivos).\n\n**PROHIBICIONES:**\n- Objetos personales (casco, guantes, ropa) dentro del cajón junto a comida\n- Transportar comida en cajón húmedo (genera bacterias y olores)\n\n**SI HAY DERRAME:**\nMoto queda inoperativa hasta que se limpie y seque totalmente.",
        action: "Compra spray desinfectante alimentario y paños. Colócalos en zona de salida con cartel: 'LIMPIAR CAJÓN ANTES DE SALIR'.",
        example: "Cliente encontró pelo en su ensalada. Investigación: el casco del rider se guardaba en el cajón. Protocolo violado, cliente perdido.",
        order: 35
    }
];

export const getOperativaModules = () => operativaModules;
