import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Check,
    X,
    Package,
    Loader2,
    Clock,
    Globe
} from 'lucide-react';
import { premiumServiceService, PremiumService, CreateServiceData } from '../../../services/premiumServiceService';

const DEFAULT_SERVICES: CreateServiceData[] = [
    {
        title: 'Consultoría Operativa Express',
        description: 'Resolución de dudas puntuales sobre operativa, personal o normativa.',
        duration: '30 min',
        price: 30,
        currency: 'EUR',
        type: 'consultancy',
        active: true,
        features: ['Videollamada 1 a 1', 'Consejos Operativos', 'Dudas Laborales/Fiscales']
    },
    {
        title: 'Consultoría Estratégica',
        description: 'Sesión profunda para planificación mensual, negociación o problemas complejos.',
        duration: '60 min',
        price: 50,
        currency: 'EUR',
        type: 'consultancy',
        active: true,
        features: ['Análisis detallado', 'Estrategia de crecimiento', 'Optimización de costes']
    },
    {
        title: 'Auditoría de Calidad',
        description: 'Revisión completa de los estándares de calidad y servicio de la franquicia.',
        duration: '2 días',
        price: 150,
        currency: 'EUR',
        type: 'audit',
        active: true,
        features: ['Visita presencial/virtual', 'Informe detallado', 'Plan de mejora']
    },
    {
        title: 'Pack Inicio Rápido',
        description: 'Todo lo necesario para arrancar con fuerza tu nueva ubicación.',
        duration: '1 mes',
        price: 299,
        currency: 'EUR',
        type: 'bundle',
        active: true,
        features: ['4 Consultorías', 'Auditoría Inicial', 'Soporte Prioritario']
    }
];

