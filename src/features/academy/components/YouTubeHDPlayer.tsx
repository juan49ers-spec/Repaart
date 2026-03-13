import { useEffect, useRef } from 'react';

/// <reference types="youtube" />

interface YouTubeHDPlayerProps {
    videoId: string;
    title?: string;
}

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYTApi(): Promise<void> {
    if (ytApiLoaded && window.YT?.Player) return Promise.resolve();

    return new Promise((resolve) => {
        if (ytApiLoading) {
            ytApiCallbacks.push(resolve);
            return;
        }
        ytApiLoading = true;
        ytApiCallbacks.push(resolve);

        const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (existingScript) {
            if (window.YT?.Player) {
                ytApiLoaded = true;
                ytApiLoading = false;
                ytApiCallbacks.forEach((cb) => cb());
                ytApiCallbacks.length = 0;
                return;
            }
        } else {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        }

        (window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
            ytApiLoaded = true;
            ytApiLoading = false;
            ytApiCallbacks.forEach((cb) => cb());
            ytApiCallbacks.length = 0;
        };
    });
}

/**
 * Intenta forzar HD mediante múltiples técnicas:
 * 1. setPlaybackQuality (deprecada pero aún funciona en algunos navegadores)
 * 2. loadVideoById con suggestedQuality (método más fiable)
 * 3. seekTo para forzar rebuffering en la nueva calidad
 */
function tryForceHD(player: YT.Player, videoId: string, useLoadVideo: boolean): boolean {
    try {
        const available = player.getAvailableQualityLevels();
        if (available.length === 0) return false;

        const currentQuality = player.getPlaybackQuality();
        const targetQuality = available.includes('hd1080') ? 'hd1080' :
            available.includes('hd720') ? 'hd720' :
                available.includes('large') ? 'large' : null;

        if (!targetQuality) return true; // No hay mejor calidad disponible

        // Ya está en HD
        if (currentQuality === 'hd1080' || currentQuality === 'hd720') return true;

        // Técnica 1: setPlaybackQuality directa
        player.setPlaybackQuality(targetQuality as YT.SuggestedVideoQuality);

        // Técnica 2: loadVideoById con suggestedQuality (más fiable)
        if (useLoadVideo) {
            const currentTime = player.getCurrentTime();
            player.loadVideoById({
                videoId: videoId,
                startSeconds: currentTime > 0 ? currentTime : 0,
                suggestedQuality: targetQuality as YT.SuggestedVideoQuality,
            });
        }

        return false;
    } catch {
        return false;
    }
}

/**
 * Parchea el iframe generado por la API para soportar fullscreen.
 */
function patchIframe(container: HTMLDivElement) {
    const iframe = container.querySelector('iframe');
    if (iframe) {
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
        iframe.style.borderRadius = '0.75rem';
        iframe.style.border = 'none';
    }
}

const YouTubeHDPlayer = ({ videoId, title }: YouTubeHDPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YT.Player | null>(null);
    const currentVideoId = useRef<string | null>(null);
    const hdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        let destroyed = false;

        const clearHDPolling = () => {
            if (hdIntervalRef.current) {
                clearInterval(hdIntervalRef.current);
                hdIntervalRef.current = null;
            }
        };

        const startHDPolling = (player: YT.Player, vid: string) => {
            clearHDPolling();
            let attempts = 0;
            const maxAttempts = 20; // 20 intentos x 2s = 40 segundos máximo

            hdIntervalRef.current = setInterval(() => {
                attempts++;
                if (attempts > maxAttempts) {
                    clearHDPolling();
                    return;
                }

                // Usar loadVideoById solo en los primeros 3 intentos para no ser intrusivo
                const isHD = tryForceHD(player, vid, attempts <= 3);
                if (isHD) {
                    clearHDPolling();
                }
            }, 2000);
        };

        const initPlayer = async () => {
            await loadYTApi();
            if (destroyed || !containerRef.current) return;

            if (playerRef.current && currentVideoId.current === videoId) return;

            if (playerRef.current) {
                try { playerRef.current.destroy(); } catch { /* ignore */ }
                playerRef.current = null;
            }

            const divId = `yt-player-${videoId}-${Date.now()}`;
            containerRef.current.innerHTML = '';
            const el = document.createElement('div');
            el.id = divId;
            containerRef.current.appendChild(el);

            playerRef.current = new window.YT.Player(divId, {
                videoId,
                width: '100%',
                height: '100%',
                playerVars: {
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    controls: 1,
                    disablekb: 0,
                    fs: 1,
                    autoplay: 1,
                    iv_load_policy: 3,
                    origin: window.location.origin,
                } as YT.PlayerVars & { hd?: number },
                events: {
                    onReady: (event: YT.PlayerEvent) => {
                        const player = event.target;

                        if (containerRef.current) patchIframe(containerRef.current);

                        // Intento inmediato
                        tryForceHD(player, videoId, false);

                        // Iniciar polling agresivo para forzar HD
                        startHDPolling(player, videoId);
                    },
                    onStateChange: (event: YT.OnStateChangeEvent) => {
                        if (event.data === YT.PlayerState.PLAYING) {
                            tryForceHD(event.target, videoId, false);
                        }
                    },
                    onPlaybackQualityChange: (event: YT.OnPlaybackQualityChangeEvent) => {
                        // Si logró poner HD, parar el polling
                        if (event.data === 'hd1080' || event.data === 'hd720') {
                            clearHDPolling();
                        }
                    },
                },
            });
            currentVideoId.current = videoId;
        };

        initPlayer();

        return () => {
            destroyed = true;
            clearHDPolling();
            if (playerRef.current) {
                try { playerRef.current.destroy(); } catch { /* ignore */ }
                playerRef.current = null;
                currentVideoId.current = null;
            }
        };
    }, [videoId]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full"
            title={title}
        />
    );
};

export default YouTubeHDPlayer;
