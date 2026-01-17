import { type FC } from 'react';
import { X, Download, FileText, AlertCircle } from 'lucide-react';

interface FileData {
    name: string;
    url: string;
    type?: string;
}

interface DocPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileData | null;
}

type ViewerType = 'image' | 'pdf' | 'video' | 'unsupported' | 'unknown';

const DocPreviewModal: FC<DocPreviewModalProps> = ({ isOpen, onClose, file }) => {
    if (!isOpen || !file) return null;

    // Helper to determine viewer type
    const getViewerType = (): ViewerType => {
        if (!file.type) return 'unknown';
        if (file.type.includes('image')) return 'image';
        if (file.type.includes('pdf')) return 'pdf';
        if (file.type.includes('video') || file.type.includes('mp4')) return 'video';
        return 'unsupported';
    };

    const viewerType = getViewerType();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-200 truncate pr-4">
                            {file.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={file.url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Descargar</span>
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Viewer Body */}
                <div className="flex-1 bg-slate-950/50 relative overflow-hidden flex items-center justify-center p-4">

                    {viewerType === 'image' && (
                        <img
                            src={file.url}
                            alt={file.name}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                        />
                    )}

                    {viewerType === 'pdf' && (
                        <iframe
                            src={`${file.url}#toolbar=0`}
                            className="w-full h-full rounded-lg border border-slate-800 bg-white"
                            title="PDF Viewer"
                        />
                    )}

                    {viewerType === 'video' && (
                        <div className="w-full h-full flex items-center justify-center bg-black rounded-lg">
                            <video
                                src={file.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-full rounded-lg"
                            >
                                Tu navegador no soporta la reproducción de video.
                            </video>
                        </div>
                    )}

                    {viewerType === 'unsupported' && (
                        <div className="text-center max-w-md p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-10 h-10 text-amber-500" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-200 mb-2">Vista previa no disponible</h4>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Este tipo de archivo ({file.type?.split('/')[1] || 'desconocido'}) no se puede visualizar directamente en el navegador.
                            </p>
                            <a
                                href={file.url}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Download className="w-5 h-5" />
                                Descargar Archivo
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocPreviewModal;
