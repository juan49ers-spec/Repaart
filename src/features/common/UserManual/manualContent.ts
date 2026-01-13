import {
    Book,
    LayoutDashboard,
    DollarSign,
    Calendar,
    Truck,
    LifeBuoy,
    GraduationCap,
    Users,
    Settings,
    FolderOpen,
    Activity,
    Shield,
    Search,
    FileText,
    AlertTriangle,
    CheckCircle
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
        title: 'Centro de Mando (Dashboard)',
        icon: LayoutDashboard,
        role: 'admin',
        content: [
            {
                title: 'Visión de Alto Nivel',
                body: `El Dashboard Admin no es solo un resumen; es un centro de control operativo.
                
*   **Métricas en Tiempo Real**: Las tarjetas superiores ("Active Franchises", "Total Revenue") se actualizan en vivo.
*   **Estado del Sistema**: El widget "System Health" monitoriza la latencia de la base de datos y el estado de los servidores de autenticación.
*   **Mapa de Red**: Visualiza la distribución geográfica de tus unidades. Un punto rojo indica una alerta crítica.`
            },
            {
                title: 'Inteligencia Artificial (Anomaly Detector)',
                body: `El sistema monitoriza constantemente los flujos financieros en busca de irregularidades.
                
**¿Qué detecta?**
*   **Caídas de Ingresos**: Si una franquicia reporta 0€ en un día laborable.
*   **Márgenes Críticos**: Si los gastos superan el 95% de los ingresos.
*   **Patrones Inusuales**: Picos de facturación no justificados.

Cuando veas una alerta en el widget de "Inteligencia", haz clic para ver el detalle y contactar con la franquicia.`
            }
        ]
    },
    {
        id: 'user_management',
        title: 'Gestión de Usuarios',
        icon: Users,
        role: 'admin',
        content: [
            {
                title: 'Alta de Nuevas Unidades',
                body: `El proceso de alta es crítico para la seguridad.
                
1.  Navega a la pestaña **Usuarios**.
2.  Pulsa **"Crear Usuario"**.
3.  **Roles**:
    *   **Franquicia**: Propietarios de unidad. Necesitan un ID de ubicación único.
    *   **Admin**: Acceso total. *Úsalo con precaución*.
    *   **Rider**: Personal de reparto. Se asignan a una franquicia específica.
    
**Importante**: La contraseña temporal debe ser comunicada por un canal seguro (ej. en persona o llamada), nunca por email.`
            },
            {
                title: 'Control de Seguridad',
                body: `Desde la tabla de usuarios puedes:
*   **Resetear Contraseña**: Si un usuario la olvida.
*   **Desactivar Cuenta**: Para empleados que abandonan la empresa. El acceso se revoca inmediatamente.
*   **Auditoría de Accesos**: Ver cuándo fue la última vez que un usuario inició sesión.`
            }
        ]
    },
    {
        id: 'global_finance',
        title: 'Finanzas Globales',
        icon: DollarSign,
        role: 'admin',
        content: [
            {
                title: 'Flujo de Validación Mensual',
                body: `Como Admin, eres el responsable de validar la salud financiera de la red.
                
**El Ciclo de Cierre:**
1.  La Franquicia envía su cierre (días 1-5 del mes).
2.  Aparece en tu **Bandeja de Entrada Financiera**.
3.  **Revisión**: Analiza los Ticket Medio y el Margen Operativo.
4.  **Decisión**:
    *   **Validar**: Los datos se consolidan.
    *   **Rechazar**: Debes aportar una razón. La franquicia recibe una notificación para corregir.
    
**Bloqueo**: Una vez validado, el mes queda "sellado" y no se puede modificar.`
            },
            {
                title: 'Análisis de Tendencias',
                body: `Usa los gráficos comparativos para detectar tendencias a medio plazo.
                
*   **Línea Verde**: Crecimiento sostenido.
*   **Línea Roja**: Declive. Investiga si es estacional o un problema operativo.`
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
