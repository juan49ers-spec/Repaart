import React, { useState } from 'react';
import { X, BookOpen, ChevronRight, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MANUAL_TOPICS } from '../../../common/UserManual/manualContent';

interface DashboardGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DashboardGuideModal: React.FC<DashboardGuideModalProps> = ({ isOpen, onClose }) => {
    // Filter only Admin topics
    const adminTopics = MANUAL_TOPICS.filter(t => t.role === 'admin' || t.role === 'all');

    // State for active topic
    const [activeTopicId, setActiveTopicId] = useState<string>(adminTopics[0]?.id || 'intro');
    const activeTopic = adminTopics.find(t => t.id === activeTopicId) || adminTopics[0];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-16 md:pt-24 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex h-[700px] max-h-[90vh]">

                {/* Sidebar Navigation */}
                <div className="w-72 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 flex flex-col backdrop-blur-xl">
                    <div className="p-8 pb-6">
                        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-1.5">
                            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-600/30">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">Manual Admin</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium pl-14">Executive Guide v3.0</p>
                    </div>

                    <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
                        {adminTopics.map((topic) => (
                            <button
                                key={topic.id}
                                onClick={() => setActiveTopicId(topic.id)}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${activeTopicId === topic.id
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md shadow-slate-100 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-700'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`transition-colors ${activeTopicId === topic.id ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                        <topic.icon className="w-4 h-4" />
                                    </div>
                                    <span className="truncate">{topic.title}</span>
                                </div>
                                {activeTopicId === topic.id && (
                                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500 animate-in fade-in slide-in-from-left-2" />
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            Cerrar Guía
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950/50 relative">
                    {/* Content Header */}
                    <div className="h-20 px-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {activeTopic.title}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-2">
                                <Activity className="w-3 h-3 text-emerald-500" />
                                Documentación Viva • Actualizado
                            </p>
                        </div>
                        <button onClick={onClose} title="Cerrar" className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        <div className="max-w-3xl space-y-12">
                            {activeTopic.content.map((block, idx) => (
                                <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                        <div className="w-8 h-1 bg-indigo-500 rounded-full" />
                                        {block.title}
                                    </h3>
                                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-600 dark:text-slate-400">
                                        <ReactMarkdown components={{
                                            strong: ({ node: _, ...props }) => <span className="font-bold text-slate-900 dark:text-white" {...props} />,
                                            ul: ({ node: _, ...props }) => <ul className="list-disc pl-4 space-y-2 mt-2 marker:text-indigo-400" {...props} />,
                                            ol: ({ node: _, ...props }) => <ol className="list-decimal pl-4 space-y-2 mt-2 marker:text-indigo-400" {...props} />,
                                            li: ({ node: _node, ...props }) => (
                                                <li className="pl-1 leading-relaxed" {...props} />
                                            ),
                                            p: ({ node: _, ...props }) => <p className="leading-relaxed mb-4" {...props} />
                                        }}>
                                            {block.body}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Note */}
                        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold opacity-50">
                                Repaart Financial Systems © 2026
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardGuideModal;
