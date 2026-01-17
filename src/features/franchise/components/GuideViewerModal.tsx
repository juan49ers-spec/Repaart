import React from 'react';
import ReactMarkdown from 'react-markdown';
import { X, ShieldAlert, BookOpen, Clock, Calendar } from 'lucide-react';
import { GUIDE_THEMES, GUIDE_ICONS } from '../../../lib/constants';

interface GuideData {
    title?: string;
    description?: string;
    category?: string;
    theme?: string;
    icon?: string;
    isCritical?: boolean;
    content?: string;
    updatedAt?: any;
}

interface GuideViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    guide: GuideData | null;
}

const GuideViewerModal: React.FC<GuideViewerModalProps> = ({ isOpen, onClose, guide }) => {
    if (!isOpen || !guide) return null;

    const ThemeIcon = GUIDE_ICONS[guide.icon as keyof typeof GUIDE_ICONS] || BookOpen;
    const theme = GUIDE_THEMES[guide.theme as keyof typeof GUIDE_THEMES] || GUIDE_THEMES.indigo;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className={`px-8 py-6 border-b border-slate-100 dark:border-slate-800 ${theme.bg} bg-opacity-10 dark:bg-opacity-10 backdrop-blur-md relative overflow-hidden shrink-0`}>
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                        <ThemeIcon className={`w-64 h-64 ${theme.text}`} />
                    </div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className={`w-14 h-14 rounded-2xl ${theme.bg} flex items-center justify-center shadow-sm`}>
                                <ThemeIcon className={`w-7 h-7 ${theme.text}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${theme.text} bg-white/50 dark:bg-black/20`}>
                                        {guide.category || 'General'}
                                    </span>
                                    {guide.isCritical && (
                                        <span className="flex items-center gap-1 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                                            <ShieldAlert className="w-3 h-3" /> Importante
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                    {guide.title || 'Sin Título'}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            title="Cerrar"
                            className="p-2 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 rounded-full text-slate-500 transition-all backdrop-blur-sm"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mt-6 flex items-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Tiempo de lectura: ~5 min
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Actualizado: {guide.updatedAt?.toDate ? guide.updatedAt.toDate().toLocaleDateString() : 'Reciente'}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar bg-white dark:bg-slate-950">
                    <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:text-indigo-600 dark:prose-h2:text-indigo-400 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-white prose-img:rounded-2xl prose-img:shadow-lg prose-hr:border-slate-100 dark:prose-hr:border-slate-800">
                        <ReactMarkdown>
                            {guide.content || guide.description || "*No hay contenido disponible para esta guía.*"}
                        </ReactMarkdown>
                    </article>

                    {/* Floating Close Button for Mobile */}
                    <div className="h-10 md:hidden" />
                </div>
            </div>
        </div>
    );
};

export default GuideViewerModal;
