import React, { useState } from 'react';
import { MANUAL_TOPICS } from './manualContent';
import { Search, ChevronRight, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface UserManualProps {
    role: 'admin' | 'franchise';
}

const UserManual: React.FC<UserManualProps> = ({ role }) => {
    const [activeTopicId, setActiveTopicId] = useState<string>(MANUAL_TOPICS[0].id);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter topics based on role and search
    const filteredTopics = MANUAL_TOPICS.filter(topic => {
        const roleMatch = topic.role === 'all' || topic.role === role;
        const searchMatch = !searchTerm ||
            topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            topic.content.some(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.body.toLowerCase().includes(searchTerm.toLowerCase()));

        return roleMatch && searchMatch;
    });

    const activeTopic = MANUAL_TOPICS.find(t => t.id === activeTopicId) || MANUAL_TOPICS[0];

    return (
        <div className="flex h-[calc(100vh-200px)] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">

            {/* SIDEBAR */}
            <div className="w-1/3 min-w-[250px] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar en el manual..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredTopics.map(topic => (
                        <button
                            key={topic.id}
                            onClick={() => setActiveTopicId(topic.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTopicId === topic.id
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            <topic.icon className={`w-5 h-5 ${activeTopicId === topic.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                            <span className="font-bold text-sm tracking-tight flex-1">{topic.title}</span>
                            {activeTopicId === topic.id && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                        </button>
                    ))}

                    {filteredTopics.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            No se encontraron temas.
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
                <div className="max-w-3xl mx-auto">

                    {/* Topic Header */}
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            <activeTopic.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 block">Manual de Usuario</span>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{activeTopic.title}</h2>
                        </div>
                    </div>

                    {/* Topic Content Blocks */}
                    <div className="space-y-10">
                        {activeTopic.content.map((block, idx) => (
                            <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block" />
                                    {block.title}
                                </h3>
                                <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-600 dark:text-slate-400">
                                    <ReactMarkdown components={{
                                        strong: ({ node, ...props }) => <span className="font-black text-slate-900 dark:text-white" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-2 mt-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="pl-1" {...props} />
                                    }}>
                                        {block.body}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-8 border-t border-dashed border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                            <BookOpen className="w-3 h-3" />
                            Repaart Finanzas Doc v3.0
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UserManual;
