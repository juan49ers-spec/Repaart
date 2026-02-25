export interface ContractTemplate {
    id: string;
    name: string;
    description: string;
    category: 'contracts' | 'agreements' | 'letters' | 'annexes' | 'policies';
    icon: string;
    content: string;
    placeholders: string[];
}

export const TEMPLATE_CATEGORIES = [
    { id: 'contracts', label: 'Contratos', color: 'indigo' },
    { id: 'agreements', label: 'Acuerdos', color: 'emerald' },
    { id: 'letters', label: 'Cartas', color: 'amber' },
    { id: 'annexes', label: 'Anexos', color: 'purple' },
    { id: 'policies', label: 'Políticas', color: 'rose' }
];

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
    {
        id: 'service-contract',
        name: 'Contrato de Servicios Logísticos y Tecnológicos',
        description: 'Contrato principal y completo para la prestación de servicios de delivery flyder',
        category: 'contracts',
        icon: 'FileText',
        placeholders: [
            'NOMBRE_DEL_FRANQUICIADO',
            'CIF_FRANQUICIA',
            'DIRECCIÓN_BASE',
            'NOMBRE_RESTAURANTE',
            'CIF_RESTAURANTE',
            'DIRECCIÓN_RESTAURANTE',
            'REPRESENTANTE_RESTAURANTE',
            'LOCALIDAD',
            'DÍA',
            'MES',
            'AÑO',
            'RADIO_KM',
            'PEDIDOS_MINIMOS',
            'PRECIO_BASE',
            'PRECIO_KM_EXTRA'
        ],
        content: `# **CONTRATO DE PRESTACIÓN DE SERVICIOS LOGÍSTICOS Y TECNOLÓGICOS**

En **[LOCALIDAD]**, a **[DÍA]** de **[MES]** de **[AÑO]**.

## **REUNIDOS**

**DE UNA PARTE (LA COMPAÑÍA):** D./Dña. **[NOMBRE_DEL_FRANQUICIADO]**, con N.I.F. **[CIF_FRANQUICIA]**, actuando en nombre y representación de la franquicia **REPAART**, con domicilio en **[DIRECCIÓN_BASE]**.

**DE OTRA PARTE (EL CLIENTE):** La entidad mercantil **[NOMBRE_RESTAURANTE]**, con C.I.F. **[CIF_RESTAURANTE]**, y domicilio social en **[DIRECCIÓN_RESTAURANTE]**, representada en este acto por D./Dña. **[REPRESENTANTE_RESTAURANTE]**.

*(En adelante, conjuntamente referidos como las “Partes”)*.

## **EXPONEN**

I. Que **LA COMPAÑÍA** es una empresa de base logística especializada en el reparto de última milla y gestión tecnológica del delivery mediante la plataforma **FLYDER**. 
II. Que **EL CLIENTE** está interesado en externalizar su servicio de reparto a domicilio para optimizar costes y tiempos de entrega. 
III. Que ambas partes acuerdan formalizar el presente contrato con sujeción a las siguientes cláusulas:

## **CLÁUSULAS**

### **PRIMERA. – OBJETO DEL CONTRATO**
El presente contrato tiene por objeto la prestación de un servicio dedicado de reparto por parte de **LA COMPAÑÍA** a favor de **EL CLIENTE**, así como el uso de la plataforma tecnológica **FLYDER** para la gestión y trazabilidad de los pedidos.

### **SEGUNDA. – DESCRIPCIÓN DEL SERVICIO**
El servicio consiste en la recogida de los pedidos en el local del CLIENTE y su entrega en el domicilio del consumidor final.
* **Zona de Reparto:** Limitada operativamente a un radio máximo de **[RADIO_KM] km** desde el punto de recogida.
* **Plataforma Tecnológica:** LA COMPAÑÍA conectará su plataforma (Flyder) con EL CLIENTE para la gestión automatizada o manual de los pedidos.

### **TERCERA. – OBLIGACIONES DE LAS PARTES**

**3.1 Del CLIENTE:**
a) Facilitar la información de los pedidos de forma veraz a través de la API o web de Flyder.
b) Entregar la mercancía debidamente embalada para su transporte en moto.
c) Abonar las facturas en las fechas estipuladas.

**3.2 De LA COMPAÑÍA:**
a) Prestar el servicio con la máxima diligencia y profesionalidad.
b) Mantener la plataforma Flyder operativa y actualizada.
c) Cumplir estrictamente con la normativa laboral y de seguridad social de sus repartidores.

### **CUARTA. – PRECIO Y FORMA DE PAGO**
**4.1 Precio:** Las tarifas por servicio se detallan en el **ANEXO II** (Condiciones Económicas).
**4.2 Facturación:** LA COMPAÑÍA emitirá factura los días **15 y 30 de cada mes**.
**4.3 Pago:** El pago se realizará mediante Domiciliación Bancaria (SEPA) a la cuenta designada por LA COMPAÑÍA en un plazo máximo de 5 días tras la emisión de la factura.
**4.4 Impagos:** El retraso en el pago devengará un recargo del **10%** en concepto de gestión de cobro. En caso de impago reiterado, LA COMPAÑÍA podrá suspender el servicio de inmediato.

### **QUINTA. – DURACIÓN Y PERMANENCIA**
El contrato tendrá una duración inicial de **12 MESES**, prorrogable automáticamente por períodos iguales salvo preaviso por escrito con al menos **un (1) mes** de antelación.

### **SEXTA. – PEDIDOS MÍNIMOS GARANTIZADOS**
EL CLIENTE garantiza a LA COMPAÑÍA un volumen mínimo de **[PEDIDOS_MINIMOS]** pedidos mensuales. Si no se alcanza esta cifra, EL CLIENTE abonará la diferencia hasta alcanzar el mínimo pactado en la última factura del mes.

### **SÉPTIMA. – EXCLUSIVIDAD**
[Cargar cláusula de snippetLibrary: Exclusividad Total del Servicio]

### **OCTAVA. – RÉGIMEN LABORAL (LEY RIDER)**
[Cargar cláusula de snippetLibrary: Régimen Laboral (Ley Rider)]

### **NOVENA. – PROTECCIÓN DE DATOS**
Ambas partes se comprometen a cumplir con el Reglamento (UE) 2016/679 (RGPD). Los datos de los clientes finales se tratarán exclusivamente para la ejecución del servicio de entrega.

### **DÉCIMA. – RESOLUCIÓN ANTICIPADA Y PENALIZACIÓN**
[Cargar cláusula de snippetLibrary: Resolución Anticipada y Penalización]

---

## **ANEXO I: TÉRMINOS Y CONDICIONES OPERATIVAS**
1. **Tiempos de Espera:** [Cargar cláusula de snippetLibrary: Penalización por Retraso en Restaurante]
2. **Cliente Ausente:** [Cargar cláusula de snippetLibrary: Protocolo de Cliente Ausente]
3. **Cancelaciones:** [Cargar cláusula de snippetLibrary: Cargo por Cancelación en Ruta]
4. **Doble Viaje:** [Cargar cláusula de snippetLibrary: Doble Viaje por Error del Restaurante]
5. **Responsabilidad de Mercancía:** [Cargar cláusula de snippetLibrary: Límite de Responsabilidad de Mercancía]

---

## **ANEXO II: CONDICIONES ECONÓMICAS**
**1. TARIFA ESTÁNDAR (Por Pedido)**
* Distancia 0 - 3,5 km: **[PRECIO_BASE] € + IVA**.
* Distancia 3,5 a 5 km: **+ [PRECIO_KM_EXTRA] €** de suplemento.
* Distancia > 5 km: A consultar / No tarifado en estándar.

Y en prueba de conformidad, firman el presente por duplicado en el lugar y fecha indicados.

| POR LA COMPAÑÍA | POR EL CLIENTE |
| :--- | :--- |
| Fdo.: ___________________ | Fdo.: ___________________ |
| **[NOMBRE_DEL_FRANQUICIADO]** | **[REPRESENTANTE_RESTAURANTE]** |`
    },
    {
        id: 'welcome-letter',
        name: 'Carta de Bienvenida e Instrucciones',
        description: 'Carta formal con instrucciones de integración de la plataforma Flyder',
        category: 'letters',
        icon: 'Mail',
        placeholders: [
            'NOMBRE_RESTAURANTE',
            'REPRESENTANTE_RESTAURANTE',
            'NOMBRE_DEL_FRANQUICIADO',
            'TELÉFONO_FRANQUICIA',
            'EMAIL_FRANQUICIA',
            'CIUDAD_FRANQUICIA',
            'DÍA',
            'MES',
            'AÑO'
        ],
        content: `**[NOMBRE_DEL_FRANQUICIADO]**
Soporte a Franquiciados y Restaurantes
Teléfono: [TELÉFONO_FRANQUICIA]
Email: [EMAIL_FRANQUICIA]

A la atención de: **[REPRESENTANTE_RESTAURANTE]**
Restaurante: **[NOMBRE_RESTAURANTE]**

En [CIUDAD_FRANQUICIA], a [DÍA] de [MES] de [AÑO]

**Asunto: Bienvenida a la red Repaart e Instrucciones de Integración Flyder**

Estimado/a [REPRESENTANTE_RESTAURANTE]:

Por medio de la presente, nos complace darle la bienvenida oficial a la red operativa de **Repaart**. Le agradecemos la confianza depositada en nuestro equipo para capitanear la logística y el reparto de última milla de **[NOMBRE_RESTAURANTE]**.

Con el objetivo de garantizar la mayor fluidez y eficiencia operativa desde el primer día, le detallamos a continuación los pasos fundamentales para la integración con nuestra plataforma tecnológica **Flyder**:

### 1. ALTA EN LA PLATAFORMA FLYDER
Para comenzar a volcar sus pedidos, es imprescindible el registro de su local en nuestra web operativa.
* **Acceso web:** Por favor, diríjase a \`https://api.flyder.app/b/auth/login\`
* **Registro:** Cree una nueva cuenta de usuario o inicie sesión si ya dispone de credenciales.
* **Panel de Reparto:** Desde el menú principal, diríjase a la sección "Reparto" -> "Iniciar Turno" para comenzar a introducir los pedidos.

### 2. MODELOS DE INTEGRACIÓN
Dependiendo del volumen de su negocio, le recomendamos dos vías de trabajo:
* **Manual (Web Flyder):** Ideal para volúmenes controlados o para digitalizar los pedidos que reciban por vía telefónica. Requiere de un dispositivo (PC o Tablet) con conexión a internet en su local.
* **Automática (API/TPV):** Si trabaja con plataformas como Glovo o Just Eat, podemos sincronizar los pedidos mediante integradores homologados (ej. Deliverect). Si este es su caso, por favor contacte con nosotros cuanto antes para iniciar las gestiones técnicas.

### 3. RECORDATORIOS OPERATIVOS CLAVE
* **Empaquetado (Packaging):** Recuerde que la integridad del producto durante el transporte depende en gran medida de un embalaje óptimo y sellado para delivery.
* **Tiempos de Preparación:** La puntualidad es nuestra máxima. Nuestros *riders* tienen la instrucción de minimizar los tiempos de espera; le rogamos que el pedido esté finalizado o en sus últimos retoques a la llegada del repartidor.

Para cualquier incidencia en el servicio, dudas técnicas, o soporte de integración, no dude en contactarnos a través del **[TELÉFONO_FRANQUICIA]** o en **[EMAIL_FRANQUICIA]**.

Reiteramos nuestra ilusión por crecer junto a ustedes.

Atentamente,

**El equipo de Operaciones de [NOMBRE_DEL_FRANQUICIADO]**
Red Repaart`
    },
    {
        id: 'nda',
        name: 'Acuerdo de Confidencialidad y Know-How',
        description: 'NDA profesional para proteger la estrategia operativa y tecnología',
        category: 'agreements',
        icon: 'Lock',
        placeholders: [
            'NOMBRE_DEL_FRANQUICIADO',
            'CIF_FRANQUICIA',
            'NOMBRE_RESTAURANTE',
            'CIF_RESTAURANTE',
            'LOCALIDAD',
            'DÍA',
            'MES',
            'AÑO'
        ],
        content: `# ACUERDO DE CONFIDENCIALIDAD Y PROTECCIÓN DE KNOW-HOW

En [LOCALIDAD], a [DÍA] de [MES] de [AÑO]

**REUNIDOS**
De una parte, **[NOMBRE_DEL_FRANQUICIADO]** (C.I.F. **[CIF_FRANQUICIA]**), en adelante "LA PARTE REVELADORA".
Y de otra parte, **[NOMBRE_RESTAURANTE]** (C.I.F. **[CIF_RESTAURANTE]**), en adelante "LA PARTE RECEPTORA".

## 1. DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL Y KNOW-HOW
Se entenderá por Información Confidencial toda la información técnica, operativa, comercial, modelo de negocio, algoritmos de enrutamiento, métodos de asignación de la app Flyder, planes estratégicos y cualquier material o *Know-how* propio de Repaart que la Parte Reveladora comparta con la Parte Receptora durante la negociación y/o prestación del servicio.

## 2. OBLIGACIÓN ESTRICTA DE SECRETO
LA PARTE RECEPTORA asume frente a LA PARTE REVELADORA el compromiso irrevocable de:
a) Mantener en estricto y absoluto secreto toda la Información Confidencial.
b) No reproducirla, compartirla, comercializarla, publicarla ni comunicarla a terceros, competidores, plataformas de delivery alternativas ni a los propios empleados que no participen directamente en la operativa.
c) Custodiar los datos de acceso, integraciones API y manuales operativos de la plataforma Flyder con la máxima diligencia.

## 3. PROPIEDAD INTELECTUAL
El intercambio de esta Información Confidencial no conlleva bajo ningún concepto la cesión, venta, licencia ni transferencia de derechos de Propiedad Intelectual o Industrial sobre la tecnología, marca o modelo operativo de Repaart.

## 4. PENALIZACIONES POR INCUMPLIMIENTO
Dada la sensibilidad competitiva de la información compartida, el incumplimiento intencionado de las obligaciones de confidencialidad y no competencia desleal aquí estipuladas facultará a LA PARTE REVELADORA para exigir una penalización por daños y perjuicios de acuerdo a la legislación vigente y a los costes directos e indirectos causados, además del cese inmediato del servicio.

## 5. VIGENCIA Y SUPERVIVENCIA
La obligación de confidencialidad pervivirá incluso finalizada la relación comercial principal entre las partes, manteniéndose vigente de forma indefinida sobre aquellos aspectos que constituyan secreto empresarial o *know-how* técnico.

Firmado en muestra de total conformidad:

Fdo.: ___________________   Fdo.: ___________________`
    },
    {
        id: 'sla',
        name: 'Acuerdo de Nivel de Calidad (SLA)',
        description: 'Define tiempos máximos, penalizaciones cruzadas y calidad del servicio',
        category: 'agreements',
        icon: 'Gauge',
        placeholders: [
            'NOMBRE_DEL_FRANQUICIADO',
            'NOMBRE_RESTAURANTE',
            'DÍA',
            'MES',
            'AÑO',
            'TIEMPO_PROM_MINUTOS',
            'TASA_INCIDENCIAS_MAX'
        ],
        content: `# ACUERDO DE NIVEL DE CALIDAD DE SERVICIO (SLA)

**Anexo al Contrato Principal**
**Proveedor Logístico:** [NOMBRE_DEL_FRANQUICIADO]
**Cliente:** [NOMBRE_RESTAURANTE]
**Fecha:** [DÍA] de [MES] de [AÑO]

## 1. OBJETIVO DEL SLA
Este Acuerdo de Nivel de Servicio (SLA) cuantifica y establece los indicadores clave de rendimiento (KPIs) con los que Repaart medirá la calidad y eficiencia de la flota asignada a **[NOMBRE_RESTAURANTE]**.

## 2. INDICADORES CLAVE Y COMPROMISOS (KPIs)

### 2.1 Tiempos Promedio de Entrega (Delivery Time)
* **Métrica:** El tiempo transcurrido desde la recogida efectiva del pedido en el local hasta la entrega al cliente final.
* **Compromiso:** Se perseguirá un tiempo de entrega medio en radio estándar inferior a **[TIEMPO_PROM_MINUTOS] minutos**.

### 2.2 Tasa de Incidencias Controladas
* **Métrica:** Porcentaje de pedidos en los que el producto llega deteriorado, manipulado o derramado por causas única y exclusivamente imputables al motorista (no atribuibles al empaquetado original del local).
* **Compromiso:** Mantener la tasa de incidencia estructural por debajo del **[TASA_INCIDENCIAS_MAX]%** del volumen total mensual.

## 3. COMPROMISOS DEL CLIENTE (RESTAURANTE)
El cumplimiento normativo de estos SLAs por parte de Repaart está condicionado al cumplimiento correlativo por parte del restaurante de los siguientes puntos:
1. **Puntualidad de Preparación:** [Cargar cláusula de snippetLibrary: Penalización por Retraso en Restaurante]
2. **Robustez del Empaquetado:** [Cargar cláusula de snippetLibrary: Condiciones de Packaging (Embalaje)]

## 4. PENALIZACIONES CRUZADAS Y REEMBOLSOS
* **Responsabilidad Logística:** [Cargar cláusula de snippetLibrary: Límite de Responsabilidad de Mercancía]
* **Errores del Local:** [Cargar cláusula de snippetLibrary: Doble Viaje por Error del Restaurante]

Mediante este protocolo, ambas partes se comprometen a buscar la excelencia operativa conjunta.

Fdo. Proveedor: ___________________   Fdo. Cliente: ___________________`
    },
    {
        id: 'rider-policy',
        name: 'Política de Derechos Riders (Ley Rider)',
        description: 'Documento legal informativo sobre los derechos y obligaciones de los repartidores',
        category: 'policies',
        icon: 'Shield',
        placeholders: [
            'NOMBRE_DEL_FRANQUICIADO',
            'CIF_FRANQUICIA',
            'DIRECCIÓN_BASE',
            'TELÉFONO_FRANQUICIA',
            'EMAIL_FRANQUICIA',
            'AÑO'
        ],
        content: `# POLÍTICA DE GARANTÍAS LABORALES Y DERECHOS RIDER

**Empresa Titular:** [NOMBRE_DEL_FRANQUICIADO] (Red Operativa Repaart)
**C.I.F.:** [CIF_FRANQUICIA]
**Periodo de Vigencia:** Ejercicio [AÑO]

## 1. DECLARACIÓN DE CUMPLIMIENTO (LEY RIDER)
En estricto cumplimiento del **Real Decreto-ley 9/2021** (conocido como Ley Rider) y del Estatuto de los Trabajadores, [NOMBRE_DEL_FRANQUICIADO] declara formalmente el carácter laboral de sus repartidores, dotándoles de la protección íntegra de la Seguridad Social y velando por su seguridad jurídica y física.

## 2. EJE DE DERECHOS RECONOCIDOS

### 2.1. Información y Transparencia Algorítmica
Nuestros repartidores tienen garantizado el derecho a conocer de forma clara e inteligible:
* Los parámetros, reglas e instrucciones en los que se basan los algoritmos o sistemas de inteligencia artificial que inciden en la toma de decisiones.
* Los criterios que determinan el perfilado y la asignación de pedidos en la plataforma *Flyder*.
* Las evaluaciones de rendimiento en base a tiempos y eficiencia.

### 2.2. Seguridad Laboral y EPIs
* **[NOMBRE_DEL_FRANQUICIADO]** asume la provisión íntegra de Equipos de Protección Individual (EPIs): baúl homologado, indumentaria térmica transpirable y sistemas de comunicación seguros.
* La empresa garantiza la revisión y el mantenimiento preventivo y correctivo periódico del parque móvil (motocicletas y ciclomotores).

### 2.3. Desconexión Digital y Conciliación
Se respeta rigurosamente el derecho a la desconexión digital de los trabajadores fuera del horario legal o pactado de prestación de servicios, garantizando el respeto de los tiempos de descanso estatutarios.

## 3. CONTACTO Y REPRESENTACIÓN SINDICAL
Para cualquier reclamación, consulta sobre condiciones laborales o requerimientos sindicales, nuestro buzón y vías de comunicación directa son:

**Domicilio Social:** [DIRECCIÓN_BASE]
**Atención Telefónica:** [TELÉFONO_FRANQUICIA]
**Buzón Directo (Correo Electrónico):** [EMAIL_FRANQUICIA]

*Este documento tiene carácter público y forma parte del contrato marco operacional entre [NOMBRE_DEL_FRANQUICIADO] y sus locales asociados (Restaurantes), garantizando que todos los eslabones de la cadena actúan bajo legalidad.*`
    }
];

// Helper para buscar plantillas
export const searchTemplates = (templates: ContractTemplate[], query: string): ContractTemplate[] => {
    if (!query.trim()) return templates;

    const searchTerm = query.toLowerCase();
    return templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm)
    );
};

export default CONTRACT_TEMPLATES;
