import { useState } from 'react';
import { useAcademyStore } from '../store/academyStore';
import { Clock, Plus, Bookmark, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
    id: string;
    time: number;
    text: string;
    createdAt: number;
}

export const NoteTaker = () => {
    const { currentTime, setSeekTarget } = useAcademyStore();
    const [notes, setNotes] = useState<Note[]>([]); // In real app, sync with Firebase
    const [isAdding, setIsAdding] = useState(false);
    const [newNoteText, setNewNoteText] = useState('');
    const [frozenTime, setFrozenTime] = useState(0);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartAdd = () => {
        setFrozenTime(currentTime);
        setIsAdding(true);
    };

    const handleSave = () => {
        if (!newNoteText.trim()) return;
        const note: Note = {
            id: Math.random().toString(36).substr(2, 9),
            time: frozenTime,
            text: newNoteText,
            createdAt: Date.now()
        };
        setNotes([note, ...notes]); // Newest first
        setNewNoteText('');
        setIsAdding(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Bookmark className="w-4 h-4 text-indigo-500" />
                    Notas de Viaje
                </h3>
                <span className="text-xs font-mono font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                    {formatTime(currentTime)}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {!isAdding && (
                    <button
                        onClick={handleStartAdd}
                        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Añadir Nota en {formatTime(currentTime)}
                    </button>
                )}

                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden"
                        >
                            <div className="p-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
                                <Clock className="w-3 h-3 text-indigo-500" />
                                <span className="text-xs font-bold text-indigo-700">Momento: {formatTime(frozenTime)}</span>
                            </div>
                            <div className="p-3">
                                <textarea
                                    autoFocus
                                    value={newNoteText}
                                    onChange={(e) => setNewNoteText(e.target.value)}
                                    placeholder="¿Qué aprendiste en este momento?"
                                    className="w-full text-sm p-0 border-none focus:ring-0 resize-none h-20 bg-transparent placeholder:text-slate-400 text-slate-700"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSave();
                                        }
                                    }}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setIsAdding(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
                                    <button onClick={handleSave} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700">Guardar</button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {notes.map((note) => (
                        <motion.div
                            key={note.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <button
                                    onClick={() => setSeekTarget(note.time)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition"
                                >
                                    <Play className="w-3 h-3" />
                                    {formatTime(note.time)}
                                </button>
                                <span className="text-[10px] text-slate-300">{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                {note.text}
                            </p>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {notes.length === 0 && !isAdding && (
                    <div className="text-center py-10 opacity-40">
                        <Bookmark className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-400">Sin notas aún</p>
                        <p className="text-xs text-slate-400">Captura momentos clave del video</p>
                    </div>
                )}
            </div>
        </div>
    );
};
