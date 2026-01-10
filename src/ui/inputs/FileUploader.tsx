import { useState, useRef, type FC, type ChangeEvent, type DragEvent } from 'react';
import { storage } from '../../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';

interface UploadResult {
    name: string;
    url: string;
    type: string;
    size: number;
}

interface FileUploaderProps {
    path?: string;
    acceptedTypes?: string;
    onUploadComplete?: (result: UploadResult) => void;
    label?: string;
    maxSizeMB?: number;
}

/**
 * Professional File Uploader component
 * @param {string} path - Storage path prefix (e.g., 'resources/documents')
 * @param {string} acceptedTypes - HTML accept string (e.g., '.pdf, .mp4')
 * @param {function} onUploadComplete - Callback with { name, url, type, size }
 * @param {string} label - Custom label
 * @param {number} maxSizeMB - Max file size in MB
 */
const FileUploader: FC<FileUploaderProps> = ({
    path = 'uploads',
    acceptedTypes = '*',
    onUploadComplete,
    label = 'Arrastra tus archivos aquí',
    maxSizeMB = 50
}) => {
    const [dragActive, setDragActive] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateFile = (file: File | null): boolean => {
        if (!file) return false;

        // Size validation
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`El archivo excede el tamaño máximo de ${maxSizeMB}MB`);
            return false;
        }

        // Type validation (simple check based on acceptedTypes string)
        if (acceptedTypes !== '*') {
            const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
            const fileType = file.type;
            const accepted = acceptedTypes.split(',').map(s => s.trim().toLowerCase());

            const isValid = accepted.some(type => {
                if (type.startsWith('.')) return fileExt === type;
                if (type.endsWith('/*')) return fileType.startsWith(type.replace('/*', ''));
                return fileType === type;
            });

            if (!isValid) {
                setError(`Tipo de archivo no permitido. Aceptados: ${acceptedTypes}`);
                return false;
            }
        }

        return true;
    };

    const handleUpload = async (file: File) => {
        setError(null);
        if (!validateFile(file)) return;

        setUploading(true);
        setProgress(0);

        // Create unique filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storageRef = ref(storage, `${path}/${timestamp}_${safeName}`);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(p);
            },
            (err) => {
                console.error("Upload error:", err);
                setError("Error al subir el archivo. Inténtalo de nuevo.");
                setUploading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setUploading(false);
                setProgress(100);

                if (onUploadComplete) {
                    onUploadComplete({
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: file.size
                    });
                }
            }
        );
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <div className="w-full">
            <div
                className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                    ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'}
                    ${uploading ? 'opacity-75 pointer-events-none' : ''}
                    ${error ? 'border-rose-300 bg-rose-50' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={acceptedTypes}
                    onChange={handleChange}
                />

                <div className="flex flex-col items-center gap-3">
                    {uploading ? (
                        <div className="w-16 h-16 flex items-center justify-center text-blue-600">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-2">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-2 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8" />
                        </div>
                    )}

                    {uploading ? (
                        <div className="w-full max-w-xs">
                            <p className="text-sm font-bold text-blue-700 mb-2">Subiendo... {Math.round(progress)}%</p>
                            <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-blue-600 h-2 transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-bold text-slate-700">
                                {error ? <span className="text-rose-600">{error}</span> : label}
                            </p>
                            <p className="text-xs text-slate-400">
                                o haz click para seleccionar
                            </p>
                            <button
                                type="button"
                                onClick={handleButtonClick}
                                className="mt-2 px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
                            >
                                Seleccionar Archivo
                            </button>
                        </>
                    )}
                </div>
            </div>
            {/* Accepted formats hint */}
            {!error && !uploading && (
                <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Formatos: {acceptedTypes === '*' ? 'Todos' : acceptedTypes}</span>
                    <span className="text-[10px] font-bold text-slate-400">Max: {maxSizeMB}MB</span>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
