import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    X, 
    Search,
    Lock,
    Gauge,
    Mail,
    MapPin,
    Shield,
    Layers,
    Sparkles
} from 'lucide-react';
import { 
    ContractTemplate, 
    CONTRACT_TEMPLATES, 
    TEMPLATE_CATEGORIES,
    searchTemplates 
} from './templates/templateLibrary';

interface TemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: ContractTemplate) => void;
}

const ICONS: Record<string, React.ElementType> = {
    FileText,
    Lock,
    Gauge,
    Mail,
    MapPin,
    Shield
};

const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: { duration: 0.3 }
    },
    exit: { 
        opacity: 0, 
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};



export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    isOpen,
    onClose,
    onSelectTemplate
}) => {
    const [templates] = useState<ContractTemplate[]>(CONTRACT_TEMPLATES);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);

    const filteredTemplates = useMemo(() => {
        let result = templates;
        
        if (searchQuery) {
            result = searchTemplates(result, searchQuery);
        }
        
        if (selectedCategory) {
            result = result.filter(t => t.category === selectedCategory);
        }
        
        return result;
    }, [templates, searchQuery, selectedCategory]);

    const handleSelect = (template: ContractTemplate) => {
        onSelectTemplate(template);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl"
        >
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl flex overflow-hidden"
            >
                {/* Sidebar */}
                <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-950/30 dark:to-slate-900/30">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4 mb-6">
                            <motion.div 
                                className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/25"
                                whileHover={{ scale: 1.05, rotate: 2 }}
                            >
                                <Layers className="w-6 h-6 text-white" strokeWidth={1.5} />
                            </motion.div>
                            
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Plantillas</h3>
                                <p className="text-sm text-slate-500 font-medium">{templates.length} disponibles</p>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.5} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar plantillas..."
                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:border-purple-500 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2"
                        >
                            Categorías
                        </h4>
                        
                        <div className="space-y-2">
                            <motion.button
                                onClick={() => setSelectedCategory(null)}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all ${
                                    !selectedCategory
                                        ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-400 shadow-sm'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Layers className="w-4 h-4" />
                                    <span className="font-bold text-sm">Todas</span>
                                </div>
                                <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                                    {templates.length}
                                </span>
                            </motion.button>

                            {TEMPLATE_CATEGORIES.map((cat, idx) => (
                                <motion.button
                                    key={cat.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all ${
                                        selectedCategory === cat.id
                                            ? `bg-gradient-to-r from-${cat.color}-100 to-${cat.color}-50 dark:from-${cat.color}-900/30 dark:to-${cat.color}-900/20 text-${cat.color}-700 dark:text-${cat.color}-400 shadow-sm`
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    <span className="font-bold text-sm">{cat.label}</span>
                                    <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                                        {templates.filter(t => t.category === cat.id).length}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
                    >
                        <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">
                                {selectedCategory 
                                    ? TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)?.label 
                                    : 'Todas las Plantillas'}
                            </h4>
                            <p className="text-sm text-slate-500 font-medium">{filteredTemplates.length} resultados</p>
                        </div>
                        
                        <motion.button 
                            onClick={onClose}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors group"
                        >
                            <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600" strokeWidth={1.5} />
                        </motion.button>
                    </motion.div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        {filteredTemplates.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"
                                >
                                    <FileText className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
                                </motion.div>
                                <p className="text-slate-500 font-medium">No se encontraron plantillas</p>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="mt-3 text-sm text-purple-600 font-bold hover:underline"
                                    >
                                        Limpiar búsqueda
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {filteredTemplates.map((template, idx) => {
                                    const Icon = ICONS[template.icon] || FileText;
                                    const category = TEMPLATE_CATEGORIES.find(c => c.id === template.category);
                                    
                                    const getColorClasses = (color?: string) => {
                                        const colorMap: Record<string, { bg: string; text: string; light: string }> = {
                                            indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600', light: 'bg-indigo-50' },
                                            emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', light: 'bg-emerald-50' },
                                            amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', light: 'bg-amber-50' },
                                            purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600', light: 'bg-purple-50' },
                                            rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600', light: 'bg-rose-50' }
                                        };
                                        return colorMap[color || ''] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600', light: 'bg-slate-50' };
                                    };

                                    const colors = getColorClasses(category?.color);

                                    return (
                                        <motion.div
                                            key={template.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            whileHover={{ scale: 1.02, y: -4 }}
                                            className="group bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-6 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-200 dark:hover:border-purple-800/50 transition-all cursor-pointer"
                                            onClick={() => handleSelect(template)}
                                        >
                                            <div className="flex items-start gap-5">
                                                <motion.div 
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                    className={`p-4 rounded-2xl ${colors.bg}`}
                                                >
                                                    <Icon className={`w-7 h-7 ${colors.text}`} strokeWidth={1.5} />
                                                </motion.div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${colors.light} ${colors.text}`}>
                                                            {category?.label}
                                                        </span>
                                                    </div>
                                                    
                                                    <h5 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                        {template.name}
                                                    </h5>
                                                    
                                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                                                        {template.description}
                                                    </p>
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                                                            {template.placeholders.length} variables
                                                        </span>
                                                        
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewTemplate(template);
                                                            }}
                                                            className="px-4 py-2 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors"
                                                        >
                                                            Vista previa
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Modal */}
                <AnimatePresence>
                    {previewTemplate && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
                            onClick={() => setPreviewTemplate(null)}
                        >
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-900">
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white">{previewTemplate.name}</h4>
                                        <p className="text-sm text-slate-500 mt-1">{previewTemplate.description}</p>
                                    </div>
                                    
                                    <motion.button 
                                        onClick={() => setPreviewTemplate(null)}
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                                    >
                                        <X className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                                    </motion.button>
                                </div>

                                <div className="p-10 overflow-y-auto custom-scrollbar max-h-[60vh] bg-slate-50/30 dark:bg-slate-950/30">
                                    <pre className="bg-slate-900 text-slate-300 p-6 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed font-mono shadow-inner"
                                    >
                                        {previewTemplate.content}
                                    </pre>

                                    <div className="mt-6"
                                    >
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Variables disponibles:</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {previewTemplate.placeholders.map(placeholder => (
                                                <motion.span 
                                                    key={placeholder}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-xs px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-mono font-bold"
                                                >
                                                    [{placeholder}]
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-4"
                                >
                                    <motion.button
                                        onClick={() => setPreviewTemplate(null)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-8 py-4 text-slate-600 dark:text-slate-400 font-bold hover:text-slate-800 transition-all"
                                    >
                                        Cerrar
                                    </motion.button>
                                    
                                    <motion.button
                                        onClick={() => {
                                            handleSelect(previewTemplate);
                                            setPreviewTemplate(null);
                                        }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group relative px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-purple-500/25 hover:shadow-2xl flex items-center gap-3 overflow-hidden"
                                    >
                                        <Sparkles className="w-5 h-5" strokeWidth={2} />
                                        <span>Usar esta plantilla</span>
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default TemplateSelector;
