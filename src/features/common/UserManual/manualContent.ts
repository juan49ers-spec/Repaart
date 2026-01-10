import { Book, LayoutDashboard, DollarSign, Calendar, Truck, LifeBuoy, GraduationCap } from 'lucide-react';

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
    {
        id: 'intro',
        title: 'Introducción',
        icon: Book,
        role: 'all',
        content: [
            {
                title: 'Bienvenido a Repaart Finanzas',
                body: `Esta plataforma es tu centro de control integral para la gestión de tu franquicia. Desde aquí podrás administrar tus finanzas, operaciones, logística y aprendizaje continuo.
                
La aplicación está diseñada con una interfaz **"Executive Glass"**, priorizando la claridad visual y la facilidad de uso.`
            },
            {
                title: 'Navegación',
                body: `La barra lateral izquierda es tu menú principal. Pasa el cursor sobre los iconos para ver las etiquetas.
                
*   **Modo Oscuro/Claro**: Puedes alternar el tema visual desde el icono de sol/luna en la esquina inferior izquierda.
*   **Perfil**: Accede a la configuración de tu cuenta haciendo clic en tu avatar.`
            }
        ]
    },
    {
        id: 'dashboard',
        title: 'Dashboard y KPIs',
        icon: LayoutDashboard,
        role: 'franchise',
        content: [
            {
                title: 'Visión General',
                body: `El Dashboard principal te ofrece una radiografía en tiempo real de tu negocio.
                
*   **KPIs (Indicadores Clave)**: Tarjetas superiores que muestran Facuración Estimada, Eficiencia Operativa, y Ticket Medio.
*   **Gráficos de Tendencia**: Visualiza la evolución de tus ingresos mes a mes.
*   **Widgets de Salud**: El widget de "Inteligencia de Negocio" te alerta sobre anomalías o tendencias positivas.`
            },
            {
                title: 'Acciones Rápidas',
                body: `Utiliza el panel de "Acciones Rápidas" en la parte superior derecha para accesos directos comunes como:
*   Crear Nuevo Ticket
*   Registrar Ingreso/Gasto
*   Ver Calendario`
            }
        ]
    },
    {
        id: 'finance',
        title: 'Gestión Financiera',
        icon: DollarSign,
        role: 'franchise',
        content: [
            {
                title: 'Registro de Operaciones',
                body: `Mantén tus cuentas al día registrando cada movimiento.
                
1.  Ve a la sección **Finanzas**.
2.  Pulsa en **"Nuevo Registro"**.
3.  Selecciona si es **Ingreso** o **Gasto**.
4.  Rellena los detalles y guarda.
                
Los gráficos se actualizarán automáticamente.`
            },
            {
                title: 'Cierres Mensuales',
                body: `Al finalizar el mes, debes realizar el "Cierre Mensual". Esto bloquea los registros de ese mes y genera el reporte para la administración.
                
Busca el botón **"Realizar Cierre"** en el panel de resumen mensual.`
            }
        ]
    },
    {
        id: 'operations',
        title: 'Operaciones y Agenda',
        icon: Calendar,
        role: 'franchise',
        content: [
            {
                title: 'Agenda Semanal',
                body: `La vista de **Operaciones** te muestra tu calendario de trabajo.
                
*   **Eventos**: Arrastra y suelta para reorganizar citas.
*   **Detalles**: Haz clic en un evento para ver la dirección del cliente y detalles del servicio.
*   **Sincronización**: Los cambios se reflejan en tiempo real.`
            }
        ]
    },
    {
        id: 'logistics',
        title: 'Logística y Tarifas',
        icon: Truck,
        role: 'franchise',
        content: [
            {
                title: 'Configuración de Zonas',
                body: `Define tus áreas de servicio y tarifas de desplazamiento.
                
*   **Tarifas por Distancia**: Configura el precio por kilómetro para desplazamientos largos.
*   **Áreas de Cobertura**: Visualiza en el mapa tus zonas activas.`
            }
        ]
    },
    {
        id: 'support',
        title: 'Soporte y Ayuda',
        icon: LifeBuoy,
        role: 'all',
        content: [
            {
                title: 'Centro de Tickets',
                body: `¿Tienes un problema? Abre un ticket de soporte.
                
1.  Ve a **Soporte**.
2.  Pulsa en **"Nuevo Ticket"**.
3.  Elige la categoría (Técnico, Financiero, etc.) y describe el problema.
4.  Podrás chatear con los administradores dentro del ticket.`
            },
            {
                title: 'Recursos',
                body: `En esta sección (donde estás ahora) encontrarás manuales, guías en PDF y documentos importantes para la operativa diaria.`
            }
        ]
    },
    {
        id: 'academy',
        title: 'Academia',
        icon: GraduationCap,
        role: 'all',
        content: [
            {
                title: 'Formación Continua',
                body: `Accede a cursos y lecciones para mejorar tus habilidades.
                
*   **Lecciones**: Contenido multimedia y texto.
*   **Quizzes**: Pon a prueba tus conocimientos al final de cada módulo.`
            }
        ]
    },
    {
        id: 'admin_control',
        title: 'Control Center',
        icon: LayoutDashboard,
        role: 'admin',
        content: [
            {
                title: 'Supervisión de Red',
                body: `Tu Dashboard te da una visión global de todas las franquicias.
                
*   **Mapa de Red**: Ubicación de todas las unidades activas.
*   **Alertas Sheriff**: Notificaciones sobre franquicias con bajo rendimiento o pagos pendientes.`
            }
        ]
    },
    {
        id: 'admin_kanban',
        title: 'Kanban Organizativo',
        icon: LayoutDashboard,
        role: 'admin',
        content: [
            {
                title: 'Gestión de Tareas',
                body: `Organiza el flujo de trabajo interno con el tablero Kanban.
                
*   **Arrastrar y Soltar**: Mueve tarjetas entre columnas (Por Hacer, En Progreso, Hecho).
*   **Filtros**: Filtra por prioridad o etiquetas para enfocarte en lo importante.`
            }
        ]
    }
];
