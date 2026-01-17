import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { PageHelpContent } from '../../constants/pageHelpData';
import { cn } from '../../lib/utils';

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm transition-all animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col ring-1 ring-black/5 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-10 pt-10 pb-8 border-b border-slate-100/50">
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105",
                            theme.bg, theme.text
                        )}>
                            {React.isValidElement(content.icon) ?
                                React.cloneElement(content.icon as React.ReactElement<any>, { size: 28, strokeWidth: 2.5 }) :
                                content.icon}
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight leading-none">{content.title}</h2>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-[0.2em]">Centro de Inteligencia Operativa</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        title="Cerrar Guía"
                        className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all text-slate-300 hover:text-slate-900"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-10 py-8 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
                    {/* Intro */}
                    <div className={cn(
                        "p-6 rounded-[2rem] border-2",
                        theme.border, theme.bg
                    )}>
                        <p className="text-base font-medium text-slate-700 leading-relaxed italic">
                            &quot;{content.intro}&quot;
                        </p>
                    </div>

                    {/* Sections */}
                    {content.sections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-6">
                            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] pl-1 flex items-center gap-4">
                                {section.title}
                                <span className="flex-1 h-px bg-slate-100"></span>
                            </h3>
                            <div className="grid gap-4">
                                {section.items.map((item, iIdx) => (
                                    <div key={iIdx} className="group p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1.5 p-1 bg-white rounded-lg shadow-sm">
                                                <ChevronRight className={cn("w-3 h-3 transition-transform group-hover:translate-x-0.5", theme.text)} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-tight">{item.term}</h4>
                                                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                                    {item.definition}
                                                </p>

                                                {item.example && (
                                                    <div className="flex items-center gap-3 text-[10px] font-semibold text-indigo-600 bg-indigo-50/50 px-3 py-1.5 rounded-full w-fit mb-3">
                                                        <span className="text-indigo-400">STATUS</span> {item.example}
                                                    </div>
                                                )}

                                                {item.tip && (
                                                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                                                        <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                                                            <span className="font-bold mr-1.5">💡 PRO:</span>
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
                <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/30">
                    <button
                        onClick={onClose}
                        className="w-full py-4.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] uppercase tracking-[0.2em] text-[10px]"
                    >
                        Entendido, Continuar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PageHelpModal;
