// Enciclopedia Repaart 2.0 - Módulos Tecnología y Calidad
import { EncyclopediaModule } from './encyclopediaModules';

// CATEGORÍA: TECNOLOGÍA (Módulos 61-75)
export const tecnologiaModules: EncyclopediaModule[] = [
    {
        id: "tec-001",
        title: "Protocolo Antena Caída (Zonas Sin Cobertura)",
        category: "Tecnología",
        content: "**Flyder es el cerebro, pero necesita internet.**\n\nSi un rider entra en garaje subterráneo o barrio con mala señal ('Zona de Sombra'), desaparece del radar.\n\n**EL RIESGO:**\nSi el rider no puede marcar 'Entregado', el sistema cree que sigue ocupado y no le asigna siguiente pedido = Pérdida de productividad.\n\n**SOLUCIÓN (Modo Avión/SMS):**\n1. Salir a zona abierta\n2. Poner/quitar modo avión para forzar reconexión\n3. Marcar estado inmediatamente\n\n**SI LA CAÍDA ES TOTAL:**\nEnviar SMS o llamada tradicional al Gerente: 'Pedido entregado, estoy libre'.\nGerente lo libera manualmente en panel de control.",
        action: "Crea 'Mapa de Calor Negro': Identifica qué portales o calles tienen problemas de cobertura. Avisa a nuevos riders.",
        example: "Calle Mayor 45: el ascensor anula el móvil. Instrucción: 'Marca Llegada ANTES de entrar al portal.'",
        order: 61
    },
    {
        id: "tec-002",
        title: "Protocolo Batería Infinita",
        category: "Tecnología",
        content: "**Sin batería no hay Flyder. Sin Flyder, el rider es ciego.**\n\n**EQUIPAMIENTO OBLIGATORIO:**\n- Prohibido salir al turno con menos del 80% de batería\n- Powerbank de empresa disponible en el local\n- 2-3 baterías externas cargadas para emergencias\n\n**PROTOCOLO DE INTERCAMBIO:**\nSi a un rider se le apaga el móvil a mitad de turno:\n1. Se le cambia el powerbank como en la Fórmula 1\n2. No pierde tiempo buscando enchufe\n\n**SANCIÓN:**\nQuedarse sin batería NO es excusa válida.\nEs falta de previsión = Sancionable igual que quedarse sin gasolina.",
        action: "Compra 3 powerbanks de 10.000mAh (15€ c/u). Mantenlos cargados en el local. Inversión: 45€. Valor: Cero tiempo muerto por batería.",
        example: "Rider se quedó sin batería a las 22:00 sin powerbank de reserva. 45 min parado buscando enchufe en un bar. Pérdida: 3 pedidos.",
        order: 62
    },
    {
        id: "tec-003",
        title: "Auditoría de Clics Fantasma (Coste Flyder)",
        category: "Tecnología",
        content: "**Flyder cobra 0.35€ + IVA por pedido. Parece poco, pero si no limpias el sistema, tiras dinero.**\n\n**EL ERROR DE DUPLICIDAD:**\nA veces el restaurante se equivoca, cancela un pedido y lo vuelve a crear.\nO el rider crea pedido de prueba y olvida borrarlo.\n\n**EL COSTE OCULTO:**\nFlyder te facturará por TODOS los pedidos registrados, sean reales o errores.\n\n**LA RUTINA DE LIMPIEZA:**\nRevisa semanalmente los pedidos 'Cancelados' o 'Erróneos'.\nAsegúrate de que están bien etiquetados para que no computen en factura.\n\n100 errores al mes = 35€ perdidos innecesariamente.",
        action: "Cada viernes, dedica 10 min a revisar pedidos cancelados/erróneos de la semana. Etiqueta correctamente.",
        example: "Franquicia descubrió que pagaba 50€/mes en pedidos de prueba no borrados. Limpieza semanal eliminó ese coste.",
        order: 63
    },
    {
        id: "tec-004",
        title: "Síndrome del Estabilizador Roto",
        category: "Tecnología",
        content: "**Las vibraciones de la moto destruyen las cámaras de los móviles modernos.**\n\n**EL PROBLEMA:**\nLos móviles con estabilizador óptico (OIS) sufren daño permanente por vibración constante de la moto.\nEl estabilizador se rompe internamente.\n\n**CONSECUENCIAS:**\n- Móvil no puede escanear códigos QR correctamente\n- Fotos de entrega borrosas\n- Móvil de empresa convertido en pisapapeles caro\n\n**SOLUCIÓN:**\nNo compres soporte de móvil barato (plástico rígido).\nInvierte en soportes con DAMPER (amortiguador de goma).\n\nCoste: 25-40€ vs 15€ del barato.\nAhorro: Evitar romper móviles de 200€.",
        action: "Revisa los soportes de tus motos. Si son de plástico rígido sin amortiguación, cámbialos por modelos con damper.",
        example: "3 móviles de empresa con cámara rota en 6 meses. Causa: soportes rígidos. Tras cambiar a damper, cero averías en 1 año.",
        order: 64
    },
    {
        id: "tec-005",
        title: "Higiene Digital (Ciberseguridad)",
        category: "Tecnología",
        content: "**Si un rider despedido accede a Flyder, puede sabotearte.**\n\n**EL KILL-SWITCH DE ACCESOS:**\nEn el momento del despido:\n1. PRIMER PASO: Cambiar contraseña de su usuario en App\n2. Eliminarlo de grupos de WhatsApp\n3. DESPUÉS: Firmar el finiquito\n\n**CUENTAS COMPARTIDAS:**\nProhibido terminantemente compartir usuarios:\n'Entra con mi clave que yo no tengo batería.'\n\n**EL RIESGO:**\nSi ocurre error o robo con ese usuario, no sabrás quién fue el culpable real.\nCada acción debe tener un responsable digital único.",
        action: "Revisa ahora mismo cuántos usuarios activos tienes en Flyder. ¿Hay alguno de ex-empleados? Desactívalos inmediatamente.",
        example: "Ex-rider despechado accedió con credenciales no revocadas. Canceló 8 pedidos antes de detectarlo. Pérdida: 200€ y reputación.",
        order: 65
    },
    {
        id: "tec-006",
        title: "Modo Oscuro y Ahorro Energético",
        category: "Tecnología",
        content: "**Parece una tontería, pero afecta a la operativa.**\n\n**CONFIGURACIÓN OBLIGATORIA:**\nModo Oscuro activado en:\n- Google Maps / Waze\n- Flyder (si disponible)\n- Sistema operativo del móvil\n\n**RAZÓN TÉCNICA:**\nReduce drásticamente el consumo de batería de la pantalla (el componente que más gasta).\n\n**BENEFICIOS:**\n- Alarga vida útil del móvil durante el turno\n- Reduce dependencia de powerbanks\n- Fatiga menos la vista del rider por la noche\n\n**INSTRUCCIÓN:**\nIncluir configuración de modo oscuro en checklist de onboarding de nuevos riders.",
        action: "Revisa los móviles de tus riders. Activa modo oscuro en todos. Tarda 2 min por móvil.",
        example: "Rider con modo oscuro llegaba a fin de turno con 30% de batería. Sin modo oscuro, llegaba con 5% (riesgo de apagón).",
        order: 66
    },
    {
        id: "tec-007",
        title: "La Foto Testigo (Entregas Contactless)",
        category: "Tecnología",
        content: "**El cliente dice 'no lo he recibido'. El rider dice 'lo dejé en el felpudo'. ¿A quién crees?**\n\n**EVIDENCIA DIGITAL:**\nEn entregas Contactless (dejar en puerta):\n- OBLIGATORIO tomar foto de la bolsa frente a la puerta\n- Número del piso visible en la foto\n- Enviar por chat de la App o guardar\n\n**USO:**\nEs tu seguro contra reclamaciones fraudulentas de reembolso.\n\n**PROTOCOLO:**\n1. Dejar pedido\n2. Dar 2 pasos atrás\n3. Foto donde se vea bolsa + puerta/número\n4. Marcar entregado\n5. Salir",
        action: "Instruye a todos los riders: 'Si dejas en puerta sin contacto, SIEMPRE foto. Sin excepciones.'",
        example: "Cliente reclamó 35€ de reembolso. Foto mostraba bolsa en su puerta con número de piso visible. Reclamación rechazada.",
        order: 67
    },
    {
        id: "tec-008",
        title: "Mapeo de Urbanizaciones Complejas",
        category: "Tecnología",
        content: "**Hay urbanizaciones que son laberintos donde el GPS falla.**\n\n**LA WIKI LOCAL:**\nCrea documento compartido o notas en tablón con mapas de complejos residenciales difíciles.\n\nEjemplo de nota:\n'Residencial Los Pinos: Los impares están a la derecha entrando por la rampa. La portería cierra a las 22:00, entrar por parking.'\n\n**BENEFICIO:**\nEvita que cada rider nuevo pierda 15 min dando vueltas en el mismo sitio.\n\n**FUENTES DE INFO:**\n- Conocimiento de riders veteranos\n- Quejas de clientes ('siempre os perdéis')\n- Tu propia experiencia de campo",
        action: "Pregunta a tus veteranos: '¿Cuál es la urbanización más confusa?'. Documenta la respuesta y compártela.",
        example: "Nueva urbanización sin señalización. Todos se perdían. Tras crear mapa interno, tiempo de entrega en esa zona bajó 8 min.",
        order: 68
    },
    {
        id: "tec-009",
        title: "Rutas Fantasma (Desviación de Kms)",
        category: "Tecnología",
        content: "**A veces, la distancia pagada (teórica) no coincide con la real.**\n\n**EL FENÓMENO:**\nFlyder calcula ruta óptima (ej. 3 km).\nPero el rider, por costumbre o error, toma camino más largo (ej. 4.5 km).\n\n**EL IMPACTO:**\nEstás gastando 50% más de gasolina y tiempo de lo necesario.\n\n**LA REVISIÓN MENSUAL:**\nCoge el 'Top 5' de pedidos más repetidos.\nCompara ruta de Google Maps con la que hacen tus riders.\n\n**SI VES DESVÍOS:**\n- Hay obras/tráfico real → Justificado\n- El rider está 'paseando' para hacer tiempo → Formación correctiva",
        action: "Pide a Flyder exportación de rutas del último mes. Compara 5 rutas frecuentes con ruta óptima de Google.",
        example: "Rider hacía 1.2 km extra en ruta habitual 'porque siempre lo hice así'. Corrección ahorró 3€/día en gasolina.",
        order: 69
    },
    {
        id: "tec-010",
        title: "Política de Redes Sociales (Confidencialidad)",
        category: "Tecnología",
        content: "**Lo que pasa en el turno, se queda en el turno.**\n\n**PROHIBICIÓN DE 'STORIES':**\nTerminantemente prohibido subir fotos o vídeos a Instagram/TikTok donde salgan:\n- Clientes (aunque sean famosos o 'raros')\n- Direcciones o interiores de casas\n- Contenido de pedidos\n- Quejas sobre restaurantes\n\n**EL RIESGO:**\nUna foto 'graciosa' de un cliente en pijama puede costarte:\n- Demanda por violación del honor\n- Pérdida de la franquicia\n- Daño reputacional irreparable\n\n**LA CLÁUSULA:**\nIncluir en contrato y hacer firmar por separado.",
        action: "Revisa contratos actuales. ¿Incluyen cláusula de redes sociales? Si no, añádela con firma específica.",
        example: "Rider subió TikTok burlándose de cliente. Se hizo viral. Demanda + despido + pérdida de 2 restaurantes clientes que vieron el vídeo.",
        order: 70
    }
];

