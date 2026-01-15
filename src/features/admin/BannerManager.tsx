import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useBanner, BannerData, AnimationStyle, BannerSize } from '../../hooks/useBanner';
import { useAuth } from '../../context/AuthContext';
import {
    Megaphone, Eye, EyeOff, Save, Palette, Link2, Type,
    ChevronRight, CheckCircle2, AlertCircle, Sparkles,
    Zap, Star, Gift, Play, Pause, Maximize2, Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLOR_OPTIONS = [
    { value: 'indigo', label: 'Índigo', bg: 'bg-indigo-500' },
    { value: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-500' },
    { value: 'amber', label: 'Ámbar', bg: 'bg-amber-500' },
    { value: 'rose', label: 'Rosa', bg: 'bg-rose-500' },
    { value: 'slate', label: 'Neutro', bg: 'bg-slate-500' },
];

const ANIMATION_OPTIONS: { value: AnimationStyle; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'static', label: 'Estático', icon: <Pause className="w-4 h-4" />, desc: 'Sin animación' },
    { value: 'pulse', label: 'Pulso', icon: <Sparkles className="w-4 h-4" />, desc: 'Efecto latido' },
    { value: 'marquee', label: 'Marquesina', icon: <Play className="w-4 h-4" />, desc: 'Texto en movimiento' },
    { value: 'wave', label: 'Onda', icon: <Zap className="w-4 h-4" />, desc: 'Efecto ondulante' },
    { value: 'glow', label: 'Brillo', icon: <Star className="w-4 h-4" />, desc: 'Efecto resplandor' },
];

const SPEED_OPTIONS = [
    { value: 'slow', label: 'Lenta' },
    { value: 'normal', label: 'Normal' },
    { value: 'fast', label: 'Rápida' },
];

const SIZE_OPTIONS: { value: BannerSize; label: string; icon: React.ReactNode }[] = [
    { value: 'compact', label: 'Compacto', icon: <Minimize2 className="w-4 h-4" /> },
    { value: 'normal', label: 'Normal', icon: <Gift className="w-4 h-4" /> },
    { value: 'large', label: 'Grande', icon: <Maximize2 className="w-4 h-4" /> },
];

interface BannerManagerProps {
    className?: string;
}

const BannerManager: React.FC<BannerManagerProps> = ({ className = '' }) => {
    const { isAdmin } = useAuth();
    const { banner, loading } = useBanner();
    const [formData, setFormData] = useState<BannerData | null>(null);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    React.useEffect(() => {
        if (!loading && banner) {
            setFormData(banner);
        }
    }, [banner, loading]);

    if (!isAdmin) return null;
    if (loading || !formData) {
        return (
            <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 ${className}`}>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
                </div>
            </div>
        );
    }

    const handleChange = <K extends keyof BannerData>(field: K, value: BannerData[K]) => {
        setFormData(prev => prev ? { ...prev, [field]: value } : prev);
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!formData) return;
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'banner'), {
                ...formData,
                updatedAt: serverTimestamp()
            });
            toast.success('Banner actualizado correctamente');
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving banner:', error);
            toast.error('Error al guardar el banner');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gestor de Banner</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Banner promocional para franquicias</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleChange('isActive', !formData.isActive)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                    >
                        {formData.isActive ? <><Eye className="w-4 h-4" /> Activo</> : <><EyeOff className="w-4 h-4" /> Oculto</>}
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Content Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Type className="w-3.5 h-3.5" /> Título
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Título del banner"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Type className="w-3.5 h-3.5" /> Subtítulo
                        </label>
                        <input
                            type="text"
                            value={formData.subtitle}
                            onChange={(e) => handleChange('subtitle', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Descripción breve"
                        />
                    </div>
                </div>

                {/* Link Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Link2 className="w-3.5 h-3.5" /> URL de Destino
                        </label>
                        <input
                            type="text"
                            value={formData.linkUrl}
                            onChange={(e) => handleChange('linkUrl', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="/ruta o https://..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5" /> Texto del Botón
                        </label>
                        <input
                            type="text"
                            value={formData.linkText}
                            onChange={(e) => handleChange('linkText', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Ver Más"
                        />
                    </div>
                </div>

                {/* Visual Options */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Opciones Visuales</h4>

                    {/* Color + Size Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Color Picker */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Palette className="w-3.5 h-3.5" /> Color
                            </label>
                            <div className="flex gap-2">
                                {COLOR_OPTIONS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => handleChange('bgColor', color.value as BannerData['bgColor'])}
                                        className={`w-10 h-10 rounded-xl ${color.bg} transition-all hover:scale-110 ${formData.bgColor === color.value ? 'ring-4 ring-offset-2 ring-slate-400' : 'opacity-60 hover:opacity-100'
                                            }`}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Size Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tamaño</label>
                            <div className="flex gap-2">
                                {SIZE_OPTIONS.map((size) => (
                                    <button
                                        key={size.value}
                                        onClick={() => handleChange('bannerSize', size.value)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${formData.bannerSize === size.value
                                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {size.icon}
                                        <span className="hidden sm:inline">{size.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Animation Style */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" /> Estilo de Animación
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {ANIMATION_OPTIONS.map((anim) => (
                                <button
                                    key={anim.value}
                                    onClick={() => handleChange('animationStyle', anim.value)}
                                    className={`p-3 rounded-xl text-center transition-all ${formData.animationStyle === anim.value
                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 ring-2 ring-indigo-500/30'
                                            : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-1.5">
                                        {anim.icon}
                                        <span className="text-xs font-bold">{anim.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Speed + Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Speed */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Velocidad</label>
                            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                {SPEED_OPTIONS.map((speed) => (
                                    <button
                                        key={speed.value}
                                        onClick={() => handleChange('animationSpeed', speed.value as BannerData['animationSpeed'])}
                                        className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${formData.animationSpeed === speed.value
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                            }`}
                                    >
                                        {speed.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Particles Toggle */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Partículas</label>
                            <button
                                onClick={() => handleChange('showParticles', !formData.showParticles)}
                                className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${formData.showParticles
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                            >
                                {formData.showParticles ? '✨ Activas' : 'Desactivadas'}
                            </button>
                        </div>

                        {/* Icon Toggle */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mostrar Icono</label>
                            <button
                                onClick={() => handleChange('showIcon', !formData.showIcon)}
                                className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${formData.showIcon
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                            >
                                {formData.showIcon ? '👁️ Visible' : 'Oculto'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                    {hasChanges ? (
                        <><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-amber-600 font-medium">Cambios sin guardar</span></>
                    ) : (
                        <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-slate-500">Todo guardado</span></>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </div>
    );
};

export default BannerManager;