const ServiceManager = () => {
    const [services, setServices] = useState<PremiumService[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateServiceData>({
        title: '',
        description: '',
        price: 0,
        currency: 'EUR',
        features: [],
        active: true,
        type: 'consultancy',
        duration: '',
        stripePaymentLink: ''
    });
    const [featureInput, setFeatureInput] = useState('');

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        setIsLoading(true);
        const data = await premiumServiceService.getAllServices();
        setServices(data);
        setIsLoading(false);
    };

    const handleEdit = (service: PremiumService) => {
        setFormData({
            title: service.title,
            description: service.description,
            price: service.price,
            currency: service.currency,
            features: service.features,
            active: service.active,
            type: service.type,
            duration: service.duration,
            stripePaymentLink: service.stripePaymentLink || ''
        });
        setEditingId(service.id);
        setIsEditing(true);
    };

    const handleNew = () => {
        setFormData({
            title: '',
            description: '',
            price: 0,
            currency: 'EUR',
            features: [],
            active: true,
            type: 'consultancy',
            duration: '',
            stripePaymentLink: ''
        });
        setEditingId(null);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Seguro que quieres eliminar este servicio?")) return;
        await premiumServiceService.deleteService(id);
        loadServices();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await premiumServiceService.updateService(editingId, formData);
            } else {
                await premiumServiceService.createService(formData);
            }
            setIsEditing(false);
            loadServices();
        } catch (error) {
            console.error("Error saving service:", error);
            alert("Error al guardar el servicio");
        }
    };

    const handleSeedDefaults = async () => {
        if (!window.confirm("¿Restaurar servicios por defecto? Esto agregará los servicios originales si no existen.")) return;
        setIsLoading(true);
        try {
            for (const service of DEFAULT_SERVICES) {
                await premiumServiceService.createService(service);
            }
            loadServices();
            alert("Servicios restaurados correctamente.");
        } catch (error) {
            console.error("Error seeding services:", error);
            alert("Error al restaurar servicios.");
        } finally {
            setIsLoading(false);
        }
    };

    const addFeature = () => {
        if (featureInput.trim()) {
            setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
            setFeatureInput('');
        }
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Package className="w-6 h-6 text-indigo-500" />
                        Gestión de Servicios Premium
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configura los servicios disponibles en el Marketplace.</p>
                </div>
                {!isEditing && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSeedDefaults}
                            className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all border border-indigo-200"
                        >
                            <Package className="w-3.5 h-3.5" />
                            Restaurar Defaults
                        </button>
                        <button
                            onClick={handleNew}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Servicio
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* Grid View */}
                <div className={`flex-1 overflow-y-auto p-6 ${isEditing ? 'hidden md:block w-1/3 border-r border-slate-200 dark:border-slate-800' : 'w-full'}`}>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : services.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                            <Package className="w-16 h-16 mb-4" />
                            <p className="text-lg font-medium">No hay servicios configurados</p>
                            <p className="text-sm">Agrega uno nuevo o restaura los defaults.</p>
                        </div>
                    ) : (
                        <div className={`${isEditing ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}>
                            {services.map(service => (
                                <div
                                    key={service.id}
                                    className={`
                                        group relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col
                                        ${editingId === service.id
                                            ? 'bg-indigo-50 border-indigo-500 shadow-indigo-500/20 shadow-lg scale-[1.02]'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1'
                                        }
                                    `}
                                    onClick={() => handleEdit(service)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Editar servicio ${service.title}`}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleEdit(service)}
                                >
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        {service.active ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wide border border-emerald-200 dark:border-emerald-800/50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>

                                    {/* Icon & Title */}
                                    <div className="mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${editingId === service.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600'}`}>
                                            {service.type === 'bundle' ? <Package className="w-6 h-6" /> : service.type === 'audit' ? <Check className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                        </div>
                                        <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {service.title}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{service.type}</p>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed flex-1">
                                        {service.description}
                                    </p>

                                    {/* Footer: Price & Features count */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Precio</span>
                                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                {service.price}€
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Features</span>
                                            <div className="flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                {service.features.length}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Editor */}
                {isEditing && (
                    <div className="flex-[2] overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
                                </h3>
                                <div className="flex gap-2">
                                    {editingId && (
                                        <button
                                            onClick={() => handleDelete(editingId)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Cancelar"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label htmlFor="service-title" className="text-xs font-bold text-slate-500 uppercase">Título</label>
                                        <input
                                            id="service-title"
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="service-type" className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                                        <select
                                            id="service-type"
                                            title="Tipo de servicio"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value as CreateServiceData['type'] })}
                                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="consultancy">Consultoría</option>
                                            <option value="recurring">Recurrente</option>
                                            <option value="audit">Auditoría</option>
                                            <option value="bundle">Pack</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="service-description" className="text-xs font-bold text-slate-500 uppercase">Descripción</label>
                                    <textarea
                                        id="service-description"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-20"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label htmlFor="service-price" className="text-xs font-bold text-slate-500 uppercase">Precio (€)</label>
                                        <input
                                            id="service-price"
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="service-duration" className="text-xs font-bold text-slate-500 uppercase">Duración (texto)</label>
                                        <input
                                            id="service-duration"
                                            type="text"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                            placeholder="ej. 60 min, Mensual"
                                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1 pt-6 flex items-center">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={formData.active}
                                                onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Activo</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="stripe-link" className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Globe className="w-3 h-3" />
                                        Stripe Payment Link (Opcional)
                                    </label>
                                    <input
                                        id="stripe-link"
                                        type="url"
                                        value={formData.stripePaymentLink}
                                        onChange={e => setFormData({ ...formData, stripePaymentLink: e.target.value })}
                                        placeholder="https://buy.stripe.com/..."
                                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-xs"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="feature-input" className="text-xs font-bold text-slate-500 uppercase">Características (Bullet Points)</label>
                                    <div className="flex gap-2">
                                        <input
                                            id="feature-input"
                                            type="text"
                                            value={featureInput}
                                            onChange={e => setFeatureInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                            placeholder="Añadir característica..."
                                            className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={addFeature}
                                            title="Añadir característica"
                                            className="bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.features.map((feat, idx) => (
                                            <span key={idx} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-xs flex items-center gap-1 group">
                                                {feat}
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeature(idx)}
                                                    title="Eliminar característica"
                                                    className="w-4 h-4 hover:bg-rose-100 hover:text-rose-500 rounded-full flex items-center justify-center transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Guardar Servicio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceManager;
