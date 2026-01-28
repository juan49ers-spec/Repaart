import { type FC, useState, useEffect } from 'react';
import { X, Download, FileText, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

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

type ViewerType = 'image' | 'pdf' | 'video' | 'word' | 'excel' | 'powerpoint' | 'unsupported' | 'unknown';

const DocPreviewModal: FC<DocPreviewModalProps> = ({ isOpen, onClose, file }) => {
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    if (!isOpen || !file) return null;

    const getViewerType = (): ViewerType => {
        if (!file.type) return 'unknown';
        if (file.type.includes('image')) return 'image';
        if (file.type.includes('pdf')) return 'pdf';
        if (file.type.includes('video') || file.type.includes('mp4')) return 'video';
        if (file.type.includes('word') || file.type.includes('document') || file.type.includes('.doc')) return 'word';
        if (file.type.includes('sheet') || file.type.includes('excel') || file.type.includes('.xls')) return 'excel';
        if (file.type.includes('presentation') || file.type.includes('powerpoint') || file.type.includes('.ppt')) return 'powerpoint';
        return 'unsupported';
    };

    const viewerType = getViewerType();

    const getOfficeViewerUrl = (type: ViewerType) => {
        const encodedUrl = encodeURIComponent(file.url);
        const baseUrl = 'https://view.officeapps.live.com/op/embed.aspx';

        switch (type) {
            case 'word':
                return `${baseUrl}?src=${encodedUrl}&wdStartOn=1`;
            case 'excel':
                return `${baseUrl}?src=${encodedUrl}&wdStartOn=1`;
            case 'powerpoint':
                return `${baseUrl}?src=${encodedUrl}&wdStartOn=1`;
            default:
                return baseUrl;
        }
    };

    const handleDownload = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        setDownloading(true);
        try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            const a = document.createElement('a');
            a.href = file.url;
            a.download = file.name;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

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
                        {viewerType === 'word' || viewerType === 'excel' || viewerType === 'powerpoint' ? (
                            <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                title="Abrir en Microsoft Office Online"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span className="hidden sm:inline">Abrir</span>
                            </a>
                        ) : null}
                        <button
                            onClick={(e) => handleDownload(e)}
                            disabled={downloading}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span className="hidden sm:inline">{downloading ? 'Descargando...' : 'Descargar'}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

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

                    {(viewerType === 'word' || viewerType === 'excel' || viewerType === 'powerpoint') && (
                        <iframe
                            src={getOfficeViewerUrl(viewerType)}
                            className="w-full h-full rounded-lg border border-slate-800 bg-white"
                            title="Microsoft Office Viewer"
                        />
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
                            <button
                                onClick={(e) => handleDownload(e)}
                                disabled={downloading}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                {downloading ? 'Descargando...' : 'Descargar Archivo'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocPreviewModal;
