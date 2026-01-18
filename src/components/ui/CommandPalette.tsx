import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ArrowRight, User, Truck, DollarSign, Settings, FileText, Zap } from 'lucide-react';

interface CommandItem {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
    category: 'Navigation' | 'Actions' | 'Tools';
}

const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // --- COMMAND DEFINITIONS ---
    const commands: CommandItem[] = [
        // Navigation
        { id: 'nav-dashboard', title: 'Dashboard', category: 'Navigation', icon: <Zap className="w-4 h-4" />, action: () => navigate('/') },
        { id: 'nav-users', title: 'Usuarios', category: 'Navigation', icon: <User className="w-4 h-4" />, action: () => navigate('/admin/users') },
        { id: 'nav-fleet', title: 'Flota', category: 'Navigation', icon: <Truck className="w-4 h-4" />, action: () => navigate('/admin/vehicles') },
        { id: 'nav-finance', title: 'Finanzas', category: 'Navigation', icon: <DollarSign className="w-4 h-4" />, action: () => navigate('/admin/finance') },
        { id: 'nav-settings', title: 'Configuración', category: 'Navigation', icon: <Settings className="w-4 h-4" />, action: () => navigate('/admin/settings/general') },

        // Actions
        { id: 'act-create-user', title: 'Crear Nuevo Usuario', subtitle: 'Registrar un nuevo usuario en la plataforma', category: 'Actions', icon: <User className="w-4 h-4 text-emerald-500" />, action: () => navigate('/admin/users?action=create') },
        { id: 'act-add-vehicle', title: 'Añadir Moto', subtitle: 'Registrar nuevo vehículo en la flota', category: 'Actions', icon: <Truck className="w-4 h-4 text-blue-500" />, action: () => navigate('/admin/vehicles?action=create') },
        { id: 'act-report', title: 'Generar Reporte Mensual', category: 'Actions', icon: <FileText className="w-4 h-4 text-purple-500" />, action: () => console.log('Report logic') },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(query.toLowerCase()))
    );

    // --- EFFECT: KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelect = (index: number) => {
        const cmd = filteredCommands[index];
        if (cmd) {
            cmd.action();
            setIsOpen(false);
        }
    };

    // Keyboard Nav inside Palette
    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelect(selectedIndex);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 slide-in-from-top-4 duration-200 flex flex-col">

                {/* Search Header */}
                <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Escribe un comando o busca..."
                        className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400"
                        value={query}
                        autoFocus
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleInputKeyDown}
                    />
                    <div className="flex items-center gap-2">
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">ESC</kbd>
                    </div>
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredCommands.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <p className="text-sm">No se encontraron resultados.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Group by category logic or flat list for now */}
                            {filteredCommands.map((cmd, idx) => (
                                <button
                                    key={cmd.id}
                                    onClick={() => handleSelect(idx)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={`
                                        w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-150 text-left
                                        ${idx === selectedIndex
                                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-100'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }
                                    `}
                                >
                                    <div className={`
                                        p-2 rounded-lg 
                                        ${idx === selectedIndex
                                            ? 'bg-white dark:bg-indigo-500/20 shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800'
                                        }
                                    `}>
                                        {cmd.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm">{cmd.title}</span>
                                            {idx === selectedIndex && (
                                                <ArrowRight className="w-4 h-4 opacity-50" />
                                            )}
                                        </div>
                                        {cmd.subtitle && (
                                            <p className={`text-xs mt-0.5 ${idx === selectedIndex ? 'text-indigo-700/70 dark:text-indigo-300/70' : 'text-slate-400'}`}>
                                                {cmd.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    {cmd.category && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-600">
                                            {cmd.category}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex gap-4">
                        <span><strong className="text-slate-600 dark:text-slate-300">↑↓</strong> navegar</span>
                        <span><strong className="text-slate-600 dark:text-slate-300">↵</strong> seleccionar</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Command className="w-3 h-3" />
                        <span>Modo Dios Activo</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
