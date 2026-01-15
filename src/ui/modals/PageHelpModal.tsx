import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { PageHelpContent } from '../../constants/pageHelpData';

interface PageHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: PageHelpContent | null;
}

const PageHelpModal: React.FC<PageHelpModalProps> = ({ isOpen, onClose, content }) => {
    if (!isOpen || !content) return null;

    const colorMap: Record<string, { bg: string, text: string, border: string }> = {
        indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900' },
        blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900' },
        emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900' },
        purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900' },
        rose: { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900' }
    };

    const theme = colorMap[content.color] || colorMap.indigo;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center shadow-inner`}>
                            {content.icon}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{content.title}</h2>
                            <p className="text-sm text-slate-500 mt-1.5 font-medium">Guía de usuario e Inteligencia de Negocio</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        title="Cerrar Guía"
                        aria-label="Cerrar Guía"
                        className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all active:scale-90"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {/* Intro */}
                    <div className={`p-4 rounded-2xl border-2 ${theme.border} ${theme.bg}`}>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed italic">
                            &quot;{content.intro}&quot;
                        </p>
                    </div>

                    {/* Sections */}
                    {content.sections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800"></span>
                                {section.title}
                            </h3>
                            <div className="grid gap-3">
                                {section.items.map((item, iIdx) => (
                                    <div key={iIdx} className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <ChevronRight className={`w-4 h-4 ${theme.text} group-hover:translate-x-1 transition-transform`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1.5 uppercase tracking-tight">{item.term}</h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                                                    {item.definition}
                                                </p>

                                                {item.example && (
                                                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 px-2 py-1 rounded-md w-fit mb-2">
                                                        <span>📊</span> {item.example}
                                                    </div>
                                                )}

                                                {item.tip && (
                                                    <div className="p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-100/50 dark:border-green-800/30">
                                                        <p className="text-[11px] text-green-700 dark:text-green-300 font-medium leading-relaxed">
                                                            {item.tip}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98] uppercase tracking-widest text-xs"
                    >
                        Entendido, ¡A por ello!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PageHelpModal;