// CATEGORÍA: CALIDAD (Módulos 71-85)
export const calidadModules: EncyclopediaModule[] = [
    {
        id: "cal-001",
        title: "El Efecto Mayordomo (Elevación del Estatus)",
        category: "Calidad",
        content: "**Diferénciate de la imagen del 'repartidor precario'.**\n\n**LA POSTURA DE ENTREGA:**\nInstruye al rider:\n- No estirar el brazo con desgana\n- Sacar producto de la mochila térmica DELANTE del cliente\n- El cliente debe ver el vapor del calor\n- Entregar con DOS manos\n\n**PSICOLOGÍA:**\nEste pequeño teatro subconsciente justifica precios más altos.\n\nEl cliente siente que le SIRVEN, no que le 'tiran' la comida.\n\n**DIFERENCIACIÓN:**\nGlovo/Uber: Entrega rápida e impersonal.\nRepaart: Experiencia de servicio Premium.",
        action: "En próxima reunión de equipo, haz role-play de entrega. Practica la 'entrega a dos manos' con todos.",
        example: "Restaurante reportó que clientes comentaban 'qué educados son vuestros riders'. Diferenciación real.",
        order: 71
    },
    {
        id: "cal-002",
        title: "Psicología del Servicio (Efecto Sonrisa)",
        category: "Calidad",
        content: "**El Manual audita aspectos que parecen triviales pero definen la propina y la repetición.**\n\n**AUDITORÍA DE EXPRESIVIDAD:**\nPuntúa del 1 al 5:\n- Rider con casco puesto que gruñe 'toma' = 1\n- Rider que mira a los ojos y sonríe = 5\n\n**EL PROTOCOLO DE DESPEDIDA:**\nObligatorio terminar con frase cordial:\n'Que aproveche' o 'Gracias, hasta la próxima'\n+ Sonrisa\n\n**EFECTO:**\nCierra el ciclo del servicio con emoción positiva.\nReduce quejas por comida fría o retrasos menores.\n\n**VOLUMEN DE VOZ:**\nSe penaliza hablar a gritos en rellano o restaurante.\nDiscreción = Servicio Premium.",
        action: "Acompaña a un rider en 3 entregas y observa su despedida. ¿Sonríe? ¿Dice 'que aproveche'? Corrige si es necesario.",
        example: "Rider que implementó protocolo de despedida aumentó sus propinas 40% en un mes. Mismo trabajo, mejor percepción.",
        order: 72
    },
    {
        id: "cal-003",
        title: "Decálogo del Silencio (Normativa Vecinal)",
        category: "Calidad",
        content: "**El mayor enemigo de una empresa de motos no es Glovo, son las asociaciones de vecinos.**\n\n**LA NORMA DE 'MOTOR OFF':**\nProhibido mantener moto arrancada mientras espera al cliente en portal.\nNi siquiera 'un minuto'.\n\n**PROHIBIDO:**\n- Tocar el claxon para llamar al compañero\n- Acelerar en vacío\n- Conversaciones a gritos entre riders\n\n**IMPACTO OPERATIVO:**\nSi tus motos no molestan, la policía no te hará controles 'sorpresa' en la puerta de tu local.\n\nSer invisible acústicamente = Rentabilidad operativa.",
        action: "Haz visita sorpresa a zona de espera de tus riders a las 21:00. ¿Hay motos arrancadas sin motivo? Corrige.",
        example: "Vecinos de zona de espera llamaron a policía 3 veces por 'ruido de motos'. Tras aplicar norma de silencio, cero quejas en 6 meses.",
        order: 73
    },
    {
        id: "cal-004",
        title: "Política de Buen Vecino (Civismo)",
        category: "Calidad",
        content: "**El delivery tiene mala fama: ruido, motos en acera, suciedad. Repaart gana mercado siendo la opción 'Caballero'.**\n\n**EL MANIFIESTO DEL SILENCIO:**\nInstruye a riders para apagar motor al llegar a zonas residenciales de noche.\nNo acelerar en vacío.\n\n**RESPETO AL ESPACIO PÚBLICO:**\nProhibido aparcar bloqueando:\n- Rampas de minusválidos\n- Pasos de cebra\n- Salidas de emergencia\n'Aunque sea un minuto.'\n\n**ARGUMENTO DE VENTA:**\n'Mis riders no te buscarán problemas con la comunidad de vecinos ni con la policía. Somos invisibles y educados.'",
        action: "Incluye el 'Código de Civismo' en formación de nuevos riders. Hazlo firmar como anexo al contrato.",
        example: "Restaurante en zona residencial de ancianos. Competencia causaba quejas, Repaart no. Ganamos exclusividad por 'buenos vecinos'.",
        order: 74
    },
    {
        id: "cal-005",
        title: "Protocolo de Embajador en Restaurante",
        category: "Calidad",
        content: "**El rider no es solo transportista; es la cara de Repaart en el local del cliente.**\n\n**LA ZONA DE INVISIBILIDAD:**\nInstruye a riders para ser DISCRETOS:\n- No gritar nombre del pedido desde la puerta\n- No apoyarse en barra donde comen clientes\n- No entrar en cocina sin permiso\n\n**EL CASCO:**\nPor seguridad e imagen, se recomienda:\n- Quitarse el casco al entrar al establecimiento\n- O al menos levantar visera/mentonera si es modular\n\n**RAZÓN:**\nEntrar con casco puesto genera desconfianza.\nInteractuar cara visible = Profesionalismo.",
        action: "Visita un restaurante cliente en hora pico. Observa cómo actúan tus riders. ¿Son discretos o invasivos?",
        example: "Rider entraba a cocina como si fuera su casa. Cocinero se quejó. Tras corrección, relación con restaurante mejoró notablemente.",
        order: 75
    },
    {
        id: "cal-006",
        title: "Higiene de la Mochila (Prueba del Olor)",
        category: "Calidad",
        content: "**Una mochila térmica cerrada y húmeda desarrolla olores horribles en 24h.**\n\n**PROTOCOLO 'CIERRES ABIERTOS':**\nAl terminar turno y dejar mochila en local:\n- Dejar ABIERTA (cremalleras bajadas)\n- Permitir que ventile toda la noche\n\n**PROHIBIDO:**\nMochila cerrada toda la noche = Caldo de cultivo de bacterias.\n\n**LA PRUEBA DEL OLOR:**\nCada lunes, haz 'test de olor' a cajones y mochilas.\nSi huele mal, limpieza profunda inmediata.\n\nNadie quiere que su pizza huela a humedad rancia.",
        action: "Instala perchero o barra en local para colgar mochilas abiertas. Coste: 20€. Beneficio: Cero olores.",
        example: "Cliente devolvió pedido porque 'olía a humedad'. Investigación: mochila llevaba 2 semanas sin ventilar ni limpiar.",
        order: 76
    },
    {
        id: "cal-007",
        title: "Auditoría de Patatas Fritas (Control de Gula)",
        category: "Calidad",
        content: "**Es la tentación número 1 del rider: 'robar' unas patatas de la bolsa abierta.**\n\n**EL PRECINTO SAGRADO:**\nExige a restaurantes que usen:\n- Pegatinas de seguridad\n- Grapas en bolsas de papel\n\n**INSPECCIÓN:**\nSi cliente se queja de que faltan cosas, y la bolsa llegó SIN precintar:\n- La culpa es TUYA por aceptarla así\n\n**INSTRUCCIÓN AL RIDER:**\n'Si la bolsa no está cerrada con grapa o pegatina, NO LA RECOJAS hasta que la cierren.'\n\nEsto protege al rider de acusaciones falsas y al cliente de robos reales.",
        action: "Comunica a todos los restaurantes: 'A partir del día X, no recogeremos bolsas sin precinto. Gracias.'",
        example: "Cliente acusó a rider de robar nuggets. Bolsa llegó con grapa intacta. Acusación rechazada. El precinto salvó al rider.",
        order: 77
    },
    {
        id: "cal-008",
        title: "Mantenimiento de Equipo de Lluvia",
        category: "Calidad",
        content: "**Los trajes de agua son caros. Si se guardan mojados, se pudren en 2 semanas.**\n\n**EL PERCHERO DE SECADO:**\nInstala barra en el local donde los trajes puedan colgarse estirados tras turno de lluvia.\n\n**PROHIBIDO:**\nMeter el impermeable hecho una bola en el cajón de la moto.\n\n**CONSECUENCIAS DEL MAL CUIDADO:**\n- Olor a humedad que se pega al rider\n- Material se deteriora y pierde impermeabilidad\n- Imagen ante el cliente dañada\n\n**INVERSIÓN:**\nBarra + perchas: 30€.\nVida útil de traje: De 3 meses a 12 meses.",
        action: "Compra 5 perchas de plástico para el local. Etiqueta: 'TRAJES DE LLUVIA'. Norma: Siempre colgar tras turno mojado.",
        example: "Traje de 45€ duró solo 6 semanas por guardarse mojado. Tras instalar perchero, trajes duran toda la temporada.",
        order: 78
    },
    {
        id: "cal-009",
        title: "Efecto Visera Sucia (Seguridad Nocturna)",
        category: "Calidad",
        content: "**Un casco con la visera rayada o sucia refracta la luz de las farolas y ciega al rider.**\n\n**EL PROTOCOLO LIMPIA-CRISTALES:**\nTen en zona de salida:\n- Spray de limpiacristales\n- Papel de cocina\n\n**NORMA:**\nObligatorio limpiar visera ANTES de empezar turno de noche.\n\n**IMPACTO:**\n- Reduce fatiga ocular\n- Evita accidentes por deslumbramiento\n- Rider que no ve bien conduce lento y con miedo\n\n**COSTE:**\nSpray: 3€. Papel: 2€.\nBeneficio: Cero accidentes por visibilidad.",
        action: "Coloca kit de limpieza de visera junto a puerta de salida con cartel: 'Limpia tu visera antes de salir'.",
        example: "Rider tuvo casi-accidente por deslumbramiento de farola en visera sucia. Tras implementar protocolo, cero incidentes similares.",
        order: 79
    },
    {
        id: "cal-010",
        title: "Diplomacia de Puerta de Atrás",
        category: "Calidad",
        content: "**Entrar por la puerta principal con casco y mochila golpeando a clientes que cenan es error grave.**\n\n**MAPEO DE ACCESOS:**\nIdentifica qué restaurantes tienen:\n- Entrada de servicio\n- Acceso por cocina\n- Puerta lateral\n\n**INSTRUCCIÓN:**\n'En la Pizzería Luigi, entrad siempre por el callejón.'\n\n**BENEFICIOS:**\n- El dueño del restaurante te amará (no molestas a sus comensales)\n- Tu rider saldrá más rápido (sin esquivar camareros)\n- Imagen profesional ante el personal del local\n\n**DOCUMENTACIÓN:**\nIncluye el acceso correcto en la ficha de cada restaurante en Flyder si es posible.",
        action: "Pregunta a cada restaurante: '¿Por dónde preferís que entren mis riders?'. Documenta y comunica al equipo.",
        example: "Rider entraba por comedor de restaurante fino. Gerente del restaurante se quejó. Cambio a entrada de servicio solucionó tensión.",
        order: 80
    }
];

export const getTecnologiaModules = () => tecnologiaModules;
export const getCalidadModules = () => calidadModules;
