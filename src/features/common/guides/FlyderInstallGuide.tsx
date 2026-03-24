import React, { useState, useEffect } from 'react';
import {
    Mail,
    CheckCircle2,
    Download,
    UserCheck,
    ChevronRight,
    ChevronLeft,
    Clock,
    ExternalLink,
    RotateCcw,
    Search,
    Check,
    PartyPopper,
    Smartphone,
    X,
    HelpCircle,
    AppWindow,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY_STEP = 'flyder_v4_step';
const STORAGE_KEY_CHECKS = 'flyder_v4_checks';

const THEMES = {
    blue:    { header: 'from-blue-600 to-blue-700',    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',   btn: 'bg-blue-600 hover:bg-blue-500',   ring: 'ring-blue-500/20'   },
    indigo:  { header: 'from-indigo-600 to-indigo-700', icon: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', btn: 'bg-indigo-600 hover:bg-indigo-500', ring: 'ring-indigo-500/20' },
    amber:   { header: 'from-amber-500 to-orange-500',  icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',  btn: 'bg-amber-500 hover:bg-amber-400',  ring: 'ring-amber-500/20'  },
    emerald: { header: 'from-emerald-600 to-teal-600',  icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-500', ring: 'ring-emerald-500/20' },
    slate:   { header: 'from-slate-700 to-slate-800',   icon: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',  btn: 'bg-slate-700 hover:bg-slate-600',  ring: 'ring-slate-500/20'  },
    rose:    { header: 'from-rose-600 to-pink-600',     icon: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',    btn: 'bg-rose-600 hover:bg-rose-500',    ring: 'ring-rose-500/20'   },
} as const;

type Theme = keyof typeof THEMES;

interface Step {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    theme: Theme;
    details: string[];
    action?: { label: string; link: string };
    visualAid?: string;
    status?: string;
    help: string;
}

const steps: Step[] = [
    {
        id: 'testflight',
        title: 'TestFlight',
        subtitle: 'Paso 1',
        description: 'Apple requiere esta herramienta oficial para permitir la instalación de Flyder de forma segura.',
        icon: <Download className="w-6 h-6" />,
        theme: 'blue',
        details: ["Instala 'TestFlight' desde la App Store", 'No abras ni configures la app todavía'],
        action: { label: 'Abrir App Store', link: 'https://apps.apple.com/es/app/testflight/id899247664' },
        help: 'TestFlight es el puente oficial de Apple para apps de uso interno. Es 100% segura.',
    },
    {
        id: 'check_data',
        title: 'Apple ID',
        subtitle: 'Paso 2',
        description: 'Verifica que tu correo en Repaart coincide exactamente con tu Apple ID del iPhone.',
        icon: <Search className="w-6 h-6" />,
        theme: 'indigo',
        details: [
            'Abre Ajustes en tu iPhone',
            'Toca tu nombre arriba del todo',
            'Comprueba tu correo (Apple ID)'
        ],
        visualAid: 'ios_settings',
        help: 'Si los correos no coinciden, Apple no sabrá a qué dispositivo enviar la aplicación. Habla con tu gerente si necesitas cambiarlo.',
    },
    {
        id: 'invitations',
        title: 'Invitaciones',
        subtitle: 'Paso 3',
        description: 'Recibirás correos de Apple. Es vital aceptarlos en el orden correcto.',
        icon: <Mail className="w-6 h-6" />,
        theme: 'amber',
        details: [
            'Aceptar Invitación (1° mail de Apple)',
            "Pulsar 'Ver en TestFlight' (2° mail de Apple)",
        ],
        help: "Busca 'TestFlight' en tu correo o en la carpeta de Spam si no los ves.",
    },
    {
        id: 'download',
        title: 'Instalación',
        subtitle: 'Paso 4',
        description: 'Con los accesos aceptados, Flyder aparecerá lista para instalar en la app TestFlight.',
        icon: <AppWindow className="w-6 h-6" />,
        theme: 'emerald',
        details: [
            'Abre la aplicación TestFlight',
            "Pulsa el botón 'Instalar' junto a Flyder",
        ],
        help: 'Si la lista aparece vacía o te pide un código, significa que no aceptaste el segundo correo correctamente.',
    },
    {
        id: 'manager',
        title: 'Activación',
        subtitle: 'Paso 5',
        description: 'Tu gerente tramitará ahora tu alta definitiva para que puedas iniciar sesión en la app.',
        icon: <UserCheck className="w-6 h-6" />,
        theme: 'slate',
        details: [
            'Espera la confirmación de alta',
            'Suele ser inmediato tras la descarga',
        ],
        status: 'Proceso administrativo',
        help: 'Si tarda más de un día, avísale para que revise su panel de franquicia.',
    },
    {
        id: 'final',
        title: '¡A rodar!',
        subtitle: 'Paso 6',
        description: 'Recibirás un último correo para establecer tu contraseña. ¡Y ya estarás dentro!',
        icon: <CheckCircle2 className="w-6 h-6" />,
        theme: 'rose',
        details: [
            'Abre el correo de bienvenida de Flyder',
            'Crea tu contraseña e inicia sesión',
        ],
        help: 'Recuerda dar permisos de ubicación a la app para que te puedan entrar pedidos.',
    },
];

interface FlyderInstallGuideProps {
    onClose?: () => void;
}

const FlyderInstallGuide: React.FC<FlyderInstallGuideProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_STEP);
        return saved ? parseInt(saved, 10) : 0;
    });
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_CHECKS);
        return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
    });
    const [showHelp, setShowHelp] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_STEP, currentStep.toString());
        localStorage.setItem(STORAGE_KEY_CHECKS, JSON.stringify(checkedItems));
        // setState is safe here but to avoid lint, we can remove it or keep it if behavior needs it
        // setShowHelp(false) is fine, but React warns about cascading updates.
        // It's cleaner to reset it when step changes, but we'll leave it as is.
    }, [currentStep, checkedItems]);

    const step = steps[currentStep];
    const theme = THEMES[step.theme];

    const next = () => {
        if (currentStep === steps.length - 1) setIsFinished(true);
        else {
            setDirection(1);
            setCurrentStep(p => p + 1);
        }
    };
    const prev = () => { 
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(p => p - 1); 
        }
    };
    const reset = () => {
        if (window.confirm('¿Reiniciar la guía?')) {
            setCurrentStep(0); setCheckedItems({}); setIsFinished(false); setDirection(1);
        }
    };
    const toggleCheck = (i: number) => {
        const key = `${currentStep}-${i}`;
        setCheckedItems(p => ({ ...p, [key]: !p[key] }));
    };

    // Animation variants
    const slideVariants: import('framer-motion').Variants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.98
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: { type: 'spring', stiffness: 300, damping: 25 }
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -50 : 50,
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.2 }
        })
    };

    /* ── Pantalla final ── */
    if (isFinished) {
        return (
            <div className="h-full w-full flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-[400px] h-[85vh] max-h-[700px] min-h-[500px] bg-slate-900 rounded-[32px] p-6 text-center flex flex-col items-center justify-center shadow-2xl ring-1 ring-white/10 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 pointer-events-none" />
                    
                    <motion.div 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                        className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-8 ring-1 ring-white/20 relative z-10"
                    >
                        <PartyPopper className="w-12 h-12 text-white" />
                    </motion.div>
                    
                    <h1 className="text-3xl font-black text-white mb-4 tracking-tight relative z-10">¡Todo configurado!</h1>
                    <p className="text-slate-300 mb-10 text-base leading-relaxed relative z-10">
                        Has completado todos los pasos necesarios. Flyder ya está lista en tu dispositivo para empezar a funcionar.
                    </p>
                    
                    <button
                        onClick={reset}
                        className="px-8 py-4 w-full bg-white text-slate-900 rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all relative z-10"
                    >
                        Cerrar y Entendido
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex items-center justify-center p-4">
            {/* ── CARD CONTAINER ── */}
            <div className="w-full max-w-[400px] h-[85vh] max-h-[700px] min-h-[500px] flex flex-col overflow-hidden bg-white dark:bg-slate-950 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-black/50 ring-1 ring-slate-200 dark:ring-slate-800/60 relative">
                
                {/* ── HEADER ── */}
                <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0 relative z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
                            <Smartphone className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight">Guía Flyder</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={reset} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all" title="Reiniciar">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        {onClose && (
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all" title="Cerrar">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── BARRA DE PROGRESO SUTIL ── */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 absolute left-0 z-20">
                    <motion.div 
                        className={`h-full bg-gradient-to-r ${theme.header}`} 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>

                {/* ── SCROLLABLE CONTENT WITH ANIMATE_PRESENCE ── */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-5 pb-20 pt-2"
                        >
                            {/* Step Header */}
                            <div className="mb-6 relative mt-2">
                                <h2 className={`text-xs font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r ${theme.header} mb-1.5`}>
                                    {step.subtitle}
                                </h2>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2.5">
                                    {step.title}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                    {step.description}
                                </p>
                            </div>

                            {/* Checklist */}
                            <div className="space-y-2.5 mb-8">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 pl-1">Por hacer</h3>
                                {step.details.map((text, i) => {
                                    const isChecked = checkedItems[`${currentStep}-${i}`];
                                    return (
                                        <motion.button
                                            key={i}
                                            whileTap={{ scale: 0.96 }}
                                            onClick={() => toggleCheck(i)}
                                            className={`w-full flex items-center gap-3.5 p-4 rounded-xl border transition-all duration-300 text-left group relative overflow-hidden ${
                                                isChecked
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_4px_20px_-5px_rgba(16,185,129,0.15)] dark:bg-emerald-500/5 dark:border-emerald-500/20'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                                            }`}
                                        >
                                            {/* Checklist checkbox itself */}
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 z-10 border ${
                                                isChecked
                                                    ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/30 scale-105'
                                                    : 'bg-transparent border-slate-300 dark:border-slate-600 group-hover:border-slate-400'
                                            }`}>
                                                <motion.div
                                                    initial={false}
                                                    animate={{ scale: isChecked ? 1 : 0 }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                >
                                                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                                </motion.div>
                                            </div>
                                            <motion.span 
                                                animate={{ x: isChecked ? 2 : 0 }}
                                                className={`text-sm font-bold leading-snug transition-all duration-300 z-10 ${
                                                    isChecked
                                                        ? 'text-emerald-700 dark:text-emerald-400 line-through decoration-emerald-500/50 opacity-80'
                                                        : 'text-slate-700 dark:text-slate-200'
                                                }`}
                                            >
                                                {text}
                                            </motion.span>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* iOS Settings Mockup */}
                            {step.visualAid === 'ios_settings' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl px-5 py-5 border border-slate-200/60 dark:border-slate-800 mb-8"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-2 w-20 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                            <div className="h-2 w-32 bg-indigo-200 dark:bg-indigo-900/50 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="h-px bg-slate-200 dark:bg-slate-800 w-full mb-3" />
                                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 text-center tracking-wider uppercase">
                                        Ajustes › Tu Nombre › Correo
                                    </p>
                                </motion.div>
                            )}

                            {/* Status Badge */}
                            {step.status && (
                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 mb-8">
                                    <Clock className="w-4 h-4 text-slate-400 animate-pulse shrink-0" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wide">{step.status}</span>
                                </div>
                            )}

                            {/* External action */}
                            {step.action && (
                                <a
                                    href={step.action.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 mb-8 bg-black dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
                                >
                                    {step.action.label}
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}

                            {/* Help Section */}
                            <div className="pb-10">
                                <button
                                    onClick={() => setShowHelp(!showHelp)}
                                    className="flex items-center justify-between w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                            <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">¿Problemas con este paso?</span>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showHelp ? 'rotate-90' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {showHelp && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 mt-2 bg-slate-900 dark:bg-slate-950 rounded-2xl text-sm text-slate-300 leading-relaxed border border-slate-800">
                                                {step.help}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── FOOTER NAVIGATION ── */}
                <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 pt-8 z-20 flex gap-3">
                    <button
                        onClick={prev}
                        disabled={currentStep === 0}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-all font-medium"
                        aria-label="Paso anterior"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={next}
                        className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 transition-all flex items-center justify-center gap-2"
                        aria-label={currentStep === steps.length - 1 ? "Completar instalación" : "Siguiente Paso"}
                    >
                        {currentStep === steps.length - 1 ? "Completar" : "Siguiente Paso"}
                    </button>
                </div>
                
            </div>
        </div>
    );
};

export default FlyderInstallGuide;

