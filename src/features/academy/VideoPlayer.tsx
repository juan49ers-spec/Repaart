import React, { useState, useCallback, useMemo } from 'react';
import { Play, Maximize2, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
    url: string;
    title?: string;
}

/**
 * VideoPlayer - Componente de video optimizado para lecciones
 * Soporta YouTube, Vimeo y URLs directas de video
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title = 'Video Lesson' }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Parse video URL and extract embed info
    const videoInfo = useMemo(() => {
        // YouTube patterns
        const youtubeMatch = url.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );
        if (youtubeMatch) {
            return {
                type: 'youtube' as const,
                id: youtubeMatch[1],
                embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`,
                thumbnail: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`,
            };
        }

        // Vimeo patterns
        const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (vimeoMatch) {
            return {
                type: 'vimeo' as const,
                id: vimeoMatch[1],
                embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`,
                thumbnail: null, // Vimeo requires API call for thumbnail
            };
        }

        // Direct video URL
        if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return {
                type: 'direct' as const,
                id: null,
                embedUrl: url,
                thumbnail: null,
            };
        }

        // Fallback: treat as embed URL
        return {
            type: 'embed' as const,
            id: null,
            embedUrl: url,
            thumbnail: null,
        };
    }, [url]);

    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    const handleError = useCallback(() => {
        setHasError(true);
    }, []);

    const handlePlay = useCallback(() => {
        setIsLoaded(true);
    }, []);

    // Error state
    if (hasError) {
        return (
            <div className="my-8 rounded-2xl bg-slate-100 border border-slate-200 p-8 text-center">
                <ExternalLink className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-600 font-medium mb-3">No se pudo cargar el video</p>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm"
                >
                    <ExternalLink className="w-4 h-4" />
                    Abrir en nueva pestaña
                </a>
            </div>
        );
    }

    // Direct video element for mp4/webm/ogg
    if (videoInfo.type === 'direct') {
        return (
            <div className="my-8 rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-black">
                <video
                    src={videoInfo.embedUrl}
                    controls
                    className="w-full aspect-video"
                    onError={handleError}
                    title={title}
                >
                    Tu navegador no soporta la reproducción de video.
                </video>
            </div>
        );
    }

    return (
        <div className="my-8 rounded-2xl overflow-hidden shadow-xl border border-slate-200 relative group">
            {/* Thumbnail Preview (before load) */}
            {!isLoaded && videoInfo.thumbnail && (
                <button
                    onClick={handlePlay}
                    className="w-full aspect-video relative cursor-pointer bg-slate-900"
                    aria-label="Reproducir video"
                >
                    <img
                        src={videoInfo.thumbnail}
                        alt={title}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        onError={() => setIsLoaded(true)} // Fallback to iframe if thumbnail fails
                    />
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/50 group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-white ml-1" fill="white" />
                        </div>
                    </div>
                    {/* Video Title */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <p className="text-white font-bold text-sm truncate">{title}</p>
                        <p className="text-white/70 text-xs flex items-center gap-1 mt-1">
                            ▶ {videoInfo.type === 'youtube' ? 'YouTube' : 'Vimeo'}
                        </p>
                    </div>
                </button>
            )}

            {/* Iframe (loaded state or no thumbnail) */}
            {(isLoaded || !videoInfo.thumbnail) && (
                <div className="relative aspect-video bg-black">
                    <iframe
                        src={videoInfo.embedUrl}
                        title={title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        onLoad={handleLoad}
                        onError={handleError}
                    />

                    {/* Fullscreen hint */}
                    <div className="absolute top-2 right-2 bg-black/50 text-white/80 text-xs px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Maximize2 className="w-3 h-3" />
                        Pantalla completa
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
