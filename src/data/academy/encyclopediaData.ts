export const ENCYCLOPEDIA_DATA = [
    {
        id: 'cat-sops',
        title: 'SOPs - Procedimientos Críticos',
        icon: 'Shield',
        description: 'Protocolos de actuación estándar para situaciones rutinarias y de emergencia. El manual de guerra.',
        articles: [
            {
                id: 'sop-incident-traffic',
                title: 'PROTOCOLO ACCIDENTE GRAVE',
                content: `
# SOP-01: Actuación en Caso de Accidente de Tráfico
**Nivel de Criticidad:** ALTO (Código Rojo)

### 1. Fase Inmediata (Minuto 0-5)
El Rider o primer testigo debe:
1.  **P.A.S.:** Proteger (señalizar), Avisar (112), Socorrer (si sabe).
2.  **Notificación a Central:** Mensaje urgente: "ACCIDENTE GRAVE + UBICACIÓN + RIDER [NOMBRE]".

### 2. Fase de Gestión (Minuto 5-30)
El Gerente de Zona/Area Manager debe:
1.  **Desplazamiento:** Acudir físicamente al lugar si es posible o enviar a un Supervisor.
2.  **Soporte Documental:** Enviar por WhatsApp al rider/policía la Póliza de Seguro y la Mutua de Accidentes.
3.  **Gestión de Carga:** Si la comida está intacta, enviar rider de rescate. Si no, cancelar pedido y notificar a cliente (sin dar detalles sangrientos).

### 3. Fase Legal y Post-Incidente (24h)
1.  **Parte de Accidente:** Rellenar parte amistoso o solicitar Atestado Policial.
2.  **Comunicación Mutua:** Dar parte de baja médica en <24h.
3.  **Auditoría Interna:** ¿Llevaba el rider los EPIS? ¿La moto tenía ITV? Si la respuesta es NO, la empresa tiene responsabilidad penal.
                `
            },
            {
                id: 'sop-cierre-caja',
                title: 'PROTOCOLO CIERRE DE CAJA',
                content: `
# SOP-02: Cierre y Arqueo de Caja
**Nivel de Criticidad:** MEDIO (Diario)

### 1. El Concepto "Caja Cero"
El dinero efectivo es un riesgo de seguridad y tentación.
*   Objetivo: Depositar en el banco todo el efectivo > 100€ (Fondo de cambio) diariamente.

### 2. Proceso de Arqueo
1.  **Conteo Físico:** Separar billetes y monedas.
2.  **Cruce con TPV:** Sacar "Cierre Z" del datáfono.
3.  **Cruce con Flyder:** Sacar reporte "Cobros en Efectivo del Día".
4.  **Cuadre:** (Efectivo Real + Tickets TPV) - (Fondo Inicial) = Ventas del Día.

### 3. Gestión de Descuadres
*   Descuadre < 2€: Se anota como "Quebranto de Moneda".
*   Descuadre > 10€: Investigación obligatoria. ¿Robo? ¿Error de cambio?
*   *Política:* Si falta dinero injustificado recurrentemente, se descuenta de la nómina del responsable de caja (previa firma de acuerdo).
                `
            }
        ]
    },
    {
        id: 'cat-legal',
        title: 'Legal Vault & Compliance',
        icon: 'Scale',
        description: 'Plantillas contractuales y documentos legales blindados para proteger la empresa.',
        articles: [
            {
                id: 'leg-contrato-mercantil',
                title: 'Plantilla Contrato Prestación Servicios (B2B)',
                content: `
# CLÁUSULAS ESENCIALES PARA CONTRATO CON RESTAURANTE

### 1. Objeto del Servicio
Definir claramente que somos "Operador Logístico", no empleados del restaurante.

### 2. Tarifas y Revisión de IPC
*"Las tarifas se incrementarán anualmente según el IPC o un 2%, lo que sea mayor."* (Protección contra inflación).

### 3. Cláusula de Exclusividad (Opcional pero Recomendada)
*"El CLIENTE se compromete a confiar el 100% de su volumen de reparto a REPAART. En caso de incumplimiento, REPAART podrá revisar las tarifas al alza."*

### 4. Limitación de Responsabilidad
*"La responsabilidad de REPAART por mercancía dañada se limita al valor de coste del producto, excluyendo lucro cesante o daños reputacionales."*

### 5. Cláusula Anti-Furtivismo (Non-Poaching)
*"El CLIENTE no podrá contratar directa o indirectamente a ningún rider de REPAART durante la vigencia del contrato y 12 meses después. Penalización: 3.000€ por trabajador."*
                `
            },
            {
                id: 'leg-cesion-material',
                title: 'Acta de Cesión de Material y Vehículo',
                content: `
# ACTA DE ENTREGA DE MATERIAL (EPIS Y VEHÍCULO)

Yo, [NOMBRE RIDER], con DNI [NUMERO], recibo el siguiente material propiedad de la empresa:

1.  **Vehículo:** Moto Yamaha [MATRICULA]. Estado: [BUENO/REGULAR]. Km: [XXXX].
2.  **Casco:** Marca [MARCA], Talla [X].
3.  **Caja Térmica:** Modelo [X].
4.  **Teléfono Móvil (si aplica):** Modelo [X], IMEI [X].

**Obligaciones:**
*   Me comprometo a cuidar el material como si fuera propio.
*   Autorizo a la empresa a descontar de mi finiquito el valor residual del material en caso de no devolución o daño por negligencia grave (no desgaste habitual).
*   Entiendo que el uso del vehículo es **estrictamente profesional**. El uso personal está prohibido y es causa de despido.

Firma Trabajador: _____________________ Fecha: __/__/____
                `
            }
        ]
    },
    {
        id: 'cat-sales',
        title: 'Sales Intelligence & Scripts',
        icon: 'Briefcase',
        description: 'Guiones de venta, manejo de objeciones y calculadoras de rentabilidad.',
        articles: [
            {
                id: 'sales-script-cold',
                title: 'Script de Llamada (Puerta Fría)',
                content: `
# PREGUION TELEFÓNICO: OBJETIVO "CONSEGUIR CITA"

**Rider/Comercial:** "Hola, buenos días. ¿Podría hablar con el encargado o gerente? Soy Juan de Repaart."
**(Si preguntan "de qué se trata"):** "Es sobre los problemas que están teniendo con el reparto de Glovo/Uber últimamente en la zona. Tenemos una solución local."

**Gerente al teléfono:** "¿Sí?"
**Comercial:** "Hola [NOMBRE], soy [TU NOMBRE] de Repaart. Llevamos el reparto del Restaurante [NOMBRE COMPETENCIA/VESINO] aquí al lado."
"Le llamo muy rápido: Hemos bajado sus costes de reparto un 20% y eliminado las quejas de comida fría. Me gustaría pasarme mañana 10 minutos (relojeados) para enseñarle cómo podemos hacer lo mismo por usted. ¿Le viene mejor a las 11:00 o a las 18:00?"

**Claves:**
*   Mencionar vecino (Prueba Social).
*   Mencionar "Dolor" (Costes, Quejas).
*   Cierre de doble alternativa (Mañana/Tarde).
                `
            },
            {
                id: 'sales-calculator-roi',
                title: 'Calculadora de Ahorro (Argumentario)',
                content: `
# CÓMO DEMOSTRAR AHORRO AL CLIENTE

**Escenario Actual (Plataformas):**
*   Facturación Delivery Mensual: 10.000€
*   Comisión Plataforma (30%): -3.000€
*   **Coste Anual:** 36.000€ tirados a la basura.

**Escenario Repaart (Tarifa Plana + Gestión Propia):**
*   Coste Flota Dedicada (Media jornada): ~1.200€
*   Coste Software Flyder: ~100€
*   Total Coste Mes: 1.300€
*   **Ahorro Mensual:** 1.700€
*   **AHORRO ANUAL:** 20.400€

**Cierre:**
"Señor cliente, con esos 20.000€ extra de beneficio al año, ¿qué haría? ¿Reformar el local? ¿Comprarse un coche? Ese dinero es suyo, no se lo regale a las plataformas."
                `
            }
        ]
    },
    {
        id: 'cat-tech',
        title: 'Troubleshooting & Soporte Flyder',
        icon: 'Cpu',
        description: 'Solución rápida a problemas técnicos de la App y dispositivos.',
        articles: [
            {
                id: 'tech-gps-fix',
                title: 'Fallo GPS Rider (No posiciona)',
                content: `
# Solución: El Rider aparece "Congelado" en el Mapa

La causa suele ser el ahorro de batería de Android.

**Pasos a seguir en el móvil del Rider:**
1.  Ir a **Ajustes > Aplicaciones > Flyder Rider App**.
2.  Batería > **"Sin Restricciones"** (Quitar modo ahorro energía).
3.  Permisos > Ubicación > **"Permitir siempre"** (No solo "cuando se usa la app").
4.  Reiniciar el teléfono.

*Si persiste:* Comprobar si tiene datos móviles activos o si ha entrado en zona de sombra (sótano/garaje).
                `
            }
        ]
    }
];
