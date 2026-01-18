import React, { useState, useEffect, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { Play, Image as ImageIcon, Clock, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';

// Safe Player Type for TS
const RP = ReactPlayer as unknown as React.ComponentType<{
    url: string;
    width: string | number;
    height: string | number;
    light?: boolean | string;
    playing?: boolean;
    controls?: boolean;
    onDuration?: (duration: number) => void;
    onClickPreview?: () => void;
    [key: string]: any;
}> & { canPlay: (url: string) => boolean };

export interface ChapterMarker {
    time: number;
    label: string;
}

interface VideoManagerProps {
    videoUrl: string;
    onChangeUrl: (url: string) => void;
    duration: number; // in seconds
    onChangeDuration: (duration: number) => void;
    customThumbnail: string;
    onChangeThumbnail: (url: string) => void;
    chapters: ChapterMarker[];
    onChangeChapters: (chapters: ChapterMarker[]) => void;
}

export const VideoManager: React.FC<VideoManagerProps> = ({
    videoUrl,
    onChangeUrl,
    duration,
    onChangeDuration,
    customThumbnail,
    onChangeThumbnail,
    chapters = [],
    onChangeChapters
}) => {
    const [previewError, setPreviewError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Derived state instead of effect
    const detectedType = useMemo(() => {
        if (!videoUrl) return 'unknown';
        if (RP.canPlay && RP.canPlay(videoUrl)) {
            if (videoUrl.includes('youtube') || videoUrl.includes('youtu.be')) return 'youtube';
            if (videoUrl.includes('vimeo')) return 'vimeo';
            return 'direct';
        }
        return 'unknown';
    }, [videoUrl]);

    useEffect(() => {
        if (videoUrl && detectedType === 'unknown') {
            // Only set error if we really tried to parse a non-empty string and failed
            // But actually react-player might handle many things.
            // Let's just rely on canPlay for the badge.
            setPreviewError(true);
        } else {
            setPreviewError(false);
        }
    }, [videoUrl, detectedType]);

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) onChangeDuration(val);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const addChapter = () => {
        const newChapter: ChapterMarker = { time: 0, label: 'Nuevo Capítulo' };
        onChangeChapters([...chapters, newChapter].sort((a, b) => a.time - b.time));
    };

    const updateChapter = (index: number, field: keyof ChapterMarker, value: string | number) => {
        const newChapters = [...chapters];
        newChapters[index] = { ...newChapters[index], [field]: value };
        // Re-sort if time changed
        if (field === 'time') {
            newChapters.sort((a, b) => a.time - b.time);
        }
        onChangeChapters(newChapters);
    };

    const removeChapter = (index: number) => {
        onChangeChapters(chapters.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Play className="w-4 h-4 text-indigo-500" />
                    Gestor de Video
                </h3>
                {detectedType !== 'unknown' && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {detectedType}
                    </span>
                )}
            </div>

            <div className="p-6 space-y-6">
                {/* URL Input */}
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        URL del Video (YouTube / Vimeo / MP4)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LinkIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={videoUrl}
                            onChange={(e) => onChangeUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all
                                ${previewError ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'}
                            `}
                        />
                    </div>
                    {previewError && videoUrl && (
                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            No se reconoce este formato de video
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Preview Player */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Previsualización
                        </label>
                        <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative shadow-inner ring-1 ring-slate-900/10">
                            {videoUrl && !previewError ? (
                                <ReactPlayer
                                    // @ts-ignore - ReactPlayer types sometimes conflict depending on version
                                    url={videoUrl}
                                    width="100%"
                                    height="100%"
                                    light={customThumbnail || true} // Use custom thumbnail or default
                                    playing={isPlaying}
                                    onClickPreview={() => setIsPlaying(true)}
                                    // Try to auto-get duration if not set
                                    onDuration={(dur: number) => {
                                        if (duration === 0) onChangeDuration(dur);
                                    }}
                                    controls
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                    <Play className="w-12 h-12 mb-2 opacity-20" />
                                    <span className="text-xs font-medium">Sin video válido</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata Controls */}
                    <div className="space-y-6">
                        {/* Custom Thumbnail */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                Carátula &quot;Cinemática&quot; (URL)
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-9 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                                    {customThumbnail ? (
                                        <img src={customThumbnail} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-4 h-4 text-slate-300" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={customThumbnail}
                                    onChange={(e) => onChangeThumbnail(e.target.value)}
                                    placeholder="https://... (URL de imagen)"
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5">
                                * Se recomienda imagen 16:9 de alta resolución para el &quot;Modo Cine&quot;.
                            </p>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                Duración (Segundos)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="number"
                                    title="Duración en segundos"
                                    value={duration}
                                    onChange={handleDurationChange}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                                        {formatTime(duration)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <h4 className="text-xs font-bold text-indigo-800 mb-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                Director&apos;s Cut Enabled
                            </h4>
                            <p className="text-[10px] text-indigo-600 leading-relaxed">
                                El sistema habilitará automáticamente el <strong>Modo Cine</strong>, <strong>Ambilight</strong> y <strong>PiP</strong> para este video en la vista del estudiante.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chapter Markers Editor */}
                <div className="border-t border-slate-200 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Capítulos / Momentos Clave
                        </label>
                        <button
                            onClick={addChapter}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1"
                        >
                            <Play className="w-3 h-3" />
                            Añadir Capítulo
                        </button>
                    </div>

                    <div className="space-y-2">
                        {chapters.length === 0 && (
                            <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                                <p className="text-slate-400 text-sm">No hay capítulos definidos.</p>
                                <button onClick={addChapter} className="text-indigo-500 text-xs font-bold mt-2 hover:underline">
                                    Crear el primero
                                </button>
                            </div>
                        )}
                        {chapters.map((chapter, index) => (
                            <div key={index} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 group">
                                <div className="w-24 relative">
                                    <Clock className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="number"
                                        value={chapter.time}
                                        onChange={(e) => updateChapter(index, 'time', Number(e.target.value))}
                                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Seg"
                                        title="Tiempo en segundos"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={chapter.label}
                                        onChange={(e) => updateChapter(index, 'label', e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Título del Capítulo"
                                    />
                                </div>
                                <div className="text-xs font-mono text-slate-400 w-16 text-right">
                                    {formatTime(chapter.time)}
                                </div>
                                <button
                                    onClick={() => removeChapter(index)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Eliminar capítulo"
                                >
                                    <AlertCircle className="w-4 h-4 rotate-45" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
