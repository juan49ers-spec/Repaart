// Enciclopedia Repaart 2.0 - Módulos Extra (Seguridad, Crisis, Legado)
import { EncyclopediaModule } from './encyclopediaModules';

// CATEGORÍA: SEGURIDAD Y LEGAL (Módulos 81-100)
export const seguridadModules: EncyclopediaModule[] = [
    {
        id: "seg-001",
        title: "Protocolo Código Rojo (Accidente con Heridos)",
        category: "Seguridad",
        content: "**Nadie quiere usarlo, pero debes tenerlo impreso.**\n\n**LA REGLA PAS:**\nProteger - Avisar - Socorrer\n\nLo primero NO es la moto ni la pizza, es llamar al 112.\n\n**GESTIÓN DOCUMENTAL INMEDIATA:**\n1. Gerente se persona en el lugar (si posible)\n2. Fotos de la vía, estado del asfalto, moto contraria\n3. ANTES de que muevan nada\n\n**DOCUMENTACIÓN VITAL:**\n- Parte amistoso firmado por todas las partes\n- Datos de testigos\n- Número de policía actuante\n\nSerán vitales para el seguro y la mutua laboral.",
        action: "Imprime el protocolo de accidentes y guárdalo en la guantera de cada moto. Que los riders sepan dónde está.",
        example: "Rider tuvo accidente leve pero no hizo fotos. El otro conductor cambió su versión. Sin pruebas, seguro no cubrió. Pérdida: 1.200€.",
        order: 81
    },
    {
        id: "seg-002",
        title: "Seguros y Responsabilidad Civil",
        category: "Seguridad",
        content: "**El Dossier menciona 'Seguro a terceros incluido', pero el diablo está en los detalles.**\n\n**QUÉ CUBRE YAMIMOTO:**\n✅ Responsabilidad Civil (Terceros)\nSi tu rider atropella a alguien o raya un coche, paga el seguro.\n\n**QUÉ NO CUBRE:**\n❌ Daños Propios (La Moto)\nSi el rider se cae solo o rompe espejo contra columna, paga la franquicia.\n\n❌ Robo de Mercancía\nSi roban la comida del cajón, es coste operativo que asumes tú.\n\n**REPERCUSIÓN:**\nSi hay negligencia del rider (ej. dejó moto sin candado), el coste se le puede repercutir según contrato firmado.",
        action: "Lee el contrato de renting de Yamimoto. Marca con rotulador qué cubre y qué no. Tenlo claro antes del primer accidente.",
        example: "Rider rompió retrovisor contra bolardo. Creyó que 'el seguro lo cubría'. No. Coste de 80€ sorpresa para la franquicia.",
        order: 82
    },
    {
        id: "seg-003",
        title: "Defensa Carga y Descarga (Ante el Agente)",
        category: "Seguridad",
        content: "**Aparcar mal es inevitable; la multa es evitable.**\n\n**LA ACTITUD:**\nSi un agente se acerca a la moto mal aparcada, el rider debe aparecer corriendo y pedir disculpas inmediatamente.\nNO discutir.\n\n**LA PALABRA MÁGICA:**\n'Agente, estoy realizando un servicio de carga y descarga urgente de alimentos. Me voy en 30 segundos.'\n\n**BASE LEGAL:**\nLa mayoría de ordenanzas permiten paradas breves (<2 min) para servicios.\n\n**SI EL RIDER SE PONE CHULO:**\nLa multa cae seguro + Posible identificación + Inmovilización de moto.\n\nCortesía = Ahorro.",
        action: "Ensaya con los riders la respuesta educada ante un agente. Role-play de 5 min en reunión de equipo.",
        example: "Rider discutió con policía 'porque tenía razón'. Multa de 200€ + Moto retenida 2 horas. La 'razón' salió muy cara.",
        order: 83
    },
    {
        id: "seg-004",
        title: "Regla del Anti-Héroe (Robo de Moto)",
        category: "Seguridad",
        content: "**Si un ladrón intenta robar la moto con violencia o amenaza:**\n\n**INSTRUCCIÓN TAJANTE:**\nLa moto vale 3.000€.\nTu vida NO tiene precio.\n\n⚠️ Si te amenazan, ENTREGA LA MOTO Y LAS LLAVES inmediatamente.\nNo te pelees.\n\n**PROTECCIÓN:**\n- La moto tiene GPS\n- La moto tiene seguro de robo\n- No queremos héroes en el hospital\n\n**POST-ROBO:**\n1. Alejarse del lugar\n2. Llamar al 112\n3. Llamar al gerente\n4. Denuncia en comisaría\n\nLa empresa cubre la pérdida. Las lesiones, no.",
        action: "Incluye esta instrucción explícita en el onboarding: 'Ante robo con violencia, no resistas. Es una orden.'",
        example: "Rider en otra empresa intentó defender la moto de un robo. Le apuñalaron. 3 semanas de hospital. La moto apareció abandonada al día siguiente.",
        order: 84
    },
    {
        id: "seg-005",
        title: "Palabra de Seguridad (Peligro Inminente)",
        category: "Seguridad",
        content: "**A veces el rider está en problemas pero no puede hablar claro porque el agresor está delante.**\n\n**LA CLAVE SECRETA:**\nDefine una palabra o frase absurda conocida solo por el equipo.\n\nEjemplos:\n- '¿Queda papel en la impresora?'\n- 'Llevo la pizza de piña'\n- 'El cliente pide extra de ketchup'\n\n**PROTOCOLO:**\nSi un rider dice esa frase por radio/teléfono:\n1. Gerente sabe que hay peligro\n2. Llamar a la policía inmediatamente\n3. Enviar refuerzos a ubicación GPS\n4. Sin hacer preguntas que delaten al rider\n\nPuede salvar una vida.",
        action: "Define tu palabra de seguridad con el equipo. Compártela solo con riders y mandos. NUNCA por escrito público.",
        example: "Rider fue retenido por cliente agresivo. Llamó y dijo la frase clave. Gerente envió a policía en 8 min. El rider estaba bien.",
        order: 85
    },
    {
        id: "seg-006",
        title: "Diplomacia Vial (Desescalada de Conflictos)",
        category: "Seguridad",
        content: "**Tus riders están 8 horas en la 'jungla' del tráfico. El roce es inevitable.**\n\n**LA REGLA DE LA MANO ALZADA:**\nAnte una pitada o insulto de un conductor:\n- JAMÁS se devuelve el insulto\n- Se levanta la mano pidiendo disculpas (aunque no tengas culpa)\n\n**RAZONES:**\n1. Una discusión con uniforme puede acabar en vídeo viral\n2. Puede escalar a agresión física\n3. El rider pierde tiempo (= dinero)\n4. Imagen de Repaart dañada\n\n**LA PAZ ES RENTABILIDAD:**\nQue el rider 'gane' la discusión no tiene ningún beneficio.\nQue la evite tiene todos los beneficios.",
        action: "Incluye 'gestión de conflictos viales' en la formación. Practica la 'mano alzada' como respuesta automática.",
        example: "Taxista insultó a rider. El rider levantó la mano y siguió. Taxista se calmó. Sin el gesto, habría habido pelea.",
        order: 86
    },
    {
        id: "seg-007",
        title: "Parking Defensivo (Antirrobo)",
        category: "Seguridad",
        content: "**El robo de motos de reparto es común porque 'son todas iguales'.**\n\n**LA TÉCNICA DEL BLOQUE:**\nSi hay varias motos paradas en la base:\n- Átalas entre ellas con cadena larga\n- O aparca 'en batería' muy pegadas\n\n**PSICOLOGÍA DEL LADRÓN:**\nEl ladrón busca la moto suelta y fácil.\nSi ve bloque de 3 motos pegadas, pasará de largo.\n\n**NUNCA CONFÍES SOLO EN:**\n- Bloqueo de manillar\n- Alarma integrada\n\n**AÑADE:**\n- Candado de disco en rueda trasera\n- Cadena al mobiliario urbano si es posible",
        action: "Compra 2 cadenas largas para la base. Coste: 40€. Valor: Evitar robo de moto de 3.000€.",
        example: "Moto sola en la puerta fue robada en 3 min mientras rider estaba dentro. Motos 'en bloque' nunca han sido robadas.",
        order: 87
    },
    {
        id: "seg-008",
        title: "Detección de Billetes Falsos",
        category: "Seguridad",
        content: "**De noche y con prisas, es fácil colar un billete falso al rider.**\n\n**EL ROTULADOR DETECTOR:**\nDales a los riders un rotulador detector de billetes falsos.\nCoste: 3€.\n\n**PROTOCOLO:**\nSi el cliente paga con billete de 20€ o más:\n1. Se marca DELANTE del cliente\n2. Si es auténtico, no pasa nada\n3. Si es falso, se devuelve amablemente:\n'Perdone, la máquina no me lo coge. ¿Tiene otro o tarjeta?'\n\n**NUNCA:**\n- Acusar al cliente de falsificador\n- Quedarse el billete falso\n- Dejar pasar para 'no molestar'",
        action: "Compra 5 rotuladores detectores. Reparte uno a cada rider. Inversión: 15€. Protección: Infinita.",
        example: "Rider aceptó billete de 50€ falso sin comprobar. Al llegar a base, era papel. Pérdida de 50€ + el pedido ya entregado.",
        order: 88
    },
    {
        id: "seg-009",
        title: "Gestión de Contra-Reembolso",
        category: "Seguridad",
        content: "**Si aceptas pagos en efectivo, tus riders son 'cajeros automáticos con ruedas'. Riesgo alto.**\n\n**EL LÍMITE DE EFECTIVO:**\nUn rider nunca debe llevar más de 50-100€ encima.\n\n**PROTOCOLO DE DESCARGA:**\nSi acumula mucho efectivo, debe pasar por la base a 'soltar lastre' aunque no haya terminado turno.\n\n**ARQUEO DIARIO:**\nEl dinero se cuenta DELANTE del rider al acabar turno.\nSi faltan 5€, se descuentan de nómina o propinas (según pacto).\n\n**NO SE FÍA:**\n'Ya lo arreglamos mañana' = Nunca se arregla.\nCuadrar caja es diario, sin excepciones.",
        action: "Define límite máximo de efectivo (ej. 80€). Instrucción: Si superas 80€, pasa por base antes del siguiente pedido.",
        example: "Rider llevaba 200€ encima (acumulado de 4 días). Le robaron. Si hubiera descargado diario, pérdida máxima habría sido 50€.",
        order: 89
    },
    {
        id: "seg-010",
        title: "Escudo Jurídico: Modelo Anti-Ley Rider",
        category: "Seguridad",
        content: "**El sector vive con miedo a inspecciones por 'falsos autónomos'. Repaart convierte este miedo en fortaleza.**\n\n**EL CONCEPTO 'SUPERAUTÓNOMO':**\nA diferencia de las plataformas (autónomos precarios), tú eres empresario con flota asalariada.\n\n**ARGUMENTO DE VENTA:**\n'Sr. Restaurante, mis riders tienen contrato, Seguridad Social y Prevención de Riesgos. Si pasa algo, la responsabilidad es 100% mía. Con otros modelos, usted podría tener un problema legal grave.'\n\n**TRANQUILIDAD:**\nTu modelo cumple estrictamente la 'Ley Rider'.\nNo dependes de vacíos legales que puedan cambiar mañana.\n\n**DUERMES TRANQUILO.**",
        action: "Usa el argumento legal como diferenciador en TODAS las reuniones comerciales. Es tu ventaja invisible.",
        example: "Inspección de trabajo en restaurante cliente. Pidieron datos de riders. Al ver contratos y SS al día, ni una sanción. Glovo en la misma zona: 30.000€ de multa.",
        order: 90
    }
];

