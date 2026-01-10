import React, { useState, type FC, type MouseEvent } from 'react';
import { Volume2, VolumeX, PlayCircle } from 'lucide-react';

interface Module {
    id: string;
    title: string;
    content: string;
    action: string;
}

interface FlipCardProps {
    module: Module;
    isViewed?: boolean;
    onFlip?: (moduleId: string) => void;
    categoryColor?: string;
    presentationMode?: boolean;
}

/**
 * FlipCard - Tarjeta 3D con efecto flip
 * Professional implementation with accessibility
 */
const FlipCard: FC<FlipCardProps> = ({
    module,
    isViewed = false,
    onFlip,
    categoryColor = 'blue',
    presentationMode = false
}) => {
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

    const handleClick = (): void => {
        setIsFlipped(!isFlipped);
        if (onFlip && !isViewed) {
            onFlip(module.id);
        }
    };

    const handleSpeak = (e: MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();

        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            } else {
                const text = `${module.title}. ${module.content}. Acción: ${module.action}`;
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'es-ES';
                utterance.rate = 0.9;
                utterance.onend = () => setIsSpeaking(false);

                window.speechSynthesis.speak(utterance);
                setIsSpeaking(true);
            }
        }
    };

    const cardHeight = presentationMode ? 'h-[600px]' : 'h-96';

    return (
        <div
            className={`cursor-pointer perspective-1000 group ${cardHeight}`}
            onClick={handleClick}
        >
            <div
                className={`relative w-full h-full transition-all duration-700 transform-style-preserve-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* FRONT */}
                <div
                    className="absolute w-full h-full surface-raised rounded-xl elevation-md backface-hidden border border-slate-200 overflow-hidden flex flex-col"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Top colored bar */}
                    <div className={`h-2 w-full ${isViewed ? 'bg-emerald-500' : `bg-${categoryColor}-600`}`} />

                    <div className="p-6 flex flex-col h-full justify-between">
                        <div>
                            <span className="text-caption text-tertiary border border-slate-200 px-2 py-1 rounded inline-block">
                                Módulo
                            </span>
                            <h3 className={`font-bold text-primary mt-4 leading-tight ${presentationMode ? 'text-4xl' : 'text-xl'
                                }`}>
                                {module.title}
                            </h3>
                        </div>

                        <div className="flex justify-center opacity-20">
                            <PlayCircle size={presentationMode ? 64 : 48} className={`text-${categoryColor}-600`} />
                        </div>

                        {isViewed && (
                            <div className="absolute top-4 right-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* BACK */}
                <div
                    className="absolute w-full h-full bg-slate-900 rounded-xl elevation-lg [transform:rotateY(180deg)] backface-hidden p-6 flex flex-col justify-between text-white shadow-inner"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="overflow-y-auto pr-2 custom-scroll flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className={`text-${categoryColor}-400 text-caption`}>
                                CONCEPTO
                            </h4>
                            <button
                                onClick={handleSpeak}
                                className={`text-${categoryColor}-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800`}
                                aria-label="Escuchar contenido"
                            >
                                {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                        </div>

                        <p className={`font-medium leading-relaxed text-slate-300 ${presentationMode ? 'text-xl' : 'text-base'
                            }`}>
                            {module.content}
                        </p>
                    </div>

                    <div className={`surface-sunken bg-slate-800 p-4 rounded-xl border border-slate-700 mt-4`}>
                        <h4 className="text-yellow-400 text-caption flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            ACCIÓN TÁCTICA
                        </h4>
                        <p className={`italic text-slate-200 ${presentationMode ? 'text-lg' : 'text-sm'}`}>
                            &quot;{module.action}&quot;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(FlipCard);
