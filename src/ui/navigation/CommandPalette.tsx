import { useEffect, useState, type FC, type ReactNode } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Calculator,
    Truck,
    Users,
    FileText,
    Settings,
    Plus,
    ArrowRight
} from 'lucide-react';

// Estilos base para cmdk (puedes ponerlos en index.css, pero aquí funcionan inline con Tailwind)
const commandStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '640px',
    zIndex: 9999, // Siempre encima
};

interface ItemProps {
    children: ReactNode;
    onSelect: () => void;
}

// Sub-componente para los items de la lista (Estilo Hover)
const Item: FC<ItemProps> = ({ children, onSelect }) => {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center px-3 py-2.5 rounded-lg text-sm text-slate-300 aria-selected:bg-blue-600 aria-selected:text-white cursor-pointer transition-all mb-1"
        >
            {children}
        </Command.Item>
    );
};

const CommandPalette: FC = () => {
    const [open, setOpen] = useState<boolean>(false);
    const navigate = useNavigate();

    // Toggle con Ctrl+K o Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <>
            {/* Backdrop Blur Oscuro */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
                onClick={() => setOpen(false)}
            />

            <div style={commandStyle} className="animate-in zoom-in-95 fade-in duration-200">
                <Command
                    label="Global Command Menu"
                    className="bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col w-full"
                >
                    {/* Input */}
                    <div className="flex items-center px-4 border-b border-slate-800">
                        <Search className="w-5 h-5 text-slate-500 mr-3" />
                        <Command.Input
                            placeholder="¿Qué necesitas hacer?..."
                            className="w-full bg-transparent py-4 text-slate-200 placeholder:text-slate-600 outline-none text-base font-medium"
                        />
                        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-900 border border-slate-800 rounded">
                            ESC
                        </kbd>
                    </div>

                    {/* List */}
                    <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-smooth">
                        <Command.Empty className="py-6 text-center text-sm text-slate-500">
                            No se encontraron resultados.
                        </Command.Empty>

                        <Command.Group heading="Acciones Rápidas" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
                            <Item onSelect={() => runCommand(() => console.log('New Moto'))}>
                                <Plus className="w-4 h-4 mr-2 text-emerald-400" />
                                <span>Registrar Nueva Moto</span>
                            </Item>
                            <Item onSelect={() => runCommand(() => console.log('New Rider'))}>
                                <Plus className="w-4 h-4 mr-2 text-blue-400" />
                                <span>Añadir Rider</span>
                            </Item>
                            <Item onSelect={() => runCommand(() => console.log('Close Month'))}>
                                <Calculator className="w-4 h-4 mr-2 text-amber-400" />
                                <span>Registrar Cierre Mensual</span>
                            </Item>
                        </Command.Group>

                        <Command.Separator className="h-px bg-slate-800 my-2" />

                        <Command.Group heading="Navegación" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
                            <Item onSelect={() => runCommand(() => navigate('/admin/finance'))}>
                                <FileText className="w-4 h-4 mr-2" /> Finanzas
                            </Item>
                            <Item onSelect={() => runCommand(() => navigate('/admin?view=users'))}>
                                <Users className="w-4 h-4 mr-2" /> Usuarios (Admin)
                            </Item>
                            <Item onSelect={() => runCommand(() => navigate('/admin/operations'))}>
                                <Truck className="w-4 h-4 mr-2" /> Operaciones y Flota
                            </Item>
                            {/* Roadmap removed */}
                            <Item onSelect={() => runCommand(() => navigate('/settings'))}>
                                <Settings className="w-4 h-4 mr-2" /> Configuración Global
                            </Item>
                        </Command.Group>

                        <Command.Group heading="Ayuda" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 mt-2">
                            <Item onSelect={() => runCommand(() => window.open('https://soporte.repaart.com', '_blank'))}>
                                <ArrowRight className="w-4 h-4 mr-2" /> Contactar Soporte Técnico
                            </Item>
                        </Command.Group>
                    </Command.List>
                </Command >
            </div >
        </>
    );
};

export default CommandPalette;
