import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { storage, db } from '../../../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const PREDEFINED_CATEGORIES = [
    { id: 'contracts', label: 'Marco Legal & Contratos', color: 'bg-indigo-500' },
    { id: 'manuals', label: 'Manuales Operativos', color: 'bg-emerald-500' },
    { id: 'commercial', label: 'Dossiers Comerciales', color: 'bg-amber-500' },
    { id: 'marketing', label: 'Activos de Marca', color: 'bg-rose-500' },
    { id: 'general', label: 'Documentación General', color: 'bg-slate-500' },
];

interface ResourceUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (resourceId?: string) => void;
    defaultCategory?: string;
}

const ResourceUploadModal: React.FC<ResourceUploadModalProps> = ({ isOpen, onClose, onSuccess, defaultCategory = 'general' }) => {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(defaultCategory);
    const [prevDefaultCategory, setPrevDefaultCategory] = useState(defaultCategory);
    const [isPinned, setIsPinned] = useState(false);

    if (defaultCategory !== prevDefaultCategory) {
        setCategory(defaultCategory);
        setPrevDefaultCategory(defaultCategory);
    }

    // Upload State
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = (selectedFile: File) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        // Auto-fill title from filename (removing extension)
        const nameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.');
        setTitle(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1).replace(/[-_]/g, ' '));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleUpload = async () => {
        if (!file || !title) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `resources/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(p);
                },
                (error) => {
                    console.error("Upload error:", error);

                    let errorMessage = "Error al subir el archivo";

                    if (error.code === 'storage/unauthorized') {
                        errorMessage = "No tienes permisos para subir archivos. Verifica que eres administrador.";
                    } else if (error.code === 'storage/canceled') {
                        errorMessage = "La subida fue cancelada.";
                    } else if (error.code === 'storage/unknown') {
                        errorMessage = "Error desconocido al subir el archivo.";
                    } else {
                        errorMessage = `Error: ${error.message || error.code}`;
                    }

                    alert(errorMessage);
                    setUploading(false);
                },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);

                    const docRef = await addDoc(collection(db, "resources"), {
                        title: title,
                        name: file.name,
                        category,
                        url,
                        storagePath: storageRef.fullPath,
                        type: file.type,
                        size: file.size,
                        isPinned,
                        downloadCount: 0,
                        createdAt: serverTimestamp()
                    });

                    setUploading(false);
                    onSuccess(docRef.id);
                    onClose();
                    // Reset state
                    setFile(null);
                    setTitle('');
                    setProgress(0);
                    setIsPinned(false); // Reset isPinned
                }
            );
        } catch (err) {
            const error = err as Error;
            console.error("Error initiating upload:", error);
            alert("Error al iniciar la subida: " + (error.message || "Error desconocido"));
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-indigo-400" />
                        Subir Nuevo Recurso
                    </h3>
                    <button onClick={onClose} title="Cerrar" className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* File Drop Zone */}
                    {!file ? (
                        <div
                            className={`
                                relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                                ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800'}
                            `}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                title="Seleccionar archivo"
                                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                            />
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <UploadCloud size={24} />
                            </div>
                            <p className="text-sm font-medium text-slate-300">
                                <span className="text-indigo-400">Haz clic para subir</span> o arrastra
                            </p>
                            <p className="text-xs text-slate-500 mt-2">PDF, Imágenes, Word, Excel (Max 25MB)</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                            <div className="p-3 bg-slate-700 rounded-lg">
                                <FileText className="w-6 h-6 text-slate-200" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                title="Eliminar archivo"
                                className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-rose-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Metadata Fields (Only show if file selected) */}
                    {file && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in">
                            <div>
                                <label htmlFor="resource-title" className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Nombre Visible</label>
                                <input
                                    id="resource-title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    placeholder="Ej: Manual de Operaciones 2026"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="resource-category" className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Categoría</label>
                                    <select
                                        id="resource-category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                        {PREDEFINED_CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 p-2 bg-slate-950 border border-slate-700 rounded-lg w-full cursor-pointer hover:border-slate-600 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isPinned}
                                            onChange={(e) => setIsPinned(e.target.checked)}
                                            className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
                                        />
                                        <span className="text-sm font-medium text-slate-300">Destacar al inicio</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        disabled={uploading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || !title || uploading}
                        className={`
                            px-6 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-all
                            ${(!file || !title) ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'}
                        `}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Subiendo ({Math.round(progress)}%)
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Guardar Archivo
                            </>
                        )}
                    </button>
                </div>

                {/* Progress Bar Overlay */}
                {uploading && (
                    <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                )}
            </div>
        </div>
    );
};

export default ResourceUploadModal;
