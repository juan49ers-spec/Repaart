import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, StickyNote, Trash2 } from 'lucide-react';

interface LessonNotesProps {
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Función para cargar notas del localStorage
const loadNotes = (lessonId: string): Note[] => {
  if (typeof window === 'undefined') return [];
  const savedNotes = localStorage.getItem(`academy_notes_${lessonId}`);
  if (savedNotes) {
    try {
      return JSON.parse(savedNotes);
    } catch (e) {
      console.error('Error loading notes:', e);
      return [];
    }
  }
  return [];
};

// Función para guardar notas en localStorage
const saveNotes = (lessonId: string, notes: Note[]) => {
  if (typeof window === 'undefined') return;
  if (notes.length > 0) {
    localStorage.setItem(`academy_notes_${lessonId}`, JSON.stringify(notes));
  } else {
    localStorage.removeItem(`academy_notes_${lessonId}`);
  }
};

export const LessonNotes: React.FC<LessonNotesProps> = ({
  lessonId,
  isOpen,
  onClose
}) => {
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // Cargar notas iniciales
  const [notes, setNotes] = useState<Note[]>(() => loadNotes(lessonId));

  const addNote = () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    saveNotes(lessonId, updatedNotes);
    setNewNote('');
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    saveNotes(lessonId, updatedNotes);
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    if (!editContent.trim() || !editingId) return;
    
    setNotes(notes.map(note => 
      note.id === editingId 
        ? { ...note, content: editContent.trim(), updatedAt: new Date().toISOString() }
        : note
    ));
    setEditingId(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Panel lateral */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <StickyNote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Mis Notas</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{notes.length} {notes.length === 1 ? 'nota' : 'notas'}</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Input para nueva nota */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escribe una nota sobre esta lección..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Guardar nota
                </motion.button>
              </div>
            </div>

            {/* Lista de notas */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <StickyNote className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    No tienes notas en esta lección.
                    <br />
                    ¡Añade tu primera nota!
                  </p>
                </motion.div>
              ) : (
                notes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30 group"
                  >
                    {editingId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditContent('');
                            }}
                            className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-lg"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p 
                          className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap cursor-pointer"
                          onClick={() => startEditing(note)}
                        >
                          {note.content}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/30">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(note.updatedAt)}
                          </span>
                          
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LessonNotes;
