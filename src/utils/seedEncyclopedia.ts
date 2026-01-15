import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Enciclopedia Operativa Repaart 2.0
 * Versión Premium: Conocimiento Ejecutivo de Alto Impacto
 * 70+ Módulos Estratégicos para Directores de Flota Local
 */
const encyclopediaData = [
    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN I: VISIÓN ESTRATÉGICA Y POSICIONAMIENTO (1-10)
    // ═══════════════════════════════════════════════════════════════
    {
        category: "Estrategia",
        title: "ADN Repaart: Operadora vs ETT",
        content: "No alquilamos riders, diseñamos flotas. El restaurante NO gestiona personal; nosotros somos el brazo logístico que opera su delivery con una flota asalariada y profesional. Somos el CFO externo de su logística.",
        action: "Posiciónate como socio estratégico, no como proveedor de mano de obra.",
        order: 1
    },
    {
        category: "Estrategia",
        title: "Batalla Card: 3 Ventajas Letales",
        content: "1) Tarifa fija predecible vs 25-30% de comisión. 2) Control absoluto de marca y experiencia del cliente. 3) Cumplimiento legal 100% (Ley Rider) sin riesgo subsidiario para el restaurante.",
        action: "Demuestra ROI en la primera reunión: Ahorro mínimo 9.000€/año para 300 pedidos/mes.",
        order: 2
    },
    {
        category: "Estrategia",
        title: "Regla del 30%: Diversificación",
        content: "NUNCA permitas que un solo cliente represente más del 30% de tu facturación. La dependencia mata franquicias. Caso Navalmoral: una franquicia colapsó al perder su ancla comercial.",
        action: "Audita tu cartera mensualmente. Si un cliente > 25%, activa plan de expansión urgente.",
        order: 3
    },
    {
        category: "Estrategia",
        title: "Ciclo de Vida del Cliente B2B",
        content: "Fase 1: Prueba (1-2 meses, tarifa reducida). Fase 2: Consolidación (3-6 meses, revisión de zonas). Fase 3: Expansión (multi-local o upsell de horarios). Un cliente maduro factura 3x más que uno nuevo.",
        action: "Define un roadmap de crecimiento con cada restaurante desde el día 1.",
        order: 4
    },
    {
        category: "Estrategia",
        title: "Posicionamiento Premium",
        content: "No compitas en precio, compite en fiabilidad. Los restaurantes de alto ticket (sushi, premium burgers) valoran la puntualidad y el trato más que ahorrar 0,50€ por entrega.",
        action: "Target: Restaurantes con ticket medio > 18€. Son los que más valoran tu servicio.",
        order: 5
    },
    {
        category: "Estrategia",
        title: "Argumento Ley Rider",
        content: "Desde 2021, el restaurante que usa riders freelance enfrenta riesgo de Inspección de Trabajo. Tú eliminas ese riesgo porque tu flota está en nómina y tú asumes la responsabilidad laboral.",
        action: "Enfatiza la tranquilidad legal como un diferencial de venta.",
        order: 6
    },
    {
        category: "Estrategia",
        title: "KPI Estratégico: Retención",
        content: "Un cliente que lleva > 6 meses contigo tiene 85% de probabilidad de quedarse 2+ años. Cada cliente perdido cuesta 3 meses de ventas recuperarlo.",
        action: "Mide el Churn Rate mensual. Target: < 5% bajas mensuales.",
        order: 7
    },
    {
        category: "Estrategia",
        title: "Mapa de Calor Comercial",
        content: "Identifica zonas de alta densidad de restaurantes premium. Un radio de 2 km con 15+ locales objetivo es tu zona oro. Conquista por saturación geográfica, no por dispersión.",
        action: "Usa Google Maps para mapear competencia y potencial antes de invertir en marketing.",
        order: 8
    },
    {
        category: "Estrategia",
        title: "Protocolo Apocalipsis Digital",
        content: "Si Flyder cae: 1) WhatsApp de emergencia con los riders. 2) Albaranes en papel. 3) Mapa físico de la ciudad plastificado en el hub. El servicio NO se detiene jamás.",
        action: "Mantén un kit de emergencia analógico siempre listo.",
        order: 9
    },
    {
        category: "Estrategia",
        title: "Mentalidad Dueño",
        content: "El líder que no se pone el casco cuando falta un rider pierde credibilidad. Lidera desde el frente: si llueve, si hay caos, tú eres el primero en salir.",
        action: "Tu equipo replica tu actitud. Si tú eres operativo, ellos serán comprometidos.",
        order: 10
    },

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN II: MODELO ECONÓMICO Y FINANZAS (11-20)
    // ═══════════════════════════════════════════════════════════════
    {
        category: "Finanzas",
        title: "Pack Franquicia Básico",
        content: "1.500€ + IVA. Royalty 1% facturación. Incluye: Marca, Manuales, acceso a Flyder y red Yamimoto. Sin soporte continuado. Ideal para riders con experiencia en gestión.",
        action: "Perfil: Ex-riders o emprendedores con conocimiento del sector.",
        order: 11
    },
    {
        category: "Finanzas",
        title: "Pack Franquicia Premium",
        content: "3.000€ + IVA. Royalty 3%. Incluye todo lo básico + Mentoring quincenal obligatorio, acceso a cockpit analítico avanzado y soporte estratégico ilimitado.",
        action: "Perfil: Gestores sin experiencia previa que necesitan acompañamiento.",
        order: 12
    },
    {
        category: "Finanzas",
        title: "Ciclo de Tesorería",
        content: "Facturación quincenal. Cobro máximo en 5 días hábiles. Pago de nóminas el día 1 del mes. Esta estructura blinda tu liquidez y evita que te conviertas en el banco de tus clientes.",
        action: "Tolerancia CERO con retrasos. Un cliente que paga tarde una vez, lo hará siempre.",
        order: 13
    },
    {
        category: "Finanzas",
        title: "Sistema Kill-Switch",
        content: "Corte automático del servicio tras 48h de impago. No hay excepciones. La relación comercial se recupera, la caja perdida no.",
        action: "Comunica esta política desde el contrato inicial. Es un seguro de liquidez.",
        order: 14
    },
    {
        category: "Finanzas",
        title: "Disciplina Fiscal PRO",
        content: "Separa inmediatamente: 21% IVA (subcuenta fiscal), 20% IRPF estimado, 15% reserva operativa. Lo que ves en la cuenta NO es tuyo hasta que pagues impuestos.",
        action: "Configura transferencias automáticas mensuales a subcuentas. Hazlo invisible.",
        order: 15
    },
    {
        category: "Finanzas",
        title: "Punto de Equilibrio",
        content: "Con 2 riders a jornada completa necesitas facturar ~8.000€/mes para break-even. Cada rider adicional debe generar mínimo 4.500€/mes para ser rentable.",
        action: "Calcula tu umbral de rentabilidad antes de contratar el tercer rider.",
        order: 16
    },
    {
        category: "Finanzas",
        title: "Ratio Mágico: 2,5 Pedidos/Hora",
        content: "Un rider que hace < 2,2 entregas/hora está destruyendo valor. El óptimo es 2,5-3 pedidos/hora en horario pico. Por debajo de 2, revisa rutas o clientes.",
        action: "Monitoriza productividad por rider cada semana en Flyder.",
        order: 17
    },
    {
        category: "Finanzas",
        title: "Elasticidad de Precios",
        content: "Zona A (0-3km): Los clientes son inelásticos. Puedes subir 0,50€ sin perder volumen. Zona C-D (5-7km): Son hipersensibles, una subida de 0,30€ puede hacerte perder el 20% del negocio.",
        action: "Optimiza márgenes en zona A, mantén competitivo en zona C-D.",
        order: 18
    },
    {
        category: "Finanzas",
        title: "Reserva de Emergencia",
        content: "Mantén siempre 2 meses de nóminas + SS en cuenta separada. Es tu colchón ante caídas estacionales (enero, agosto) o crisis inesperadas.",
        action: "Target: 10.000€ de reserva para una operación con 3-4 riders.",
        order: 19
    },
    {
        category: "Finanzas",
        title: "Análisis de Contribución por Cliente",
        content: "No todos los restaurantes son igual de rentables. Calcula: (Facturación Cliente - Coste Rider Asignado) / Horas dedicadas. Los clientes con ratio < 15€/h drenan recursos.",
        action: "Audita semestralmente. Si un cliente es deficitario 3 meses seguidos, renegocia o corta.",
        order: 20
    },

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN III: OPERATIVA Y EXCELENCIA LOGÍSTICA (21-35)
    // ═══════════════════════════════════════════════════════════════
    {
        category: "Operativa",
        title: "Flyder: Motor de IA",
        content: "Activación 200€ único + 0,35€/pedido. Optimización de rutas con machine learning, trazabilidad GPS en tiempo real y análisis predictivo de demanda. ROI en el primer trimestre.",
        action: "Instala versión iOS via TestFlight. Versión Android en desarrollo.",
        order: 21
    },
    {
        category: "Operativa",
        title: "Flota Yamimoto: Renting Blindado",
        content: "154€/mes + IVA por scooter. Fianza 200€ recuperable. Incluye: Seguro a terceros, mantenimiento programado, y moto de sustitución en averías > 10 días. Revisiones obligatorias: 1k, 5k, 10k km.",
        action: "Acuerdo exclusivo de red. Libera capital para contratar riders en vez de comprar motos.",
        order: 22
    },
    {
        category: "Operativa",
        title: "Zonificación Estratégica",
        content: "Zona A (0-3km): 5,50€. Zona B (3-4km): 6,50€. Zona C (4-5km): 7,50€. Zona D (5-7km): 9,00€. La zona D existe para disuadir, no para facturar. El 80% del volumen debe ser A-B.",
        action: "Rechaza clientes en Zona D si no puedes agrupar entregas. Es pérdida disfrazada.",
        order: 23
    },
    {
        category: "Operativa",
        title: "Packaging como Veto",
        content: "Rechaza servicio si el envase NO es estanco. Un derrame líquido en la moto destruye 3 horas de productividad y genera reclamaciones. El restaurante debe adaptar su packaging a delivery.",
        action: "Documento fotográfico del empaquetado. Si hay incidencia, es su culpa, no tuya.",
        order: 24
    },
    {
        category: "Operativa",
        title: "Métrica Pickup vs Delivery",
        content: "Analiza tiempos: Si el 60% del retraso es espera en local (pickup), el problema NO es el rider. Presiona al restaurante para que active 'Listo para recoger' con precisión.",
        action: "KPI: Tiempo medio de espera en local < 4 minutos. Por encima, escala.",
        order: 25
    },
    {
        category: "Operativa",
        title: "Protocolo de Incidencias",
        content: "1) Foto del empaque al recoger. 2) GPS activo durante todo el trayecto. 3) Foto de entrega con geolocalización. Ante reclamos de 'no recibido', tienes prueba notarial digital.",
        action: "Activa 'Modo Prueba' en Flyder para todos los pedidos > 40€.",
        order: 26
    },
    {
        category: "Operativa",
        title: "Metodología 5S en el Hub",
        content: "Seiri (Clasificar): Solo lo esencial. Seiton (Ordenar): Zona de cascos, carga, descanso. Seiso (Limpiar): Limpieza diaria. Seiketsu (Estandarizar): Checklist visual. Shitsuke (Disciplina): Auditoría semanal.",
        action: "Un hub desordenado es señal de operación caótica. El orden es productividad.",
        order: 27
    },
    {
        category: "Operativa",
        title: "APPCC y Seguridad Alimentaria",
        content: "Limpieza profunda de mochilas térmicas cada lunes. Prohibido transportar objetos personales dentro. Temperatura interna del cajón: entre 2°C y 8°C para frío, > 65°C para caliente.",
        action: "Usa termómetros digitales. Un brote alimentario puede cerrar tu operación.",
        order: 28
    },
    {
        category: "Operativa",
        title: "Ingeniería de Turnos",
        content: "Solapa turnos 15 min ('Pit Stop'): el saliente transfiere contexto al entrante (pedidos pendientes, incidencias). Evita descoordinación en cambios de relevo.",
        action: "El turno empalma, no choca. Comunicación = continuidad.",
        order: 29
    },
    {
        category: "Operativa",
        title: "Auditoría de Combustible",
        content: "Consumo medio: 2,5L/100km. Si un rider supera 3,5L/100km de forma recurrente, hay conducción ineficiente (aceleraciones bruscas, rutas mal optimizadas).",
        action: "Revisa consumo semanal por rider. Es un KPI de eficiencia operativa.",
        order: 30
    },
    {
        category: "Operativa",
        title: "Clustering de Pedidos",
        content: "Agrupa entregas en el mismo edificio o calle en ventanas de 10 min. Un rider que hace 3 entregas en el mismo portal triplica su productividad.",
        action: "Flyder auto-agrupa. Valida manualmente en horas pico.",
        order: 31
    },
    {
        category: "Operativa",
        title: "Protocolo 'Listo para Recoger'",
        content: "El restaurante marca el pedido como listo en Flyder. Solo entonces se asigna rider. Evita tiempos muertos de espera. Un rider esperando 10 min pierde 2 entregas potenciales.",
        action: "Penaliza restaurantes que marcan 'listo' con > 5 min de antelación falsa.",
        order: 32
    },
    {
        category: "Operativa",
        title: "Mapa de Puntos Críticos",
        content: "Identifica obstáculos recurrentes: calles cortadas, zonas peatonales, edificios sin acceso. Crea un mapa compartido con el equipo para evitar repetir errores.",
        action: "Actualiza el mapa semanalmente. Es know-how operativo acumulativo.",
        order: 33
    },
    {
        category: "Operativa",
        title: "KPI: Tiempo Medio de Entrega",
        content: "Target: < 28 minutos desde confirmación del pedido hasta entrega. Por encima de 35 min, el cliente percibe lentitud y puede reclamar.",
        action: "Monitoriza por franja horaria. Identifica cuellos de botella.",
        order: 34
    },
    {
        category: "Operativa",
        title: "Protocolo Buen Vecino",
        content: "Apaga el motor al llegar. Silencio en portales. No bloquees rampas ni vados. Respeto absoluto al espacio público. Una queja vecinal puede costarte permisos municipales.",
        action: "Sé invisible acústicamente. La mejor entrega es la que no se nota.",
        order: 35
    },

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN IV: GESTIÓN DE PERSONAS Y LIDERAZGO (36-50)
    // ═══════════════════════════════════════════════════════════════
    {
        category: "RRHH",
        title: "Perfil Rider Ideal",
        content: "24-40 años. Experiencia en moto > 2 años. Actitud de servicio demostrable. Contratación: 10-35 h/semana (evita 40h si no tienes volumen estable). Mantén siempre una bolsa de 2-3 candidatos de reserva.",
        action: "Entrevista en moto: observa cómo conduce antes de contratar.",
        order: 36
    },
    {
        category: "RRHH",
        title: "Shadowing: Mentoría Operativa",
        content: "Un rider nuevo NO sale solo hasta completar 3-5 entregas con un veterano. Aprende: trucos de parking, trato con porteros, gestión de incidencias. Validación antes de 'suelta'.",
        action: "El shadowing reduce errores iniciales en un 70%.",
        order: 37
    },
    {
        category: "RRHH",
        title: "Política de Multas",
        content: "El rider es el ÚNICO responsable de sanciones de tráfico o parking. Identifica SIEMPRE al conductor en el plazo de 20 días. No asumas multas por 'buen rollo'.",
        action: "Cláusula contractual explícita. Es responsabilidad individual.",
        order: 38
    },
    {
        category: "RRHH",
        title: "Líneas Rojas de Despido",
        content: "Tolerancia CERO: 1) Robo o fraude. 2) Agresión a cliente o compañero. 3) Uso de uniforme fuera del turno. 4) Uso de moto para fines personales. Despido disciplinario inmediato.",
        action: "Documenta toda infracción. Protege la marca y la operación.",
        order: 39
    },
    {
        category: "RRHH",
        title: "Ritual Huddle Pre-Turno",
        content: "3 minutos antes de cada turno: briefing de objetivos, incidencias del día, reconocimiento al Top 1 del turno anterior. Crea sentido de equipo y alineación.",
        action: "La tribu se construye con rituales diarios, no con charlas anuales.",
        order: 40
    },
    {
        category: "RRHH",
        title: "Salario Emocional",
        content: "Reconocimiento público del Top 3 de eficiencia semanal. Bonificación simbólica (50€/mes) al rider con mejor NPS. El reconocimiento retiene más que un 5% de subida salarial.",
        action: "Gamifica la productividad. El ego profesional es un motor potente.",
        order: 41
    },
    {
        category: "RRHH",
        title: "Calendario Táctico",
        content: "Descansos concentrados de lunes a jueves. Viernes a domingo: plantilla COMPLETA. Ningún rider libra en fin de semana. El 70% del volumen se genera en 3 días.",
        action: "Si un rider pide libre el sábado, no es el rider que necesitas.",
        order: 42
    },
    {
        category: "RRHH",
        title: "Plan de Carrera Interno",
        content: "Rider → Supervisor → Gestor de turno. Define criterios claros: productividad > 2,8 ped/h, 0 incidencias en 3 meses, y mentoría de 1 compañero nuevo. Promoción interna reduce rotación un 40%.",
        action: "Comunica el plan desde la contratación. Es un incentivo de permanencia.",
        order: 43
    },
    {
        category: "RRHH",
        title: "Protocolo de Bajas",
        content: "Si un rider avisa con < 2h de antelación, penalización en el siguiente horario. Si es recurrente (> 3 veces/mes), revisión contractual. La planificación NO admite improvisación.",
        action: "Establece un sistema de avisos escalonado. La disciplina es la base del servicio.",
        order: 44
    },
    {
        category: "RRHH",
        title: "Feedback 1-1 Quincenal",
        content: "15 minutos con cada rider cada 2 semanas. Agenda: productividad, incidencias, ideas de mejora. El feedback bidireccional evita sorpresas y construye confianza.",
        action: "Los problemas pequeños detectados a tiempo evitan crisis grandes.",
        order: 45
    },
    {
        category: "RRHH",
        title: "Gestión de Conflictos",
        content: "Ante un conflicto entre riders: 1) Escucha por separado. 2) Mediación conjunta. 3) Decisión firme y comunicada. NO dejes conflictos sin resolver más de 24h. El cáncer organizativo crece rápido.",
        action: "La neutralidad aparente es liderazgo débil. Decide y comunica.",
        order: 46
    },
    {
        category: "RRHH",
        title: "Uniformidad y Marca Personal",
        content: "Uniforme impecable: camiseta limpia, mochila sin roturas, casco corporativo. El rider ES tu marca en la calle. Un rider desaliñado proyecta una operación descuidada.",
        action: "Revisión semanal de uniformes. Reposición inmediata si hay deterioro.",
        order: 47
    },
    {
        category: "RRHH",
        title: "KPI: Rotación de Personal",
        content: "Target: < 20% anual. Rotación > 30% indica problema cultural o salarial. Cada rider que se va te cuesta 1 mes de su salario en reclutamiento y formación del sustituto.",
        action: "Mide rotación trimestral. Investiga causas de salida en exit interviews.",
        order: 48
    },
    {
        category: "RRHH",
        title: "Bolsa de Reserva",
        content: "Mantén siempre 2-3 candidatos pre-validados (entrevista + prueba en moto) listos para activar en 48h. Las bajas inesperadas NO pueden paralizar la operación.",
        action: "Actualiza la bolsa mensualmente. Es tu seguro operativo.",
        order: 49
    },
    {
        category: "RRHH",
        title: "Clima Laboral: NPS Interno",
        content: "Encuesta anónima trimestral con 1 pregunta: '¿Recomendarías trabajar aquí a un amigo?' (0-10). Target: > 8. Un equipo desmotivado destruye la experiencia del cliente.",
        action: "Actúa sobre el feedback. Medir sin actuar es peor que no medir.",
        order: 50
    },

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN V: COMERCIAL Y CAPTACIÓN B2B (51-60)
    // ═══════════════════════════════════════════════════════════════
    {
        category: "Comercial",
        title: "Pitch de 60 Segundos",
        content: "'Eliminamos el 25% de comisión de las plataformas con una tarifa fija desde 5,50€. Tu marca, tu control, tu cliente. Cumplimiento legal 100% con flota asalariada. ¿Hablamos de cómo ahorrarte 9.000€ al año?'",
        action: "Practica hasta que salga natural. El pitch es tu arma comercial.",
        order: 51
    },
    {
        category: "Comercial",
        title: "Prospección Caliente",
        content: "Target: Restaurantes en Google con > 200 reseñas y ticket medio > 15€. Prioriza: sushi, hamburguesas premium, comida saludable. Evita: kebabs, pizzerías low-cost (compiten por precio).",
        action: "CRM simple: Google Sheets con estado de cada prospecto.",
        order: 52
    },
    {
        category: "Comercial",
        title: "Objeción: 'Ya trabajo con Glovo'",
        content: "Respuesta: 'Perfecto, yo no sustituyo plataformas, las complemento. Usa Glovo para lluvia de pedidos esporádicos, y Repaart para tu base fiel con tu propia marca. Control híbrido.'",
        action: "No compitas frontalmente. Posiciónate como complemento estratégico.",
        order: 53
    },
    {
        category: "Comercial",
        title: "Prueba Piloto de 30 Días",
        content: "Ofrece el primer mes a tarifa reducida (-20%). Sin compromiso de permanencia. Si no funciona, se dan la mano. El 80% de las pruebas se convierten en contratos estables.",
        action: "Baja la barrera de entrada. La calidad del servicio vende sola.",
        order: 54
    },
    {
        category: "Comercial",
        title: "Upselling: Multi-Turno",
        content: "Cliente actual: solo comidas (13-16h). Propuesta: agrega cenas (20-23h) con tarifa plana incremental. El upsell tiene 60% de tasa de éxito vs captar cliente nuevo.",
        action: "Revisa mensualmente clientes con potencial de expansión horaria.",
        order: 55
    },
    {
        category: "Comercial",
        title: "Referencias: El Arma Silenciosa",
        content: "Cada cliente satisfecho puede referir 1-2 restaurantes en su zona. Incentiva: '1 mes gratis si tu referido contrata'. El boca a boca B2B es 5x más efectivo que cold calling.",
        action: "Pide referencias activamente tras 3 meses de servicio impecable.",
        order: 56
    },
    {
        category: "Comercial",
        title: "Contrato Blindado",
        content: "Cláusulas clave: 1) Penalización por cancelación < 30 días. 2) Ajuste de tarifas anual con IPC. 3) Corte automático tras 48h impago. El contrato te protege ante clientes tóxicos.",
        action: "Review legal anual. Un contrato es tu escudo, no un mero formalismo.",
        order: 57
    },
    {
        category: "Comercial",
        title: "KPI: Costo de Adquisición (CAC)",
        content: "¿Cuánto inviertes (tiempo + marketing) en captar 1 cliente? Target: < 300€. Si CAC > 500€, tu estrategia comercial es ineficiente.",
        action: "Mide CAC/cliente y compáralo con el LTV (valor de vida del cliente).",
        order: 58
    },
    {
        category: "Comercial",
        title: "Estacionalidad: Plan B",
        content: "Enero y agosto caen 30-40%. Diversifica: catering corporativo, eventos privados, entregas de supermercados. No dependas 100% de restaurantes tradicionales.",
        action: "Prepara el plan B en noviembre, no cuando ya estés en crisis.",
        order: 59
    },
    {
        category: "Comercial",
        title: "Follow-Up Post-Venta",
        content: "Llamada a la semana 2, 4 y 8 del contrato. Pregunta: '¿Qué mejorarías?' Actúa sobre el feedback inmediatamente. El cliente que se siente escuchado renueva contratos.",
        action: "El follow-up NO es cortesía, es retención activa.",
        order: 60
    },

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN VI: TECNOLOGÍA Y DATA (61-70)
    // ═══════════════════════════════════════════════════════════════
    {
        category: "Tecnología",
        title: "Flyder: Analítica Predictiva",
        content: "El algoritmo aprende patrones de demanda por franja horaria y clima. Predice picos con 85% de precisión. Usa estas predicciones para ajustar plantilla en tiempo real.",
        action: "Revisa el dashboard predictivo cada lunes para planificar la semana.",
        order: 61
    },
    {
        category: "Tecnología",
        title: "GPS como Notario Digital",
        content: "Ante reclamos de 'pedido no recibido', exporta el log GPS de Flyder: posición exacta y timestamp. Es prueba judicial válida. Has ganado el 100% de disputas con esta evidencia.",
        action: "Activa geolocalización de foto de entrega en pedidos > 35€.",
        order: 62
    },
    {
        category: "Tecnología",
        title: "Backup de Datos",
        content: "Exporta datos de Flyder semanalmente a Google Drive cifrado. Ante caída del sistema, tienes histórico para facturación y análisis. Nunca confíes 100% en una sola plataforma.",
        action: "Automatiza el backup. Es tu póliza de seguro digital.",
        order: 63
    },
    {
        category: "Tecnología",
        title: "Integración con TPV",
        content: "Conecta Flyder con el TPV del restaurante vía API. El pedido se registra automáticamente sin intervención manual. Reduce errores humanos en un 90%.",
        action: "Ofrece esta integración como diferencial premium a clientes grandes.",
        order: 64
    },
    {
        category: "Tecnología",
        title: "Dashboard de KPIs",
        content: "Panel único con: Pedidos/hora, tiempo medio de entrega, productividad por rider, % de incidencias, facturación vs objetivo. Visibilidad en tiempo real desde el móvil.",
        action: "Dedica 10 min diarios a revisar el dashboard. Los datos NO mienten.",
        order: 65
    },
    {
        category: "Tecnología",
        title: "Optimización de Rutas con ML",
        content: "Flyder usa machine learning para calcular la ruta óptima considerando tráfico en tiempo real, semáforos y zonas peatonales. Ahorro medio: 15% de tiempo por entrega.",
        action: "Confía en el algoritmo. Es más eficiente que la intuición del rider.",
        order: 66
    },
    {
        category: "Tecnología",
        title: "Alertas Automáticas",
        content: "Configura alertas push: 1) Rider con tiempo de espera > 8 min. 2) Pedido con retraso > 5 min sobre ETA. 3) Cliente con 2+ incidencias en 7 días. Intervención proactiva.",
        action: "Las alertas te permiten apagar fuegos antes de que sean incendios.",
        order: 67
    },
    {
        category: "Tecnología",
        title: "Análisis de Zonas Calientes",
        content: "Flyder mapea en un heatmap las zonas con mayor densidad de entregas. Usa este mapa para: 1) Negociar contratos zonales. 2) Optimizar ubicación del hub. 3) Descartar zonas deficitarias.",
        action: "El heatmap es tu brújula estratégica de expansión.",
        order: 68
    },
    {
        category: "Tecnología",
        title: "Protocolo de Ciberseguridad",
        content: "Cambia contraseñas de Flyder cada 3 meses. Activa autenticación en 2 pasos. No compartas accesos con riders. Una brecha de datos puede costarte multas GDPR de 20.000€+.",
        action: "La seguridad digital NO es paranoia, es profesionalidad.",
        order: 69
    },
    {
        category: "Tecnología",
        title: "ROI Tecnológico",
        content: "Flyder cuesta ~400€/mes (activación + uso). Te ahorra mínimo 20h/mes en gestión manual y optimiza rutas (ahorro 15% combustible). ROI: 300% en el primer año.",
        action: "La tecnología NO es un gasto, es una inversión que se amortiza sola.",
        order: 70
    },

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN VII: CALIDAD Y SERVICIO PREMIUM (71-85)
    // ═══════════════════════════════════════════════════════════════
    {
        category: "Calidad",
        title: "El Efecto Mayordomo (Elevación del Estatus)",
        content: "**Diferénciate de la imagen del 'repartidor precario'.**\\n\\n**LA POSTURA DE ENTREGA:**\\nInstruye al rider:\\n- No estirar el brazo con desgana\\n- Sacar producto de la mochila térmica DELANTE del cliente\\n- El cliente debe ver el vapor del calor\\n- Entregar con DOS manos\\n\\n**PSICOLOGÍA:**\\nEste pequeño teatro subconsciente justifica precios más altos.\\n\\nEl cliente siente que le SIRVEN, no que le 'tiran' la comida.\\n\\n**DIFERENCIACIÓN:**\\nGlovo/Uber: Entrega rápida e impersonal.\\nRepaart: Experiencia de servicio Premium.",
        action: "En próxima reunión de equipo, haz role-play de entrega. Practica la 'entrega a dos manos' con todos.",
        example: "Restaurante reportó que clientes comentaban 'qué educados son vuestros riders'. Diferenciación real.",
        order: 71
    },
    {
        category: "Calidad",
        title: "Psicología del Servicio (Efecto Sonrisa)",
        content: "**El Manual audita aspectos que parecen triviales pero definen la propina y la repetición.**\\n\\n**AUDITORÍA DE EXPRESIVIDAD:**\\nPuntúa del 1 al 5:\\n- Rider con casco puesto que gruñe 'toma' = 1\\n- Rider que mira a los ojos y sonríe = 5\\n\\n**EL PROTOCOLO DE DESPEDIDA:**\\nObligatorio terminar con frase cordial:\\n'Que aproveche' o 'Gracias, hasta la próxima'\\n+ Sonrisa\\n\\n**EFECTO:**\\nCierra el ciclo del servicio con emoción positiva.\\nReduce quejas por comida fría o retrasos menores.\\n\\n**VOLUMEN DE VOZ:**\\nSe penaliza hablar a gritos en rellano o restaurante.\\nDiscreción = Servicio Premium.",
        action: "Acompaña a un rider en 3 entregas y observa su despedida. ¿Sonríe? ¿Dice 'que aproveche'? Corrige si es necesario.",
        example: "Rider que implementó protocolo de despedida aumentó sus propinas 40% en un mes. Mismo trabajo, mejor percepción.",
        order: 72
    },
    {
        category: "Calidad",
        title: "Decálogo del Silencio (Normativa Vecinal)",
        content: "**El mayor enemigo de una empresa de motos no es Glovo, son las asociaciones de vecinos.**\\n\\n**LA NORMA DE 'MOTOR OFF':**\\nProhibido mantener moto arrancada mientras espera al cliente en portal.\\nNi siquiera 'un minuto'.\\n\\n**PROHIBIDO:**\\n- Tocar el claxon para llamar al compañero\\n- Acelerar en vacío\\n- Conversaciones a gritos entre riders\\n\\n**IMPACTO OPERATIVO:**\\nSi tus motos no molestan, la policía no te hará controles 'sorpresa' en la puerta de tu local.\\n\\nSer invisible acústicamente = Rentabilidad operativa.",
        action: "Haz visita sorpresa a zona de espera de tus riders a las 21:00. ¿Hay motos arrancadas sin motivo? Corrige.",
        example: "Vecinos de zona de espera llamaron a policía 3 veces por 'ruido de motos'. Tras aplicar norma de silencio, cero quejas en 6 meses.",
        order: 73
    },
    {
        category: "Calidad",
        title: "Política de Buen Vecino (Civismo)",
        content: "**El delivery tiene mala fama: ruido, motos en acera, suciedad. Repaart gana mercado siendo la opción 'Caballero'.**\\n\\n**EL MANIFIESTO DEL SILENCIO:**\\nInstruye a riders para apagar motor al llegar a zonas residenciales de noche.\\nNo acelerar en vacío.\\n\\n**RESPETO AL ESPACIO PÚBLICO:**\\nProhibido aparcar bloqueando:\\n- Rampas de minusválidos\\n- Pasos de cebra\\n- Salidas de emergencia\\n'Aunque sea un minuto.'\\n\\n**ARGUMENTO DE VENTA:**\\n'Mis riders no te buscarán problemas con la comunidad de vecinos ni con la policía. Somos invisibles y educados.'",
        action: "Incluye el 'Código de Civismo' en formación de nuevos riders. Hazlo firmar como anexo al contrato.",
        example: "Restaurante en zona residencial de ancianos. Competencia causaba quejas, Repaart no. Ganamos exclusividad por 'buenos vecinos'.",
        order: 74
    },
    {
        category: "Calidad",
        title: "Protocolo de Embajador en Restaurante",
        content: "**El rider no es solo transportista; es la cara de Repaart en el local del cliente.**\\n\\n**LA ZONA DE INVISIBILIDAD:**\\nInstruye a riders para ser DISCRETOS:\\n- No gritar nombre del pedido desde la puerta\\n- No apoyarse en barra donde comen clientes\\n- No entrar en cocina sin permiso\\n\\n**EL CASCO:**\\nPor seguridad e imagen, se recomienda:\\n- Quitarse el casco al entrar al establecimiento\\n- O al menos levantar visera/mentonera si es modular\\n\\n**RAZÓN:**\\nEntrar con casco puesto genera desconfianza.\\nInteractuar cara visible = Profesionalismo.",
        action: "Visita un restaurante cliente en hora pico. Observa cómo actúan tus riders. ¿Son discretos o invasivos?",
        example: "Rider entraba a cocina como si fuera su casa. Cocinero se quejó. Tras corrección, relación con restaurante mejoró notablemente.",
        order: 75
    },
    {
        category: "Calidad",
        title: "Higiene de la Mochila (Prueba del Olor)",
        content: "**Una mochila térmica cerrada y húmeda desarrolla olores horribles en 24h.**\\n\\n**PROTOCOLO 'CIERRES ABIERTOS':**\\nAl terminar turno y dejar mochila en local:\\n- Dejar ABIERTA (cremalleras bajadas)\\n- Permitir que ventile toda la noche\\n\\n**PROHIBIDO:**\\nMochila cerrada toda la noche = Caldo de cultivo de bacterias.\\n\\n**LA PRUEBA DEL OLOR:**\\nCada lunes, haz 'test de olor' a cajones y mochilas.\\nSi huele mal, limpieza profunda inmediata.\\n\\nNadie quiere que su pizza huela a humedad rancia.",
        action: "Instala perchero o barra en local para colgar mochilas abiertas. Coste: 20€. Beneficio: Cero olores.",
        example: "Cliente devolvió pedido porque 'olía a humedad'. Investigación: mochila llevaba 2 semanas sin ventilar ni limpiar.",
        order: 76
    },
    {
        category: "Calidad",
        title: "Auditoría de Patatas Fritas (Control de Gula)",
        content: "**Es la tentación número 1 del rider: 'robar' unas patatas de la bolsa abierta.**\\n\\n**EL PRECINTO SAGRADO:**\\nExige a restaurantes que usen:\\n- Pegatinas de seguridad\\n- Grapas en bolsas de papel\\n\\n**INSPECCIÓN:**\\nSi cliente se queja de que faltan cosas, y la bolsa llegó SIN precintar:\\n- La culpa es TUYA por aceptarla así\\n\\n**INSTRUCCIÓN AL RIDER:**\\n'Si la bolsa no está cerrada con grapa o pegatina, NO LA RECOJAS hasta que la cierren.'\\n\\nEsto protege al rider de acusaciones falsas y al cliente de robos reales.",
        action: "Comunica a todos los restaurantes: 'A partir del día X, no recogeremos bolsas sin precinto. Gracias.'",
        example: "Cliente acusó a rider de robar nuggets. Bolsa llegó con grapa intacta. Acusación rechazada. El precinto salvó al rider.",
        order: 77
    },
    {
        category: "Calidad",
        title: "Mantenimiento de Equipo de Lluvia",
        content: "**Los trajes de agua son caros. Si se guardan mojados, se pudren en 2 semanas.**\\n\\n**EL PERCHERO DE SECADO:**\\nInstala barra en el local donde los trajes puedan colgarse estirados tras turno de lluvia.\\n\\n**PROHIBIDO:**\\nMeter el impermeable hecho una bola en el cajón de la moto.\\n\\n**CONSECUENCIAS DEL MAL CUIDADO:**\\n- Olor a humedad que se pega al rider\\n- Material se deteriora y pierde impermeabilidad\\n- Imagen ante el cliente dañada\\n\\n**INVERSIÓN:**\\nBarra + perchas: 30€.\\nVida útil de traje: De 3 meses a 12 meses.",
        action: "Compra 5 perchas de plástico para el local. Etiqueta: 'TRAJES DE LLUVIA'. Norma: Siempre colgar tras turno mojado.",
        example: "Traje de 45€ duró solo 6 semanas por guardarse mojado. Tras instalar perchero, trajes duran toda la temporada.",
        order: 78
    },
    {
        category: "Calidad",
        title: "Efecto Visera Sucia (Seguridad Nocturna)",
        content: "**Un casco con la visera rayada o sucia refracta la luz de las farolas y ciega al rider.**\\n\\n**EL PROTOCOLO LIMPIA-CRISTALES:**\\nTen en zona de salida:\\n- Spray de limpiacristales\\n- Papel de cocina\\n\\n**NORMA:**\\nObligatorio limpiar visera ANTES de empezar turno de noche.\\n\\n**IMPACTO:**\\n- Reduce fatiga ocular\\n- Evita accidentes por deslumbramiento\\n- Rider que no ve bien conduce lento y con miedo\\n\\n**COSTE:**\\nSpray: 3€. Papel: 2€.\\nBeneficio: Cero accidentes por visibilidad.",
        action: "Coloca kit de limpieza de visera junto a puerta de salida con cartel: 'Limpia tu visera antes de salir'.",
        example: "Rider tuvo casi-accidente por deslumbramiento de farola en visera sucia. Tras implementar protocolo, cero incidentes similares.",
        order: 79
    },
    {
        category: "Calidad",
        title: "Diplomacia de Puerta de Atrás",
        content: "**Entrar por la puerta principal con casco y mochila golpeando a clientes que cenan es error grave.**\\n\\n**MAPEO DE ACCESOS:**\\nIdentifica qué restaurantes tienen:\\n- Entrada de servicio\\n- Acceso por cocina\\n- Puerta lateral\\n\\n**INSTRUCCIÓN:**\\n'En la Pizzería Luigi, entrad siempre por el callejón.'\\n\\n**BENEFICIOS:**\\n- El dueño del restaurante te amará (no molestas a sus comensales)\\n- Tu rider saldrá más rápido (sin esquivar camareros)\\n- Imagen profesional ante el personal del local\\n\\n**DOCUMENTACIÓN:**\\nIncluye el acceso correcto en la ficha de cada restaurante en Flyder si es posible.",
        action: "Pregunta a cada restaurante: '¿Por dónde preferís que entren mis riders?'. Documenta y comunica al equipo.",
        example: "Rider entraba por comedor de restaurante fino. Gerente del restaurante se quejó. Cambio a entrada de servicio solucionó tensión.",
        order: 80
    },

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN VIII: SEGURIDAD Y LEGAL (81-90)
    // ═══════════════════════════════════════════════════════════════
    {
        category: "Seguridad",
        title: "Protocolo Código Rojo (Accidente con Heridos)",
        content: "**Nadie quiere usarlo, pero debes tenerlo impreso.**\\n\\n**LA REGLA PAS:**\\nProteger - Avisar - Socorrer\\n\\nLo primero NO es la moto ni la pizza, es llamar al 112.\\n\\n**GESTIÓN DOCUMENTAL INMEDIATA:**\\n1. Gerente se persona en el lugar (si posible)\\n2. Fotos de la vía, estado del asfalto, moto contraria\\n3. ANTES de que muevan nada\\n\\n**DOCUMENTACIÓN VITAL:**\\n- Parte amistoso firmado por todas las partes\\n- Datos de testigos\\n- Número de policía actuante\\n\\nSerán vitales para el seguro y la mutua laboral.",
        action: "Imprime el protocolo de accidentes y guárdalo en la guantera de cada moto. Que los riders sepan dónde está.",
        example: "Rider tuvo accidente leve pero no hizo fotos. El otro conductor cambió su versión. Sin pruebas, seguro no cubrió. Pérdida: 1.200€.",
        order: 81
    },
    {
        category: "Seguridad",
        title: "Seguros y Responsabilidad Civil",
        content: "**El Dossier menciona 'Seguro a terceros incluido', pero el diablo está en los detalles.**\\n\\n**QUÉ CUBRE YAMIMOTO:**\\n✅ Responsabilidad Civil (Terceros)\\nSi tu rider atropella a alguien o raya un coche, paga el seguro.\\n\\n**QUÉ NO CUBRE:**\\n❌ Daños Propios (La Moto)\\nSi el rider se cae solo o rompe espejo contra columna, paga la franquicia.\\n\\n❌ Robo de Mercancía\\nSi roban la comida del cajón, es coste operativo que asumes tú.\\n\\n**REPERCUSIÓN:**\\nSi hay negligencia del rider (ej. dejó moto sin candado), el coste se le puede repercutir según contrato firmado.",
        action: "Lee el contrato de renting de Yamimoto. Marca con rotulador qué cubre y qué no. Tenlo claro antes del primer accidente.",
        example: "Rider rompió retrovisor contra bolardo. Creyó que 'el seguro lo cubría'. No. Coste de 80€ sorpresa para la franquicia.",
        order: 82
    },
    {
        category: "Seguridad",
        title: "Defensa Carga y Descarga (Ante el Agente)",
        content: "**Aparcar mal es inevitable; la multa es evitable.**\\n\\n**LA ACTITUD:**\\nSi un agente se acerca a la moto mal aparcada, el rider debe aparecer corriendo y pedir disculpas inmediatamente.\\nNO discutir.\\n\\n**LA PALABRA MÁGICA:**\\n'Agente, estoy realizando un servicio de carga y descarga urgente de alimentos. Me voy en 30 segundos.'\\n\\n**BASE LEGAL:**\\nLa mayoría de ordenanzas permiten paradas breves (<2 min) para servicios.\\n\\n**SI EL RIDER SE PONE CHULO:**\\nLa multa cae seguro + Posible identificación + Inmovilización de moto.\\n\\nCortesía = Ahorro.",
        action: "Ensaya con los riders la respuesta educada ante un agente. Role-play de 5 min en reunión de equipo.",
        example: "Rider discutió con policía 'porque tenía razón'. Multa de 200€ + Moto retenida 2 horas. La 'razón' salió muy cara.",
        order: 83
    },
    {
        category: "Seguridad",
        title: "Regla del Anti-Héroe (Robo de Moto)",
        content: "**Si un ladrón intenta robar la moto con violencia o amenaza:**\\n\\n**INSTRUCCIÓN TAJANTE:**\\nLa moto vale 3.000€.\\nTu vida NO tiene precio.\\n\\n⚠️ Si te amenazan, ENTREGA LA MOTO Y LAS LLAVES inmediatamente.\\nNo te pelees.\\n\\n**PROTECCIÓN:**\\n- La moto tiene GPS\\n- La moto tiene seguro de robo\\n- No queremos héroes en el hospital\\n\\n**POST-ROBO:**\\n1. Alejarse del lugar\\n2. Llamar al 112\\n3. Llamar al gerente\\n4. Denuncia en comisaría\\n\\nLa empresa cubre la pérdida. Las lesiones, no.",
        action: "Incluye esta instrucción explícita en el onboarding: 'Ante robo con violencia, no resistas. Es una orden.'",
        example: "Rider en otra empresa intentó defender la moto de un robo. Le apuñalaron. 3 semanas de hospital. La moto apareció abandonada al día siguiente.",
        order: 84
    },
    {
        category: "Seguridad",
        title: "Palabra de Seguridad (Peligro Inminente)",
        content: "**A veces el rider está en problemas pero no puede hablar claro porque el agresor está delante.**\\n\\n**LA CLAVE SECRETA:**\\nDefine una palabra o frase absurda conocida solo por el equipo.\\n\\nEjemplos:\\n- '¿Queda papel en la impresora?'\\n- 'Llevo la pizza de piña'\\n- 'El cliente pide extra de ketchup'\\n\\n**PROTOCOLO:**\\nSi un rider dice esa frase por radio/teléfono:\\n1. Gerente sabe que hay peligro\\n2. Llamar a la policía inmediatamente\\n3. Enviar refuerzos a ubicación GPS\\n4. Sin hacer preguntas que delaten al rider\\n\\nPuede salvar una vida.",
        action: "Define tu palabra de seguridad con el equipo. Compártela solo con riders y mandos. NUNCA por escrito público.",
        example: "Rider fue retenido por cliente agresivo. Llamó y dijo la frase clave. Gerente envió a policía en 8 min. El rider estaba bien.",
        order: 85
    },
    {
        category: "Seguridad",
        title: "Diplomacia Vial (Desescalada de Conflictos)",
        content: "**Tus riders están 8 horas en la 'jungla' del tráfico. El roce es inevitable.**\\n\\n**LA REGLA DE LA MANO ALZADA:**\\nAnte una pitada o insulto de un conductor:\\n- JAMÁS se devuelve el insulto\\n- Se levanta la mano pidiendo disculpas (aunque no tengas culpa)\\n\\n**RAZONES:**\\n1. Una discusión con uniforme puede acabar en vídeo viral\\n2. Puede escalar a agresión física\\n3. El rider pierde tiempo (= dinero)\\n4. Imagen de Repaart dañada\\n\\n**LA PAZ ES RENTABILIDAD:**\\nQue el rider 'gane' la discusión no tiene ningún beneficio.\\nQue la evite tiene todos los beneficios.",
        action: "Incluye 'gestión de conflictos viales' en la formación. Practica la 'mano alzada' como respuesta automática.",
        example: "Taxista insultó a rider. El rider levantó la mano y siguió. Taxista se calmó. Sin el gesto, habría habido pelea.",
        order: 86
    },
    {
        category: "Seguridad",
        title: "Parking Defensivo (Antirrobo)",
        content: "**El robo de motos de reparto es común porque 'son todas iguales'.**\\n\\n**LA TÉCNICA DEL BLOQUE:**\\nSi hay varias motos paradas en la base:\\n- Átalas entre ellas con cadena larga\\n- O aparca 'en batería' muy pegadas\\n\\n**PSICOLOGÍA DEL LADRÓN:**\\nEl ladrón busca la moto suelta y fácil.\\nSi ve bloque de 3 motos pegadas, pasará de largo.\\n\\n**NUNCA CONFÍES SOLO EN:**\\n- Bloqueo de manillar\\n- Alarma integrada\\n\\n**AÑADE:**\\n- Candado de disco en rueda trasera\\n- Cadena al mobiliario urbano si es posible",
        action: "Compra 2 cadenas largas para la base. Coste: 40€. Valor: Evitar robo de moto de 3.000€.",
        example: "Moto sola en la puerta fue robada en 3 min mientras rider estaba dentro. Motos 'en bloque' nunca han sido robadas.",
        order: 87
    },
    {
        category: "Seguridad",
        title: "Detección de Billetes Falsos",
        content: "**De noche y con prisas, es fácil colar un billete falso al rider.**\\n\\n**EL ROTULADOR DETECTOR:**\\nDales a los riders un rotulador detector de billetes falsos.\\nCoste: 3€.\\n\\n**PROTOCOLO:**\\nSi el cliente paga con billete de 20€ o más:\\n1. Se marca DELANTE del cliente\\n2. Si es auténtico, no pasa nada\\n3. Si es falso, se devuelve amablemente:\\n'Perdone, la máquina no me lo coge. ¿Tiene otro o tarjeta?'\\n\\n**NUNCA:**\\n- Acusar al cliente de falsificador\\n- Quedarse el billete falso\\n- Dejar pasar para 'no molestar'",
        action: "Compra 5 rotuladores detectores. Reparte uno a cada rider. Inversión: 15€. Protección: Infinita.",
        example: "Rider aceptó billete de 50€ falso sin comprobar. Al llegar a base, era papel. Pérdida de 50€ + el pedido ya entregado.",
        order: 88
    },
    {
        category: "Seguridad",
        title: "Gestión de Contra-Reembolso",
        content: "**Si aceptas pagos en efectivo, tus riders son 'cajeros automáticos con ruedas'. Riesgo alto.**\\n\\n**EL LÍMITE DE EFECTIVO:**\\nUn rider nunca debe llevar más de 50-100€ encima.\\n\\n**PROTOCOLO DE DESCARGA:**\\nSi acumula mucho efectivo, debe pasar por la base a 'soltar lastre' aunque no haya terminado turno.\\n\\n**ARQUEO DIARIO:**\\nEl dinero se cuenta DELANTE del rider al acabar turno.\\nSi faltan 5€, se descuentan de nómina o propinas (según pacto).\\n\\n**NO SE FÍA:**\\n'Ya lo arreglamos mañana' = Nunca se arregla.\\nCuadrar caja es diario, sin excepciones.",
        action: "Define límite máximo de efectivo (ej. 80€). Instrucción: Si superas 80€, pasa por base antes del siguiente pedido.",
        example: "Rider llevaba 200€ encima (acumulado de 4 días). Le robaron. Si hubiera descargado diario, pérdida máxima habría sido 50€.",
        order: 89
    },
    {
        category: "Seguridad",
        title: "Escudo Jurídico: Modelo Anti-Ley Rider",
        content: "**El sector vive con miedo a inspecciones por 'falsos autónomos'. Repaart convierte este miedo en fortaleza.**\\n\\n**EL CONCEPTO 'SUPERAUTÓNOMO':**\\nA diferencia de las plataformas (autónomos precarios), tú eres empresario con flota asalariada.\\n\\n**ARGUMENTO DE VENTA:**\\n'Sr. Restaurante, mis riders tienen contrato, Seguridad Social y Prevención de Riesgos. Si pasa algo, la responsabilidad es 100% mía. Con otros modelos, usted podría tener un problema legal grave.'\\n\\n**TRANQUILIDAD:**\\nTu modelo cumple estrictamente la 'Ley Rider'.\\nNo dependes de vacíos legales que puedan cambiar mañana.\\n\\n**DUERMES TRANQUILO.**",
        action: "Usa el argumento legal como diferenciador en TODAS las reuniones comerciales. Es tu ventaja invisible.",
        example: "Inspección de trabajo en restaurante cliente. Pidieron datos de riders. Al ver contratos y SS al día, ni una sanción. Glovo en la misma zona: 30.000€ de multa.",
        order: 90
    },

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN IX: LIDERAZGO Y LEGADO (91-100)
    // ═══════════════════════════════════════════════════════════════
    {
        category: "Liderazgo",
        title: "El Factor Autobús (Plan de Sucesión)",
        content: "**Una pregunta macabra pero necesaria:**\\n\\nSi mañana te atropella un autobús (o enfermas gravemente), ¿la franquicia abre al día siguiente?\\n\\n**EL 'LIBRO ROJO':**\\nDebes tener documento con las claves maestras:\\n- Contraseña de Flyder y Banco\\n- Teléfono de emergencia de Yamimoto\\n- Contacto del Gestor\\n- Acceso a email corporativo\\n- PIN de alarma del local\\n\\n**UBICACIÓN:**\\nComparte la ubicación de este documento con persona de máxima confianza (socio, pareja, tu COM).\\n\\n**SI TODO ESTÁ EN TU CABEZA:**\\nTu negocio tiene una debilidad mortal.",
        action: "Crea tu 'Libro Rojo' este fin de semana. Guárdalo en lugar seguro. Comparte ubicación con 1 persona de confianza.",
        example: "Gerente tuvo accidente el viernes. Nadie sabía contraseñas. Lunes sin abrir. Con Libro Rojo, la pareja habría podido operar.",
        order: 91
    },
    {
        category: "Liderazgo",
        title: "Gestión del Rumor (Radio Macuto)",
        content: "**'He oído que van a bajar el precio por pedido', 'Dicen que van a cerrar la zona norte'.**\\n\\nLos rumores tóxicos destruyen la moral.\\n\\n**TRANSPARENCIA RADICAL:**\\nSi detectas un rumor:\\n1. Convoca reunión rápida\\n2. O manda audio oficial al grupo\\n\\n'Chicos, esto es mentira. La realidad es X.'\\n\\n**CORTA LA DESINFORMACIÓN DE RAÍZ:**\\nAntes de que se convierta en revuelta de plantilla.\\n\\n**LA FUENTE:**\\nIdentifica quién propaga rumores.\\nNo siempre es mala intención; a veces es inseguridad.\\nHabla en privado: 'Si tienes dudas, pregúntame a mí, no inventes.'",
        action: "Establece 'Viernes de Café' mensual: 30 min de charla informal donde el equipo puede preguntar cualquier cosa.",
        example: "Rumor de 'cierre inminente' se propagó. 3 riders buscaron otro trabajo. Reunión de aclaración evitó 2 bajas más.",
        order: 92
    },
    {
        category: "Liderazgo",
        title: "El Líder Alfa (Psicología de Grupo)",
        content: "**En todo grupo de riders hay uno que no es jefe, pero al que todos escuchan.**\\n\\nEs el veterano, el carismático, el que organiza las cenas.\\n\\n**IDENTIFÍCALO:**\\n¿Quién tiene el grupo de WhatsApp paralelo (sin jefes)?\\n¿A quién consultan los demás antes de aceptar cambios?\\n\\n**GÁNATELO:**\\nNo luches contra él. Hazle tu aliado.\\n\\nConsúltale cambios antes de anunciarlos:\\n'Oye Juan, estoy pensando en cambiar la zona de espera. ¿Tú cómo lo ves?'\\n\\n**EL EFECTO:**\\nSi él lo aprueba, el resto de la manada lo aceptará sin rechistar.",
        action: "Identifica quién es tu 'líder alfa' informal. Invítale a un café y pídele su opinión sobre la operativa.",
        example: "Cambio de horarios anunciado sin consultar al veterano. Él se quejó, todos se quejaron. Tensión 2 semanas. Habría bastado una conversación previa.",
        order: 93
    },
    {
        category: "Liderazgo",
        title: "Kaizen Operativo (Mejora Continua)",
        content: "**No permitas que la empresa se estanque.**\\n\\n**LA REGLA DEL 1%:**\\nPregunta cada mes al equipo:\\n'¿Qué pequeña cosa nos molesta a todos y podemos cambiar?'\\n\\n**EJEMPLOS:**\\n- Cambiar ubicación del interruptor de la luz\\n- Comprar un abrelatas mejor\\n- Cambiar la marca de papel higiénico\\n- Arreglar la puerta que chirría\\n\\n**EL IMPACTO ACUMULADO:**\\nCorregir 12 pequeñas molestias al año transforma el clima laboral y la eficiencia BRUTALMENTE.\\n\\n**COSTE:**\\nCasi cero.\\n\\n**BENEFICIO:**\\nEquipo siente que su opinión importa.",
        action: "En la próxima reunión, pregunta: '¿Qué pequeña cosa os molesta?'. Arregla 1 cosa esa misma semana.",
        example: "Rider sugirió cambiar el candado de la puerta (tardaban 30 seg en abrir). Nuevo candado: 15€. Ahorro: 5 min/día de frustración.",
        order: 94
    },
    {
        category: "Liderazgo",
        title: "Combate a la Soledad (Salud Mental)",
        content: "**El trabajo de rider es solitario. Pasan 8 horas dentro de un casco sin hablar con nadie.**\\n\\n**EL 'MINUTO HUMANO':**\\nCuando pasen por la base, dedícales 1 minuto de conversación real.\\nMirándoles a los ojos, no a la tablet.\\n\\n'¿Qué tal el tráfico hoy? ¿Mucho frío?'\\n\\n**EFECTO:**\\nSentirse escuchado reduce la ansiedad y el burnout.\\nMejora la retención de personal.\\n\\n**EL COSTE:**\\n5 minutos al día.\\n\\n**EL BENEFICIO:**\\nEquipo más fiel, menos rotación, mejor ambiente.",
        action: "Cuando un rider pase por base, para lo que estés haciendo 60 segundos. Pregunta algo personal (no de trabajo).",
        example: "Rider veterano confesó que se sentía 'invisible'. Tras implementar el minuto humano, su actitud cambió completamente.",
        order: 95
    },
    {
        category: "Liderazgo",
        title: "Ritual de Descompresión (Post-Turno)",
        content: "**El rider llega a casa con la adrenalina del tráfico y el ruido.**\\n\\n**CIERRE DE TURNO:**\\nNo permitas que se vayan corriendo con el casco puesto.\\n\\nFomenta 5 minutos de 'enfriamiento' en el local:\\n- Beber agua\\n- Charlar con el compañero\\n- Sentarse sin hacer nada\\n\\n**BENEFICIO:**\\nAyuda a bajar las pulsaciones antes de volver a su vida personal.\\nReduce el estrés acumulado a largo plazo.\\n\\n**EL ESPACIO:**\\nTen un rincón con sillas cómodas y agua fría disponible.",
        action: "Crea 'zona de relax' en el local: 2 sillas, dispensador de agua, quizás una revista. Coste: 50€.",
        example: "Rider iba a casa estresado, discutía con pareja. Tras implementar ritual de descompresión, reportó mejor calidad de vida.",
        order: 96
    },
    {
        category: "Liderazgo",
        title: "Cómo Exprimir el Mentoring Premium",
        content: "**Si pagas Pack Premium (3% royalty), tienes Sesión Estratégica Quincenal.**\\n\\nMuchos la desperdician hablando de trivialidades.\\n\\n**EL 'PRE-WORK' OBLIGATORIO:**\\nAntes de conectar al Calendly, prepara tu 'Top 3 de Problemas':\\n\\n1. Ruta Ineficiente: '¿Por qué Flyder me manda cruzar el centro a las 14:00?'\\n2. Cliente Tóxico: 'El Restaurante X tarda 15 min de media, ¿cómo le presiono?'\\n3. Finanzas: 'Mi coste de personal se ha disparado al 45%'\\n\\n**OBJETIVO:**\\nNo uses la sesión para quejarte.\\nÚsala para auditar tus datos con un experto que ve DECENAS de franquicias y sabe qué tecla tocar.",
        action: "Antes de cada mentoring, escribe 3 problemas concretos con datos. Envíalos al mentor 24h antes.",
        example: "Franquiciado llevaba 3 meses de mentoring hablando de 'cosas generales'. Cuando empezó a traer datos, en 2 sesiones optimizó rutas y ahorró 200€/mes.",
        order: 97
    },
    {
        category: "Liderazgo",
        title: "Protocolo Crisis Viral (Redes Sociales)",
        content: "**Un vídeo de rider comiéndose pizza o haciendo caballito se hace viral en TikTok.**\\n\\n**REACCIÓN INMEDIATA (24h máximo):**\\n1. Identificar al rider (por matrícula/hora)\\n2. Expediente disciplinario / Despido fulminante\\n3. Comunicado Público\\n\\n**EL COMUNICADO:**\\n'Lamentamos el incidente. El individuo ya no trabaja con nosotros. Repaart condena esto. Invitamos al cliente afectado a [compensación].'\\n\\n**LA CLAVE:**\\nLa rapidez y contundencia transforman una crisis en una demostración de seriedad.\\n\\nCallar o tardar = La crisis crece.",
        action: "Ten plantilla de comunicado de crisis preparada. Solo hay que rellenar los datos del incidente.",
        example: "Vídeo de rider burlándose de cliente se hizo viral. Respuesta en 4h con despido visible. La prensa tituló 'Empresa actúa rápido'. Crisis controlada.",
        order: 98
    },
    {
        category: "Liderazgo",
        title: "Parte de Guerra (Bitácora de Incidencias)",
        content: "**Los problemas que no se escriben, se olvidan y se repiten.**\\n\\n**EL CUADERNO FÍSICO:**\\nTen un cuaderno en la mesa.\\nAnota fecha y problema raro:\\n\\n'Día 12: La App falló de 21:00 a 21:15'\\n'Día 15: Restaurante X se quedó sin envases'\\n'Día 18: Rider Juan llegó tarde por tercera vez'\\n\\n**ANÁLISIS MENSUAL:**\\nA final de mes, lee el cuaderno.\\nSi ves que el 'Fallo de App' se repite los viernes, ya sabes que tienes que avisar a soporte PREVENTIVAMENTE.\\n\\n**ES TU MEMORIA EXTERNA.**",
        action: "Compra un cuaderno bonito solo para incidencias. Anota todo lo 'raro' que pase cada día. Revísalo cada domingo.",
        example: "Patrón detectado: Restaurante X siempre tenía problemas los jueves. Investigación reveló que ese día cambiaba el personal de cocina.",
        order: 99
    },
    {
        category: "Liderazgo",
        title: "La Mentalidad 'Dueño' (Liderazgo Final)",
        content: "**El módulo final no es una técnica, es una ACTITUD.**\\n\\n**EL EJEMPLO:**\\n- Si llueve a mares y faltan manos, el Gerente se pone el casco y hace un reparto.\\n- Si hay un papel en el suelo del local, el Gerente lo recoge.\\n- Si hay problema a las 23:00, el Gerente contesta el teléfono.\\n\\n**LECCIÓN:**\\nTus riders no respetarán lo que DICES.\\nRespetarán lo que HACES.\\n\\n**EL LEGADO:**\\nEl liderazgo desde el frente es la ÚNICA forma de mantener una flota de alta eficiencia.\\n\\n**EL TEST FINAL:**\\n¿Puedes irte 15 días de vacaciones y que todo funcione?\\nSi la respuesta es SÍ, tienes una EMPRESA.\\nSi es NO, tienes un AUTOEMPLEO.",
        action: "Esta semana, haz UNA tarea 'de base' que normalmente no harías. Limpia un cajón, ayuda en un reparto. Que te vean.",
        example: "Gerente limpió personalmente el local un sábado. Los riders nunca más dejaron basura en el suelo. El ejemplo educa más que mil órdenes.",
        order: 100
    },

    // ═══════════════════════════════════════════════════════════════
    // SECCIÓN X: NIVEL CEO Y GESTIÓN DE CRISIS (101-150)
    // ═══════════════════════════════════════════════════════════════
    {
        category: "Seguridad",
        title: "Diplomacia Vial (Desescalada de Conflictos)",
        content: "**Tus riders están 8 horas en la 'jungla' del tráfico. El roce es inevitable.**\\n\\n**LA REGLA DE LA MANO ALZADA:**\\nAnte una pitada o insulto de un conductor:\\n- JAMÁS se devuelve el insulto\\n- Se levanta la mano pidiendo disculpas (aunque no tengas culpa)\\n\\n**RAZONES:**\\n1. Una discusión con uniforme puede acabar en vídeo viral\\n2. Puede escalar a agresión física\\n3. El rider pierde tiempo (= dinero)\\n4. Imagen de Repaart dañada\\n\\n**LA PAZ ES RENTABILIDAD:**\\nQue el rider 'gane' la discusión no tiene ningún beneficio.\\nQue la evite tiene todos los beneficios.",
        action: "Incluye 'gestión de conflictos viales' en la formación. Practica la 'mano alzada' como respuesta automática.",
        example: "Taxista insultó a rider. El rider levantó la mano y siguió. Taxista se calmó. Sin el gesto, habría habido pelea.",
        order: 101
    },
    {
        category: "Operativa",
        title: "El Kit 'MacGyver' (Reparaciones de Trinchera)",
        content: "**A veces la moto se 'desmonta' a mitad de servicio y la grúa tarda 1 hora.**\\n\\n**DOTACIÓN DE EMERGENCIA:**\\nCada moto debe llevar bajo el asiento 3 cosas:\\n- Bridas de plástico\\n- Cinta Americana\\n- Destornillador reversible\\n\\n**USO:**\\nUn espejo flojo, una matrícula que vibra o un carenado suelto tras un golpe leve se arreglan en 2 minutos con bridas para poder terminar el turno.\\n\\nYa irá al taller mañana, pero hoy la facturación no para.",
        action: "Equipa todas las motos con el Kit MacGyver. Coste: 5€/moto. Ahorro: Horas de servicio perdidas.",
        example: "Rider ató espejo con brida y siguió repartiendo 3 horas más. Sin brida, habría tenido que volver a base.",
        order: 102
    },
    {
        category: "Operativa",
        title: "Gestión de 'Eventos Masivos' (La Champions League)",
        content: "**El fútbol o Eurovisión no son días normales; son tsunamis.**\\n\\n**LA PARADOJA DEL PARTIDO:**\\n- Pre-Partido: Demanda explosiva (pizzas/cervezas). Necesitas a toda la plantilla.\\n- Durante el Partido: La demanda cae a CERO. Las calles están vacías.\\n- Descanso/Final: Segundo pico explosivo.\\n\\n**ESTRATEGIA:**\\nNo pongas turnos lineales. Parte los turnos o pacta descansos no remunerados durante los 45 min de la primera parte para reactivarlos al descanso. Optimización pura.",
        action: "Revisa calendario de Liga y Champions. Marca en rojo los días de partido y planifica turnos partidos.",
        example: "Gerente dio descanso de 21:00 a 21:45 durante final de Champions. Ahorró 45 min de sueldo de 10 riders sin trabajo.",
        order: 103
    },
    {
        category: "Liderazgo",
        title: "Detección del 'Líder Alfa' (Psicología de Grupo)",
        content: "**En todo grupo de riders hay uno que no es jefe, pero al que todos escuchan (el veterano, el carismático).**\\n\\n**IDENTIFÍCALO:**\\nEs quien organiza las cenas o quien tiene el grupo de WhatsApp paralelo (sin jefes).\\n\\n**GÁNATELO:**\\nNo luches contra él. Hazle tu aliado. Consúltale cambios operativos antes de anunciarlos: 'Oye Juan, estoy pensando en cambiar la zona de espera, ¿tú cómo lo ves?'.\\n\\nSi él lo aprueba, el resto de la manada lo aceptará sin rechistar.",
        action: "Identifica a tu Líder Alfa. Invítale a un café y pídele opinión honesta sobre la operativa. Hazle sentir importante.",
        example: "Cambio de uniformidad aceptado gracias a que el Líder Alfa lo validó primero.",
        order: 104
    },
    {
        category: "Operativa",
        title: "Mapeo de 'Obras y Cortes' (Urbanismo Táctico)",
        content: "**Flyder calcula la ruta teórica, pero no sabe que la Calle Mayor está levantada por obras desde ayer.**\\n\\n**EL BRIEFING DIARIO:**\\nTen una pizarra blanca en la entrada. Escribe cada mañana: '🚫 C/ Mayor CORTADA. Entrad por C/ Ancha'.\\n\\n**AHORRO:**\\nEvitas que 10 riders se metan en una ratonera, den la vuelta y pierdan 10 minutos cada uno. 100 minutos ahorrados con un rotulador.",
        action: "Instala pizarra de 'Incidencias Viales' en la salida. Actualízala cada mañana.",
        example: "Aviso de corte en pizarra salvó el servicio de mediodía de un atasco monumental.",
        order: 105
    },
    {
        category: "Seguridad",
        title: "La Técnica del 'Semáforo-Check' (Seguridad Activa)",
        content: "**El mayor peligro es mirar el móvil en marcha para ver dónde es la entrega.**\\n\\n**EL HÁBITO:**\\nEntrena al rider: El móvil solo se toca con los pies en el suelo (semáforo rojo o aparcado).\\n\\nSi el rider manipula el móvil rodando a 30km/h: Sanción Grave. Es la causa nº1 de alcances traseros en ciudad.",
        action: "Sanciona con tolerancia cero el uso de móvil en marcha. Es cuestión de vida o muerte.",
        example: "Accidente evitado: Rider esperó al semáforo para revisar dirección en vez de hacerlo en marcha.",
        order: 106
    },
    {
        category: "Calidad",
        title: "Marketing de la Basura (El Efecto Visible)",
        content: "**Si tus riders fuman o comen en la puerta del local y tiran las colillas/papeles al suelo, los vecinos te odiarán.**\\n\\n**LA PAPELERA CORPORATIVA:**\\nPon un cenicero/papelera grande en la puerta. Norma: 'Lo que cae al suelo, se recoge'.\\n\\nVer a un rider barriendo la acera de tu local genera una imagen de civismo brutal en el barrio. Te diferencia de la 'suciedad' asociada al delivery.",
        action: "Compra cenicero exterior grande. Instituye la norma de 'acera limpia'.",
        example: "Vecino felicitó al gerente por tener la acera más limpia de la calle. Quejas vecinales desaparecieron.",
        order: 107
    },
    {
        category: "Comercial",
        title: "El Momento 'Burofax' (Cobro de Morosos)",
        content: "**Hay un momento donde la diplomacia con un restaurante que no paga se acaba.**\\n\\n**EL LÍMITE:**\\nSi tras llamadas y visitas amistosas pasan 15 días del vencimiento:\\n1. Cortar servicio (bloqueo en sistema).\\n2. Burofax oficial reclamando deuda + intereses legales.\\n\\nNo tengas miedo a perder el cliente; un cliente que no paga te está costando dinero cada día. Mejor que se vaya a la competencia.",
        action: "Redacta plantilla de Burofax de reclamación de deuda. Tenla lista para usar.",
        example: "Restaurante pagó deuda de 2.000€ 24h después de recibir burofax. El miedo legal funciona.",
        order: 108
    },
    {
        category: "Operativa",
        title: "Modo 'Oscuro' y Ahorro Energético",
        content: "**Parece una tontería, pero afecta a la operativa.**\\n\\n**CONFIGURACIÓN DE APP:**\\nObliga a usar el 'Modo Oscuro' en Google Maps/Waze y en el móvil.\\n\\n**RAZÓN:**\\nReduce drásticamente el consumo de batería de la pantalla (el componente que más gasta). Esto alarga la vida útil del móvil durante el turno y reduce la dependencia de powerbanks. Además, fatiga menos la vista del rider por la noche.",
        action: "Verifica configuración de móviles de riders. Todos a 'Dark Mode'.",
        example: "Autonomía de baterías aumentó 20% solo cambiando a modo oscuro.",
        order: 109
    },
    {
        category: "Liderazgo",
        title: "El 'Factor Autobús' (Plan de Sucesión)",
        content: "**Una pregunta macabra pero necesaria: Si mañana te atropella un autobús, ¿la franquicia abre al día siguiente?**\\n\\n**EL 'LIBRO ROJO':**\\nDebes tener un documento con las claves maestras: Contraseña de Flyder y Banco, teléfono de emergencia de Yamimoto, contacto del Gestor. Comparte la ubicación de este documento con una persona de máxima confianza (socio, pareja o tu 'COM').\\n\\nSi todo está en tu cabeza, tu negocio tiene una debilidad mortal.",
        action: "Crea y comparte tu 'Libro Rojo' de emergencia hoy mismo.",
        example: "Franquicia siguió operando tras accidente del gerente gracias al Libro Rojo.",
        order: 110
    },
    {
        category: "Seguridad",
        title: "Protocolo de Viento Lateral (El 'Efecto Vela')",
        content: "**Llevar un cajón de 90 litros detrás convierte la moto en un velero.**\\n\\n**EL PELIGRO:**\\nCon vientos >40 km/h, el cajón hace de 'vela'. Un golpe de viento lateral puede tirar al rider al suelo o sacarlo de su carril.\\n\\n**LA INSTRUCCIÓN:**\\nEn días ventosos, prohibido terminantemente adelantar camiones o autobuses (el efecto succión es mortal). Se debe reducir la velocidad un 20% y conducir por el centro del carril.",
        action: "Activa alerta 'Viento Fuerte' en días de temporal. Prohíbe adelantamientos a vehículos grandes.",
        example: "Rider salvó caída por ráfaga al circular más lento y centrado siguiendo protocolo.",
        order: 111
    },
    {
        category: "RRHH",
        title: "Ergonomía Preventiva (La 'Espalda del Rider')",
        content: "**Las bajas por lumbalgia son la epidemia silenciosa del sector.**\\n\\n**AJUSTE DE ESPEJOS:**\\nObliga a cada rider a ajustar los espejos al inicio del turno. Si conducen encorvados para ver por un espejo mal puesto, en 4 horas tendrán dolor.\\n\\n**TÉCNICA DE LEVANTAMIENTO:**\\nEnseña a cargar la mochila térmica usando las piernas, no la espalda. Una baja de 15 días por 'tirón' te destroza el cuadrante.",
        action: "Charla de 5 min sobre ergonomía y ajuste de espejos antes del turno.",
        example: "Reducción de bajas por dolor de espalda tras campaña de concienciación.",
        order: 112
    },
    {
        category: "RRHH",
        title: "Disciplina de Radio (El Grupo de WhatsApp)",
        content: "**El grupo de WhatsApp de trabajo puede convertirse en un gallinero de memes.**\\n\\n**REGLA 'CANAL LIMPIO':**\\nEl grupo 'OPERATIVA' es solo para incidencias de trabajo ('Llegada', 'Avería', 'Cliente no está').\\n\\n**PROHIBIDO:**\\nMemes, chistes, fotos personales o discusiones de fútbol. Si hay una urgencia real, se perderá entre la basura. Crea un segundo grupo 'OFF-TOPIC' para el ocio si quieren, pero el canal de trabajo es sagrado.",
        action: "Audita tu grupo de WhatsApp. Si hay memes, elimínalos y recuerda la norma.",
        example: "Aviso de accidente perdido entre memes de fútbol. Nunca más.",
        order: 113
    },
    {
        category: "Operativa",
        title: "La Defensa de 'Carga y Descarga' (Ante el Agente)",
        content: "**Aparcar mal es inevitable, pero la multa es evitable.**\\n\\n**LA ACTITUD:**\\nSi un agente se acerca a la moto mal aparcada, el rider debe aparecer corriendo y pedir disculpas inmediatamente, no discutir.\\n\\n**LA PALABRA MÁGICA:**\\n'Agente, estoy realizando un servicio de carga y descarga urgente de alimentos, me voy en 30 segundos'. La mayoría de ordenanzas permiten paradas breves (<2 min). Si el rider se pone chulo, la multa cae seguro.",
        action: "Role-play con riders: Cómo hablar con la policía para evitar multas.",
        example: "Multa evitada por rider que pidió disculpas humildemente y alegó carga y descarga.",
        order: 114
    },
    {
        category: "RRHH",
        title: "La 'Lista Gris' (Base de Datos de Ex-Empleados)",
        content: "**La memoria es frágil. No recontrates a quien te dio problemas.**\\n\\n**EL REGISTRO DE SALIDA:**\\nCuando alguien se va, anota en tu Excel privado el motivo real: 'Baja voluntaria (correcto)' o 'Despido (robaba gasolina / conflictivo)'.\\n\\n**UTILIDAD:**\\nDentro de 2 años, ese rider volverá a pedir trabajo. Si no tienes la lista, podrías cometer el error de readmitir a una 'manzana podrida'.",
        action: "Crea Excel 'Histórico de Personal' con columna 'Motivo Salida' y 'Recontratable (S/N)'.",
        example: "Evitamos recontratar a rider conflictivo 3 años después gracias a la Lista Gris.",
        order: 115
    },
    {
        category: "Seguridad",
        title: "Rutina de 'Ver y Ser Visto' (Luces Fundidas)",
        content: "**Una luz de freno fundida multiplica por 10 el riesgo de que un coche embista a tu rider por detrás.**\\n\\n**EL CHEQUEO DE PAREJAS:**\\nAntes de salir, los riders deben ponerse por parejas: uno frena y pone intermitentes, el otro mira. Tardan 10 segundos. Circular con luces fundidas es Falta Grave de seguridad. Yamimoto suele incluir bombillas, cámbialas al momento.",
        action: "Instaura el 'Chequeo de Luces' diario en la salida del turno.",
        example: "Detección de luz de freno fundida antes de salir evitó posible accidente nocturno.",
        order: 116
    },
    {
        category: "Calidad",
        title: "Política de 'Desperdicio Cero' (RSC Interna)",
        content: "**¿Qué se hace con la comida de un pedido cancelado o devuelto?**\\n\\n**PROTOCOLO:**\\nTirar comida a la basura da mala imagen y baja la moral. Se ofrece primero al personal del turno (rider/gerente) para consumo propio en el descanso.\\n\\n**REGLA DE ORO:**\\nJamás se revende ni se lleva a casa para 'la familia'. Se consume en el local o se tira. Evita que los riders 'forcen' cancelaciones para llevarse la cena a casa.",
        action: "Define política de comida sobrante y comunícala. Transparencia total.",
        example: "Fin de rumores sobre qué pasaba con los pedidos cancelados.",
        order: 117
    },
    {
        category: "Operativa",
        title: "Estrategia Antirrobo 'Parking Defensivo'",
        content: "**El robo de motos de reparto es común porque 'son todas iguales'.**\\n\\n**LA TÉCNICA DEL BLOQUE:**\\nSi hay varias motos paradas en la base, átalas entre ellas con una cadena larga o aparca 'en batería' muy pegadas.\\n\\n**PSICOLOGÍA DEL LADRÓN:**\\nEl ladrón busca la moto suelta y fácil. Si ve un bloque de 3 motos pegadas, pasará de largo. Nunca confíes solo en el bloqueo de manillar.",
        action: "Compra cadena larga de seguridad para la flota en base.",
        example: "Intento de robo frustrado porque las motos estaban encadenadas en bloque.",
        order: 118
    },
    {
        category: "RRHH",
        title: "Combate a la Soledad (Salud Mental)",
        content: "**El trabajo de rider es solitario. Pasan 8 horas dentro de un casco sin hablar con nadie.**\\n\\n**EL 'MINUTO HUMANO':**\\nCuando pasen por la base, dedícales 1 minuto de conversación real mirándoles a los ojos, no a la tablet. '¿Qué tal el tráfico hoy? ¿Mucho frío?'.\\n\\nSentirse escuchado reduce la ansiedad y el 'burnout' (síndrome del quemado), mejorando la retención de personal.",
        action: "Obligatorio: Saludar mirando a los ojos a cada rider que entra en base.",
        example: "Mejora visible en ánimo de riders tras aplicar el 'Minuto Humano'.",
        order: 119
    },
    {
        category: "Liderazgo",
        title: "El 'Parte de Guerra' (Bitácora de Incidencias)",
        content: "**Los problemas que no se escriben, se olvidan y se repiten.**\\n\\n**EL CUADERNO FÍSICO:**\\nTen un cuaderno en la mesa. Anota fecha y problema raro: 'Día 12: La App falló de 21:00 a 21:15', 'Día 15: El Restaurante X se quedó sin envases'.\\n\\n**ANÁLISIS:**\\nA final de mes, lee el cuaderno. Si ves que el 'Fallo de App' se repite los viernes, ya sabes que tienes que avisar a soporte técnico preventivamente. Es tu memoria externa.",
        action: "Compra cuaderno de incidencias. Empieza a registrar HOY.",
        example: "Patrón de fallo recurrente identificado y resuelto gracias al registro escrito.",
        order: 120
    },
    {
        category: "Seguridad",
        title: "El Efecto 'Visera Sucia' (Seguridad Nocturna)",
        content: "**Un casco con la visera rayada o sucia refracta la luz de las farolas y ciega al rider por la noche.**\\n\\n**EL PROTOCOLO LIMPIA-CRISTALES:**\\nTen un spray de limpiacristales y papel de cocina en la zona de salida. Norma: Obligatorio limpiar la visera antes de empezar el turno de noche.\\n\\n**IMPACTO:**\\nReduce la fatiga ocular y evita accidentes por deslumbramiento. Un rider que no ve bien, conduce lento y con miedo.",
        action: "Kit de limpieza de viseras disponible en la entrada.",
        order: 121
    },
    {
        category: "Operativa",
        title: "Diplomacia de la 'Puerta de Atrás' (Invisibilidad)",
        content: "**Entrar por la puerta principal con el casco y la mochila golpeando a los clientes que cenan es un error grave.**\\n\\n**MAPEO DE ACCESOS:**\\nIdentifica qué restaurantes tienen entrada de servicio o cocina. Instrucción: 'En la Pizzería Luigi, entrad siempre por el callejón'.\\n\\n**BENEFICIO:**\\nEl dueño del restaurante te amará porque no molestas a sus comensales, y tu rider saldrá más rápido sin esquivar camareros.",
        action: "Revisa accesos de todos los restaurantes. Documenta entradas de servicio con fotos.",
        example: "Quejas de restaurante de lujo cesaron al usar puerta de servicio.",
        order: 122
    },
    {
        category: "Tecnología",
        title: "Síndrome del 'Estabilizador Roto' (Cuidado del Móvil)",
        content: "**Las vibraciones de la moto destruyen las cámaras de los móviles modernos (rompen el estabilizador óptico).**\\n\\n**EL SOPORTE ANTI-VIBRACIÓN:**\\nNo compres el soporte de móvil más barato de Amazon (plástico rígido). Invierte en soportes con damper (amortiguador de goma).\\n\\n**AHORRO:**\\nUn móvil de empresa con la cámara rota no puede escanear códigos QR ni hacer fotos de entrega, convirtiéndose en un pisapapeles caro.",
        action: "Sustitución progresiva de soportes rígidos por soportes con amortiguación (QuadLock o similar).",
        example: "Factura de reparación de móviles reducida drásticamente.",
        order: 123
    },
    {
        category: "Comercial",
        title: "Política de 'Redes Sociales Mudas' (Confidencialidad)",
        content: "**Lo que pasa en el turno, se queda en el turno.**\\n\\n**PROHIBICIÓN DE 'STORIES':**\\nTerminantemente prohibido subir fotos o vídeos a Instagram/TikTok donde salgan clientes (aunque sean famosos o raros), direcciones o interiores de casas.\\n\\n**RIESGO:**\\nUna foto 'graciosa' de un cliente en pijama puede costarte una demanda por violación del honor y la pérdida de la franquicia.",
        action: "Cláusula de confidencialidad en redes sociales firmada por todos los riders.",
        example: "Despido procedente de rider que publicó foto de casa de famoso.",
        order: 124
    },
    {
        category: "Tecnología",
        title: "Detección de Billetes Falsos (Efectivo Seguro)",
        content: "**De noche y con prisas, es fácil colar un billete de 20€ o 50€ falso al rider.**\\n\\n**EL ROTULADOR DETECTOR:**\\nDales a los riders un rotulador detector de billetes falsos (cuesta 3€).\\n\\n**PROTOCOLO:**\\nSi el cliente paga con un billete de 20€ o más, se marca delante de él. Si es auténtico, no pasa nada. Si es falso, se devuelve amablemente: 'Perdone, la máquina no me lo coge, ¿tiene otro o tarjeta?'.",
        action: "Reparto de rotuladores detectores a toda la flota.",
        example: "Intento de colar 50€ falsos frustrado por el rotulador.",
        order: 125
    },
    {
        category: "Seguridad",
        title: "La Regla del 'Anti-Héroe' (Robo de Moto)",
        content: "**Si un ladrón intenta robar la moto con violencia o amenaza:**\\n\\n**INSTRUCCIÓN TAJANTE:**\\nLa moto vale 3.000€, tu vida no tiene precio. Si te amenazan, entrega la moto y las llaves inmediatamente. No te pelees.\\n\\nLa moto tiene GPS y seguro de robo. No queremos héroes en el hospital. La empresa cubre la pérdida, pero no las lesiones.",
        action: "Instrucción clara en onboarding: NUNCA resistirse a robo con violencia.",
        order: 126
    },
    {
        category: "Operativa",
        title: "El 'Minuto de Oro' (Post-Entrega)",
        content: "**El momento crítico es justo después de cerrar la puerta del cliente.**\\n\\n**PAUSA TÁCTICA:**\\nEl rider no debe marcar 'Libre' y arrancar a tope en el segundo 1. Esperar 30 segundos en el portal revisando el móvil.\\n\\n**RAZÓN:**\\nSi el cliente abre la bolsa y ve que falta la Coca-Cola, bajará corriendo o llamará. Si el rider sigue ahí, se soluciona en el momento. Si ya se ha ido lejos, se convierte en una incidencia grave de reembolso.",
        action: "Norma de esperar 30s en portal antes de arrancar.",
        example: "Incidencia de bebida olvidada resuelta in-situ gracias a la pausa táctica.",
        order: 127
    },
    {
        category: "Calidad",
        title: "Higiene de la Mochila (La Prueba del Olor)",
        content: "**Una mochila térmica cerrada y húmeda desarrolla olores horribles en 24h.**\\n\\n**PROTOCOLO 'CIERRES ABIERTOS':**\\nAl terminar el turno y dejar la mochila en el local, se debe dejar abierta (cremalleras bajadas) para que ventile. Mochila cerrada toda la noche = Caldo de cultivo de bacterias.\\n\\nNadie quiere que su pizza huela a humedad rancia.",
        action: "Zona de ventilación de mochilas habilitada en el local.",
        example: "Eliminación de quejas por 'olor raro' en la comida.",
        order: 128
    },
    {
        category: "Seguridad",
        title: "El Kit de 'Luces Extra' (Visibilidad Pasiva)",
        content: "**A veces la luz de la moto es insuficiente en calles oscuras.**\\n\\n**ADHESIVOS REFLECTANTES:**\\nPega cinta reflectante extra (homologada) en los laterales del cajón y en el casco del rider.\\n\\n**SEGURIDAD:**\\nCuanto más parezca un árbol de navidad por la noche, menos probabilidades hay de que un coche se lo lleve por delante en un cruce.",
        action: "Mejora de visibilidad de flota con reflectantes de alta calidad.",
        order: 129
    },
    {
        category: "Liderazgo",
        title: "Gestión del Rumor (Radio Macuto)",
        content: "**'He oído que van a bajar el precio por pedido', 'Dicen que van a cerrar la zona norte'.**\\n\\n**TRANSPARENCIA RADICAL:**\\nSi detectas un rumor, convoca una reunión rápida o manda un audio oficial al grupo: 'Chicos, esto es mentira. La realidad es X'. Corta la desinformación de raíz antes de que se convierta en una revuelta de la plantilla.",
        action: "Canal oficial de desmentidos. Comunicación rápida y veraz.",
        example: "Conato de huelga por rumor falso desactivado en 10 minutos con comunicación clara.",
        order: 130
    },
    {
        category: "Operativa",
        title: "La Regla de 'Pisos Bajos' (Cardio Táctico)",
        content: "**Esperar al ascensor es el mayor 'ladrón de tiempo' en edificios antiguos.**\\n\\n**LA NORMA DEL TERCERO:**\\nSi la entrega es en un 1º, 2º o 3º piso, se sube por las escaleras (salvo lesión o pedido pesado). Entre que llamas al ascensor, baja, abre puertas y sube, has perdido 3 minutos. Por la escalera tardas 45 segundos.",
        action: "Recomendación de uso de escaleras para pisos bajos. Salud y eficiencia.",
        example: "Ahorro acumulado de 30 min/día por rider usando escaleras.",
        order: 131
    },
    {
        category: "Operativa",
        title: "Política de 'Oído Libre' (Legalidad y Seguridad)",
        content: "**Los auriculares son ilegales en moto en muchos sitios, y peligrosos en todos.**\\n\\n**EL INTERCOMUNICADOR:**\\nSi necesitan GPS por audio, invierte en sistemas integrados en el casco (homologados). Si usan auriculares normales: Estrictamente prohibido usar los dos. Siempre un oído libre para escuchar sirenas, cláxones o ruidos de motor.",
        action: "Prohibición de doble auricular. Fomento de intercomunicadores legales.",
        order: 132
    },
    {
        category: "Operativa",
        title: "Gestión de Llaves de Restaurante (Confianza Extrema)",
        content: "**Algunos restaurantes cierran cocina antes de que tú recojas el último pedido.**\\n\\n**PROTOCOLO 'LLAVE CUSTODIA':**\\nCon clientes de mucha confianza, puedes tener copia de su llave o código de alarma para recoger pedidos dejados en la barra tras el cierre. Requiere contrato de responsabilidad, pero permite alargar el servicio sin coste de personal para el restaurante.",
        action: "Servicio premium de 'Llave Custodia' para clientes VIP.",
        example: "Facturación nocturna aumentada al poder recoger tras cierre de local.",
        order: 133
    },
    {
        category: "Liderazgo",
        title: "Diplomacia con Conserjes (Los 'Porteros')",
        content: "**Un conserje enfadado puede prohibir la entrada a tus riders y obligarles a esperar en la calle.**\\n\\n**LA ALIANZA:**\\nInstruye a tus riders: 'Al conserje se le saluda siempre con un Buenas noches, caballero'. Si hay buena relación, el conserje abrirá la puerta antes y facilitará el trabajo. Si hay mala relación, te hará la vida imposible.",
        action: "Formación en trato exquisito a conserjes y personal de seguridad.",
        example: "Conserje bloqueaba acceso a riders maleducados. Tras cambio de actitud, facilita ascensor VIP.",
        order: 134
    },
    {
        category: "Tecnología",
        title: "La Foto 'Testigo' (Entregas Sin Contacto)",
        content: "**El cliente dice 'no lo he recibido'. El rider dice 'lo dejé en el felpudo'. ¿A quién crees?**\\n\\n**EVIDENCIA DIGITAL:**\\nEn entregas 'Contactless' (dejar en puerta), es obligatorio tomar una foto de la bolsa frente a la puerta abierta o número del piso y enviarla por el chat de la App. Es tu seguro contra reclamaciones fraudulentas.",
        action: "Foto obligatoria en toda entrega 'contactless'.",
        example: "Devolución de dinero denegada a cliente fraudulento gracias a la foto testigo.",
        order: 135
    },
    {
        category: "Seguridad",
        title: "El Kit 'Anti-Pinchazo' (Solución de 5 Minutos)",
        content: "**Esperar a la grúa por un clavo es ruinoso.**\\n\\n**SPRAY REPARADOR:**\\nCada moto debe llevar un bote de espuma repara-pinchazos. Si pinchas, usa el bote, hincha y termina el turno (o vuelve a base). Te ahorra las 2 horas de espera de la asistencia.",
        action: "Spray repara-pinchazos en cada cajón de moto.",
        example: "Rider salvó turno de noche gracias al spray tras pinchar.",
        order: 136
    },
    {
        category: "Operativa",
        title: "Guantes Táctiles (Eficiencia Digital)",
        content: "**Quitarse y ponerse los guantes de moto cada vez que hay que tocar el móvil es una pérdida de tiempo.**\\n\\n**DOTACIÓN:**\\nCompra guantes de invierno con punta conductiva (para pantallas). Parece un detalle menor, pero ahorra unos 30 segundos por cada interacción con Flyder. En 20 pedidos, son 10 minutos ganados.",
        action: "Guantes táctiles como parte del uniforme estándar.",
        order: 137
    },
    {
        category: "Calidad",
        title: "Auditoría de 'Patatas Fritas' (Control de Gula)",
        content: "**Es la tentación número 1 del rider: 'robar' unas patatas de la bolsa abierta.**\\n\\n**EL PRECINTO SAGRADO:**\\nExige a tus restaurantes que usen pegatinas de seguridad o grapas. Si la bolsa llega sin precintar, la culpa es tuya por aceptarla. Instruye al rider: 'Si no está cerrada con grapa o pegatina, no la recojas hasta que la cierren'.",
        action: "Tolerancia cero con bolsas abiertas. Protección contra robo y desconfianza.",
        order: 138
    },
    {
        category: "Operativa",
        title: "La 'Chuleta' de Urbanizaciones (Mapeo Complejo)",
        content: "**Hay urbanizaciones que son laberintos donde el GPS falla.**\\n\\n**LA WIKI LOCAL:**\\nCrea un documento compartido o notas en el tablón con mapas de los complejos residenciales difíciles: 'En Residencial Los Pinos, los impares están a la derecha rampa'. Evita que cada rider nuevo pierda 15 minutos dando vueltas.",
        action: "Base de datos de 'Urbanizaciones Laberinto' compartida.",
        example: "Tiempos de entrega en urbanización compleja reducidos un 40%.",
        order: 139
    },
    {
        category: "Liderazgo",
        title: "Ritual de 'Descompresión' (Salud Mental)",
        content: "**El rider llega a casa con la adrenalina del tráfico y el ruido.**\\n\\n**CIERRE DE TURNO:**\\nNo permitas que se vayan corriendo con el casco puesto. Fomenta 5 minutos de 'enfriamiento' en el local: beber agua, charlar, sentarse. Ayuda a bajar las pulsaciones antes de volver a la vida personal.",
        action: "Zona de descanso post-turno obligatoria 5 min.",
        order: 140
    },
    {
        category: "Tecnología",
        title: "Protocolo 'Apocalipsis Digital' (Caída de Servidores)",
        content: "**¿Qué pasa si Flyder, Google Maps o AWS se caen a nivel mundial un viernes a las 21:00?**\\n\\n**OPERATIVA ANALÓGICA:**\\nTen impresos en el local mapas físicos de la ciudad y bloques de albaranes de papel. Modo Radio-Taxi: Los pedidos entran por teléfono, asignas por walkie/teléfono y el rider se guía por mapa papel. Mientras tu competencia está paralizada, tú sigues repartiendo.",
        action: "Simulacro de caída de sistema trimestral. Mapas físicos listos.",
        example: "Servicio mantenido durante caída global de AWS gracias al modo analógico.",
        order: 141
    },
    {
        category: "Calidad",
        title: "El 'Efecto Mayordomo' (Elevación del Estatus)",
        content: "**Diferénciate de la imagen del 'repartidor precario'.**\\n\\n**POSTURA DE ENTREGA:**\\nNo se estira el brazo con desgana. Se saca el producto de la mochila térmica DELANTE del cliente (para que vea el vapor) y se entrega con dos manos. Este pequeño teatro subconsciente justifica precios más altos.",
        action: "Entrenamiento en protocolo de entrega premium.",
        example: "Cliente elogió 'clase' del rider al entregar con dos manos.",
        order: 142
    },
    {
        category: "Seguridad",
        title: "Código 'Palabra de Seguridad' (Peligro Inminente)",
        content: "**A veces el rider está en problemas pero no puede hablar claro porque el agresor está delante.**\\n\\n**LA CLAVE:**\\nDefine una palabra o frase absurda (ej: '¿Queda papel en la impresora?'). Si un rider dice esa frase por radio, el Gerente sabe que debe llamar a la policía inmediatamente y enviar refuerzos GPS, sin hacer preguntas.",
        action: "Establecer palabra de seguridad secreta con la flota.",
        example: "Rescate de rider intimidado gracias a uso de palabra clave.",
        order: 143
    },
    {
        category: "Tecnología",
        title: "Gestión de 'Picos Fantasma' (Meteo Predictiva)",
        content: "**No esperes a que empiece a llover para llamar a refuerzos; ya es tarde.**\\n\\n**APP DE RADAR:**\\nEl Gerente debe tener app de radar de lluvia real. Si ves mancha azul a 30 min, lanza alerta de 'Guardia Preventiva' a riders libres. Ganas media hora de ventaja para posicionar tus motos antes de la tormenta.",
        action: "Monitorización meteorológica proactiva.",
        example: "Flota posicionada 20 min antes de la tormenta, servicio sin colapso.",
        order: 144
    },
    {
        category: "Calidad",
        title: "Lista Negra Sanitaria (Protección de Marca)",
        content: "**Si un restaurante tiene cucarachas, la mala fama te salpica a ti.**\\n\\n**EL VETADO:**\\nSi tus riders reportan suciedad extrema en una cocina ('Jefe, ahí huele a podrido'), ten la valentía de rescindir el contrato. Tu marca va en la moto, pero también en la calidad de lo que transportas.",
        action: "Canal de denuncia interna de condiciones insalubres en restaurantes.",
        example: "Cancelación de contrato con local sucio evitó crisis de reputación.",
        order: 145
    },
    {
        category: "Comercial",
        title: "Protocolo 'Crisis Viral' (Redes Sociales)",
        content: "**Un vídeo de un rider tuyo haciendo una locura se hace viral.**\\n\\n**REACCIÓN INMEDIATA:**\\n1. Identificar al rider.\\n2. Expediente/Despido.\\n3. Comunicado Público: 'Lamentamos el incidente. El individuo ya no trabaja con nosotros. Repaart condena esto'. La rapidez transforma una crisis en demostración de seriedad.",
        action: "Plantilla de respuesta a crisis viral preparada.",
        order: 146
    },
    {
        category: "Estrategia",
        title: "Estrategia 'Mancha de Aceite' (Crecimiento)",
        content: "**Al crecer, no saltes a la otra punta de la ciudad.**\\n\\n**LA LÓGICA:**\\nCrece calle a calle, barrio a barrio, como una mancha de aceite. Si abres una zona desconectada, necesitas flota exclusiva. Si creces pegado, tus riders pueden 'fluir' de una zona a otra optimizando recursos.",
        action: "Plan de expansión contiguo, nunca saltos geográficos.",
        order: 147
    },
    {
        category: "Comercial",
        title: "Venta Cruzada 'B2B2C' (El Flyer Inverso)",
        content: "**Tienes acceso directo al salón de miles de familias. Monetízalo.**\\n\\n**EL ACUERDO:**\\nNegocia con empresas locales (clínica dental, gimnasio): 'Por 200€/mes, mis riders meterán tu flyer en cada bolsa'. Fuente de ingresos neta que aprovecha logística existente.",
        action: "Comercialización de 'Espacio Publicitario en Bolsa'.",
        example: "Ingresos extra recurrentes por publicidad de terceros.",
        order: 148
    },
    {
        category: "Liderazgo",
        title: "El 'Kaizen' Operativo (Mejora Continua)",
        content: "**No permitas que la empresa se estanque.**\\n\\n**REGLA DEL 1%:**\\nPregunta cada mes al equipo: '¿Qué pequeña cosa nos molesta a todos y podemos cambiar?'. (Ej: Interruptor luz, abrelatas mejor). Corregir 12 molestias al año transforma el clima laboral.",
        action: "Sesión mensual de 'Pequeñas Mejoras'.",
        order: 149
    },
    {
        category: "Liderazgo",
        title: "El Legado (Tu Salida)",
        content: "**Un negocio solo es real si funciona sin ti.**\\n\\n**TEST DE LAS VACACIONES:**\\nEl objetivo final es que puedas irte 15 días al Caribe, desconectar, y al volver: La empresa siga abierta, la caja cuadre y los clientes estén felices. Si logras esto, tienes una EMPRESA vendible y valiosa, no un autoempleo.",
        action: "Planifica tus próximas vacaciones de 15 días sin móvil. Es el examen final.",
        order: 150
    }

];

