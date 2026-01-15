
export const COURSE_MODULES_DATA = [
    {
        id: 'module-finance',
        title: 'Pilar 1: Ingeniería Financiera y Estrategia Tributaria',
        description: 'Programa Ejecutivo: Arquitectura de Costes, Disciplina Fiscal (IVA/IRPF) y Valoración de Activos.',
        order: 1,
        duration: '2h 30min',
        lessons: [
            {
                id: 'less-fin-1',
                title: 'Fundamentos de Economía Logística',
                content: `
# Fundamentos de Economía Logística y CAPEX vs OPEX

**Objetivo Ejecutivo:** Dominar la estructura de capital y entender por qué la mayoría de franquicias mueren por confusión contable, no por falta de ventas.

### 1. CAPEX (Capital Expenditure) vs OPEX (Operating Expenditure)
Entender esta diferencia es vital para no descapitalizarse.
*   **CAPEX (Inversión):** Compra de Motos, Fianza de Local, Licencias. Es dinero que sale "de golpe" pero se amortiza en años.
*   **OPEX (Gasto Recurrente):** Gasolina, Nóminas, Renting mensual. Se paga con la caja del mes.
*   **Error Fatal:** Usar la caja operativa (OPEX) para financiar expansiones (CAPEX) sin tener reservas.

### 2. La Regla del "No-Go" (700 Pedidos)
Basado en datos de 500 franquicias:
*   Arrancar con < 300 pedidos = Muerte por Coste Fijo en 3 meses.
*   Punto de Equilibrio Real (Break-even): **700 pedidos/mes**.
*   Zona de Rentabilidad (Profit Zone): > 1.200 pedidos/mes.
*   **Directriz:** No active la flota operativa hasta tener pre-contratos por valor de 700 envíos.

### 3. Anatomía del Coste por Pedido (Unit Economics)
Si cobras 5.00€ por reparto, ¿cuánto ganas?
*   Coste Rider (25 min): -3.50€
*   Gasolina/Moto: -0.40€
*   Software/Seguro: -0.10€
*   **Margen Bruto Real:** 1.00€.
*   *Lección:* Necesitas volumen masivo. El delivery es un negocio de "centavos repetidos millones de veces".
                `,
                order: 1,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué es OPEX?",
                            options: ["Operación Extranjera", "Gastos Operativos Recurrentes (Nóminas, Gasolina)", "Compras de Activos", "Beneficio"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Cuál es el volumen mínimo de seguridad para arrancar?",
                            options: ["100 pedidos", "300 pedidos", "700 pedidos", "2000 pedidos"],
                            correctAnswer: 2,
                            type: "single-choice"
                        },
                        {
                            question: "¿Es el delivery un negocio de alto margen unitario?",
                            options: ["Sí, se gana mucho por pedido", "No, es un negocio de volumen y márgenes ajustados", "Depende del clima", "Solo si cobras propina"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-fin-2',
                title: 'Gestión de Liquidez y Disciplina Fiscal (IVA/IRPF)',
                content: `
# Gestión de Liquidez y Disciplina Fiscal

**Objetivo Ejecutivo:** Evitar la quiebra técnica por mala gestión tributaria.

### 1. EL ESPEJISMO FISCAL: "El Dinero del Banco NO es Tuyo"
Este es el motivo #1 de cierre de franquicias rentables.
*   **El Fenómeno:** Facturas 10.000€ + IVA (2.100€). Total ingreso: 12.100€.
*   **El Error:** Pensar que tienes 12.100€ para gastar.
*   **La Realidad:** Esos 2.100€ son del Estado. Tú eres un mero recaudador temporal. Si te los gastas en motos o sueldos, cuando llegue el trimestre (Modelo 303), estarás muerto.

### 2. Estrategia de la "Cuenta Intocable" (Tax Vault)
Protocolo de supervivencia financiera:
*   Abrir una segunda cuenta bancaria bloqueada.
*   Transferir automáticamente el **21% de cada factura cobrada** (IVA) y el **15% de cada nómina** (IRPF/Seguros Sociales) a esta cuenta.
*   Prohibido tocar ese dinero bajo pena de despido del gerente.

### 3. El ciclo del "Valle de la Muerte"
Los cobros (Restaurantes pagan a 30 días) vs Pagos (Nóminas/Gasolina son inmediatos).
*   *Necesitas Fondo de Maniobra:* Mínimo 2 meses de costes operativos en caja antes de empezar. Sin esto, la primera nómina impagada destruirá tu equipo.

**Axioma:** La falta de beneficio te mata en un año; la falta de caja te mata mañana.
                `,
                order: 2,
                quiz: {
                    questions: [
                        {
                            question: "Si cobras una factura de 1.210€ (1.000 + 210 IVA), ¿cuánto dinero real tienes?",
                            options: ["1.210€", "1.000€ (El resto es deuda con Hacienda)", "Lo que quiera", "1.100€"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Cuál es la 'Estrategia de la Cuenta Intocable'?",
                            options: ["No gastar nada", "Apartar automáticamente los impuestos (IVA/IRPF) a una cuenta separada al cobrar", "Esconder el dinero", "Invertir en bolsa"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué mata a una empresa más rápido?",
                            options: ["Falta de beneficio", "Falta de liquidez (Caja)", "Falta de clientes", "Mal marketing"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-fin-3',
                title: 'Ingeniería de Tarifas y Rentabilidad',
                content: `
# Ingeniería de Tarifas y Rentabilidad

**Objetivo Ejecutivo:** Diseñar una estructura de precios que maximice el margen y penalice la ineficiencia.

### 1. La Trampa de la Distancia
Un pedido a 6km destruye tu rentabilidad operativa.
*   *Tiempo de Ciclo:* 45 min ida/vuelta.
*   *Capacidad:* Rider bloqueado -> 1.3 pedidos/hora.
*   *Solución:* **Tarificación Exponencial**. Zona 1 (0-3km) tarifa plana. Zona 2 (>3km) recargo disuasorio de +1€/km. El objetivo no es cobrar más, es que **no te pidan** lejos.

### 2. Densidad (Mancha de Aceite)
La rentabilidad está en la densidad, no en la extensión.
*   Es mejor tener 10 clientes en 1km² que 50 clientes en 10km².
*   *Estrategia:* Rechaza clientes aislados que te obliguen a dispersar la flota. "No podemos dar servicio de calidad en esa zona todavía".

### 3. Valoración de Empresa y Exit
¿Cómo se valora tu franquicia si quieres venderla?
*   Se valora por **EBITDA x Múltiplo** (generalmente 4x o 5x).
*   Una franquicia con operativa documentada y gerente autónomo vale el doble que una donde el dueño tiene que estar 12 horas trabajando.

**Lección:** Construye el negocio para venderlo, aunque no quieras venderlo. Eso te obligará a hacerlo eficiente y autónomo.
                `,
                order: 3,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es el objetivo del recargo por distancia?",
                            options: ["Hacerse rico", "Desincentivar pedidos ineficientes lejanos que bloquean al rider", "Castigar al cliente", "Nada"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Por qué rechazar un cliente aislado?",
                            options: ["Por antipatía", "Porque dispersa la flota y reduce la densidad operativa (Pedidos/Hora)", "Por pereza", "No se rechaza nunca"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Cómo se maximiza el valor de venta (Exit)?",
                            options: ["Trabajando mucho", "Creando una operativa autónoma y rentable (EBITDA positivo)", "Teniendo muchas motos", "Con publicidad"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            }
        ]
    },
    {
        id: 'module-ops',
        title: 'Pilar 2: Excelencia Operativa y Logística de Precisión',
        description: 'Programa Ejecutivo: Metodología Lean Logistics. Infraestructura, optimización algorítmica y gestión de crisis.',
        order: 2,
        duration: '2h 15min',
        lessons: [
            {
                id: 'less-ops-1',
                title: 'Infraestructura de Flota y Gestión de Activos',
                content: `
# Infraestructura de Flota y Gestión de Activos

**Objetivo Ejecutivo:** Diseñar una estrategia de activos que maximice el tiempo de actividad (Uptime) y minimice el coste por kilómetro.

### 1. Modelos de Propiedad: The Asset Matrix
La decisión entre Renting, Leasing o Propiedad no es emocional, es financiera y operativa.

*   **Renting Full-Service (Opción Recomendada):** Transforma CAPEX en OPEX.
    *   *Pros:* Coste predecible, mantenimiento incluido, vehículo de sustitución.
    *   *Contras:* Coste total más alto a largo plazo si no hay incidencias (rara vez ocurre).
    *   *KPI:* Disponibilidad de Flota > 98%.
*   **Propiedad:** Alto riesgo operativo.
    *   *Riesgo:* Una avería mayor o siniestro total impacta directamente al P&L y puede paralizar el servicio si no hay backup.

### 2. Mantenimiento Preventivo Total (TPM)
Implementar cultura de "Cero Averías no Planificadas".
*   **Inspección Pre-Vuelo (Pre-Flight Check):** Protocolo obligatorio diario de 2 minutos. (Frenos, Luces, Neumáticos).
*   **Gestión de Ciclo de Vida:** La vida útil económica de una moto de reparto es de 25.000km. Más allá de eso, el coste de mantenimiento supera al de sustitución.

### 3. Gestión de Inventarios Críticos
La rotura de stock de un activo menor (batería, casco, caja térmica) puede detener un activo mayor (moto/rider).
*   **Stock de Seguridad:** Mantener siempre un 10% de excedente en equipamiento crítico (EPIS, Powerbanks, Cajas).

**Directriz:** La flota no son "motos", son unidades de producción de ingresos. Una moto parada es una fábrica cerrada.
                `,
                order: 1,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es el principal beneficio del Renting Full-Service en logística?",
                            options: ["Es más barato siempre", "Convierte CAPEX en OPEX predecible y garantiza disponibilidad", "Las motos corren más", "No pagas impuestos"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué es el TPM (Mantenimiento Preventivo Total)?",
                            options: ["Reparar cuando se rompe", "Cultura de prevención para evitar averías no planificadas", "Comprar motos nuevas cada mes", "Un seguro"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Cuándo termina la vida útil económica de una moto de reparto intensivo?",
                            options: ["A los 5 años", "Cuando el coste de mantenimiento supera al de sustitución (aprox 25k km)", "Nunca", "A los 1000km"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-ops-2',
                title: 'Estandarización de Procesos (SOPs)',
                content: `
# Estandarización de Procesos (SOPs)

**Objetivo Ejecutivo:** Convertir la operación en una ciencia replicable mediante Procedimientos Operativos Estándar (Standard Operating Procedures). Eliminación de la variabilidad humana.

### 1. La Cadena de Custodia
El servicio de delivery es una carrera de relevos donde el testigo (producto) no puede caer al suelo.

*   **Fase 1: Handshake en Restaurante:** Verificación visual de sellado y completitud. El rider actúa como auditor de calidad final. "Si no está sellado, no existe".
*   **Fase 2: Estibado de Carga:** Ingeniería de carga. Separación térmica (frío/caliente) y estabilización gravitatoria. Un volcado de carga no es un accidente, es negligencia.
*   **Fase 3: La "Última Yarda":** Protocolo de entrega en puerta. Retirada de casco (seguridad subjetiva del cliente) y entrega a dos manos.

### 2. Gestión del Tiempo de Ciclo
Cada minuto improductivo erosiona el margen.
*   **Tiempos Muertos en Restaurante:** Si la espera > 7 min, se debe notificar a Central para reasignación o compensación.
*   **Tiempos Muertos en Cliente:** Protocolo de "No Respuesta".
    1.  Llamada (min 0).
    2.  Timbre/Interfono (min 1).
    3.  Aviso a Soporte (min 3).
    4.  Retirada y Devolución (min 5).

### 3. Higiene y Seguridad Alimentaria
Cumplimiento estricto de normativa APPCC.
*   Limpieza diaria de cajas térmicas con virucidas.
*   Prohibición absoluta de contacto directo rider-alimento.

**Filosofía:** "Excellence is not an act, but a habit". Los SOPs no son sugerencias, son la ley interna de la compañía.
                `,
                order: 2,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es el rol del rider en el restaurante según el SOP?",
                            options: ["Esperar fuera", "Auditor de calidad final (verificar sellado)", "Ayudar en cocina", "Pedir comida gratis"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué se debe hacer si el tiempo de espera en restaurante supera los 7 minutos?",
                            options: ["Esperar pacientemente", "Discutir con el camarero", "Notificar a Central por ineficiencia operativa", "Irse a casa"],
                            correctAnswer: 2,
                            type: "single-choice"
                        },
                        {
                            question: "¿Por qué es crítica la estiba de carga?",
                            options: ["Para que quepa más", "Para evitar volcados y mezclas térmicas (Integridad del producto)", "Por estética", "No es importante"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-ops-3',
                title: 'Optimización Algorítmica de Rutas',
                content: `
# Optimización Algorítmica de Rutas

**Objetivo Ejecutivo:** Aplicar lógica matemática para maximizar la densidad de entregas y reducir los kilómetros en vacío (Dead Mileage).

### 1. El Coste del Kilómetro Vacío
Cada kilómetro recorrido sin carga es una pérdida neta de recursos (tiempo + combustible + depreciación).
*   *Objetivo:* Reducir el ratio de KM Vacíos por debajo del 25% del total.

### 2. Estrategias de Asignación (Dispatching)
Más allá del "Primero en entrar, primero en salir" (FIFO), existen estrategias avanzadas:
*   **Estrategia de Enjambre (Swarm):** Mantener a los riders orbitando en zonas de alta densidad (Hotspots) en lugar de dispersarlos.
*   **Encadenamiento (Chaining):** Asignar una recogida *antes* de que el rider complete su entrega actual, basándose en su trayectoria vectorial.
*   **Mancha de Aceite:** Expandir el radio de operación solo cuando la zona central está saturada eficientemente.

### 3. Gestión de Picos de Demanda (Peak Shaving)
Cuando la demanda supera la capacidad:
1.  **Reducción de Radio:** Cortar temporalmente entregas a >3km para aumentar la frecuencia de rotación de la flota.
2.  **Agrupación Forzosa (Batching):** Obligar al sistema a agrupar 2-3 pedidos por rider, sacrificando ligeramente el tiempo de entrega individual por el volumen global.

**Análisis:** La eficiencia logística no se logra corriendo más, sino recorriendo menos distancia para el mismo resultado.
                `,
                order: 3,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué es el 'Dead Mileage'?",
                            options: ["Millas muertas", "Kilómetros recorridos sin carga (improductivos)", "Kilómetros de noche", "Rutas peligrosas"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿En qué consiste la estrategia de 'Encadenamiento'?",
                            options: ["Atar las motos", "Asignar la siguiente tarea antes de terminar la actual para eliminar tiempos muertos", "Hacer cadena humana", "Ir en grupo"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué hacer ante un pico de demanda extremo?",
                            options: ["Cerrar la app", "Reducir radio de acción y forzar agrupación (Batching)", "Contratar más gente en ese instante", "Gritar"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-ops-4',
                title: 'Gestión de Crisis y Resiliencia',
                content: `
# Gestión de Crisis y Resiliencia Operativa

**Objetivo Ejecutivo:** Liderar situaciones de alta presión y fallo sistémico. Protocolos de continuidad de negocio.

### 1. La Matriz de Riesgos
Clasificación de incidentes según impacto y probabilidad.
*   **Cisnes Negros:** Eventos de baja probabilidad pero impacto catastrófico (Accidente mortal, redada policial, caída total de servidores).
*   **Ruido Operativo:** Eventos frecuentes de bajo impacto (Pinchazo, lluvia ligera, error en pedido).

### 2. Protocolos de Respuesta Rápida (QRF)
*   **Accidente Grave:** Activación de Cadena de Mando.
    1.  Prioridad Absoluta: Integridad humana (Rider/Terceros).
    2.  Soporte Legal/Seguros inmediato.
    3.  Gestión de Prensa/Redes Sociales (Contención de daños reputacionales).
*   **Caída Tecnológica:** Paso a procedimiento analógico de emergencia (Papel y teléfono). El servicio no se detiene porque falle la pantalla.

### 3. Resiliencia Psicológica del Equipo
En noches de tormenta y colapso, el equipo mira al líder.
*   *Liderazgo en Crisis:* Calma visible, instrucciones cortas y precisas. No buscar culpables durante el fuego, solo soluciones.
*   *Post-Mortem:* Análisis forense del incidente al día siguiente para evitar recurrencia.

**Directriz:** La calidad de un sistema logístico se mide por su capacidad de recuperación ante el fallo, no por la ausencia de fallos.
                `,
                order: 4,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es la prioridad absoluta en un accidente grave?",
                            options: ["Salvar la moto", "Salvar la comida", "Integridad humana y soporte legal/médico", "Borrar la app"],
                            correctAnswer: 2,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué es un 'Post-Mortem' en gestión?",
                            options: ["Un funeral", "Análisis forense del incidente para evitar que se repita", "Un informe de autopsia", "Una fiesta"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-ops-5',
                title: 'Logística Predictiva y Big Data',
                content: `
# Logística Predictiva y Big Data

**Objetivo Ejecutivo:** Transición de un modelo reactivo ("Apagar fuegos") a un modelo proactivo ("Predecir incendios").

### 1. Forecasting de Demanda
Uso de series temporales históricas para dimensionar la flota.
*   *Variables:* Día de la semana, Clima, Eventos Deportivos, Festivos, Nómina (principio de mes).
*   *Output:* Planificación de turnos (Rostering) con precisión de +/- 5%. Evitar el "Overstaffing" (coste innecesario) y el "Understaffing" (pérdida de ventas).

### 2. Pre-Posicionamiento de Flota
Si los datos indican que el viernes a las 21:00 aumenta un 40% la demanda en el Distrito Centro:
*   Mover preventivamente la flota ociosa hacia ese centro de gravedad *antes* de que entren los pedidos.
*   Reducción del tiempo de recogida (Pickup Time) en un 50%.

### 3. KPIs Predictivos
Indicadores que avisan del colapso antes de que ocurra:
*   **Ratio de Aceptación:** Si baja del 90%, el sistema se está saturando.
*   **Tiempo de Asignación:** Si sube de 30s a 2 min, falta flota inminente.

**Visión:** El operador experto no espera a que suene el teléfono. Ya sabe que va a sonar.
                `,
                order: 5,
                quiz: {
                    questions: [
                        {
                            question: "¿Para qué sirve el Forecasting de Demanda?",
                            options: ["Para adivinar el futuro", "Para dimensionar la flota eficientemente (evitar exceso/falta de personal)", "Para saber si lloverá", "Para apostar"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué es el Pre-Posicionamiento?",
                            options: ["Aparcar bien", "Mover la flota a zonas de demanda esperada ANTES de que ocurra", "Ir a casa antes", "Llegar tarde"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-ops-6',
                title: 'Escalabilidad Multi-Zona',
                content: `
# Escalabilidad Multi-Zona

**Objetivo Ejecutivo:** Gestión simultánea de múltiples hubs operativos. De la micro-gestión a la gestión de clústers.

### 1. El Reto de la Escala
Lo que funciona con 10 motos falla con 100.
*   *Cuello de botella:* La supervisión humana directa.
*   *Solución:* Descentralización y jerarquía. Creación de la figura del **Area Manager**.

### 2. Estandarización Total (McDonald's Model)
La operativa en la Zona Norte debe ser idéntica a la Zona Sur.
*   Protocolos unificados de contratación, formación y disciplina.
*   Sistemas de reporte homogéneos. Si cada hub reporta diferente, la comparativa es imposible.

### 3. Economías de Escala Operativas
Ventajas competitivas del volumen:
*   **Flota Flotante:** Capacidad de mover recursos entre zonas adyacentes según picos de demanda asimétricos.
*   **Poder de Compra:** Negociación centralizada de seguros, combustible y vehículos.

**Estrategia:** Crecer no es simplemente "hacerse más grande", es hacerse más eficiente. Si el crecimiento aumenta la complejidad administrativa más rápido que los ingresos, es un crecimiento tóxico.
                `,
                order: 6,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es el principal cuello de botella al escalar?",
                            options: ["Falta de gasolina", "Supervisión humana directa (Micro-gestión)", "Falta de espacio", "El clima"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué permite la 'Flota Flotante' entre zonas?",
                            options: ["Que las motos naden", "Mover recursos entre zonas para cubrir picos de demanda asimétricos", "Perder motos", "Nada"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            }
        ]
    },
    {
        id: 'module-tech',
        title: 'Pilar 3: Ecosistema Tecnológico y Transformación Digital',
        description: 'Programa Ejecutivo: Business Intelligence, Integración API y Ciberseguridad Logística.',
        order: 3,
        duration: '2h 00min',
        lessons: [
            {
                id: 'less-tech-1',
                title: 'Arquitectura del Ecosistema Flyder',
                content: `
# Arquitectura del Ecosistema Flyder

**Objetivo Ejecutivo:** Comprender la tecnología no como una app, sino como el sistema nervioso central de la empresa.

### 1. Componentes del Stack Tecnológico
Flyder no es monolítico. Se compone de tres capas interconectadas:
*   **The Brain (Dispatch Algorithm):** El motor de decisiones en la nube. Asigna pedidos basándose en costes, tiempo y ubicación.
*   **The Command Center (Web App):** Tu panel de control. Visibilidad total de la flota, mapa de calor y gestión de usuarios.
*   **The Edge (Rider App):** La terminal del trabajador. GPS, pruebas de entrega (POD) y comunicación.

### 2. Flujo de Datos en Tiempo Real
La latencia es el enemigo.
*   La posición GPS se actualiza cada 5-10 segundos.
*   Los estados del pedido (Aceptado, En Cocina, Recogido, Entregado) son los *inputs* que alimentan el algoritmo. Un status falso ("He llegado" cuando no has llegado) corrompe la inteligencia del sistema.

### 3. La Nube como Auditor
Flyder registra cada milisegundo.
*   *Auditoría Forense:* ¿Por qué llegó tarde el pedido? El sistema dirá si fue cocina lenta (Waiting Time), rider lento (Transit Time) o ruta ineficiente. Se acabaron las excusas; solo existen los datos.

**Visión:** Usted no gestiona motos, gestiona información. Las motos son solo el medio físico para ejecutar una instrucción digital.
                `,
                order: 1,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué hace el 'Brain' o algoritmo de despacho?",
                            options: ["Dibuja mapas", "Toma decisiones de asignación basadas en variables (coste, tiempo)", "Cobra a los clientes", "Nada"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Por qué es crítico marcar los estados (Status) correctamente?",
                            options: ["Por burocracia", "Porque son los inputs que alimentan la inteligencia del sistema; datos falsos corrompen la optimización", "Para que el cliente no se queje", "Por diversión"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-tech-2',
                title: 'Interoperabilidad e Integraciones API',
                content: `
# Interoperabilidad e Integraciones API

**Objetivo Ejecutivo:** Automatizar el flujo de pedidos desde el agregador hasta la rueda de la moto. Eliminación del "Re-typing".

### 1. El Problema de la "Torre de Babel"
Un restaurante puede recibir pedidos de Uber, Glovo, JustEat y su propia web.
*   *Sin integración:* El personal debe copiar manualmente el pedido de la tablet al sistema de reparto. Error humano garantizado y retraso de 2-5 minutos.
*   *Con integración (Middleware):* El pedido fluye directo al TPV y a Flyder.

### 2. Webhooks y APIs
*   **API (Application Programming Interface):** El lenguaje universal para que las máquinas hablen.
*   **Integración Flyder:** Permite conectar tu flota a e-commerce externos (Shopify, Woocommerce) o agregadores de delivery (Deliverect, Sinqro).

### 3. Ventaja Competitiva Tecnológica
Vender integración es vender eficiencia.
*   *Argumento B2B:* "Conéctese a nuestra API y sus pedidos de JustEat saltarán automáticamente a nuestros riders. Ahorre 1 operario de sala dedicado a transcribir tickets."

**Estrategia:** La integración crea "Sticky Sticky" (Adherencia). Un cliente integrado tecnológicamente es mucho más difícil que se vaya a la competencia.
                `,
                order: 2,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué problema resuelve la integración API?",
                            options: ["Hace la comida más rica", "Elimina la entrada manual de pedidos (Re-typing) y errores humanos", "Baja el precio de la gasolina", "Aumenta los impuestos"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué es el 'Sticky Sticky' o adherencia tecnológica?",
                            options: ["Pegamento", "La dificultad del cliente para cambiar de proveedor una vez integrado sus sistemas", "Un postre", "Un tipo de cinta"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-tech-3',
                title: 'Business Intelligence (BI) y Analytics',
                content: `
# Business Intelligence (BI) y Analytics

**Objetivo Ejecutivo:** Transformar datos brutos en decisiones estratégicas (Data-Driven Decision Making).

### 1. Jerarquía de Métricas
No todos los números importan igual.
*   **Métricas de Vanidad:** Nº Total de Pedidos, Facturación Bruta. (Te hacen sentir bien, pero no indican salud).
*   **Métricas de Acción:** Coste por Entrega, Tiempo de Espera en Restaurante, % de Ocupación. (Te dicen qué corregir).

### 2. Dashboards de Control
Configuración de paneles para dirección:
*   *Dashboard Operativo (Tiempo Real):* ¿Qué está pasando AHORA? (Mapas de calor, alertas de retraso).
*   *Dashboard Táctico (Semanal):* Desempeño por Rider, Rentabilidad por Cliente.
*   *Dashboard Estratégico (Mensual):* Tendencias macro, LTV (Lifetime Value), Churn Rate (Tasa de cancelación).

### 3. Análisis de Cohortes
Entender el comportamiento de grupos específicos a lo largo del tiempo.
*   *Ejemplo:* ¿Los riders contratados en Enero son más productivos que los de Marzo? ¿Por qué? ¿Cambió el proceso de selección?

**Cultura de Datos:** En Dios confiamos; todos los demás deben traer datos. (W. Edwards Deming).
                `,
                order: 3,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué diferencia una métrica de vanidad de una de acción?",
                            options: ["El color", "La de vanidad solo hincha el ego; la de acción permite tomar decisiones correctivas", "La de acción es más difícil de calcular", "Ninguna"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué es un Dashboard Operativo?",
                            options: ["Un informe anual", "Un panel de control en tiempo real para gestionar el 'ahora'", "Una hoja de excel antigua", "Un videojuego"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-tech-4',
                title: 'Ciberseguridad y Compliance (RGPD)',
                content: `
# Ciberseguridad y Compliance (RGPD)

**Objetivo Ejecutivo:** Proteger el activo más valioso (los datos) y blindar legalmente a la compañía.

### 1. El Riesgo en la Última Milla
Gestionamos datos PII (Personally Identifiable Information): Nombres, Direcciones, Teléfonos, Códigos de Puerta.
*   *Vulnerabilidad:* El factor humano. Riders usando datos de clientes para fines personales.

### 2. Protocolos de Seguridad Activa
*   **Enmascaramiento de Llamadas:** El rider nunca debe ver el teléfono real del cliente. Usar sistemas VOIP pasarela.
*   **Principio de Mínimo Privilegio:** Un rider solo ve los datos del pedido *mientras está activo*. Al entregar, el acceso se revoca instantáneamente.
*   **Geocercado (Geofencing):** Alertas si un dispositivo corporativo sale del área de operación. Bloqueo remoto (Remote Wipe).

### 3. RGPD y Sanciones
La multa por brecha de datos puede ser del 4% de la facturación global.
*   Prohibición de fotos a DNIs, Tarjetas de Crédito o interiores de viviendas.
*   Gestión de Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición).

**Responsabilidad:** La ignorancia de la ley no exime de su cumplimiento. Usted es el custodio final de los datos de sus clientes.
                `,
                order: 4,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué es el Principio de Mínimo Privilegio?",
                            options: ["Pagar poco", "Dar acceso solo a los datos necesarios y solo durante el tiempo necesario", "Que los jefes manden", "No usar tecnología"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "Si un rider guarda el teléfono de una clienta y le escribe luego...",
                            options: ["Es romántico", "Es una violación gravísima del RGPD y motivo de despido fulminante", "No pasa nada", "Es marketing"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-tech-5',
                title: 'Automatización de Procesos (RPA)',
                content: `
# Automatización de Procesos (RPA)

**Objetivo Ejecutivo:** Eliminar tareas administrativas repetitivas para enfocar el talento humano en tareas de valor añadido.

### 1. Automatización de Facturación
El proceso de cobro no debe requerir intervención humana.
*   Integración Flyder -> Software Contable. Generación, envío y conciliación de facturas automática.

### 2. Bots de Gestión de Flota
Uso de scripts para monitoreo pasivo.
*   *Alerta Caducidad:* Avisos automáticos 30 días antes de caducar ITVs, Seguros o Carnets de conducir.
*   *Alerta Mantenimiento:* Aviso automático al taller cuando una moto cumple 3.000km de ciclo.

### 3. Onboarding Digital
Digitalización del proceso de contratación.
*   Firma digital de contratos (DocuSign/Signaturit).
*   Subida de documentos a nube segura.
*   Cursos de formación online (LMS) previos a la incorporación.

**ROI de la Automatización:** Si una tarea tarda 5 minutos y se repite 10 veces al día, automatizarla ahorra 300 horas al año. Equivale a casi 2 meses de trabajo de una persona.
                `,
                order: 5,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es el objetivo del RPA (Robotic Process Automation)?",
                            options: ["Construir robots físicos", "Automatizar tareas digitales repetitivas para liberar tiempo humano", "Despedir a todos", "Jugar"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué permite la firma digital en el onboarding?",
                            options: ["Gastar papel", "Agilizar la contratación y evitar desplazamientos innecesarios", "Falsificar firmas", "Nada"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-tech-6',
                title: 'Innovación Futura: Drones y Robots',
                content: `
# Innovación Futura: Drones, Robots y AI

**Objetivo Ejecutivo:** Visión de futuro. Entender hacia dónde va la industria para no quedarse obsoleto.

### 1. Vehículos Autónomos Terrestres (Rovers)
Robots de acera (Sidewalk Robots) para entregas de ultracorta distancia (<1km).
*   *Impacto:* Reducción drástica del coste laboral en la "última yarda".

### 2. Drones Aéreos
Para zonas rurales o de difícil acceso.
*   *Barreras:* Regulación aérea actual (AESA/EASA) y ruido.

### 3. Inteligencia Artificial Generativa y Predictiva
El futuro no es solo optimizar rutas, es interactuar con el cliente.
*   *Chatbots AI:* Atención al cliente de primer nivel automatizada y empática las 24h.
*   *Predicción de Pedidos:* El sistema sugerirá al restaurante empezar a cocinar *antes* de que el cliente pulse "pedir", basándose en patrones probabilísticos.

**Actitud del Líder:** No necesitamos implementar esto hoy, pero debemos estar preparados estructuralmente para integrarlo mañana. La rigidez tecnológica es sentencia de muerte.
                `,
                order: 6,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es la principal barrera actual para los drones?",
                            options: ["Tecnología", "Regulación aérea y seguridad", "Nadie los quiere", "Son lentos"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué ventaja traerán los robots de acera?",
                            options: ["Son bonitos", "Reducción de coste laboral en entregas muy cortas", "Vuelan", "Hablan"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            }
        ]
    },
    {
        id: 'module-hr',
        title: 'Pilar 4: Capital Humano y Liderazgo Organizacional',
        description: 'Programa Ejecutivo: Gestión de talento en alta rotación. Liderazgo, Cultura y Negociación Laboral.',
        order: 4,
        duration: '2h 45min',
        lessons: [
            {
                id: 'less-hr-1',
                title: 'Ingeniería Laboral y Compliance',
                content: `
# Ingeniería Laboral y Compliance

**Objetivo Ejecutivo:** Diseñar una estructura contractual blindada que optimice costes y cumpla rigurosamente la legislación (Ley Rider).

### 1. El Nuevo Paradigma: La Asalarización
El modelo "Falso Autónomo" ha muerto. La ventaja competitiva reside ahora en la eficiencia de la gestión de asalariados.
*   **Contratos Fijos Discontinuos:** Flexibilidad para ajustar plantilla a estacionalidad.
*   **Jornadas Parciales Complementarias:** Uso de horas complementarias pactadas para absorber picos de demanda sin sobrecostes excesivos.

### 2. Prevención de Riesgos Laborales (PRL) Avanzada
La seguridad vial es un riesgo laboral *in itinere* y *en misión*.
*   **Responsabilidad Civil y Penal:** El administrador puede ser responsable de accidentes si no demuestra diligencia debida (formación, EPIS, mantenimiento).
*   **Protocolo de Clima Adverso:** Política clara de suspensión de servicio por lluvias torrenciales o vientos >50km/h. Proteger al trabajador es proteger a la empresa de demandas millonarias.

### 3. Gestión de Absentismo
El cáncer silencioso de la logística.
*   *Estrategia:* Bonus de Presentismo (Premiar al que viene, no solo castigar al que falta). Monitorización de patrones (bajas de lunes o viernes).

**Visión:** El cumplimiento legal no es un coste, es un activo de venta B2B ("Riesgo Cero para el Cliente") y una barrera de entrada para competidores piratas.
                `,
                order: 1,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué ventaja ofrece el contrato Fijo Discontinuo?",
                            options: ["Pagar menos", "Flexibilidad para ajustar plantilla a la estacionalidad/demanda", "No dar vacaciones", "Es ilegal"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Por qué es crucial la política de suspensión por Clima Adverso?",
                            options: ["Porque las motos se mojan", "Para proteger la vida del trabajador y evitar responsabilidad penal de la empresa", "Para descansar", "No es importante"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-hr-2',
                title: 'Talent Acquisition & Recruiting Marketing',
                content: `
# Talent Acquisition & Recruiting Marketing

**Objetivo Ejecutivo:** Crear un "Pipeline" continuo de candidatos cualificados. Tratar el reclutamiento como ventas.

### 1. La Regla del Banquillo (Bench Strength)
En delivery, la rotación anual puede superar el 100%.
*   **Mentalidad Always-Hiring:** Nunca se deja de entrevistar. Si necesita contratar hoy para cubrir hoy, ya llega tarde. Debe tener siempre 3 candidatos pre-calificados en "banquillo".

### 2. Perfilado de Competencias (The Ideal Rider Profile)
Más allá de "saber conducir moto". Búsqueda de *Soft Skills*:
*   **Madurez Emocional:** Capacidad de aguantar presión y trato difícil. (Mayores de 25 años suelen tener menor siniestralidad y mayor permanencia).
*   **Orientación al Servicio:** Candidatos con experiencia previa en hostelería (camareros) suelen funcionar mejor que los puramente logísticos.

### 3. Onboarding de Alto Impacto
Las primeras 72h determinan la vida útil del empleado.
*   **Shadowing Operativo:** El novato no toca una moto el día 1. Acompaña a un "Mentor" (Rider Senior) para observar estándares. El Mentor valida o rechaza al candidato.

**Estrategia:** Deje de publicar anuncios aburridos ("Se busca repartidor"). Venda una carrera, flexibilidad y pertenencia a un equipo de élite.
                `,
                order: 2,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué es la 'Regla del Banquillo'?",
                            options: ["Tener sillas para sentarse", "Tener siempre candidatos entrevistados y listos para entrar (Pipeline continuo)", "Jugar al fútbol", "Contratar suplentes"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué es el Shadowing?",
                            options: ["Trabajar de noche", "Técnica de formación donde el novato acompaña y observa a un veterano", "Hacer sombras", "Espionaje"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-hr-3',
                title: 'Sistemas de Incentivos y Gamificación',
                content: `
# Sistemas de Incentivos y Gamificación

**Objetivo Ejecutivo:** Alinear los intereses económicos del trabajador con los objetivos financieros de la empresa.

### 1. Retribución Variable Inteligente
El sueldo fijo compra tiempo; el variable compra esfuerzo.
*   **Modelo Híbrido:** Salario Base (Convenio) + Incentivo por Pedido (a partir de umbral de rentabilidad).
*   **KPIs Bonificables:**
    *   Volumen (Pedidos/hora).
    *   Calidad (Valoración Cliente).
    *   Fiabilidad (Ausencia de absentismo).

### 2. Gamificación del Desempeño
Uso de dinámicas de juego en el trabajo.
*   **Rankings Semanales:** "Top Gun de la Semana". Reconocimiento público (Status social).
*   **Premios no monetarios:** Libertad para elegir turno o zona la semana siguiente. A veces, la autonomía vale más que el dinero.

### 3. El Peligro de los Incentivos Perversos
Cuidado con bonificar solo la velocidad: provoca accidentes.
*   *Contrapeso:* Todo bonus de productividad se cancela si hay una multa de tráfico o siniestro culpable. Seguridad > Velocidad.

**Filosofía:** La gente no trabaja para usted, trabaja para sus propias metas. Ayúdeles a alcanzarlas a través de los objetivos de la empresa.
                `,
                order: 3,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es el objetivo de la retribución variable?",
                            options: ["Gastar más", "Alinear intereses: que el trabajador gane más cuando la empresa gana más", "Complicar las nóminas", "Evitar impuestos"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué es un incentivo perverso en delivery?",
                            options: ["Pagar poco", "Bonificar velocidad pura sin penalizar la siniestralidad (fomenta accidentes)", "Bonificar la sonrisa", "Regalar cascos"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-hr-4',
                title: 'Liderazgo Situacional y Gestión Remota',
                content: `
# Liderazgo Situacional y Gestión Remota

**Objetivo Ejecutivo:** Dirigir equipos que no están físicamente presentes la mayor parte del tiempo.

### 1. El Desafío del Liderazgo Distribuido
El rider está solo en la calle el 95% del turno. No puedes supervisar; debes inspirar y confiar.
*   **Micro-momentos de Liderazgo:** El *Briefing* inicial (5 min) y el *Debriefing* final (cierre) son los únicos puntos de contacto. Deben ser de alto impacto motivacional.

### 2. Modelo Hersey-Blanchard Adaptado
Adaptar el estilo al nivel del empleado:
*   **Dirección (Novato):** Instrucciones claras, control estricto. "Haz esto así".
*   **Persuasión (Junior):** Explicar por qué.
*   **Participación (Senior):** Pedir opinión. "¿Cómo solucionarías esta ruta?".
*   **Delegación (Team Leader):** "Toma el objetivo y gestionalo".

### 3. Comunicación Asíncrona Efectiva
Uso profesional de canales digitales (Apps, Chats corporativos).
*   Reglas claras de comunicación: Tono respetuoso, concisión operativa. Prohibición de "ruido" (memes, discusiones) en canales operativos.

**Clave:** La autoridad moral se gana en la trinchera. Un gerente que nunca se ha subido a una moto bajo la lluvia tiene poca credibilidad ante su flota.
                `,
                order: 4,
                quiz: {
                    questions: [
                        {
                            question: "¿Por qué es complejo el liderazgo en delivery?",
                            options: ["Porque llueve", "Porque el equipo está disperso y sin supervisión directa el 95% del tiempo", "Porque las motos hacen ruido", "Porque no llevan corbata"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "Según el liderazgo situacional, ¿cómo tratas a un Team Leader experto?",
                            options: ["Como a un novato", "Micro-gestión", "Delegación y confianza", "Ignorándolo"],
                            correctAnswer: 2,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-hr-5',
                title: 'Cultura Corporativa y Employer Branding',
                content: `
# Cultura Corporativa y Employer Branding

**Objetivo Ejecutivo:** Convertir la empresa en un imán de talento y reducir los costes de rotación.

### 1. El Coste Oculto de la Rotación (Churn)
Perder a un rider formado cuesta aprox. 1.200€ (Reclutamiento + Formación + Baja productividad inicial + Uniformidad perdida).
*   *Retención = Rentabilidad.* Aumentar la retención un 5% puede aumentar beneficios un 25%.

### 2. Employer Branding Local
Ser "El Mejor Sitio para Trabajar" en tu ciudad.
*   **Reputación:** Los riders hablan entre ellos. Si pagas puntual y tratas con respeto, tendrás cola de candidatos. Si engañas con las horas, nadie querrá trabajar contigo.
*   **Sentido de Pertenencia:** Uniformes impecables, equipamiento de calidad. Orgullo de marca. "Nosotros no somos riders de app, somos Profesionales Logísticos".

### 3. Plan de Carrera (La Aristocracia Interna)
Estructura de ascenso clara para romper el techo de cristal.
*   Rider Junior -> Rider Senior -> Formador -> Controlador de Tráfico -> Area Manager.
*   Promoción interna antes que contratación externa. Fomenta lealtad extrema.

**Mensaje:** La cultura es lo que sucede cuando el jefe no mira.
                `,
                order: 5,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es el coste estimado de rotación de un empleado?",
                            options: ["0€", "30€", "Aprox 1.200€ (Costes directos e indirectos)", "Infinito"],
                            correctAnswer: 2,
                            type: "single-choice"
                        },
                        {
                            question: "¿Cómo mejora el Employer Branding la rentabilidad?",
                            options: ["Vendes camisetas", "Atrae mejor talento a menor coste y reduce la rotación", "Es publicidad para clientes", "Sonríes más"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-hr-6',
                title: 'Resolución de Conflictos y Negociación',
                content: `
# Resolución de Conflictos y Negociación

**Objetivo Ejecutivo:** Gestión profesional de la fricción humana. Prevención de crisis laborales.

### 1. Tipología de Conflictos Logísticos
*   **Rider vs Restaurante:** Tiempos de espera, trato personal.
*   **Rider vs Cliente:** Problemas en entrega, propinas, malentendidos.
*   **Rider vs Empresa:** Turnos, nóminas, sanciones.

### 2. El Semáforo Disciplinario
Sistema de consecuencias claro, justo y progresivo.
*   **Líneas Amarillas (Advertencia):** Llegadas tarde, uniformidad incorrecta.
*   **Líneas Rojas (Expulsión):** Robo, Alcohol/Drogas, Acoso, Fraude GPS deliberado. (Tolerancia Cero).
*   *Clave:* La sanción debe ser inmediata y documentada. La impunidad destruye la moral del equipo cumplidor.

### 3. Mediación y Despido Elegante
Incluso en un despido procedente, las formas importan para evitar vandalismo o mala prensa.
*   **Entrevista de Salida:** Entender por qué se van los buenos.
*   **Offboarding Seguro:** Recuperación de activos (casco, llaves) y revocación de accesos digitales *antes* de comunicar el despido hostil.

**Habilidad Directiva:** Firmeza con los estándares, suavidad con las personas.
                `,
                order: 6,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué es una Línea Roja en disciplina?",
                            options: ["Algo sugerido", "Una falta perdonable", "Una infracción intolerable que conlleva despido (Robo, Acoso)", "Pintura en el suelo"],
                            correctAnswer: 2,
                            type: "single-choice"
                        },
                        {
                            question: "¿Por qué es importante un Offboarding Seguro en despidos hostiles?",
                            options: ["Para despedirse bien", "Para evitar sabotajes, robo de datos o daños a activos de la empresa", "Para dar el finiquito", "Para tomar café"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            }
        ]
    },
    {
        id: 'module-strat',
        title: 'Pilar 5: Desarrollo Corporativo y Expansión de Mercado',
        description: 'Programa Ejecutivo: Estrategia B2B, Key Account Management y Plan de Expansión Territorial.',
        order: 5,
        duration: '2h 15min',
        lessons: [
            {
                id: 'less-strat-1',
                title: 'Propuesta de Valor y Estrategia B2B',
                content: `
# Propuesta de Valor y Estrategia B2B

**Objetivo Ejecutivo:** Definir por qué un restaurante debería elegirnos frente a gigantes tecnológicos o riders autónomos ilegales. Diferenciación estratégica.

### 1. El Océano Rojo del Delivery
Competimos contra plataformas con capital infinito. No podemos competir en precio bajo; debemos competir en **Servicio Premium y Seguridad**.

### 2. La "Battle Card" Comercial (Repaart vs The World)
Argumentario de venta consultiva para Restaurantes Top:
*   **Vs Plataformas (Glovo/Uber):** "Ellos le cobran un 30-35% de comisión por pedido y secuestran a SU cliente. Nosotros somos una tarifa plana logística ecológica. Usted mantiene el margen y el data del cliente."
*   **Vs Riders Falsos Autónomos:** "Contratarlos es fraude de ley. Una inspección de trabajo cerraría su local. Nosotros ofrecemos escudo legal total con flota en nómina al 100%."

### 3. Segmentación de Mercado (Targeting)
No dispare a todo lo que se mueve.
*   **Cliente Ideal (ICP):** Restaurante volumen medio-alto (>800 pedidos/mes), ticket medio >25€, preocupado por imagen de marca.
*   **Anti-Cliente:** Fast food Low cost, bajo volumen, zonas conflictivas. (Consumen recursos y no dan margen).

**Visión:** No vendemos transporte de comida. Vendemos tranquilidad para el dueño del restaurante y protección de su marca.
                `,
                order: 1,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es el principal argumento contra las plataformas de agregadores?",
                            options: ["Son lentas", "Altas comisiones (30%+) y pérdida de control del cliente final", "Tienen mochilas amarillas", "No tienen motos"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué es el ICP (Ideal Customer Profile)?",
                            options: ["Un código postal", "El perfil de cliente más rentable y adecuado para nuestra estrategia (Volumen alto, Ticket medio)", "Cualquier restaurante", "Una pizza"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-strat-2',
                title: 'Prospección y "Sales Funnel"',
                content: `
# Prospección y "Sales Funnel"

**Objetivo Ejecutivo:** Sistematizar la captación de nuevos clientes. Del "Puerta Fría" a la Ingeniería de Ventas.

### 1. El Embudo de Ventas (Funnel)
Gestión científica del pipeline.
*   **Top of Funnel (Leads):** Bases de datos de restaurantes (Google Maps, Tripadvisor). Barrido de zona.
*   **Middle (Cualificación):** ¿Tiene volumen suficiente? ¿Paga bien? Visita de "Mistery Shopper" para evaluar operatividad.
*   **Bottom (Cierre):** Presentación de propuesta económica y firma.

### 2. Técnicas de Aproximación
*   **Digital:** Campañas de LinkedIn/Email a dueños de franquicias hosteleras locales.
*   **Físico:** No visitar en hora punta. Horario de gerente (10:00-11:30 o 17:00-18:30). Llevar "Tablet" con demo de Flyder, no un panfleto de papel arrugado.

### 3. Cálculo de ROI para el Cliente
No hable de su precio, hable del dinero que el cliente va a ganar.
*   *Script:* "Con su modelo actual paga 3.000€ en comisiones. Con nuestra tarifa plana pagaría 1.800€. Le pongo 1.200€ de beneficio extra en su bolsillo cada mes desde el día 1."

**Directriz:** El vendedor amateur vende características. El vendedor profesional vende resultados financieros.
                `,
                order: 2,
                quiz: {
                    questions: [
                        {
                            question: "¿Cuál es el mejor horario para visitar un restaurante B2B?",
                            options: ["Hora de comer (14:00)", "Horas valle de gestión (10-11:30 o 17-18:30)", "Cena fin de semana", "De madrugada"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué se debe vender al cliente?",
                            options: ["Motos bonitas", "Características técnicas", "ROI (Retorno de Inversión) y resultados financieros", "Pena"],
                            correctAnswer: 2,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-strat-3',
                title: 'Negociación y Cierre de Alto Nivel',
                content: `
# Negociación y Cierre de Alto Nivel

**Objetivo Ejecutivo:** Cerrar acuerdos beneficiosos y sostenibles. Dominar la tensión negociadora.

### 1. Variables de Negociación (Variables)
Nunca ceda en Precio sin pedir algo a cambio (Trade-off).
*   *Si el cliente pide bajar precio...* Usted pide: Más volumen garantizado, contrato a más años, pago por adelantado o exclusividad.

### 2. El Contrato Blindado (SLA)
Un apretón de manos no sirve. Todo por escrito.
*   **SLA (Service Level Agreement):** Definir qué es "buen servicio". (Ej: Tiempo de llegada < 20 min en el 95% de casos).
*   **Cláusulas de Salida:** Penalización si rompen contrato antes de tiempo. Protege su inversión en flota dedicada.

### 3. Manejo de Objeciones Clásicas
*   *"Sois caros"*: -> "Lo barato sale caro. ¿Cuánto le cuesta un pedido frío o una multa de inspección? Nosotros somos el seguro a todo riesgo de su reparto."
*   *"Ya tengo mis chicos"*: -> "Genial, ¿y qué pasa cuando se ponen enfermos o se rompe la moto? Nosotros garantizamos sustitución inmediata. Eliminamos su dolor de cabeza de gestión HR."

**Actitud:** Negocie desde la abundancia, no desde la necesidad. Esté dispuesto a levantarse de la mesa si el trato no es rentable.
                `,
                order: 3,
                quiz: {
                    questions: [
                        {
                            question: "En una negociación, si cedes en precio debes...",
                            options: ["Dar las gracias", "Pedir una contrapartida (Trade-off) como volumen o permanencia", "Irte", "Bajar más"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué define un SLA (Service Level Agreement)?",
                            options: ["El sueldo", "Los niveles de servicio comprometidos objetivamente (tiempos, calidad)", "El menú", "La amistad"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-strat-4',
                title: 'Key Account Management (Gestión de Cuentas Clave)',
                content: `
# Key Account Management (Gestión de Cuentas Clave)

**Objetivo Ejecutivo:** Convertir clientes en socios estratégicos. Maximizar el LTV (Lifetime Value).

### 1. La Estrategia "Farming"
Captar cuesta 5 veces más que retener.
*   **QBR (Quarterly Business Review):** Reunión trimestral con grandes clientes. Mostrar datos de rendimiento, ahorro generado y proponer mejoras. No sea un proveedor invisible.

### 2. Gestión de Crisis con Clientes VIP
Cuando fallamos con la "Ballena" (Cliente grande).
*   *Protocolo:* Reconocimiento inmediato de culpa + Plan de Acción Correctivo + Compensación proactiva.
*   La recuperación del servicio *excepcional* tras un fallo fideliza más que un servicio perfecto pero estándar (Paradoja de la recuperación).

### 3. Up-selling y Cross-selling
*   **Up-selling:** ¿Abren los lunes? Ofrecer cubrir esos turnos.
*   **Cross-selling:** ¿Tienen otra marca/local? Ofrecer unificar logística con descuento de grupo.

**Visión:** El KAM no es un "solucionador de quejas", es un consultor de crecimiento para el cliente.
                `,
                order: 4,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué es una QBR?",
                            options: ["Una barbacoa", "Quarterly Business Review (Revisión Trimestral de Negocio con el cliente)", "Una queja", "Un impuesto"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Cuál es el objetivo del Farming?",
                            options: ["Plantar tomates", "Cultivar y hacer crecer a los clientes actuales para maximizar su valor (LTV)", "Buscar nuevos clientes", "Reducir precios"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-strat-5',
                title: 'Marketing Local y Posicionamiento',
                content: `
# Marketing Local y Posicionamiento

**Objetivo Ejecutivo:** Dominar la mente del mercado local. Ser la referencia inevitable.

### 1. Estrategia de Hiper-Localización
El delivery es un negocio de barrios, no de ciudades.
*   **Dominio de Zona:** Es mejor ser el Rey de un barrio (alta densidad) que un alfil en toda la ciudad (baja densidad).
*   **Partnerships:** Alianzas con asociaciones de comerciantes de barrio. "Logística oficial del Barrio X".

### 2. Marketing de Guerrilla
Acciones de bajo coste y alto impacto.
*   **Branding Móvil:** Las cajas de las motos son vallas publicitarias móviles. Deben estar impolutas y con marca visible.
*   **Flyering Táctico:** Inserción de publicidad propia en las bolsas de entrega (con permiso). Llegamos directo al salón del consumidor final.

### 3. Presencia Digital B2B
*   **LinkedIn Local:** Conectar con todos los dueños de hostelería de la ciudad. Publicar casos de éxito ("Felicidades al Restaurante Pepe por batir récord de pedidos con nuestra flota"). Genera prueba social.

**Concepto:** La visibilidad genera confianza. La confianza genera ventas.
                `,
                order: 5,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué significa Hiper-Localización?",
                            options: ["Usar GPS", "Enfocar esfuerzos en dominar barrios específicos para maximizar densidad", "Anunciarse en TV nacional", "Vender en todo el mundo"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué elemento es una 'valla publicitaria móvil' gratuita?",
                            options: ["El casco", "La caja de la moto (Top case)", "El ticket", "El suelo"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            },
            {
                id: 'less-strat-6',
                title: 'Plan Maestro de Expansión Territorial',
                content: `
# Plan Maestro de Expansión Territorial

**Objetivo Ejecutivo:** Escalar el modelo a nuevas geografías sin quebrar en el intento.

### 1. Análisis de Viabilidad de Nuevas Plazas (Due Diligence)
Antes de abrir en una ciudad nueva:
*   **Demografía:** Población > 50k habitantes. Renta per cápita media/alta.
*   **Tejido HORECA:** Número de restaurantes con delivery activo en portales.
*   **Orografía:** ¿Es plana? (Mejor para bicis/motos eléctricas) ¿Llueve mucho?

### 2. Estrategia de Desembarco (Landing)
*   **Modelo "Cabeza de Playa":** Entrar con 1 cliente ancla fuerte ya firmado antes de abrir la base. Nunca abrir "a ver qué pasa".
*   **Equipo Expedicionario:** Enviar a un gerente veterano (Task Force) para el setup inicial de 2 meses. No contratar gerente local novato hasta que la operación ruede.

### 3. M&A Local (Fusiones y Adquisiciones)
A veces es más rápido comprar que construir.
*   Identificar pequeñas flotas locales ineficientes. Comprarlas por valor de activos, migrar sus clientes a tu tecnología Flyder y sanear su P&L. Crecimiento inorgánico rápido.

**Conclusión Final del Programa:** Usted tiene ahora las herramientas de un CEO logístico. El conocimiento es potencial; la ejecución es poder. Salga ahí fuera y construya un imperio. El mercado espera.
                `,
                order: 6,
                quiz: {
                    questions: [
                        {
                            question: "¿Qué es el modelo 'Cabeza de Playa' en expansión?",
                            options: ["Ir a la costa", "Asegurar un cliente ancla fuerte antes de desplegar infraestructura en una nueva ciudad", "Invadir por mar", "Montar chiringuito"],
                            correctAnswer: 1,
                            type: "single-choice"
                        },
                        {
                            question: "¿Qué es una Due Diligence de expansión?",
                            options: ["Una fiesta", "Investigación y análisis previo de viabilidad (demografía, competencia) de una nueva zona", "Contratar gente", "Comprar motos"],
                            correctAnswer: 1,
                            type: "single-choice"
                        }
                    ]
                }
            }
        ]
    }
];
