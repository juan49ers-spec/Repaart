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
        intro: 'Vista general del rendimiento de tu franquicia, ahora con diseño responsivo "Sidebar Safe".',
        sections: [
            {
                title: '📊 Indicadores Clave (KPIs)',
                items: [
                    {
                        term: 'Flash de Ventas',
                        definition: 'Visualización rápida de facturación vs periodo anterior.',
                        tip: '💡 Los widgets se adaptan automáticamente: 2 columnas en portátil, 4 en monitor grande.'
                    },
                    {
                        term: 'Take Home (Bolsillo)',
                        definition: 'Dinero real disponible tras gastos operativos e impuestos.',
                        tip: '💡 Mantén un ojo en el semáforo de salud operacional dentro del widget.'
                    }
                ]
            }
        ]
    },
    operations: {
        id: 'operations',
        title: 'Operativa & Riders',
        icon: <Clock className="w-6 h-6" />,
        color: 'blue',
        intro: 'Centro de mando para tu flota. Gestiona horarios, riders y motos desde un único lugar.',
        sections: [
            {
                title: '📅 Planificador (Scheduler)',
                items: [
                    {
                        term: 'Filas de Riders',
                        definition: 'Ahora con diseño alternado (zebra) para distinguir mejor cada fila en horarios densos.',
                        tip: '💡 Haz clic derecho en un turno para ver opciones rápidas: Validar, Clonar o Borrar.'
                    },
                    {
                        term: 'Snap & Ghost',
                        definition: 'Arrastra turnos viendo una previsualización semitransparente antes de soltar.',
                        tip: '💡 Facilita mover turnos complejos sin perder la referencia visual.'
                    }
                ]
            },
            {
                title: '🏍️ Flota y Motos',
                items: [
                    {
                        term: 'Grid de Vehículos',
                        definition: 'Nueva vista de tarjetas premium para monitorear estado, batería y mantenimientos.',
                        tip: '💡 Filtra rápidamente por motos "En Taller" o "Disponibles".'
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
        intro: 'Forma a tu equipo con módulos interactivos y seguimiento de progreso.',
        sections: [
            {
                title: '📚 Experiencia de Lectura',
                items: [
                    {
                        term: 'Modo Cine',
                        definition: 'Lectura inmersiva con tipografía optimizada y sin distracciones.',
                        tip: '💡 Ideal para que los riders completen cursos desde el móvil.'
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
        intro: 'Accede a tu cuenta y ajustes desde la nueva ubicación en el Sidebar.',
        sections: [
            {
                title: '⚙️ Nueva Navegación',
                items: [
                    {
                        term: 'Menú de Usuario',
                        definition: 'Ahora situado en la parte inferior del menú lateral (esquina inferior izquierda).',
                        tip: '💡 Haz clic en tu avatar abajo a la izquierda para ver "Mi Perfil" o "Cerrar Sesión".'
                    },
                    {
                        term: 'Modo Oscuro',
                        definition: 'Alterna entre tema claro y oscuro desde el botón junto a tu versión de app.',
                        tip: '💡 El tema oscuro ahorra batería en dispositivos OLED.'
                    }
                ]
            }
        ]
    },
    sidebar_config: {
        id: 'sidebar_config',
        title: 'Configuración Financiera',
        icon: <Settings className="w-6 h-6" />,
        color: 'amber',
        intro: 'Ajusta los parámetros de tu modelo de negocio.',
        sections: [
            {
                title: '📦 Tarifas y Costes',
                items: [
                    {
                        term: 'Estructura de Costes',
                        definition: 'Define precios por pedido y tramos de distancia.',
                        tip: '💡 Los cambios aquí afectan al cálculo retroactivo del mes en curso.'
                    }
                ]
            }
        ]
    },
    support: {
        id: 'support',
        title: 'Ayuda y Soporte',
        icon: <MessageSquare className="w-6 h-6" />,
        color: 'rose',
        intro: 'Centro de resolución de dudas y contacto con central.',
        sections: [
            {
                title: '🎫 Tickets',
                items: [
                    {
                        term: 'Categorías',
                        definition: 'Clasifica tu duda (Técnica, Operativa, Financiera) para una respuesta más rápida.',
                        tip: '💡 Revisa las FAQ antes de abrir un ticket, ¡la respuesta podría estar ya ahí!'
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
        intro: 'Documentación oficial, contratos y manuales operativos.',
        sections: [
            {
                title: '📂 Archivos',
                items: [
                    {
                        term: 'Playbooks',
                        definition: 'Guías paso a paso para situaciones comunes (Accidentes, Inspecciones).',
                        tip: '💡 Descarga los PDFs importantes para tenerlos disponibles offline.'
                    }
                ]
            }
        ]
    }
};
