import React from 'react';
import { LayoutDashboard, GraduationCap, UserCircle, MessageSquare, BookOpen, Clock, Settings } from 'lucide-react';

export interface HelpItem {
    term: string;
    definition: string;
    example?: string;
    tip?: string;
}

export interface PageHelpContent {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: 'indigo' | 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';
    intro: string;
    sections: {
        title: string;
        items: HelpItem[];
    }[];
}

export const pageHelpData: Record<string, PageHelpContent> = {
    dashboard: {
        id: 'dashboard',
        title: 'Panel de Control (Cockpit)',
        icon: <LayoutDashboard className="w-6 h-6" />,
        color: 'indigo',
        intro: 'Vista general del rendimiento de tu franquicia en tiempo real.',
        sections: [
            {
                title: '📊 Indicadores Clave (KPIs)',
                items: [
                    {
                        term: 'Ingresos Brutos',
                        definition: 'Total facturado antes de gastos.',
                        tip: '💡 Comprueba la proyección a fin de mes para ver si cumplirás tus objetivos.'
                    },
                    {
                        term: 'Bolsillo (Neto)',
                        definition: 'Dinero real que te queda tras pagar personal, impuestos y gastos.',
                        tip: '💡 Mantén un ojo en el semáforo de salud operacional.'
                    }
                ]
            }
        ]
    },
    operations: {
        id: 'operations',
        title: 'Gestión Operativa',
        icon: <Clock className="w-6 h-6" />,
        color: 'blue',
        intro: 'Controla el día a día de tus riders y la flota de motos.',
        sections: [
            {
                title: '📅 Cuadrante Semanal',
                items: [
                    {
                        term: 'Asignación de Turnos',
                        definition: 'Planificación de horarios para tus riders.',
                        tip: '💡 Usa el autocompletado para ahorrar tiempo en turnos recurrentes.'
                    }
                ]
            },
            {
                title: '🏍️ Gestión de Flota',
                items: [
                    {
                        term: 'Mantenimiento',
                        definition: 'Registro de reparaciones y estado de las motos.',
                        tip: '💡 Un buen mantenimiento reduce el gasto de gasolina y evita accidentes.'
                    }
                ]
            }
        ]
    },
    academy: {
        id: 'academy',
        title: 'Academy & Formación',
        icon: <GraduationCap className="w-6 h-6" />,
        color: 'emerald',
        intro: 'Forma a tu equipo y mejora tus propias habilidades de gestión.',
        sections: [
            {
                title: '📚 Módulos de Aprendizaje',
                items: [
                    {
                        term: 'Cursos Activos',
                        definition: 'Material educativo sobre optimización de rutas y seguridad.',
                        tip: '💡 Asegúrate de que tus nuevos riders completen la formación básica.'
                    }
                ]
            }
        ]
    },
    profile: {
        id: 'profile',
        title: 'Perfil y Configuración',
        icon: <UserCircle className="w-6 h-6" />,
        color: 'purple',
        intro: 'Datos de tu franquicia y personalización de la cuenta.',
        sections: [
            {
                title: '⚙️ Preferencias',
                items: [
                    {
                        term: 'Datos de Contacto',
                        definition: 'Email y teléfono para comunicaciones oficiales.',
                        tip: '💡 Mantén estos datos actualizados para recibir alertas críticas.'
                    }
                ]
            }
        ]
    },
    sidebar_config: {
        id: 'sidebar_config',
        title: 'Panel de Configuración',
        icon: <Settings className="w-6 h-6" />,
        color: 'amber',
        intro: 'Ajusta los parámetros financieros y operativos de tu mes fiscal.',
        sections: [
            {
                title: '📦 Pedidos',
                items: [
                    {
                        term: 'Tarifas',
                        definition: 'Desglose de pedidos por distancia (KM).',
                        tip: '💡 Introduce el número exacto de pedidos cerrados en cada rango para una facturación precisa.'
                    }
                ]
            },
            {
                title: '👷 Laboral',
                items: [
                    {
                        term: 'Riders Contratados',
                        definition: 'Número de repartidores dados de alta.',
                        tip: '💡 No olvides incluir al gerente si este realiza labores operativas.'
                    }
                ]
            },
            {
                title: '🏦 Fiscalidad',
                items: [
                    {
                        term: 'IRPF Estimado',
                        definition: 'Porcentaje de retención para el pago a cuenta.',
                        tip: '💡 Un IRPF bien ajustado evita sorpresas en la declaración anual.'
                    }
                ]
            }
        ]
    },
    support: {
        id: 'support',
        title: 'Centro de Soporte',
        icon: <MessageSquare className="w-6 h-6" />,
        color: 'rose',
        intro: 'Canal directo para resolver incidencias, solicitar ayuda técnica y gestionar tu cuenta.',
        sections: [
            {
                title: '🎫 Gestión de Tickets',
                items: [
                    {
                        term: '1. Crear Nuevo Ticket',
                        definition: 'Usa el botón "Nuevo Ticket" para reportar problemas técnicos, dudas operativas o solicitudes administrativas.',
                        tip: '💡 Selecciona la categoría correcta (Técnica, Financiera, Operativa) para que llegue al departamento adecuado más rápido.'
                    },
                    {
                        term: '2. Seguimiento y Estado',
                        definition: 'Consulta la tabla de historial para ver el progreso de tus solicitudes.',
                        example: '🟢 Abierto | 🟡 En Proceso | 🔴 Resuelto',
                        tip: '💡 Recibirás notificaciones cuando un agente responda o cambie el estado de tu ticket.'
                    }
                ]
            },
            {
                title: '👤 Mi Perfil de Franquiciado',
                items: [
                    {
                        term: 'Datos de Contacto',
                        definition: 'Asegúrate de que tu teléfono y email de emergencias estén siempre actualizados.',
                        tip: '💡 La central utilizará estos datos para comunicaciones urgentes sobre cierres o incidencias de red.'
                    },
                    {
                        term: 'Seguridad',
                        definition: 'Gestión de contraseña y sesiones activas.',
                        tip: '💡 Recomendamos cambiar tu contraseña cada 3 meses por seguridad.'
                    }
                ]
            }
        ]
    },
    resources: {
        id: 'resources',
        title: 'Centro de Recursos',
        icon: <BookOpen className="w-6 h-6" />,
        color: 'blue',
        intro: 'Biblioteca digital integral con toda la documentación operativa, manuales y guías de la franquicia.',
        sections: [
            {
                title: '📖 Manuales Operativos (Playbooks)',
                items: [
                    {
                        term: 'Protocolos de Emergencia',
                        definition: 'Guías paso a paso para actuar ante accidentes, robos o inspecciones.',
                        example: '🛡️ Protocolo Accidentes | 🔧 Mantenimiento',
                        tip: '💡 Ten siempre impresa una copia del Protocolo de Accidentes en el tablón de la tienda.'
                    },
                    {
                        term: 'Guías de Excelencia',
                        definition: 'Mejores prácticas para mejorar tu puntuación de calidad y servicio.',
                        tip: '💡 Consulta la guía "Atención al Cliente" para entrenar a tus nuevos empleados.'
                    }
                ]
            },
            {
                title: '📂 Navegación y Visualización',
                items: [
                    {
                        term: 'Buscador Inteligente',
                        definition: 'Localiza documentos rápidamente buscando por nombre, categoría o tipo de archivo.',
                        tip: '💡 Puedes buscar "Factura" o "Contrato" para filtrar resultados al instante.'
                    },
                    {
                        term: 'Vista Previa Instantánea',
                        definition: 'Visualiza PDFs e imágenes directamente en la plataforma sin necesidad de descargarlos.',
                        example: '👁️ Icono de Ojo',
                        tip: '💡 Usa la vista de cuadrícula para identificar visualmente los documentos por su portada.'
                    }
                ]
            }
        ]
    }
};