async function seedEncyclopedia() {
    try {
        console.log("🔥 Iniciando carga de Enciclopedia Repaart 2.0...");

        const colRef = collection(db, 'academy_encyclopedia');

        // Borrar contenido anterior
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
            console.log(`📦 Eliminando ${snapshot.size} módulos anteriores...`);
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log(`✅ Contenido anterior eliminado.`);
        }

        // Insertar nuevo contenido
        console.log(`📚 Insertando ${encyclopediaData.length} módulos...`);
        let count = 0;

        for (const item of encyclopediaData) {
            await addDoc(colRef, {
                ...item,
                createdAt: serverTimestamp()
            });
            count++;
            if (count % 10 === 0) {
                console.log(`   Progreso: ${count}/${encyclopediaData.length}`);
            }
        }

        console.log(`\n🎓 ¡ENCICLOPEDIA CARGADA CON ÉXITO!`);
        console.log(`   Total: ${encyclopediaData.length} módulos estratégicos`);
        console.log(`   Categorías: Estrategia, Finanzas, Operativa, RRHH, Comercial, Tecnología, Calidad, Seguridad, Liderazgo`);
        console.log(`   Nivel: Executive Knowledge Base Completa (100 Módulos)\n`);
        console.log(`🌐 Abre: http://localhost:5173/academy?tab=encyclopedia`);

    } catch (error) {
        console.error("❌ Error durante la carga:", error);
    }
}

// Auto-ejecutar si se importa desde el navegador
if (typeof window !== 'undefined') {
    (window as any).seedEncyclopedia = seedEncyclopedia;
    console.log("✅ Función seedEncyclopedia() disponible en consola del navegador");
}

export { seedEncyclopedia };
