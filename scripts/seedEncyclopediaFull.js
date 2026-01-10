// Script completo para cargar los 150 módulos de Encyclopedia
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBvKB03R1antoQQVUdgvPuBDlY7xpjRx7Q",
    authDomain: "repaartfinanzas.firebaseapp.com",
    projectId: "repaartfinanzas",
    storageBucket: "repaartfinanzas.firebasestorage.app",
    messagingSenderId: "829736003569",
    appId: "1:829736003569:web:4f6cb9dee9a8e27c21f7af"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 12 CATEGORÍAS
const categories = [
    { id: "estrategia", name: "Estrategia", icon: "TrendingUp", color: "blue", order: 1, unlockRequirement: null },
    { id: "finanzas", name: "Finanzas", icon: "Trophy", color: "emerald", order: 2, unlockRequirement: "estrategia" },
    { id: "operativa", name: "Operativa", icon: "TrendingUp", color: "sky", order: 3, unlockRequirement: "finanzas" },
    { id: "rrhh", name: "RRHH & Equipo", icon: "Trophy", color: "indigo", order: 4, unlockRequirement: "operativa" },
    { id: "seguridad", name: "Seguridad", icon: "TrendingUp", color: "red", order: 5, unlockRequirement: "rrhh" },
    { id: "eficiencia", name: "Eficiencia", icon: "TrendingUp", color: "yellow", order: 6, unlockRequirement: "seguridad" },
    { id: "comercial", name: "Comercial", icon: "Trophy", color: "purple", order: 7, unlockRequirement: "eficiencia" },
    { id: "cultura", name: "Cultura", icon: "Trophy", color: "pink", order: 8, unlockRequirement: "comercial" },
    { id: "maestria", name: "Maestría", icon: "Trophy", color: "amber", order: 9, unlockRequirement: "cultura" },
    { id: "tactica", name: "Táctica", icon: "TrendingUp", color: "slate", order: 10, unlockRequirement: "maestria" },
    { id: "crisis", name: "Legal & Crisis", icon: "TrendingUp", color: "orange", order: 11, unlockRequirement: "tactica" },
    { id: "micro", name: "Micro-Gestión", icon: "TrendingUp", color: "teal", order: 12, unlockRequirement: "crisis" }
];