// CATEGORÍA: LIDERAZGO Y LEGADO (Módulos 91-100)
export const liderazgoModules: EncyclopediaModule[] = [
    {
        id: "lid-001",
        title: "El Factor Autobús (Plan de Sucesión)",
        category: "Liderazgo",
        content: "**Una pregunta macabra pero necesaria:**\n\nSi mañana te atropella un autobús (o enfermas gravemente), ¿la franquicia abre al día siguiente?\n\n**EL 'LIBRO ROJO':**\nDebes tener documento con las claves maestras:\n- Contraseña de Flyder y Banco\n- Teléfono de emergencia de Yamimoto\n- Contacto del Gestor\n- Acceso a email corporativo\n- PIN de alarma del local\n\n**UBICACIÓN:**\nComparte la ubicación de este documento con persona de máxima confianza (socio, pareja, tu COM).\n\n**SI TODO ESTÁ EN TU CABEZA:**\nTu negocio tiene una debilidad mortal.",
        action: "Crea tu 'Libro Rojo' este fin de semana. Guárdalo en lugar seguro. Comparte ubicación con 1 persona de confianza.",
        example: "Gerente tuvo accidente el viernes. Nadie sabía contraseñas. Lunes sin abrir. Con Libro Rojo, la pareja habría podido operar.",
        order: 91
    },
    {
        id: "lid-002",
        title: "Gestión del Rumor (Radio Macuto)",
        category: "Liderazgo",
        content: "**'He oído que van a bajar el precio por pedido', 'Dicen que van a cerrar la zona norte'.**\n\nLos rumores tóxicos destruyen la moral.\n\n**TRANSPARENCIA RADICAL:**\nSi detectas un rumor:\n1. Convoca reunión rápida\n2. O manda audio oficial al grupo\n\n'Chicos, esto es mentira. La realidad es X.'\n\n**CORTA LA DESINFORMACIÓN DE RAÍZ:**\nAntes de que se convierta en revuelta de plantilla.\n\n**LA FUENTE:**\nIdentifica quién propaga rumores.\nNo siempre es mala intención; a veces es inseguridad.\nHabla en privado: 'Si tienes dudas, pregúntame a mí, no inventes.'",
        action: "Establece 'Viernes de Café' mensual: 30 min de charla informal donde el equipo puede preguntar cualquier cosa.",
        example: "Rumor de 'cierre inminente' se propagó. 3 riders buscaron otro trabajo. Reunión de aclaración evitó 2 bajas más.",
        order: 92
    },
    {
        id: "lid-003",
        title: "El Líder Alfa (Psicología de Grupo)",
        category: "Liderazgo",
        content: "**En todo grupo de riders hay uno que no es jefe, pero al que todos escuchan.**\n\nEs el veterano, el carismático, el que organiza las cenas.\n\n**IDENTIFÍCALO:**\n¿Quién tiene el grupo de WhatsApp paralelo (sin jefes)?\n¿A quién consultan los demás antes de aceptar cambios?\n\n**GÁNATELO:**\nNo luches contra él. Hazle tu aliado.\n\nConsúltale cambios antes de anunciarlos:\n'Oye Juan, estoy pensando en cambiar la zona de espera. ¿Tú cómo lo ves?'\n\n**EL EFECTO:**\nSi él lo aprueba, el resto de la manada lo aceptará sin rechistar.",
        action: "Identifica quién es tu 'líder alfa' informal. Invítale a un café y pídele su opinión sobre la operativa.",
        example: "Cambio de horarios anunciado sin consultar al veterano. Él se quejó, todos se quejaron. Tensión 2 semanas. Habría bastado una conversación previa.",
        order: 93
    },
    {
        id: "lid-004",
        title: "Kaizen Operativo (Mejora Continua)",
        category: "Liderazgo",
        content: "**No permitas que la empresa se estanque.**\n\n**LA REGLA DEL 1%:**\nPregunta cada mes al equipo:\n'¿Qué pequeña cosa nos molesta a todos y podemos cambiar?'\n\n**EJEMPLOS:**\n- Cambiar ubicación del interruptor de la luz\n- Comprar un abrelatas mejor\n- Cambiar la marca de papel higiénico\n- Arreglar la puerta que chirría\n\n**EL IMPACTO ACUMULADO:**\nCorregir 12 pequeñas molestias al año transforma el clima laboral y la eficiencia BRUTALMENTE.\n\n**COSTE:**\nCasi cero.\n\n**BENEFICIO:**\nEquipo siente que su opinión importa.",
        action: "En la próxima reunión, pregunta: '¿Qué pequeña cosa os molesta?'. Arregla 1 cosa esa misma semana.",
        example: "Rider sugirió cambiar el candado de la puerta (tardaban 30 seg en abrir). Nuevo candado: 15€. Ahorro: 5 min/día de frustración.",
        order: 94
    },
    {
        id: "lid-005",
        title: "Combate a la Soledad (Salud Mental)",
        category: "Liderazgo",
        content: "**El trabajo de rider es solitario. Pasan 8 horas dentro de un casco sin hablar con nadie.**\n\n**EL 'MINUTO HUMANO':**\nCuando pasen por la base, dedícales 1 minuto de conversación real.\nMirándoles a los ojos, no a la tablet.\n\n'¿Qué tal el tráfico hoy? ¿Mucho frío?'\n\n**EFECTO:**\nSentirse escuchado reduce la ansiedad y el burnout.\nMejora la retención de personal.\n\n**EL COSTE:**\n5 minutos al día.\n\n**EL BENEFICIO:**\nEquipo más fiel, menos rotación, mejor ambiente.",
        action: "Cuando un rider pase por base, para lo que estés haciendo 60 segundos. Pregunta algo personal (no de trabajo).",
        example: "Rider veterano confesó que se sentía 'invisible'. Tras implementar el minuto humano, su actitud cambió completamente.",
        order: 95
    },
    {
        id: "lid-006",
        title: "Ritual de Descompresión (Post-Turno)",
        category: "Liderazgo",
        content: "**El rider llega a casa con la adrenalina del tráfico y el ruido.**\n\n**CIERRE DE TURNO:**\nNo permitas que se vayan corriendo con el casco puesto.\n\nFomenta 5 minutos de 'enfriamiento' en el local:\n- Beber agua\n- Charlar con el compañero\n- Sentarse sin hacer nada\n\n**BENEFICIO:**\nAyuda a bajar las pulsaciones antes de volver a su vida personal.\nReduce el estrés acumulado a largo plazo.\n\n**EL ESPACIO:**\nTen un rincón con sillas cómodas y agua fría disponible.",
        action: "Crea 'zona de relax' en el local: 2 sillas, dispensador de agua, quizás una revista. Coste: 50€.",
        example: "Rider iba a casa estresado, discutía con pareja. Tras implementar ritual de descompresión, reportó mejor calidad de vida.",
        order: 96
    },
    {
        id: "lid-007",
        title: "Cómo Exprimir el Mentoring Premium",
        category: "Liderazgo",
        content: "**Si pagas Pack Premium (3% royalty), tienes Sesión Estratégica Quincenal.**\n\nMuchos la desperdician hablando de trivialidades.\n\n**EL 'PRE-WORK' OBLIGATORIO:**\nAntes de conectar al Calendly, prepara tu 'Top 3 de Problemas':\n\n1. Ruta Ineficiente: '¿Por qué Flyder me manda cruzar el centro a las 14:00?'\n2. Cliente Tóxico: 'El Restaurante X tarda 15 min de media, ¿cómo le presiono?'\n3. Finanzas: 'Mi coste de personal se ha disparado al 45%'\n\n**OBJETIVO:**\nNo uses la sesión para quejarte.\nÚsala para auditar tus datos con un experto que ve DECENAS de franquicias y sabe qué tecla tocar.",
        action: "Antes de cada mentoring, escribe 3 problemas concretos con datos. Envíalos al mentor 24h antes.",
        example: "Franquiciado llevaba 3 meses de mentoring hablando de 'cosas generales'. Cuando empezó a traer datos, en 2 sesiones optimizó rutas y ahorró 200€/mes.",
        order: 97
    },
    {
        id: "lid-008",
        title: "Protocolo Crisis Viral (Redes Sociales)",
        category: "Liderazgo",
        content: "**Un vídeo de rider comiéndose pizza o haciendo caballito se hace viral en TikTok.**\n\n**REACCIÓN INMEDIATA (24h máximo):**\n1. Identificar al rider (por matrícula/hora)\n2. Expediente disciplinario / Despido fulminante\n3. Comunicado Público\n\n**EL COMUNICADO:**\n'Lamentamos el incidente. El individuo ya no trabaja con nosotros. Repaart condena esto. Invitamos al cliente afectado a [compensación].'\n\n**LA CLAVE:**\nLa rapidez y contundencia transforman una crisis en una demostración de seriedad.\n\nCallar o tardar = La crisis crece.",
        action: "Ten plantilla de comunicado de crisis preparada. Solo hay que rellenar los datos del incidente.",
        example: "Vídeo de rider burlándose de cliente se hizo viral. Respuesta en 4h con despido visible. La prensa tituló 'Empresa actúa rápido'. Crisis controlada.",
        order: 98
    },
    {
        id: "lid-009",
        title: "Parte de Guerra (Bitácora de Incidencias)",
        category: "Liderazgo",
        content: "**Los problemas que no se escriben, se olvidan y se repiten.**\n\n**EL CUADERNO FÍSICO:**\nTen un cuaderno en la mesa.\nAnota fecha y problema raro:\n\n'Día 12: La App falló de 21:00 a 21:15'\n'Día 15: Restaurante X se quedó sin envases'\n'Día 18: Rider Juan llegó tarde por tercera vez'\n\n**ANÁLISIS MENSUAL:**\nA final de mes, lee el cuaderno.\nSi ves que el 'Fallo de App' se repite los viernes, ya sabes que tienes que avisar a soporte PREVENTIVAMENTE.\n\n**ES TU MEMORIA EXTERNA.**",
        action: "Compra un cuaderno bonito solo para incidencias. Anota todo lo 'raro' que pase cada día. Revísalo cada domingo.",
        example: "Patrón detectado: Restaurante X siempre tenía problemas los jueves. Investigación reveló que ese día cambiaba el personal de cocina.",
        order: 99
    },
    {
        id: "lid-010",
        title: "La Mentalidad 'Dueño' (Liderazgo Final)",
        category: "Liderazgo",
        content: "**El módulo final no es una técnica, es una ACTITUD.**\n\n**EL EJEMPLO:**\n- Si llueve a mares y faltan manos, el Gerente se pone el casco y hace un reparto.\n- Si hay un papel en el suelo del local, el Gerente lo recoge.\n- Si hay problema a las 23:00, el Gerente contesta el teléfono.\n\n**LECCIÓN:**\nTus riders no respetarán lo que DICES.\nRespetarán lo que HACES.\n\n**EL LEGADO:**\nEl liderazgo desde el frente es la ÚNICA forma de mantener una flota de alta eficiencia.\n\n**EL TEST FINAL:**\n¿Puedes irte 15 días de vacaciones y que todo funcione?\nSi la respuesta es SÍ, tienes una EMPRESA.\nSi es NO, tienes un AUTOEMPLEO.",
        action: "Esta semana, haz UNA tarea 'de base' que normalmente no harías. Limpia un cajón, ayuda en un reparto. Que te vean.",
        example: "Gerente limpió personalmente el local un sábado. Los riders nunca más dejaron basura en el suelo. El ejemplo educa más que mil órdenes.",
        order: 100
    }
];

export const getSeguridadModules = () => seguridadModules;
export const getLiderazgoModules = () => liderazgoModules;
