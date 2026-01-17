// Enciclopedia Repaart 2.0 - Módulos RRHH
import { EncyclopediaModule } from './encyclopediaModules';

// CATEGORÍA: RRHH (Módulos 36-60)
export const rrhhModules: EncyclopediaModule[] = [
    {
        id: "rrhh-001",
        title: "Perfil y Contratación de Riders",
        category: "RRHH",
        content: "**El rider es la cara visible de tu operación ante el cliente final.**\n\n**PERFIL IDEAL:**\n- Edad: 24-40 años\n- Preferiblemente con experiencia en reparto\n- Carnet de moto en vigor\n- Smartphone propio (Android/iOS)\n- Actitud de servicio\n\n**RÉGIMEN DE CONTRATACIÓN:**\n- Régimen General (asalariados, NO autónomos)\n- Contratos de 10-35h semanales\n- Alta en Seguridad Social desde día 1\n\n**BOLSA DE RESERVA:**\nMantén SIEMPRE 3-4 candidatos ya entrevistados y validados.\nCuando uno se vaya, no empiezas de cero.",
        action: "Abre perfil en Job Today y no lo cierres nunca. Incluso cuando estés completo, sigue recibiendo CVs para tu bolsa.",
        example: "Franquicia sin bolsa de reserva perdió 2 riders la misma semana. Tardó 3 semanas en cubrir, perdiendo 2.000€ de facturación.",
        order: 36
    },
    {
        id: "rrhh-002",
        title: "Inventario de Material por Rider",
        category: "RRHH",
        content: "**El rider es responsable de su material. Si lo pierde, se descuenta.**\n\n**LISTADO DE ENTREGA (firmar recepción):**\n- Cajón térmico: 69€\n- Bolsa térmica: 25€\n- Casco: 50€\n- Uniforme completo: 35€\n- Soporte móvil: 15€\n\n**PROTOCOLO:**\n1. Al contratar: Rider firma documento de recepción con valoración\n2. Durante empleo: Inspección mensual de estado\n3. Al despedir: Checklist de devolución obligatorio\n\n**SI FALTA ALGO:**\nDescuento en finiquito según precios establecidos.\nSi no lo haces en ese momento, no recuperarás el dinero.",
        action: "Crea documento 'Entrega de Material' con lista y precios. Rider firma al recibir. Guarda copia en su expediente.",
        example: "Rider despedido 'olvidó' devolver el casco. Sin documento firmado, no pudimos descontar. Pérdida: 50€.",
        order: 37
    },
    {
        id: "rrhh-003",
        title: "Estilos de Liderazgo Adaptativo",
        category: "RRHH",
        content: "**No se lidera igual a un novato que a un veterano.**\n\n**LIDERAZGO DIRECTIVO (para novatos):**\n- Instrucciones claras y específicas\n- Supervisión cercana\n- Feedback inmediato\n- Poca autonomía inicial\n\n**LIDERAZGO DELEGATIVO (para expertos):**\n- Objetivos, no instrucciones\n- Autonomía en ejecución\n- Supervisión por resultados\n- Confianza en su criterio\n\n**EL JEFE DE EQUIPO:**\nAl superar 3.000 pedidos/mes, necesitas esta figura.\n- Gestiona tráfico en tiempo real\n- Resuelve incidencias menores\n- Cobra plus de responsabilidad\n- Libera tiempo del gerente",
        action: "Clasifica a tus riders: Novato (<3 meses), Intermedio (3-12 meses), Veterano (>12 meses). Adapta tu estilo a cada grupo.",
        example: "Gerente trataba a veterano de 2 años como novato, dando instrucciones detalladas. El rider se sintió desconfiado y se fue a la competencia.",
        order: 38
    },
    {
        id: "rrhh-004",
        title: "Ingeniería de Horarios (Regla de Oro)",
        category: "RRHH",
        content: "**El coste de personal es tu mayor gasto. Un horario mal hecho arruina un mes bueno.**\n\n**LA REGLA DEL FIN DE SEMANA:**\nDías de descanso SOLO de lunes a jueves.\nViernes, sábado y domingo: Plantilla al completo (salvo excepciones muy puntuales).\n\n**PROHIBIDO ENCADENAR DESCANSOS:**\nNunca des descanso el mismo día a 2 empleados clave de la misma zona.\nDejas el servicio descubierto ante cualquier imprevisto.\n\n**VALIDACIÓN DEL CUADRANTE:**\n- Enviar horario al staff el viernes de la semana anterior\n- Cada rider debe confirmar recepción\n- 'No lo vi' no es excusa válida si está confirmado",
        action: "Crea cuadrante semanal con colores: Verde (servicio cubierto), Rojo (riesgo de falta). Si hay mucho rojo, ajusta antes de publicar.",
        example: "Dos riders descansaron el mismo sábado. Llegó pico de pedidos y solo había 1 moto. Pérdida de 400€ esa noche.",
        order: 39
    },
    {
        id: "rrhh-005",
        title: "Protocolo de Vacaciones (Regla 60/15)",
        category: "RRHH",
        content: "**Para evitar quedarte sin plantilla en agosto o Navidad.**\n\n**PLAZOS DE PREAVISO ESTRICTOS:**\n\n**Vacaciones Anuales:**\n⏰ Mínimo 60 días de antelación\nPermite planificar contrataciones temporales si es necesario.\n\n**Días Libres Puntuales (Asuntos Propios):**\n⏰ Mínimo 15 días de antelación\n\n**Bajas Médicas:**\nSolo se aceptan con parte oficial de mutua o médico.\n⚠️ Avisar por WhatsApp NO es suficiente.\nSin papel = Falta injustificada = Despido procedente.\n\n**VACACIONES EN FECHAS CLAVE:**\nNavidad, Semana Santa, puentes largos: Bloqueo total de vacaciones salvo emergencia justificada.",
        action: "Incluye estos plazos en el contrato de trabajo. Haz firmar anexo específico de política de vacaciones.",
        example: "Rider pidió vacaciones para agosto el 15 de julio. Sin política clara, no pudimos negarnos. Lección: establecer regla de 60 días desde el inicio.",
        order: 40
    },
    {
        id: "rrhh-006",
        title: "Semáforo Disciplinario",
        category: "RRHH",
        content: "**Sistema claro de consecuencias para que todos sepan qué esperar.**\n\n**🔴 SEMÁFORO ROJO (Despido Inmediato):**\n- Robo de dinero o mercancía\n- Agresión física a cliente/compañero\n- Conducir bajo efectos de alcohol/drogas\n- Falsificación de datos en Flyder\n\n**🟠 SEMÁFORO NARANJA (Sanción Escrita):**\n- Impuntualidad reiterada (3+ veces/mes)\n- Incumplimiento de protocolo de higiene\n- Falta de respeto verbal\n- Daño por negligencia a material\n\n**🟡 SEMÁFORO AMARILLO (Aviso Verbal):**\n- Primera impuntualidad\n- Uniforme incompleto\n- Olvido puntual de protocolo\n- Actitud mejorable",
        action: "Imprime el semáforo y pégalo en el tablón del local. Cada rider debe firmarlo como 'leído y entendido'.",
        example: "Rider llegó tarde 4 veces sin consecuencias. Pensó que era normal. Cuando le sancionaron, se sorprendió y hubo conflicto. Con semáforo claro, sabría las reglas desde el día 1.",
        order: 41
    },
    {
        id: "rrhh-007",
        title: "Despido por Baja Productividad",
        category: "RRHH",
        content: "**Muchos gerentes temen despedir por 'rendir poco'. El manual te respalda.**\n\n**CLÁUSULA DE PRODUCTIVIDAD:**\nEl contrato establece que la productividad se mide por parámetros objetivos:\n- Pedidos/hora\n- Tiempos de entrega\n- Incidencias generadas\n\n**DESPIDOS PROCEDENTES POR:**\n- Impuntualidad continuada documentada\n- Desconexiones injustificadas de la App\n- Desviarse de ruta sin motivo\n- Ratio pedidos/hora consistentemente <2.0\n\n**LA CLAVE: DOCUMENTAR**\nUsa los datos de Flyder para justificar sanciones objetivamente.\nSin datos = Posible impugnación en juzgado.\nCon datos = Despido procedente.",
        action: "Antes de despedir por productividad, recopila 30 días de datos de Flyder del rider. Es tu escudo legal.",
        example: "Rider impugnó despido. Gerente presentó informe Flyder mostrando 1.6 pedidos/hora vs media de equipo de 2.4. Despido declarado procedente.",
        order: 42
    },
    {
        id: "rrhh-008",
        title: "Política de Multas de Tráfico",
        category: "RRHH",
        content: "**Uno de los puntos más conflictivos. Déjalo claro desde la entrevista.**\n\n**LA REGLA DE ORO:**\n⚠️ LA EMPRESA NO PAGA MULTAS. JAMÁS.\n\n**RESPONSABILIDAD DEL RIDER:**\nEl contrato estipula: 'El trabajador se hará cargo de cualquier sanción por estacionamiento inadecuado o infracción de tráfico.'\n\n**GESTIÓN ADMINISTRATIVA:**\n1. Multa llega a la empresa (titular del vehículo)\n2. Identificamos al conductor ante DGT inmediatamente\n3. Multa pasa al nombre del rider\n4. Si no se puede identificar: Descuento de nómina previo aviso y firma\n\n**NO ASUMAS MULTAS POR 'BUEN ROLLO':**\nPerderás puntos TÚ y crearás precedente.",
        action: "Incluye cláusula específica de multas en contrato. Hazla firmar por separado con destacado visible.",
        example: "Rider aparcó en zona reservada 'solo 2 minutos'. Multa de 200€. Sin cláusula clara, hubo discusión de 1 hora. Con cláusula, se resolvió en 5 min.",
        order: 43
    },
    {
        id: "rrhh-009",
        title: "Formación Shadowing (Primer Turno)",
        category: "RRHH",
        content: "**No basta con entregar la moto y el móvil.**\n\n**LA TÉCNICA DEL RIDER SOMBRA:**\nEn su primer turno, el novato NO va solo.\nHace las primeras 3-5 entregas acompañado de un veterano.\n\n**OBJETIVO:**\nAprender trucos no escritos:\n- Dónde aparcar en zonas difíciles\n- Cómo tratar a encargados de restaurantes\n- Cómo colocar pizzas para que no se vuelquen\n- Atajos locales que no salen en GPS\n\n**VALIDACIÓN DE APTITUD:**\nAntes de darle 'suelta', el mentor debe validar:\n☐ Sabe usar Flyder correctamente\n☐ Conduce con prudencia\n☐ Entiende protocolo de cobro\n\nSi no pasa este filtro, NO sale solo.",
        action: "Designa 1-2 'mentores' oficiales entre tus veteranos. Págales plus de 5€ por cada novato formado.",
        example: "Novato sin shadowing se perdió 3 veces el primer día. Tiempos horribles, cliente furioso. Una hora de acompañamiento habría evitado esto.",
        order: 44
    },
    {
        id: "rrhh-010",
        title: "Prevención de Riesgos Laborales (PRL)",
        category: "RRHH",
        content: "**El reparto en moto tiene riesgos físicos. Ignorarlos = Bajas largas que destrozan tu cuadrante.**\n\n**EQUIPAMIENTO OBLIGATORIO (EPIs):**\n- Casco SIEMPRE abrochado (sin excepciones)\n- Pantalón de agua y ropa reflectante en lluvia/baja visibilidad\n- Guantes (recomendado)\n\n**GESTIÓN DE LA FATIGA:**\nVigila turnos dobles excesivos.\nRider cansado = Accidente en potencia = Moto siniestrada + Baja laboral.\n\n**PROTOCOLO DE CLIMA ADVERSO:**\nTienes potestad de suspender servicio en alerta meteorológica roja.\nMejor perder facturación de una noche que perder 3 motos y tener 2 bajas médicas.\n\n**SI SE QUITA EL CASCO:**\n⚠️ Sanción Grave inmediata. Sin discusión.",
        action: "Compra EPIs de calidad: Pantalones de agua (30€), reflectantes (15€). Es inversión en seguridad, no gasto.",
        example: "Rider sin reflectante en noche lluviosa. Coche no le vio al girar. Fractura de pierna, 3 meses de baja. Cuadrante destruido.",
        order: 45
    },
    {
        id: "rrhh-011",
        title: "Sistema de Referidos (Reclutamiento Gratis)",
        category: "RRHH",
        content: "**Los mejores riders conocen a otros buenos riders. Ahorra en anuncios.**\n\n**EL BONUS DE CAZATALENTOS:**\nOfrece 50€ a cualquier empleado que traiga candidato válido.\n\n**LA CLÁUSULA DE PERMANENCIA:**\n⚠️ No pagues el bono al momento.\n\n**Regla:**\n'Te pago los 50€ cuando tu recomendado cumpla 2 meses y haya superado periodo de prueba.'\n\n**BENEFICIO DOBLE:**\n- El veterano hará de 'mentor' del nuevo (quiere cobrar su bono)\n- Filtro de calidad automático (no recomendará a alguien malo)\n- Te ahorras coste de anuncios y entrevistas",
        action: "Anuncia el programa de referidos en reunión de equipo. Recuérdalo cada mes.",
        example: "Programa de referidos trajo 4 riders en 6 meses. Coste: 200€ en bonos. Ahorro en anuncios y tiempo de entrevistas: 600€+.",
        order: 46
    },
    {
        id: "rrhh-012",
        title: "Offboarding (Recuperación de Activos)",
        category: "RRHH",
        content: "**Cuando un rider se va, es el momento más crítico para tu inventario.**\n\n**CHECKLIST DE SALIDA (antes de firmar finiquito):**\n☐ Llaves de la moto (y copia si la tenía)\n☐ Casco (revisar golpes)\n☐ Cajón y soportes (limpios)\n☐ Uniforme completo (recién lavado)\n☐ Tarjeta de gasolina (si tenía)\n☐ Soporte de móvil\n☐ Powerbank de empresa (si lo tenía)\n\n**EJECUCIÓN DE FIANZA:**\nSi falta algo o uniforme está roto:\nDescuenta el coste exacto de la liquidación final (finiquito).\n\n**TIMING:**\nSi no lo haces EN ESE MOMENTO, ya no recuperarás ese dinero.",
        action: "Imprime checklist de salida. úsalo en TODAS las terminaciones de contrato sin excepción.",
        example: "Rider se fue 'en buenas'. No hicimos checklist. Días después notamos que faltaban llaves de reserva y casco. 150€ perdidos.",
        order: 47
    },
    {
        id: "rrhh-013",
        title: "Plan de Carrera (Rider a Jefe)",
        category: "RRHH",
        content: "**Si el rider ve que su único futuro es seguir en la moto 10 años, se irá.**\n\n**EL CAMINO DEL ASCENSO VISIBLE:**\n\n**Nivel 1: Rider Junior**\nRecién contratado, en formación.\n\n**Nivel 2: Rider Senior** (>6 meses)\nElige turno, prioridad en vacaciones.\n\n**Nivel 3: Formador** (>12 meses)\nCobra plus por enseñar a novatos (+50€/novato).\n\n**Nivel 4: Jefe de Equipo** (>18 meses)\nGestiona tráfico en tiempo real, plus de responsabilidad (+100-150€/mes).\n\n**BENEFICIO:**\nCreas 'aristocracia' interna.\nLos veteranos cuidarán el negocio porque quieren ascender, no solo cobrar.",
        action: "Explica el plan de carrera en la entrevista de contratación. Haz visible quién ha ascendido.",
        example: "Rider veterano iba a irse por 0.50€ más/hora en la competencia. Al explicarle que en 3 meses sería Jefe de Equipo, se quedó.",
        order: 48
    },
    {
        id: "rrhh-014",
        title: "Rituales de Reconocimiento (Salario Emocional)",
        category: "RRHH",
        content: "**El dinero atrae al rider, pero el sentimiento de tribu es lo que lo retiene.**\n\n**EL HUDDLE PRE-SERVICIO:**\nAntes del turno de noche (el más duro), reúne al equipo 3 minutos.\nNo para echar bronca, sino para motivar:\n'Chicos, hoy hay partido, va a ser locura. Quiero que vayáis con cuidado. Si alguien se agobia, que avise al Jefe de Equipo. ¡A por ello!'\n\n**GAMIFICACIÓN TRANSPARENTE:**\nPublica semanalmente 'Top 3 de Eficiencia' en tablón o WhatsApp.\n\n**PREMIO SIMBÓLICO:**\nGanador elige su zona o día libre la semana siguiente.\n\nLa competitividad sana mejora tus tiempos SIN coste económico directo.",
        action: "Implementa el 'Top 3 Semanal' esta semana. Anuncia que el ganador elige zona o día libre.",
        example: "Tras implementar ranking semanal, productividad media subió 8% sin ningún coste extra. Riders querían 'ganar'.",
        order: 49
    },
    {
        id: "rrhh-015",
        title: "Detección del Rider Quemado (Burnout)",
        category: "RRHH",
        content: "**El delivery es duro. Un buen rider puede volverse tóxico si se quema.**\n\n**SÍNTOMAS DE BURNOUT:**\n- Empieza a llegar tarde\n- Contesta mal por radio/WhatsApp\n- Aumentan sus quejas sobre todo\n- Caen sus ratios de productividad\n- Pide cambios de turno constantes\n\n**LA ROTACIÓN DE ZONA:**\nNo le despidas aún. A veces simplemente está harto de subir escaleras en el Barrio Antiguo.\n\n**INTERVENCIÓN:**\nCámbialo una semana a la Zona de Oficinas (más fácil) para que 'respire'.\n\nA menudo, un cambio de aires recupera su productividad.",
        action: "Si detectas 2+ síntomas de burnout, ten conversación privada: '¿Estás bien? ¿Qué necesitas?'. A veces solo quieren ser escuchados.",
        example: "Rider veterano iba a dimitir. Una charla reveló que odiaba su zona actual. Cambio de zona, productividad recuperada, rider salvado.",
        order: 50
    }
];

export const getRRHHModules = () => rrhhModules;