// 150 MÓDULOS - DATOS COMPLETOS
const modules = [
    {
        "categoryId": "estrategia",
        "title": "El Modelo 'Superautónomos'",
        "content": "Repaart se diferencia radicalmente de las plataformas 'gig-economy' y de las ETTs tradicionales. Somos una Operadora Logística Descentralizada. Nuestro modelo combina la flexibilidad operativa de la microempresa con una estructura sólida de asalariados, eliminando el riesgo de 'falsos autónomos' y ofreciendo estabilidad.",
        "action": "Vende 'Flota Dedicada' y 'Garantía Total de Servicio' frente a la incertidumbre de la competencia.",
        "order": 1
    },
    {
        "categoryId": "estrategia",
        "title": "Estructura de Packs",
        "content": "El modelo se divide en dos niveles de inversión según el perfil del gestor. El 'Pack Básico' (1.500€ + 1% royalty) está diseñado para expertos logísticos que buscan autonomía. El 'Pack Premium' (3.000€ + 3% royalty) ofrece un acompañamiento intensivo con Mentoring quincenal.",
        "action": "Si es tu primera experiencia en logística, la inversión en el Pack Premium es obligatoria para evitar errores de novato.",
        "order": 2
    },
    {
        "categoryId": "estrategia",
        "title": "Matriz de Tarifas por Zonas",
        "content": "La rentabilidad en última milla depende estrictamente de la densidad y la distancia. La Zona A (0-4km) a 6€ es el núcleo del negocio. La Zona D (6-7km) a 9€ es una tarifa disuasoria diseñada para proteger la productividad, no para generar volumen.",
        "action": "Audita tus rutas mensualmente: El 80% de tu facturación debe provenir de la Zona A.",
        "order": 3
    },
    {
        "categoryId": "estrategia",
        "title": "Expansión 'Mancha de Aceite'",
        "content": "El error más común es abrir nuevas zonas desconectadas geográficamente. El crecimiento debe ser contiguo (barrio a barrio) para permitir que la flota fluya entre zonas según la demanda, optimizando los recursos y evitando tiempos muertos.",
        "action": "Jamás firmes un restaurante aislado a 10km de tu base actual, por muy buena que sea la marca.",
        "order": 4
    },
    {
        "categoryId": "finanzas",
        "title": "Protocolo de Tesorería Blindada",
        "content": "La liquidez es el oxígeno de la franquicia. Implementamos un ciclo de facturación quincenal con vencimiento a 5 días. Para proteger tu caja, el sistema incluye un 'Kill-Switch' que corta el servicio automáticamente ante impagos.",
        "action": "Aplica tolerancia cero: Si un restaurante no paga el día 5, el servicio se suspende el día 6.",
        "order": 5
    },
    {
        "categoryId": "finanzas",
        "title": "El Fondo de Maniobra Sagrado",
        "content": "Debes mantener un capital líquido intocable de aproximadamente 1.500€. Este fondo no es beneficio; es un seguro de vida para cubrir imprevistos críticos como averías simultáneas de motos, retrasos bancarios o fianzas urgentes.",
        "action": "Crea una cuenta bancaria separada para este fondo y nunca la uses para gastos corrientes.",
        "order": 6
    },
    {
        "categoryId": "finanzas",
        "title": "Disciplina Fiscal (Modelo 130)",
        "content": "Muchos gerentes nuevos confunden el dinero en cuenta con beneficios reales. Recuerda que debes adelantar el 20% de tu beneficio trimestral a Hacienda mediante el Modelo 130 del IRPF. El dinero en caja no es todo tuyo.",
        "action": "Automatiza tu seguridad fiscal: Transfiere el 20% de cada beneficio mensual a una sub-cuenta de impuestos.",
        "order": 7
    },
    {
        "categoryId": "finanzas",
        "title": "La 'Caja de Resistencia'",
        "content": "Operar al límite de la caja es suicida. Hemos establecido un indicador de Alerta Roja: si el saldo de tu cuenta operativa baja de 1.100€, la viabilidad de la empresa está en riesgo inmediato.",
        "action": "Si entras en zona de Alerta Roja, activa un plan de austeridad radical cortando todo gasto no esencial.",
        "order": 8
    },
    {
        "categoryId": "operativa",
        "title": "Tecnología Flyder",
        "content": "Flyder es el cerebro operativo que gestiona la asignación inteligente. Con un coste de 0,35€/pedido, es tu principal herramienta de eficiencia. En dispositivos iOS, requiere una instalación especial vía TestFlight por ser software interno corporativo.",
        "action": "Realiza una auditoría semanal de 'clics fantasma' para evitar pagar comisiones por pedidos cancelados o erróneos.",
        "order": 9
    },
    {
        "categoryId": "operativa",
        "title": "Gestión de Flota Yamimoto",
        "content": "El renting profesional incluye seguro y mantenimiento, pero exige cumplimiento estricto. Las revisiones a los 1.000, 5.000 y 10.000 km son obligatorias para mantener la validez de la garantía mecánica.",
        "action": "Adquiere al menos 1 moto propia de 'reserva táctica' para cubrir bajas de vehículos de renting.",
        "order": 10
    },
    {
        "categoryId": "operativa",
        "title": "Protocolo 'Antena Caída'",
        "content": "En zonas de sombra (sótanos, garajes), el rider pierde conexión y desaparece del mapa de Flyder, impidiendo la asignación de nuevos pedidos y reduciendo la productividad.",
        "action": "Instruye a los riders: Salir a zona abierta, activar/desactivar modo avión para forzar reconexión y contactar a base.",
        "order": 11
    },
    {
        "categoryId": "operativa",
        "title": "La Brecha de los 10 Días",
        "content": "Atención a la letra pequeña: El contrato de Yamimoto solo ofrece vehículo de sustitución si la avería inmoviliza la moto más de 10 días. Una avería de 8 días te deja pagando la cuota pero sin vehículo.",
        "action": "Mitiga este riesgo financiero utilizando tu moto de reserva propia o un alquiler local por días.",
        "order": 12
    },
    {
        "categoryId": "rrhh",
        "title": "Perfil del Rider Ideal",
        "content": "Buscamos estabilidad. El perfil óptimo se sitúa entre 24 y 40 años. Los perfiles muy jóvenes suelen presentar mayor rotación e incidencias. Valoramos especialmente la presencia, higiene y habilidades de trato al cliente.",
        "action": "Mantén siempre a 3 candidatos entrevistados y validados en tu 'Bolsa de Reserva'.",
        "order": 13
    },
    {
        "categoryId": "rrhh",
        "title": "Control de Inventario",
        "content": "El equipamiento (Cajón, Casco, Bolsa Térmica, Uniforme) representa un coste elevado. Es responsabilidad contractual del trabajador cuidarlo. La pérdida o daño por negligencia debe ser repercutida.",
        "action": "Realiza inspecciones visuales aleatorias y descuenta pérdidas del finiquito según tarifa.",
        "order": 14
    },
    {
        "categoryId": "rrhh",
        "title": "Liderazgo Situacional",
        "content": "La gestión de personas no es talla única. Aplica un estilo Directivo (instrucciones precisas) con los novatos inseguros y un estilo Delegativo (autonomía y consulta) con los veteranos fiables.",
        "action": "Adapta tu comunicación: Al nuevo explícale el 'cómo', al veterano pregúntale su opinión.",
        "order": 15
    },
    {
        "categoryId": "rrhh",
        "title": "Horas Complementarias",
        "content": "La demanda en delivery es volátil. Los contratos parciales deben incluir siempre el anexo de 'Horas Complementarias' para tener flexibilidad legal ante picos de trabajo imprevistos.",
        "action": "Utiliza este mecanismo legal para cubrir las noches de viernes sin pagar horas extra caras.",
        "order": 16
    },
    {
        "categoryId": "seguridad",
        "title": "Riesgo de Viento Lateral",
        "content": "El cajón de reparto actúa como una vela. Con vientos superiores a 40km/h, el riesgo de que una ráfaga lateral desestabilice la moto o la saque del carril es crítico.",
        "action": "Protocolo: Prohibido adelantar a camiones o autobuses. Reducir velocidad un 20% y circular por el centro.",
        "order": 17
    },
    {
        "categoryId": "seguridad",
        "title": "El Kit 'MacGyver'",
        "content": "Las esperas de grúa matan la rentabilidad. Una dotación mínima de herramientas bajo el asiento (bridas, cinta americana, destornillador) permite solucionar desperfectos menores in situ.",
        "action": "Equipa cada moto con este kit para reparaciones de emergencia y salvar el turno.",
        "order": 18
    },
    {
        "categoryId": "seguridad",
        "title": "Visibilidad Nocturna",
        "content": "Una visera de casco rayada o sucia refracta la luz de las farolas y los coches, cegando al rider por la noche y aumentando drásticamente la fatiga y el riesgo de accidente.",
        "action": "Instala una estación de limpieza en la salida. Haz obligatorio limpiar la visera antes del turno noche.",
        "order": 19
    },
    {
        "categoryId": "crisis",
        "title": "Accidente con Heridos",
        "content": "En situaciones graves, el pánico bloquea. Todo el equipo debe conocer la conducta PAS: Proteger la zona, Avisar al 112 y Socorrer. La prioridad es la vida, luego la burocracia.",
        "action": "El Gerente debe acudir o solicitar fotos inmediatas de la vía antes de que se muevan los vehículos.",
        "order": 20
    },
    {
        "categoryId": "crisis",
        "title": "Protocolo Anti-Atraco",
        "content": "La seguridad del personal es innegociable. Una moto cuesta 3.000€ y está asegurada; la integridad física de tu rider no tiene precio. Evita confrontaciones a toda costa.",
        "action": "Instrucción tajante: Si hay amenaza, entrega la moto y las llaves inmediatamente. No te hagas el héroe.",
        "order": 21
    },
    {
        "categoryId": "comercial",
        "title": "Argumentario B2B",
        "content": "No entres en guerra de precios con las grandes apps. Tu propuesta de valor es la 'Paz Mental': ofreces seguridad jurídica (riders asalariados) frente al riesgo de los 'falsos autónomos'.",
        "action": "Vende seguridad: 'Si hay una inspección o accidente, la responsabilidad es 100% de Repaart'.",
        "order": 22
    },
    {
        "categoryId": "comercial",
        "title": "Mistery Shopper",
        "content": "Para ganar argumentos de venta, no basta con decir que eres mejor; debes demostrarlo. Realiza pedidos a través de la competencia para documentar sus fallos en tiempos y presentación.",
        "action": "Lleva fotos de la competencia (pizza volcada) al dueño del restaurante para cerrar la venta.",
        "order": 23
    },
    {
        "categoryId": "eficiencia",
        "title": "Tela de Araña",
        "content": "La densidad de pedidos es la clave del margen. Si ya tienes un rider yendo a una calle, recoger otro pedido en el local de al lado tiene un coste marginal cercano a cero.",
        "action": "Cuando firmes un cliente, visita y capta inmediatamente a los 3 locales colindantes.",
        "order": 24
    },
    {
        "categoryId": "comercial",
        "title": "Marketing de Guerrilla",
        "content": "Tus motos son vallas publicitarias móviles. Aparcarlas en callejones oscuros es desperdiciar impactos visuales gratuitos que generan confianza en la marca.",
        "action": "Instruye a los riders para aparcar en avenidas principales o frente a restaurantes concurridos.",
        "order": 25
    },
    {
        "categoryId": "eficiencia",
        "title": "Kilómetros Basura",
        "content": "El regreso automático a la base tras cada entrega ('Efecto Yo-Yo') es ineficiente. Se quema gasolina y tiempo volviendo de vacío innecesariamente.",
        "action": "Impón la 'Espera Activa': Tras entregar, esperar 3 minutos en la zona por si sale otro pedido.",
        "order": 26
    },
    {
        "categoryId": "eficiencia",
        "title": "Eco-Conducción",
        "content": "Los acelerones bruscos y el ralentí excesivo disparan el consumo de combustible. Una conducción agresiva no solo es peligrosa, sino que encarece la operación un 15%.",
        "action": "Forma a los riders en conducción suave y apagado de motor en esperas superiores a 1 minuto.",
        "order": 27
    },
    {
        "categoryId": "eficiencia",
        "title": "Regla de Pisos Bajos",
        "content": "El ascensor es un ladrón de tiempo en edificios antiguos. En entregas a 1º, 2º o 3º piso, subir por las escaleras es estadísticamente más rápido.",
        "action": "Fomenta el uso de escaleras en pisos bajos. Ahorra 30 minutos acumulados al día por rider.",
        "order": 28
    },
    {
        "categoryId": "eficiencia",
        "title": "Guantes Táctiles",
        "content": "La micro-pérdida de tiempo al quitarse y ponerse los guantes en cada parada para usar el móvil suma horas muertas al final del mes y genera riesgo de pérdida.",
        "action": "Invierte en guantes de invierno con punta conductiva para toda la flota.",
        "order": 29
    },
    {
        "categoryId": "cultura",
        "title": "Efecto Mayordomo",
        "content": "La entrega es el único punto de contacto físico. No estires el brazo con desgana. Saca el producto de la mochila térmica delante del cliente para que vea el vapor.",
        "action": "Instruye para entregar con las dos manos. Esto justifica un precio premium.",
        "order": 30
    },
    {
        "categoryId": "calidad",
        "title": "Auditoría de Packaging",
        "content": "Muchos gerentes pierden dinero por fallos de envase del restaurante. Si la comida llega volcada o fría por un envase barato, el cliente culpa a Repaart.",
        "action": "Rechaza servir restaurantes con envases inadecuados o exige grapas y precintos de seguridad.",
        "order": 31
    },
    {
        "categoryId": "cultura",
        "title": "Embajador en Restaurante",
        "content": "El rider es la cara de tu empresa. Entrar gritando, con el casco puesto o golpeando con la mochila daña tu imagen y molesta a los clientes que cenan.",
        "action": "Norma de etiqueta: Entrar por puerta trasera, quitarse el casco y hablar bajo.",
        "order": 32
    },
    {
        "categoryId": "cultura",
        "title": "Gestión de Conserjes",
        "content": "Un conserje enfadado puede prohibir la entrada a tus riders y obligarles a esperar en la calle, retrasando toda la cadena de reparto.",
        "action": "Establece el saludo obligatorio: 'Buenas noches caballero'. Gánatelos como aliados.",
        "order": 33
    },
    {
        "categoryId": "crisis",
        "title": "Protocolo Apocalipsis",
        "content": "Plan de contingencia ante caída mundial de servidores (Flyder/Google/AWS). La operativa no puede detenerse por un fallo informático en hora punta.",
        "action": "Ten mapas físicos y talonarios de papel en el local. Activa el modo 'Radio-Taxi' vía teléfono.",
        "order": 34
    },
    {
        "categoryId": "cultura",
        "title": "Gestión del Rumor",
        "content": "'Radio Macuto' destruye la moral de la tropa. Los rumores sobre bajadas de sueldo o cambios de zona desmotivan si no se atajan.",
        "action": "Aplica transparencia radical. Desmiente rumores con datos oficiales en el grupo general.",
        "order": 35
    },
    {
        "categoryId": "operativa",
        "title": "El Minuto de Oro",
        "content": "El momento crítico es justo después de cerrar la puerta del cliente. Si falta algo, es mejor solucionarlo in situ que gestionar un reembolso posterior.",
        "action": "El rider debe esperar 30 segundos en el portal antes de irse por si el cliente reclama.",
        "order": 36
    },
    {
        "categoryId": "maestria",
        "title": "El Legado (Salida)",
        "content": "Un negocio real es aquel que funciona sin la presencia constante de su dueño. Si todo el conocimiento está en tu cabeza, tienes un autoempleo frágil.",
        "action": "Crea el 'Libro Rojo': Un documento con todas las claves y procesos para que el negocio ruede 15 días sin ti.",
        "order": 37
    },
    {
        "categoryId": "rrhh",
        "title": "Flexibilidad Contractual",
        "content": "El delivery tiene picos imprevisibles. Contratar gente nueva para 2 horas es inviable. El 'Pacto de Horas Complementarias' es tu herramienta legal.",
        "action": "Incluye este anexo en contratos parciales para cubrir picos legales sin pagar horas extra.",
        "order": 38
    },
    {
        "categoryId": "crisis",
        "title": "Protección de Datos",
        "content": "Tus riders tienen datos sensibles de clientes. El uso indebido (contactar para ligar o vender) es una falta muy grave y un riesgo legal enorme.",
        "action": "Prohibición tajante de contacto post-servicio. Borrado semanal del historial de navegación.",
        "order": 39
    },
    {
        "categoryId": "operativa",
        "title": "La Brecha de 10 Días",
        "content": "El contrato de renting de Yamimoto tiene un vacío: no da moto de sustitución si la avería dura menos de 10 días, pero sigues pagando la cuota.",
        "action": "Ten una moto propia de reserva o un acuerdo de alquiler local para cubrir estos huecos.",
        "order": 40
    },
    {
        "categoryId": "cultura",
        "title": "Rituales de Tribu",
        "content": "El dinero atrae, pero el sentido de pertenencia retiene. Diferénciate de la frialdad de las grandes apps creando un equipo humano real.",
        "action": "Realiza un briefing motivacional de 3 minutos antes del turno duro. Gamifica con rankings.",
        "order": 41
    },
    {
        "categoryId": "cultura",
        "title": "Descompresión",
        "content": "El rider llega a casa con la adrenalina del tráfico. Ayudarle a bajar pulsaciones antes de salir mejora su salud mental y reduce el burnout.",
        "action": "Fomenta 5 minutos de charla y agua en la base al terminar el turno antes de irse.",
        "order": 42
    },
    {
        "categoryId": "cultura",
        "title": "Combate Soledad",
        "content": "El trabajo de rider es solitario. Pasan 8 horas dentro de un casco sin hablar con nadie, lo que afecta al ánimo.",
        "action": "Dedica 1 minuto de conversación real (no laboral) a cada rider al cruzaros en la base.",
        "order": 43
    },
    {
        "categoryId": "tactica",
        "title": "Kit MacGyver",
        "content": "A veces la moto se 'desmonta' a mitad de servicio. Una dotación mínima de herramientas evita llamar a la grúa por tonterías.",
        "action": "Lleva bridas, cinta americana y destornillador bajo el asiento para reparaciones de trinchera.",
        "order": 44
    },
    {
        "categoryId": "tactica",
        "title": "Kit Anti-Pinchazo",
        "content": "Esperar a la grúa por un clavo es ruinoso. Un spray de espuma permite acabar el turno y llevar la moto al taller rodando.",
        "action": "Dota a cada moto de un spray reparador. Ahorra 2 horas de inactividad por pinchazo.",
        "order": 45
    },
    {
        "categoryId": "finanzas",
        "title": "Fórmula del Beneficio",
        "content": "Solo hay dos formas de mejorar beneficios: Aumentar ventas o disminuir costes. Ante una crisis, cortar costes es inmediato; vender más lleva tiempo.",
        "action": "Revisa primero el 'desagüe' de costes (personal sobrante, gasolina) antes de invertir en ventas.",
        "order": 46
    },
    {
        "categoryId": "finanzas",
        "title": "Calidad de la Deuda",
        "content": "No toda la deuda es igual. Si la mayoría de tu deuda es a corto plazo, tienes un riesgo de insolvencia alto ante cualquier bache de ventas.",
        "action": "Si el ratio de deuda a corto plazo se dispara, renegocia con el banco para alargar plazos.",
        "order": 47
    },
    {
        "categoryId": "comercial",
        "title": "Canal de Escucha Radical",
        "content": "La percepción de calidad no depende de no fallar nunca, sino de la velocidad con la que arreglas el fallo. Un problema resuelto rápido fideliza.",
        "action": "Habilita un canal directo (WhatsApp VIP) para dueños de restaurantes para resolver incidencias ya.",
        "order": 48
    },
    {
        "categoryId": "cultura",
        "title": "Reconocimiento Público",
        "content": "El salario emocional es clave. Reconocer el buen trabajo delante de los compañeros refuerza las conductas positivas y motiva al grupo.",
        "action": "Nombra al 'Rider del Mes' basándote en métricas objetivas y prémiale simbólicamente.",
        "order": 49
    },
    {
        "categoryId": "cultura",
        "title": "Política de Buen Vecino",
        "content": "El ruido y el caos generan enemigos en el barrio. Si los vecinos se quejan, la policía vendrá. Ser invisible acústicamente es rentabilidad.",
        "action": "Prohibido mantener motores arrancados en esperas o tocar el claxon para saludar.",
        "order": 50
    },
    {
        "categoryId": "maestria",
        "title": "El Radar de Falta de Respeto",
        "content": "La autoridad se pierde en los detalles. Si un rider te interrumpe, llega tarde sin avisar o mastica chicle mientras le hablas, te está midiendo. Si lo toleras, has perdido el mando.",
        "action": "Corrige la falta de respeto en el segundo 1. 'Por favor, tira el chicle antes de hablarme'.",
        "order": 51
    },
    {
        "categoryId": "maestria",
        "title": "La Regla del 3 para Despidos",
        "content": "Despedir es caro, pero mantener a un tóxico es ruina. La regla es: 1ª vez (Advertencia verbal), 2ª vez (Sanción escrita), 3ª vez (Despido disciplinario). Sin emociones.",
        "action": "Documenta cada paso. Sin papel, el despido es improcedente.",
        "order": 52
    },
    {
        "categoryId": "tactica",
        "title": "Optimización de Semáforos",
        "content": "En rutas repetitivas, memorizar los ciclos semafóricos ahorra minutos. Saber qué semáforo tarda 2 minutos en abrir permite apagar motor o elegir ruta alternativa.",
        "action": "Mapea los 'semáforos negros' de tu zona y diseña rutas para evitarlos.",
        "order": 53
    },
    {
        "categoryId": "tactica",
        "title": "El Atajo del Callejón",
        "content": "Los GPS comerciales (Google Maps) priorizan avenidas. El conocimiento local de callejones, pasajes peatonales permitidos o zonas de carga y descarga es tu ventaja competitiva.",
        "action": "Dedica 1 hora semanal a explorar tu zona buscando atajos 'invisibles' para el GPS.",
        "order": 54
    },
    {
        "categoryId": "crisis",
        "title": "Gestión de Redadas",
        "content": "Si hay una inspección de trabajo o policial en el local, el pánico es tu enemigo. El gerente debe ser el único interlocutor. El resto, silencio absoluto.",
        "action": "Ten la carpeta 'Inspección' siempre a mano con: Alta IAE, Seguro RC y Contratos.",
        "order": 55
    },
    {
        "categoryId": "crisis",
        "title": "Crisis de Reputación Online",
        "content": "Una reseña de 1 estrella bien contestada vale más que 5 estrellas sin texto. Si un cliente ataca en Google, responde con educación, datos y ofreciendo solución offline.",
        "action": "Nunca discutas en público. Respuesta tipo: 'Lamentamos lo ocurrido, por favor contacta al...'",
        "order": 56
    },
    {
        "categoryId": "micro",
        "title": "Control de Gasolina",
        "content": "El robo hormiga de combustible es común. Si el consumo de una moto se dispara un 20% sin justificación mecánica, alguien está llenando su coche con tu tarjeta.",
        "action": "Cruza los litros repostados con los Km recorridos semanalmente por moto. Audita desviaciones.",
        "order": 57
    },
    {
        "categoryId": "micro",
        "title": "Auditoría de Propinas",
        "content": "Las propinas digitales a veces 'se pierden' antes de llegar al rider. Esto genera desconfianza y robo interno como represalia. La transparencia en propinas es sagrada.",
        "action": "Publica el desglose de propinas digitales recibidas y entregadas mensualmente.",
        "order": 58
    },
    {
        "categoryId": "estrategia",
        "title": "La Trampa del Volumen",
        "content": "Facturar más no es ganar más si tus costes variables se disparan. A veces, rechazar un cliente lejano o poco rentable aumenta tu beneficio neto al final de mes.",
        "action": "Analiza la rentabilidad por cliente. Despide al 10% de clientes menos rentables cada año.",
        "order": 59
    },
    {
        "categoryId": "estrategia",
        "title": "Diversificación de Flota",
        "content": "Depender 100% de motos de gasolina te expone al precio del petróleo. Introducir un 20% de flota eléctrica o bicis de carga para zona centro reduce riesgos y costes.",
        "action": "Prueba piloto con 1 vehículo eléctrico en Zona A para comparar costes reales.",
        "order": 60
    },
    {
        "categoryId": "finanzas",
        "title": "Negociación de Seguros",
        "content": "El seguro es un coste fijo brutal. No aceptes la primera renovación. Al tener más de 5 motos, puedes optar a pólizas de flota con descuentos del 30-40%.",
        "action": "Contacta a un corredor especializado en flotas tres meses antes del vencimiento.",
        "order": 61
    },
    {
        "categoryId": "finanzas",
        "title": "Coste de Oportunidad",
        "content": "¿Cuánto vale tu hora de gerente? Si pasas 2 horas reparando un pinchazo para ahorrar 20€, estás perdiendo dinero. Tu labor es vender y gestionar, no mecánica.",
        "action": "Delega tareas de bajo valor (limpieza, mecánica básica) en cuanto puedas pagarlo.",
        "order": 62
    },
    {
        "categoryId": "operativa",
        "title": "Rotación de Zonas",
        "content": "Los riders se queman si siempre hacen la misma ruta aburrida o la misma ruta difícil (cuestas, sin ascensor). Rotarlos mantiene la frescura y reparte la carga.",
        "action": "Establece un sistema de rotación semanal de zonas preferentes.",
        "order": 63
    },
    {
        "categoryId": "operativa",
        "title": "El Check-in Digital",
        "content": "El inicio de turno es caótico. Usa un formulario digital (Google Forms o App) para que el rider reporte estado de moto, Km y batería al entrar. Sin check-in no hay turno.",
        "action": "Implementa QR en cada moto que lleve al formulario de estado. Obligatorio foto de daños.",
        "order": 64
    },
    {
        "categoryId": "rrhh",
        "title": "El Efecto 'Manzana Podrida'",
        "content": "Un líder negativo (que se queja de todo, incita a trabajar menos) contagia a todo el equipo en semanas. Identifícalo rápido. Si no cambia, debe salir inmediatamente.",
        "action": "Aísla al líder negativo. No le des audiencia pública en reuniones.",
        "order": 65
    },
    {
        "categoryId": "rrhh",
        "title": "Entrevista de Salida",
        "content": "Cuando un buen rider se va, tienes una oportunidad de oro para aprender. ¿Se va por sueldo? ¿Por el trato? ¿Por las motos? Pregunta con humildad real.",
        "action": "Realiza siempre una entrevista de salida confidencial para detectar fallos estructurales.",
        "order": 66
    },
    {
        "categoryId": "seguridad",
        "title": "Conducción Defensiva",
        "content": "En la jungla urbana, tener prioridad no evita el accidente. Asume que los coches NO te ven. El rider debe conducir pensando que es invisible.",
        "action": "Formación: Jamás permanecer en el ángulo muerto de un coche o camión.",
        "order": 67
    },
    {
        "categoryId": "seguridad",
        "title": "Ropa de Alta Visibilidad",
        "content": "El negro es 'cool' pero invisible de noche. El chaleco reflectante no es opcional, es un EPI obligatorio. Un rider atropellado es una tragedia personal y empresarial.",
        "action": "Sanción grave por no llevar el chaleco o llevarlo oculto bajo la mochila.",
        "order": 68
    },
    {
        "categoryId": "eficiencia",
        "title": "Agrupación de Pedidos",
        "content": "Llevar un solo pedido es ineficiente. El arte está en el 'doblete': recoger 2 pedidos de locales cercanos para clientes en la misma dirección vectorial.",
        "action": "Configura Flyder para permitir dobletes solo si el retraso añadido es < 5 min.",
        "order": 69
    },
    {
        "categoryId": "eficiencia",
        "title": "Layout del Local",
        "content": "Si el rider tarda 2 minutos en aparcar, entrar, coger bolsa y salir, pierdes dinero. El flujo en base debe ser tipo 'Pit Stop' de F1. Entrar, cargar, salir.",
        "action": "Diseña la zona de carga cerca de la puerta. Elimina obstáculos.",
        "order": 70
    },
    {
        "categoryId": "comercial",
        "title": "Venta Cruzada en Entrega",
        "content": "El momento de la entrega es publicidad pura. Un folleto de 'Repaart' en la bolsa (si el restaurante lo permite) o una pegatina en el cierre fideliza al cliente final.",
        "action": "Negocia con restaurantes incluir tu branding a cambio de descuento por volumen.",
        "order": 71
    },
    {
        "categoryId": "comercial",
        "title": "Alianzas de Barrio",
        "content": "Tu flota está parada por las mañanas. ¿Quién necesita repartos matinales? Farmacias, floristerías, paquetería local. Rentabiliza las horas valle.",
        "action": "Ofrece tarifas 'Valle' con 40% de descuento para repartos de 10:00 a 13:00.",
        "order": 72
    },
    {
        "categoryId": "cultura",
        "title": "Meritocracia Real",
        "content": "Si el vago cobra lo mismo que el crack, el crack se irá o se volverá vago. Diseña un sistema de bonus variable basado en métricas (puntualidad, 0 incidencias).",
        "action": "Implementa un 'Bonus de Excelencia' mensual de 50€ para el Top 3.",
        "order": 73
    },
    {
        "categoryId": "cultura",
        "title": "Tolerancia al Error",
        "content": "El miedo paraliza. Si castigas brutalmente cada error honesto, nadie tomará iniciativas. Diferencia entre 'error por desidia' (castigo) y 'error por intentar' (aprendizaje).",
        "action": "Celebra el 'Fallo del Mes' del que más se haya aprendido para quitar miedo.",
        "order": 74
    },
    {
        "categoryId": "maestria",
        "title": "Lectura de Patrones",
        "content": "El experto no mira, observa. Detecta que un restaurante está colapsando antes de que lo digan (camareros corriendo, gritos en cocina) y frena la asignación ahí.",
        "action": "Enseña a los riders a reportar 'Testigo de Caos' en restaurantes para ajustar tiempos.",
        "order": 75
    },
    {
        "categoryId": "maestria",
        "title": "Gestión de la Energía",
        "content": "El turno de 4 horas a tope quema. El experto gestiona sus fuerzas. Sabe cuándo apretar (lluvia, partido) y cuándo rodar suave para recuperar.",
        "action": "Fomenta micro-descansos de 2 min tras entregas de alta tensión (pisos sin ascensor).",
        "order": 76
    },
    {
        "categoryId": "tactica",
        "title": "El 'No' al Cliente",
        "content": "El cliente no siempre tiene la razón. Si pide algo ilegal (entrar en casa, comprar tabaco), el rider debe saber decir NO con elegancia y firmeza.",
        "action": "Guiones predefinidos: 'Lo siento, por protocolo de seguridad tengo prohibido...'",
        "order": 77
    },
    {
        "categoryId": "tactica",
        "title": "Uso del Caballete",
        "content": "Parece tonto, pero aparcar con pata de cabra en pendiente es caída segura (y rotura de maneta). El caballete central es obligatorio en paradas de más de 1 minuto.",
        "action": "Instrucción de mecánica básica: Pata de cabra solo para 'parada y sigo' en llano.",
        "order": 78
    },
    {
        "categoryId": "crisis",
        "title": "Robo de Vehículo",
        "content": "Te robarán una moto. Es estadística. Lo importante es la recuperación. El GPS oculto es vital, pero la rapidez de reacción lo es más.",
        "action": "Protocolo Robo: 1. Localizar GPS. 2. Llamar 091. 3. Acudir con copia de llaves (con prudencia).",
        "order": 79
    },
    {
        "categoryId": "crisis",
        "title": "Agresión a Rider",
        "content": "Si un cliente o tercero agrede a un rider, la empresa debe responder con toda su fuerza legal. El rider debe sentirse protegido por una 'maquinaria' superior.",
        "action": "Asistencia jurídica gratuita para el rider en caso de agresión en servicio.",
        "order": 80
    },
    {
        "categoryId": "micro",
        "title": "Limpieza de Mochilas",
        "content": "Una mochila sucia es un foco de bacterias y mala imagen. El cliente ve la mochila antes que la comida. Si huele mal o tiene manchas, pierdes confianza.",
        "action": "Revisión semanal de higiene de mochilas. Pulverizado de alcohol diario obligatorio.",
        "order": 81
    },
    {
        "categoryId": "micro",
        "title": "Orden en el Móvil",
        "content": "Un rider con el soporte del móvil roto o el cable colgando es un peligro. La pantalla debe estar firme y visible a un golpe de vista para no apartar la mirada.",
        "action": "Ten soportes y cables de repuesto en la oficina. No dejes salir a nadie con 'apaños'.",
        "order": 82
    },
    {
        "categoryId": "estrategia",
        "title": "Escalabilidad vs Artesanía",
        "content": "Al principio eres artesano (controlas todo). Para crecer, debes industrializar. Estandariza procesos para que cualquiera con el manual pueda hacerlo.",
        "action": "Si lo explicas más de 3 veces, escríbelo en un procedimiento.",
        "order": 83
    },
    {
        "categoryId": "estrategia",
        "title": "Análisis de Competencia",
        "content": "No ignores a Glovo/Uber. Úsalos. Mira sus tiempos, sus precios dinámicos. Aprende de sus errores y copa los huecos que su algoritmo no cubre (trato personal).",
        "action": "Monitoriza las tarifas de entrega de las Apps en tu zona en días de lluvia.",
        "order": 84
    },
    {
        "categoryId": "finanzas",
        "title": "Amortización de Activos",
        "content": "La moto se gasta. El casco caduca. Debes guardar una provisión mensual para reposición de activos, o en 2 años tendrás chatarra y cero capital.",
        "action": "Calcula la vida útil (ej. moto 3 años) y reserva 1/36 del valor cada mes.",
        "order": 85
    },
    {
        "categoryId": "finanzas",
        "title": "Control de Caja Chica",
        "content": "Los pequeños gastos sin ticket (cafés, propinas) son un agujero negro fiscal y contable. Todo gasto de empresa debe estar justificado o sale de tu bolsillo personal.",
        "action": "Prohibido gastos sin ticket. Usa Apps de escaneo de gastos.",
        "order": 86
    },
    {
        "categoryId": "operativa",
        "title": "Gestión de Lluvia",
        "content": "La lluvia es dinero... y peligro. La demanda se dispara, la velocidad baja. Debes reducir el radio de entrega para mantener tiempos y seguridad.",
        "action": "Activa 'Modo Lluvia': Radio máx 3km y +1€ por pedido al cliente.",
        "order": 87
    },
    {
        "categoryId": "operativa",
        "title": "Batería de Móviles",
        "content": "Sin batería no hay rider. Es la herramienta de trabajo #1. Quedarse sin batería a mitad de turno es falta grave de previsión.",
        "action": "Obligatorio Powerbank cargada personal o puerto USB funcional en la moto.",
        "order": 88
    },
    {
        "categoryId": "rrhh",
        "title": "Gestión de la Frustración",
        "content": "El cliente no contesta, llueve, la moto falla. El rider acumula ira. Enséñales a ventilar esa ira de forma sana y no pagarla con el siguiente cliente.",
        "action": "Técnica de 'Reset': Respirar 10 segundos antes de llamar al siguiente timbre.",
        "order": 89
    },
    {
        "categoryId": "rrhh",
        "title": "Uniformidad e Identidad",
        "content": "El uniforme no solo identifica, protege y une. Un equipo mal uniformado (mezcla de prendas, ropa sucia) parece una banda, no una empresa.",
        "action": "Entrega 2 juegos de uniforme. Exige devolución al finalizar contrato.",
        "order": 90
    },
    {
        "categoryId": "seguridad",
        "title": "Frenada de Emergencia",
        "content": "Pocos saben frenar en mojado sin ABS. El pánico lleva a bloquear rueda y caer. La técnica es progresiva, usando ambos frenos sin bloquear.",
        "action": "Realiza prácticas de frenada en parking vacío un día de lluvia con los novatos.",
        "order": 91
    },
    {
        "categoryId": "seguridad",
        "title": "Fatiga Visual",
        "content": "Tras 6 horas de atención continua, la visión túnel aparece. El rider deja de ver los laterales. Es el momento de mayor riesgo.",
        "action": "Limita los turnos continuos a máximo 4 horas sin descanso real.",
        "order": 92
    },
    {
        "categoryId": "eficiencia",
        "title": "Conocimiento del Portal",
        "content": "Perder 5 minutos buscando el portal 4B en una urbanización gigante mata la media. El saber dónde está la entrada exacta es 'Data' valiosa.",
        "action": "Riders veteranos deben anotar trucos de acceso en las notas de cliente para los nuevos.",
        "order": 93
    },
    {
        "categoryId": "eficiencia",
        "title": "Preparación Pre-Turno",
        "content": "Llegar y salir. Si el rider llega a su hora y tarda 15 min en vestirse, poner soporte, buscar llaves... es tiempo perdido.",
        "action": "El turno empieza 'listo para rodar'. Llegar 10 min antes es la norma no escrita.",
        "order": 94
    },
    {
        "categoryId": "comercial",
        "title": "Recuperación de Cliente",
        "content": "Un cliente enfadado por un retraso se puede recuperar. Un pedido gratis o un descuento agresivo hoy asegura 20 pedidos futuros.",
        "action": "Autoriza a los riders a ofrecer disculpas y 'bonus' inmediato si la cagan.",
        "order": 95
    },
    {
        "categoryId": "comercial",
        "title": "Feedback de Restaurante",
        "content": "El restaurante sabe más del cliente que tú (si le gusta muy hecho, si es alérgico). Escuchar al cocinero te da pistas para mejorar el servicio.",
        "action": "Pregunta al dueño: '¿Qué es lo que más se quejan tus clientes del delivery?' y soluciónalo.",
        "order": 96
    },
    {
        "categoryId": "cultura",
        "title": "Rituales de Entrada",
        "content": "El 'Onboarding' define la lealtad futura. Tirar al novato a la calle el primer día sin explicarle nada es decirle 'no me importas'.",
        "action": "Primer turno: 'Sombra'. Acompaña a un veterano 2 horas sin llevar moto.",
        "order": 97
    },
    {
        "categoryId": "cultura",
        "title": "Celebración de Hitos",
        "content": "1.000 pedidos entregados sin incidencias. 1 año en la empresa. Celebrar estas marcas crea historia y sentido de progreso.",
        "action": "Regalo simbólico (casco mejor, chaqueta pro) al cumplir hitos de permanencia.",
        "order": 98
    },
    {
        "categoryId": "maestria",
        "title": "Anticipación de Tráfico",
        "content": "El maestro no frena, deja de acelerar. Anticipa que el semáforo se pondrá rojo 200m antes. Conducción fluida es igual a rapidez y seguridad.",
        "action": "Premia a quien gaste menos pastillas de freno (indicador de conducción suave).",
        "order": 99
    },
    {
        "categoryId": "maestria",
        "title": "Psicología del Portero",
        "content": "En discotecas o fincas de lujo, el portero es la llave. Tratarlo con respeto y conocer su nombre te abre puertas (literalmente) que a otros les cierran.",
        "action": "Nunca pitar para que abran. Bajar y pedir por favor.",
        "order": 100
    },
    {
        "categoryId": "tactica",
        "title": "Carga de Mochila",
        "content": "Llevar las bebidas tumbadas o las pizzas en vertical es crimen. El uso de separadores y la correcta estiba evita desastres en la primera curva.",
        "action": "Formación práctica de Tetris: Cómo cargar 3 pedidos sin que se mezclen.",
        "order": 101
    },
    {
        "categoryId": "tactica",
        "title": "Puntos Ciegos de GPS",
        "content": "Hay zonas donde el GPS falla o te manda contra dirección. Conocerlas evita vueltas absurdas y multas.",
        "action": "Crea un mapa de 'Zonas Negras' en la oficina con post-its de advertencia.",
        "order": 102
    },
    {
        "categoryId": "crisis",
        "title": "Avería Lejos de Base",
        "content": "Quedarse tirado a 8km. ¿Qué haces? ¿Abandonas la moto? ¿Esperas 2 horas? El plan de rescate debe ser claro.",
        "action": "Si hay otro rider cerca, hace de 'remolque' (ilegal pero efectivo en emergencia) o lleva al piloto a base.",
        "order": 103
    },
    {
        "categoryId": "crisis",
        "title": "Cliente Agresivo",
        "content": "Cliente borracho o violento en la puerta. La integridad del rider es primero. Entregar pedido (o tirarlo) y huir. No cobrar no es el problema.",
        "action": "Lista negra de clientes/direcciones peligrosas. Se deja de servir y punto.",
        "order": 104
    },
    {
        "categoryId": "micro",
        "title": "Presión de Neumáticos",
        "content": "Ruedas bajas = +consumo, -agarre, -velocidad. Es el mantenimiento más barato y más ignorado.",
        "action": "Manómetro en la entrada. Revisión obligatoria cada lunes.",
        "order": 105
    },
    {
        "categoryId": "micro",
        "title": "Ajuste de Espejos",
        "content": "Cada rider tiene una altura. Salir con los espejos del compañero anterior es conducir a ciegas. Ajustar espejos es parte del ritual de arranque.",
        "action": "Checklist de salida: Casco, Guantes, Espejos, Gasolina.",
        "order": 106
    },
    {
        "categoryId": "estrategia",
        "title": "Economía de Escala",
        "content": "Con 2 motos sufres. Con 20 motos, dominas. Los costes fijos se diluyen. El objetivo de la franquicia debe ser alcanzar la 'Masa Crítica' (aprox 8-10 motos) lo antes posible.",
        "action": "Reinversión total de beneficios hasta llegar a la flota crítica.",
        "order": 107
    },
    {
        "categoryId": "estrategia",
        "title": "Especialización de Nicho",
        "content": "¿Sushi o Hamburguesas? El sushi viaja mal, paga bien. Las hamburguesas viajan bien, pagan poco. Elige tu batalla.",
        "action": "Analiza qué tipo de comida predomina en tu zona y adapta tus mochilas.",
        "order": 108
    },
    {
        "categoryId": "finanzas",
        "title": "Ratio de Siniestralidad",
        "content": "Si tienes muchos accidentes, el seguro te echará o subirá la prima un 200%. Un rider accidentado es un coste oculto gigante.",
        "action": "Bonifica a los riders con 0 partes de accidente al año.",
        "order": 109
    },
    {
        "categoryId": "finanzas",
        "title": "Control de Multas",
        "content": "Las multas llegan meses tarde. Identificar quién llevaba la moto tal día a tal hora es una pesadilla administrativa si no tienes registros perfectos.",
        "action": "Registro digital de asignación Moto-Rider por franjas horarias exactas.",
        "order": 110
    },
    {
        "categoryId": "operativa",
        "title": "Zonas de Calor",
        "content": "La demanda se mueve. A las 13:00 oficinas. A las 21:00 residencial. Posicionar la flota estáticamente es ineficiente. La flota debe 'orbitar' hacia donde va a surgir la demanda.",
        "action": "Mueve a los riders en espera hacia las zonas calientes antes de que suene el pedido.",
        "order": 111
    },
    {
        "categoryId": "operativa",
        "title": "Gestión de Propina Digital",
        "content": "A veces la App da propina pero no la ves hasta fin de mes. Adelantarla o no es decisión financiera, pero comunicarla motiva hoy.",
        "action": "Informa al rider de la propina obtenida al cerrar el pedido para subidón de dopamina.",
        "order": 112
    },
    {
        "categoryId": "rrhh",
        "title": "El Salario Emocional",
        "content": "Flexibilidad de turnos para estudiantes o padres. Eso vale dinero. Ofrecer turnos adaptados fideliza más que 50€ extra.",
        "action": "Pregunta preferencias de horario antes de imponer el cuadrante.",
        "order": 113
    },
    {
        "categoryId": "rrhh",
        "title": "Gestión de Conflictos",
        "content": "Roces entre riders por zonas o motos mejores. Córtalo de raíz. Somos un equipo, no rivales. La competencia es externa.",
        "action": "Reunión de mediación inmediata ante cualquier conato de pelea.",
        "order": 114
    },
    {
        "categoryId": "seguridad",
        "title": "Ojo a las Puertas",
        "content": "El enemigo nº1 del rider urbano: la puerta de coche que se abre de golpe. Circular pegado a los coches aparcados es ruleta rusa.",
        "action": "Regla del metro y medio: Sepárate de la fila de aparcados siempre.",
        "order": 115
    },
    {
        "categoryId": "seguridad",
        "title": "Estado del Pavimento",
        "content": "Pintura blanca resbaladiza, tapas de alcantarilla, arena de obra. El suelo cambia. Leer la textura del asfalto evita caídas tontas.",
        "action": "Alerta en grupo de WhatsApp sobre obras o manchas de aceite en la zona.",
        "order": 116
    },
    {
        "categoryId": "eficiencia",
        "title": "Memorización de Códigos",
        "content": "Perder tiempo buscando el código del portal en el móvil cada vez. Los códigos comunes deben estar en la cabeza del rider.",
        "action": "Gamificación: ¿Quién se sabe el código de tal urbanización? Premia la memoria.",
        "order": 117
    },
    {
        "categoryId": "eficiencia",
        "title": "Optimización de Batería",
        "content": "Pantalla al 100% de brillo gasta el doble. Modo oscuro ahorra batería. Pequeños ajustes en el móvil del rider extienden la vida útil del turno.",
        "action": "Configura los móviles de empresa en modo ahorro de energía y modo oscuro.",
        "order": 118
    },
    {
        "categoryId": "comercial",
        "title": "Imagen de Flota",
        "content": "10 motos limpias y alineadas frente al local imponen respeto y marca. 10 motos sucias y tiradas dan pena. La estética vende.",
        "action": "Obligatorio lavar la moto una vez a la semana. Paga el lavado.",
        "order": 119
    },
    {
        "categoryId": "comercial",
        "title": "Trato a la Mascota",
        "content": "Si el cliente tiene perro, ser amable con el perro (sin tocarlo por higiene) gana al dueño para siempre. El detalle humano.",
        "action": "Un 'qué perro más bonito' genera más propina que llegar 1 minuto antes.",
        "order": 120
    },
    {
        "categoryId": "cultura",
        "title": "Lenguaje Interno",
        "content": "Crear jerga propia (ej. 'zona zombie', 'paquete bomba') une al grupo. Sentirse parte de una tribu con su propio código.",
        "action": "No reprimas la jerga operativa, foméntala si es positiva.",
        "order": 121
    },
    {
        "categoryId": "cultura",
        "title": "Mentoring Inverso",
        "content": "A veces el novato joven sabe más de tecnología/Apps que el veterano. Deja que los jóvenes enseñen trucos digitales a los mayores.",
        "action": "Fomenta parejas de trabajo intergeneracionales.",
        "order": 122
    },
    {
        "categoryId": "maestria",
        "title": "El Sexto Sentido",
        "content": "Saber que ese coche va a girar sin poner intermitente solo por cómo se mueve. Eso es experiencia. Se adquiere con kilómetros conscientes.",
        "action": "Comenta jugadas de tráfico peligrosas en el debriefing.",
        "order": 123
    },
    {
        "categoryId": "maestria",
        "title": "Dominio del Clima",
        "content": "No existe mal tiempo, solo ropa inadecuada. El maestro va seco y caliente cuando todos se mojan. Equipamiento técnico de calidad marca la diferencia.",
        "action": "Subvenciona ropa térmica buena. Menos bajas por enfermedad.",
        "order": 124
    },
    {
        "categoryId": "tactica",
        "title": "Uso del Caballete (II)",
        "content": "Para cargar la mochila pesada, la moto debe estar plana. Cargarla inclinada desestabiliza la carga y puede volcar la bebida.",
        "action": "Carga siempre sobre caballete central.",
        "order": 125
    },
    {
        "categoryId": "tactica",
        "title": "La Llave Maestra",
        "content": "Tener copias de llaves de los candados o accesos en lugares estratégicos por si se pierden. Perder una llave no puede parar un turno.",
        "action": "Juego de llaves de repuesto siempre en la caja fuerte del local.",
        "order": 126
    },
    {
        "categoryId": "crisis",
        "title": "Fallo de App",
        "content": "Se cae el sistema. ¿Qué hacemos? Vuelta al papel y boli. Talonarios de albaranes manuales siempre listos.",
        "action": "Simulacro de 'Caída de Sistema' una vez al año. ¿Saben operar sin móvil?",
        "order": 127
    },
    {
        "categoryId": "crisis",
        "title": "Retención Policial",
        "content": "Paran a un rider. Papeles, seguro, ITV. Todo debe estar en una carpeta plastificada en la moto. Si falta un papel, moto inmovilizada.",
        "action": "Revisión mensual de que la documentación de la moto sigue ahí.",
        "order": 128
    },
    {
        "categoryId": "micro",
        "title": "Luces Fundidas",
        "content": "Una luz fundida es multa y peligro. Cambiar una bombilla cuesta 2€ y 5 minutos. No hacerlo es negligencia.",
        "action": "Stock de bombillas en el local. Se cambian al momento.",
        "order": 129
    },
    {
        "categoryId": "micro",
        "title": "Holgura de Frenos",
        "content": "Las manetas se destensan. Ajustar la tensión del freno es seguridad básica. Si la maneta toca el puño, no frena.",
        "action": "Enseña a tensar frenos con la rosca manual.",
        "order": 130
    },
    {
        "categoryId": "estrategia",
        "title": "Planificación Anual",
        "content": "El delivery es estacional. En invierno facturas el doble que en verano. Guarda en invierno para comer en verano. No gastes todo en enero.",
        "action": "Crea un 'Fondo de Estacionalidad' para los meses flacos (julio/agosto).",
        "order": 131
    },
    {
        "categoryId": "estrategia",
        "title": "Alianzas con Talleres",
        "content": "No seas un cliente más. Sé un socio. Negocia prioridad en reparaciones con un taller cercano a cambio de fidelidad. Tu moto no puede hacer cola.",
        "action": "Busca taller que ofrezca 'moto de cortesía' o reparación express.",
        "order": 132
    },
    {
        "categoryId": "finanzas",
        "title": "Control de Efectivo",
        "content": "Si cobras en efectivo, el cuadre de caja diario es sagrado. El dinero vuela. Sobres cerrados, conteo doble.",
        "action": "Cierre de caja obligatorio al terminar turno delante de responsable.",
        "order": 133
    },
    {
        "categoryId": "finanzas",
        "title": "Coste de Reclutamiento",
        "content": "Cada rider nuevo cuesta dinero (ropa, formación, alta). Retener es más barato que fichar. Calcula cuánto te cuesta cada baja.",
        "action": "Invierte el 50% de lo que te costaría fichar en un bonus de retención.",
        "order": 134
    },
    {
        "categoryId": "operativa",
        "title": "Gestión de Bajas Medicas",
        "content": "El absentismo 'falso' de fin de semana. Patrón sospechoso de bajas los viernes. Requiere seguimiento estricto y mutua.",
        "action": "Visita de control o llamada de preocupación genuina (que también fiscaliza).",
        "order": 135
    },
    {
        "categoryId": "operativa",
        "title": "Overbooking Controlado",
        "content": "Vender más capacidad de la que tienes. Arriesgado pero rentable si sabes gestionar los picos. Jugar al límite de la capacidad.",
        "action": "Solo haz overbooking si tienes capacidad de reacción (riders de guardia).",
        "order": 136
    },
    {
        "categoryId": "rrhh",
        "title": "Formación Continua",
        "content": "El rider que no aprende se aburre. Cursos de seguridad, de mecánica, de atención al cliente. Dales valor curricular.",
        "action": "Viernes de formación: 15 min de charla técnica antes, pizzas después.",
        "order": 137
    },
    {
        "categoryId": "rrhh",
        "title": "Plan de Carrera",
        "content": "De Rider a Jefe de Equipo a Encargado. Mostrar un camino de ascenso motiva a los ambiciosos.",
        "action": "Publica el organigrama y los requisitos para subir de nivel.",
        "order": 138
    },
    {
        "categoryId": "seguridad",
        "title": "Respeto al Peatón",
        "content": "La acera es lava. Invadir acera para atajar da mala imagen y multas. El rider profesional respeta al más débil.",
        "action": "Prohibición absoluta de circular por aceras, ni con motor apagado.",
        "order": 139
    },
    {
        "categoryId": "seguridad",
        "title": "Uso del Móvil",
        "content": "Mirar el GPS en marcha es accidente. Se mira parado, se memoriza el tramo, se avanza. Audio-guía mejor que visual.",
        "action": "Configura el GPS para instrucciones por voz al auricular (un solo oído).",
        "order": 140
    },
    {
        "categoryId": "eficiencia",
        "title": "Rutas Circulares",
        "content": "Evita ir y volver por el mismo sitio si puedes hacer un círculo que te deje en otra zona de demanda. Optimiza el flujo.",
        "action": "Planifica la vuelta a base pasando por zonas de recogida potenciales.",
        "order": 141
    },
    {
        "categoryId": "eficiencia",
        "title": "Velocidad vs Prisa",
        "content": "Correr no es llegar antes. Fluidez es llegar antes. Los acelerones y frenazos solo gastan. Mantener velocidad media constante es la clave.",
        "action": "El rider 'lento' pero constante suele tener mejores medias que el 'loco'.",
        "order": 142
    },
    {
        "categoryId": "comercial",
        "title": "Detalle en Lluvia",
        "content": "Entregar la bolsa seca. Llevar un trapo para secar la bolsa antes de dársela al cliente. Ese detalle marca la diferencia premium.",
        "action": "Trapo de microfibra en cada moto para días de lluvia.",
        "order": 143
    },
    {
        "categoryId": "comercial",
        "title": "Saludo Personalizado",
        "content": "Mirar el nombre del cliente en el ticket. 'Aquí tiene su cena, Ana'. Rompe la barrera del anonimato.",
        "action": "Obligatorio usar el nombre del cliente al entregar.",
        "order": 144
    },
    {
        "categoryId": "cultura",
        "title": "Humildad del Líder",
        "content": "El gerente también reparte si hace falta. Que te vean coger una moto en un pico de faena gana más respeto que 100 discursos.",
        "action": "Una vez al mes, haz un turno de reparto real con ellos.",
        "order": 145
    },
    {
        "categoryId": "cultura",
        "title": "Transparencia de Errores",
        "content": "Si la empresa se equivoca (nómina mal, turno mal), pide perdón públicamente y compensa. Ocultar errores directivos rompe la confianza.",
        "action": "Admite tus errores rápido y corrígelos con intereses.",
        "order": 146
    },
    {
        "categoryId": "maestria",
        "title": "Zen en el Caos",
        "content": "Viernes noche, lluvia, todo pita. El maestro mantiene la calma. Si el líder se pone nervioso, el equipo colapsa. Tu calma es su calma.",
        "action": "Técnicas de control de voz y respiración en momentos de estrés máximo.",
        "order": 147
    },
    {
        "categoryId": "maestria",
        "title": "Visión Periférica",
        "content": "Ver lo que no pasa. Una pelota que sale rodando implica un niño detrás. Anticiparse al error ajeno te salva la vida.",
        "action": "Entrena la mirada a 50 metros, no a 5 metros.",
        "order": 148
    },
    {
        "categoryId": "tactica",
        "title": "Gestión de llaves",
        "content": "Llavero retráctil amarrado al pantalón. Jamás poner las llaves sobre el mostrador o el asiento. Se pierden u olvidan.",
        "action": "Dota de llaveros extensibles a todos. Llaves siempre pegadas al cuerpo.",
        "order": 149
    },
    {
        "categoryId": "tactica",
        "title": "Cierre de Jornada",
        "content": "No te vas hasta que la moto está lista para mañana (llena, limpia, cargada). Dejar problemas para el turno de mañana es falta de compañerismo.",
        "action": "Checklist de cierre tan importante como el de apertura.",
        "order": 150
    }
];

