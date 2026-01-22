import {
    Book,
    LayoutDashboard,
    DollarSign,
    Calendar,
    Users,
    Settings,
    FolderOpen
} from 'lucide-react';

export interface ManualTopic {
    id: string;
    title: string;
    icon: any;
    role: 'all' | 'admin' | 'franchise';
    content: {
        title: string;
        body: string; // Markdown supported
    }[];
}

export const MANUAL_TOPICS: ManualTopic[] = [
    // --- INTRO & COMMON ---
    {
        id: 'intro',
        title: 'Introducción Exclusiva',
        icon: Book,
        role: 'all',
        content: [
            {
                title: 'Bienvenido a Repaart Finanzas',
                body: `Bienvenido a la plataforma centralizada de gestión. Esta herramienta ha sido diseñada bajo la filosofía **"Executive Glass"**, combinando una estética premium con funcionalidades críticas de negocio.
                
Su objetivo es servir como la única fuente de la verdad para toda la operativa financiera, logística y de recursos humanos de la red.`
            },
            {
                title: 'Primeros Pasos',
                body: `La interfaz se divide en dos áreas principales:
                
1.  **Barra Lateral de Navegación**: Acceso rápido a todos los módulos (Dashboard, Usuarios, Finanzas, etc.).
2.  **Área de Trabajo Principal**: Donde ocurre la acción. Cambia dinámicamente según el módulo seleccionado.

**Tip Pro**: Usa el atajo \`Ctrl + K\` (o el icono de lupa) para abrir la búsqueda global en cualquier momento.`
            }
        ]
    },

    // --- ADMIN MODULES ---
    {
        id: 'admin_dashboard',
        title: 'Centro de Control (Global)',
        icon: LayoutDashboard,
        role: 'admin',
        content: [
            {
                title: 'Arquitectura del Centro de Control',
                body: `El **Centro de Control** es el corazón operativo del Administrador. Se divide en tres zonas de monitorización crítica:
                
1.  **Estado de la Red (Health)**: Visualiza de forma agregada el rendimiento de todas las franquicias activas. El color de los indicadores determina la urgencia de intervención técnica o comercial.
2.  **Acciones Pendientes**: Tu lista de tareas tácticas. Aquí aparecen aprobaciones de cierres mensuales, solicitudes de soporte y alertas de mantenimiento de flota.
3.  **Ingresos Administrativos**: Seguimiento de los Royalties y Fees recolectados por la red en el mes seleccionado.

**Tip**: El Centro de Control se sincroniza en tiempo real con la base de datos de Firestore para asegurar datos frescos.`
            },
            {
                title: 'Capa de Inteligencia Artificial',
                body: `En la parte inferior del Dashboard reside el módulo de **Inteligencia Artificial**.
                
Este sistema analiza los KPIs principales de cada franquicia para detectar:
*   **Anomalías de Facturación**: Desviaciones estadísticas fuera de la normalidad.
*   **Riesgo de Margen**: Alertas cuando los costes operativos amenazan la viabilidad de una unidad.
*   **Previsiones de Crecimiento**: Algoritmos predictivos que sugieren qué unidades están listas para escalar.

Utiliza el widget de Inteligencia para priorizar tus auditorías semanales.`
            }
        ]
    },
    {
        id: 'user_management',
        title: 'Gestión de Estructura',
        icon: Users,
        role: 'admin',
        content: [
            {
                title: 'Alta y Onboarding de Franquicias',
                body: `El crecimiento de la red se gestiona desde el flujo de **Recrutamiento**.
                
1.  **Creación**: Define el nombre de la unidad e ID único (Slug).
2.  **Configuración de Tarifas**: Asigna el modelo de Royalties (Fixed vs Variable) específico para esa ubicación.
3.  **Roles Especiales**:
    *   **Manager de Franquicia**: Acceso total a la unidad local.
    *   **Rider**: Acceso simplificado (PWA) centrado únicamente en su horario y perfil.
    
**Seguridad**: El sistema genera logs de auditoría por cada usuario creado o modificado.`
            },
            {
                title: 'Protocolo de Seguridad (Auditoría)',
                body: `Como Administrador, tienes acceso al **Registro de Auditoría** (Escudo de Seguridad).
                
Este panel registra:
*   **IP de Conexión**: Ubicación desde donde se operan las finanzas.
*   **Cambios de Datos**: Quién cambió un valor de facturación y cuándo.
*   **Intentos de Acceso**: Monitorización de seguridad proactiva contra accesos no autorizados.

Usa el botón de **Auditoría** en la barra superior para acceder instantáneamente a la traza completa de eventos.`
            }
        ]
    },
    {
        id: 'global_finance',
        title: 'Validación Financiera',
        icon: DollarSign,
        role: 'admin',
        content: [
            {
                title: 'Bandeja de Entrada de Cierres',
                body: `El flujo financiero administrativo se centra en la **Validación de Cierres**.
                
1.  **Recepción**: Las franquicias envían sus datos del mes vencido.
2.  **Análisis de Desviación**: Compara el rendimiento actual vs el mes anterior.
3.  **Sellado de Datos**: Al aprobar un cierre, los datos se vuelven inmutables para la franquicia, garantizando la integridad de los reportes anuales.
    
**Decisión Crítica**: Si rechazas un cierre, el sistema reabre automáticamente el periodo para la franquicia y le notifica los cambios requeridos.`
            },
            {
                title: 'Red de Pagos y Royalties',
                body: `Visualiza el balance consolidado de la red. El sistema calcula automáticamente el IVA soportado a nivel global, facilitando los modelos de liquidación trimestral.`
            }
        ]
    },
    {
        id: 'digital_vault',
        title: 'Bóveda Digital (Recursos)',
        icon: FolderOpen,
        role: 'admin',
        content: [
            {
                title: 'Gestión de Conocimiento',
                body: `La Bóveda Digital es el repositorio oficial de la empresa. Todo lo que subas aquí es visible para la red.
                
**Estructura Recomendada:**
*   **Marco Legal**: Contratos y normativas.
*   **Manuales Operativos**: Guías paso a paso (como esta).
*   **Activos de Marca**: Logos y plantillas de marketing.
                
**Tip**: Usa el botón "Pin" (chincheta) para fijar documentos importantes al inicio de la lista.`
            },
            {
                title: 'Subida de Archivos',
                body: `El sistema previsualiza automáticamente PDFs e imágenes.
                
1.  Pulsa **"Subir Nuevo Recurso"**.
2.  Arrastra el archivo o búscalo en tu PC.
3.  Asigna una **Categoría** correcta (clave para que lo encuentren).
4.  Pulsa **Subir**.
                
*Límite de tamaño: 25MB por archivo.*`
            }
        ]
    },
    {
        id: 'system_settings',
        title: 'Configuración del Sistema',
        icon: Settings,
        role: 'admin',
        content: [
            {
                title: 'Ajustes Globales',
                body: `Aquí defines las reglas del juego para toda la red.
                
*   **Límites de Gastos**: Umbrales que disparan alertas automáticas.
*   **Notificaciones**: Configura qué eventos envían email además de aviso in-app.
*   **Mantenimiento**: Opción para poner la plataforma en modo "Solo Lectura" durante actualizaciones.`
            },
            {
                title: 'Logs de Auditoría',
                body: `El sistema registra *cada acción* importante (creación de usuario, borrado de archivo, validación financiera).
                
Usa el buscador de logs para investigar incidentes de seguridad o errores operativos. Cada entrada incluye: Quién, Qué, Cuándo y Desde dónde (IP).`
            }
        ]
    },

    // --- FRANCHISE MODULES (Resumed) ---
    {
        id: 'franchise_dashboard',
        title: 'Mi Negocio (Dashboard)',
        icon: LayoutDashboard,
        role: 'franchise',
        content: [
            {
                title: 'Tus Métricas',
                body: `Tu panel principal se enfoca en lo que importa hoy.
*   **Facturación Estimada**: Proyección de cierre de mes.
*   **Eficiencia**: Ratio de tickets por hora trabajada.
*   **Avisos**: Recordatorios de cierres pendientes o documentos nuevos.`
            }
        ]
    },
    {
        id: 'franchise_finance',
        title: 'Mis Finanzas',
        icon: DollarSign,
        role: 'franchise',
        content: [
            {
                title: 'Registro Diario',
                body: `La disciplina es clave. Registra tus tickets al final de cada jornada.
                
El sistema acumula automáticamente tus ingresos y calcula el desglose de IVA y Royalties estimados en tiempo real.`
            }
        ]
    },
    {
        id: 'franchise_ops',
        title: 'Operativa Diaria',
        icon: Calendar,
        role: 'franchise',
        content: [
            {
                title: 'Agenda y Citas',
                body: `Gestiona tus servicios programados. La vista de calendario te permite arrastrar citas para reprogramarlas.
                
Recuerda marcar las citas como "Completadas" para que sumen a tu productividad.`
            }
        ]
    }
];
