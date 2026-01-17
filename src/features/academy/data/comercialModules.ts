// Enciclopedia Repaart 2.0 - Módulos Comercial
import { EncyclopediaModule } from './encyclopediaModules';

// CATEGORÍA: COMERCIAL (Módulos 51-70)
export const comercialModules: EncyclopediaModule[] = [
    {
        id: "com-001",
        title: "Auditoría de Packaging (Enemigo Silencioso)",
        category: "Comercial",
        content: "**Muchos gerentes pierden dinero no por fallos de reparto, sino por fallos de envase.**\n\nSi la comida llega volcada, el cliente culpa a Repaart, no al restaurante.\n\n**LA EXIGENCIA CONTRACTUAL:**\nAntes de firmar con un restaurante, DEBES auditar sus envases.\n\n**ENVASES PELIGROSOS:**\n- Sopas en tapas endebles\n- Salsas sin precinto\n- Envases de sala (abiertos o frágiles)\n- Bolsas sin grapa ni pegatina\n\n**ACCIÓN PREVENTIVA:**\nSi detectas envases inadecuados:\n1. Rechaza el servicio hasta que corrijan\n2. O deja por escrito que Repaart NO asume devoluciones por derrames causados por envase\n\n**TIP PRO:**\nRecomienda proveedores de packaging seguro. Te posiciona como experto, no solo 'el del transporte'.",
        action: "Antes de firmar contrato con restaurante nuevo, pide que te enseñen sus envases de delivery. Veta los peligrosos desde el día 0.",
        example: "Pizzería usaba cajas demasiado grandes para pizzas pequeñas. Se movían y llegaban volcadas. Tras exigir cambio de caja, quejas bajaron 90%.",
        order: 51
    },
    {
        id: "com-002",
        title: "Restaurante Embajador (Referral B2B)",
        category: "Comercial",
        content: "**Tus mejores comerciales son tus clientes felices.**\n\n**LA OFERTA:**\n'Sr. Restaurante, si convence al local de al lado para que trabaje con nosotros, le doy 50% de descuento en su próxima factura quincenal (hasta 100€).'\n\n**LA LÓGICA ECONÓMICA:**\nTe cuesta menos esos 100€ de descuento que pagar a un comercial para visitar puertas frías.\n\n**BENEFICIO ADICIONAL:**\nGanas densidad en la misma calle (Estrategia Zona A).\n\n**CÓMO ACTIVARLO:**\nAl entregar factura quincenal, menciona el programa.\n'Por cierto, si conoce algún restaurante que necesite delivery profesional, tenemos este programa de descuentos...'",
        action: "Comunica el programa de referidos a tus 5 mejores clientes esta semana. Ellos ya confían en ti, recomendarán con gusto.",
        example: "Pizzería refirió a la hamburguesería de enfrente. Descuento: 80€. Nuevo cliente: 400€/mes de facturación. ROI brutal.",
        order: 52
    },
    {
        id: "com-003",
        title: "Despido de Clientes (Semáforo)",
        category: "Comercial",
        content: "**A veces, el cliente NO tiene la razón.**\n\nUn restaurante que no paga o que retrasa tu operativa te hace perder dinero.\n\n**🔴 RESCISIÓN INMEDIATA:**\n- Impago: Tras 5 días de plazo sin pago ni respuesta → Kill-Switch\n- Maltrato: Faltas de respeto graves o gritos a tus riders → Daña moral de la tropa\n\n**🟠 ULTIMÁTUM (15 días):**\n- Tiempos de Cocina: Habitualmente >10-15 min de espera → Te roba tiempo de reparto\n- Packaging Deficiente: Tras avisar, sigue usando envases problemáticos\n\n**ACCIÓN:**\nReunión formal con el dueño:\n'O arreglamos esto en 15 días, o tendré que subir la tarifa para compensar la ineficiencia.'",
        action: "Identifica tu cliente más problemático. ¿Cuánto tiempo/dinero te cuesta? Si es >10% de tu margen, actúa esta semana.",
        example: "Restaurante con 18 min de espera media. Tras ultimátum, no mejoró. Lo despedimos. Productividad general subió 12%.",
        order: 53
    },
    {
        id: "com-004",
        title: "Protocolo de Activación (48h Críticas)",
        category: "Comercial",
        content: "**Has firmado el contrato. ¿Y ahora qué? El 80% de problemas surgen en los primeros 2 días.**\n\n**CHECKLIST DE ACTIVACIÓN:**\n\n**1. AUDITORÍA DE CARTA (Día -2)**\nRevisa su menú en las apps.\n¿Tienen platos 'peligrosos' para moto (sopas, cafés en vaso abierto)?\nAcción: Oblígales a retirar o cambiar envase ANTES del primer envío.\n\n**2. TEST DE ESTRÉS TECNOLÓGICO (Día -1)**\nNo esperes al viernes noche. Haz pedido de prueba un martes 11:00 AM.\nVerifica: ¿Entra en Flyder? ¿Suena tablet en cocina? ¿Sale dirección completa?\n\n**3. FORMACIÓN EXPRESS (Día 0)**\nPreséntate en el local.\nExplica a camareros dónde esperar tus riders.\nEvita que motos bloqueen entrada desde día 1.",
        action: "Crea checklist de activación de 10 puntos. Úsalo con CADA nuevo restaurante sin excepción.",
        example: "Restaurante activado sin test previo. Viernes 21:00 descubrimos que su tablet no sonaba. Caos de pedidos perdidos.",
        order: 54
    },
    {
        id: "com-005",
        title: "Mystery Shopper (Audita a tu Rival)",
        category: "Comercial",
        content: "**Para ganar argumentos de venta, no basta con decir que eres mejor. Demuéstralo.**\n\n**EL EXPERIMENTO MENSUAL:**\n1. Pide a un restaurante cliente tuyo, pero hazlo a través de Glovo/Uber\n2. Cronometra el tiempo real\n3. Revisa estado del packaging (¿llegó frío? ¿volcado?)\n4. Observa imagen del rider (¿mochila sucia? ¿sin uniforme?)\n\n**EL ARMA DE VENTA:**\nLleva esos datos al dueño:\n'Mira, pedí una pizza con la competencia y llegó así (foto). Mis tiempos medios contigo son 10 min más rápidos. Estás dañando tu marca por ahorrarte 50 céntimos.'",
        action: "Este mes, haz un pedido mystery shopper a 2 restaurantes clientes vía competencia. Documenta con fotos y tiempos.",
        example: "Foto de pizza volcada de Glovo convenció a restaurante de firmar exclusividad con Repaart. 'Esto no puede ser mi imagen'.",
        order: 55
    },
    {
        id: "com-006",
        title: "Marketing de Guerrilla (Visibilidad Low-Cost)",
        category: "Comercial",
        content: "**No tienes presupuesto de TV de Uber, pero tienes el terreno.**\n\n**LA MOTO COMO VALLA PUBLICITARIA:**\nTus cajones son vistos por miles de personas/día.\nAsegura que vinilos de Repaart estén impolutos.\nMoto sucia = Anti-marketing.\n\n**PEGATINAS 'ZONA SEGURA':**\nPide a restaurantes asociados poner pegatina Repaart en puerta.\nEfecto: Cliente que va al local ve que tiene delivery profesional.\n\n**FLYERS EN LA BOLSA (Cross-Selling):**\nNegocia con Restaurante A (Pizzería) meter flyer del Restaurante B (Hamburguesería) en sus bolsas, y viceversa.\n\n**BENEFICIO:**\nCreas ecosistema local donde tus clientes se pasan pedidos entre ellos, aumentando TU volumen.",
        action: "Compra 500 pegatinas Repaart. Ofrécelas a tus restaurantes. Cada puerta con pegatina es publicidad 24/7 gratuita.",
        example: "Pegatina en puerta de pizzería generó 3 llamadas de restaurantes vecinos preguntando por el servicio. Coste pegatina: 0.10€.",
        order: 56
    },
    {
        id: "com-007",
        title: "Feedback Loop Proactivo (Fidelización)",
        category: "Comercial",
        content: "**El cliente que se va sin quejarse es el más peligroso.**\n\n**NO ESPERES AL PROBLEMA:**\nEstablece rutina quincenal de contacto con restaurantes clave.\n\n**LA PREGUNTA DE ORO:**\n'¿Qué tal el servicio esta semana? ¿Hay algún rider que quieras destacar (para bien o para mal)?'\n\n**BENEFICIO DOBLE:**\n- **Operativo:** Detectas fallos invisibles ('el rider llega rápido pero la pizza llega movida')\n- **Relacional:** El restaurante se siente escuchado, eleva barrera de salida frente a competencia\n\n**ACCIÓN CORRECTIVA:**\nSi hay quejas, no des excusas.\nImplementa cambio visible ('He reentrenado a Juan en colocación de carga') y comunícalo.",
        action: "Programa llamada quincenal a tus 10 mejores clientes. 5 min por llamada = 50 min de inversión en retención.",
        example: "Llamada de rutina reveló que rider siempre llegaba 5 min antes de que estuviera listo. Ajuste de timing evitó perder cliente.",
        order: 57
    },
    {
        id: "com-008",
        title: "Canal de Escucha Radical",
        category: "Comercial",
        content: "**¿Cómo evitas que un restaurante se vaya a la competencia? No bajando precios, sino escuchando mejor.**\n\n**EL ERROR COMÚN:**\nMuchos gerentes evitan contacto cuando hay problemas.\n'Mejor no le llamo para no removerlo.'\n\n**LA ESTRATEGIA GANADORA:**\nCrea Canal Directo de Atención prioritario para resolver inconvenientes rápidamente.\n\n**LA CLAVE:**\nLa percepción de calidad del restaurante NO depende de que nunca falles, sino de lo RÁPIDO que arreglas el fallo.\n\nUn problema resuelto en 5 minutos fideliza MÁS que un servicio perfecto pero impersonal.\n\n**EL WHATSAPP VIP:**\nDa tu número personal a los 5 mejores clientes.\n'Para cualquier urgencia, escríbeme directo.'",
        action: "Identifica tu cliente más valioso. ¿Tiene tu teléfono directo? Si no, dáselo hoy.",
        example: "Restaurante top tuvo queja a las 22:00. Contesté en 2 min y resolví. 'Con Glovo tardaban días en contestar'. Fidelizado para siempre.",
        order: 58
    },
    {
        id: "com-009",
        title: "Venta Cruzada B2B2C",
        category: "Comercial",
        content: "**Tienes acceso directo al salón de miles de familias. Monetízalo.**\n\n**EL INGRESO ATÍPICO:**\nNegocia con empresas locales (clínica dental, gimnasio, academia):\n'Por 200€/mes, mis riders meterán tu flyer en cada bolsa de comida que entreguen.'\n\n**LOGÍSTICA:**\n- Prepara packs de 100 flyers por restaurante\n- Rider mete 1 flyer por bolsa al recoger\n- Sin coste de envío adicional (ya vas a esa casa)\n\n**BENEFICIO:**\nFuente de ingresos neta que no depende de las pizzas.\nAprovechas logística que ya estás pagando.",
        action: "Contacta 3 negocios locales esta semana y ofrece el servicio de distribución de flyers. Precio: 150-250€/mes según volumen.",
        example: "Gimnasio local pagó 180€/mes por 2.000 flyers distribuidos. Ingreso extra anual: 2.160€ sin coste operativo adicional.",
        order: 59
    },
    {
        id: "com-010",
        title: "Cláusula de Realidad (Disclaimer)",
        category: "Comercial",
        content: "**Para cerrar con responsabilidad empresarial, incluye esta advertencia sobre proyecciones financieras.**\n\n**LA NOTA DE EXPECTATIVAS:**\n'La información financiera y análisis de rentabilidad son estimaciones basadas en escenarios operativos óptimos.'\n\n**EL ÉXITO DEPENDE DE:**\n- La gestión local del gerente\n- La coyuntura económica de la ciudad\n- El cumplimiento estricto de los protocolos\n\n**MENSAJE AL NUEVO FRANQUICIADO:**\nLa franquicia te da el coche (modelo) y el mapa (manuales), pero TÚ eres quien conduce.\n\nLos beneficios NO son automáticos; son el resultado de la gestión diaria.\n\n**USO:**\nIncluir en todos los materiales de venta y contratos.",
        action: "Revisa tus materiales comerciales. ¿Incluyen disclaimer de expectativas? Si no, añádelo para evitar reclamaciones futuras.",
        example: "Franquiciado demandó a central porque 'no ganaba lo prometido'. El disclaimer en contrato demostró que eran estimaciones, no garantías. Demanda desestimada.",
        order: 60
    }
];

export const getComercialModules = () => comercialModules;