async function seedEncyclopedia() {
    console.log('🌱 Iniciando seed completo de Encyclopedia (150 módulos)...\n');

    try {
        // 1. Categorías
        console.log('📁 Creando 12 categorías...');
        for (const cat of categories) {
            await setDoc(doc(db, 'encyclopedia_categories', cat.id), {
                ...cat,
                createdAt: new Date()
            });
            console.log(`  ✓ ${cat.name}`);
        }

        // 2. Módulos
        console.log('\n📚 Creando 150 módulos...');
        let count = 0;
        for (const mod of modules) {
            const docRef = doc(collection(db, 'encyclopedia_modules'));
            await setDoc(docRef, {
                ...mod,
                createdAt: new Date()
            });
            count++;
            if (count % 10 === 0) console.log(`  ✓ ${count}/150 módulos cargados...`);
        }
        console.log(`  ✓ ${modules.length} módulos completados`);

        console.log('\n✅ Encyclopedia inicializada correctamente!');
        console.log(`\n📊 Resumen:`);
        console.log(`   - ${categories.length} categorías`);
        console.log(`   - ${modules.length} módulos`);
        console.log('\n🎓 Ahora ve a Academy → Encyclopedia\n');

        console.log('🏁 Proceso finalizado.');
        if (typeof process !== 'undefined' && process.exit) {
            process.exit(0);
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        if (typeof process !== 'undefined' && process.exit) {
            process.exit(1);
        }
    }
}

seedEncyclopedia();
