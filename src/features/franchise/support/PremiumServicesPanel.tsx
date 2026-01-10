import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, ArrowRight, FileText, TrendingUp, ShieldCheck, Star, Package, CreditCard } from 'lucide-react';
import { notificationService } from '../../../services/notificationService';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import BookingCalendar from './BookingCalendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ServiceOption {
    id: string;
    title: string;
    description: string;
    duration?: string;
    price: number;
    icon: React.ElementType;
    features: string[];
    color: string;
    type: 'consultancy' | 'recurring' | 'audit' | 'bundle';
    expertId?: string;
}

const SERVICES: ServiceOption[] = [
    {
        id: 'consultancy_30',
        title: 'Consultoría Operativa Express',
        description: 'Resolución de dudas puntuales sobre operativa, personal o normativa.',
        duration: '30 min',
        price: 30,
        icon: Clock,
        features: ['Videollamada 1 a 1', 'Consejos Operativos', 'Dudas Laborales/Fiscales'],
        color: 'indigo',
        type: 'consultancy',
        expertId: 'carlos'
    },
    {
        id: 'consultancy_60',
        title: 'Consultoría Estratégica',
        description: 'Sesión profunda para planificación mensual, negociación o problemas complejos.',
        duration: '60 min',
        price: 50,
        icon: TrendingUp,
        features: ['Análisis detallado', 'Estrategia de crecimiento', 'Optimización de costes'],
        color: 'purple',
        type: 'consultancy',
        expertId: 'ana'
    },
    {
        id: 'billing_service',
        title: 'Servicio de Facturación',
        description: 'Nos encargamos de generar y gestionar tus facturas cada 15 días.',
        duration: 'Mensual',
        price: 100,
        icon: FileText,
        features: ['Facturación Quincenal', 'Gestión de cobros', 'Reporte mensual'],
        color: 'emerald',
        type: 'recurring'
    },
    {
        id: 'financial_audit',
        title: 'Auditoría Financiera',
        description: 'Revisión exhaustiva de tus números y procesos para detectar fugas.',
        duration: 'Sesión 60m + Informe',
        price: 100,
        icon: ShieldCheck,
        features: ['Análisis de rentabilidad', 'Detección de ineficiencias', 'Plan de acción'],
        color: 'amber',
        type: 'audit',
        expertId: 'lucia'
    }
];

const BUNDLES: ServiceOption[] = [
    {
        id: 'growth_pack',
        title: 'Pack Crecimiento',
        description: 'Impulsa tu franquicia con una auditoría completa y seguimiento.',
        duration: 'Pack Ahorro -15%',
        price: 135, // Was 100 + 30 + 30 = 160. ~15% off.
        icon: Package,
        features: ['1 Auditoría Financiera', '2 Consultorías Express (30m)', 'Prioridad Alta'],
        color: 'rose',
        type: 'bundle'
    }
];

const PremiumServicesPanel: React.FC = () => {
    const { user } = useAuth();
    const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
    const [viewState, setViewState] = useState<'catalog' | 'booking' | 'subscriptions'>('catalog');
    const [bookingDetails, setBookingDetails] = useState<{ date: Date, time: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Filter services vs bundles
    const coreServices = SERVICES;
    const bundleServices = BUNDLES;

    const handleServiceClick = (service: ServiceOption) => {
        setSelectedService(service);
        if (service.type === 'consultancy' || service.type === 'audit' || service.type === 'bundle') {
            setViewState('booking'); // Calendar for consultancies, audits, AND bundles
        } else {
            // For simple recurring subscriptions, maybe direct request (or calendar if onboarding needed? Let's keep direct for now)
            setViewState('catalog');
        }
    };

    const handleCalendarSelect = (date: Date, time: string) => {
        setBookingDetails({ date, time });
        // Proceed to book
        submitBooking(date, time);
    };

    const submitBooking = async (date?: Date, time?: string) => {
        if (!selectedService || !user) return;

        setLoading(true);
        try {


            const dateStr = date ? format(date, 'yyyy-MM-dd') : null;

            const desc = date && time
                ? `Solicitud de Cita (Sujeta a confirmación):\nFecha Solicitada: ${format(date, 'd MMMM yyyy', { locale: es })}\nHora Solicitada: ${time}\nServicio: ${selectedService.title}\nPrecio: ${selectedService.price}€ + IVA\n\nDetalles del Pack: ${selectedService.features.join(', ')}`
                : `Solicitud de contratación (Sujeta a confirmación):\nServicio: ${selectedService.title}\nPrecio: ${selectedService.price}€ + IVA`;

            // Create a ticket for the booking request
            await addDoc(collection(db, "tickets"), {
                subject: `[SOLICITUD PENDIENTE] ${selectedService.title} - ${user.displayName || 'Franquiciado'}`,
                description: `${desc}\nUsuario: ${user.email}\nSolicitado desde Marketplace Premium.\n\nACCIÓN REQUERIDA:\n1. Revisar disponibilidad/solicitud.\n2. Crear enlace de pago.\n3. Responder al franquiciado confirmando la fecha y enviando el enlace de pago.`,
                category: 'premium',
                priority: 'high',
                status: 'open',
                origin: 'PremiumServicesPanel',
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                messages: [],
                metadata: {
                    serviceId: selectedService.id,
                    price: selectedService.price,
                    type: selectedService.type,
                    bookingDate: dateStr,
                    bookingTime: time || null
                }
            });

            try {
                await notificationService.notify(
                    'PREMIUM_SERVICE_REQUEST',
                    user.uid,
                    user.displayName || 'Franquiciado',
                    {
                        title: `Solicitud de Servicio Premium: ${selectedService.title}`,
                        message: date ? `Hemos recibido tu solicitud para el ${dateStr} a las ${time}. En breve te contactaremos para confirmar.` : `Solicitud recibida. Espera nuestra confirmación.`,
                        priority: 'high',
                    }
                );
            } catch (notifyError) {
                console.warn("Notification system permission denied (non-critical):", notifyError);
                // Proceed anyway as the ticket is created
            }

            setSuccess(true);
            setViewState('catalog'); // Reset view context visually but show success overlay

        } catch (error) {
            console.error("Error booking service:", error);
            alert("Hubo un error al procesar tu solicitud.");
        } finally {
            setLoading(false);
            setBookingDetails(null);
        }
    };

    const handleReset = () => {
        setSuccess(false);
        setSelectedService(null);
        setBookingDetails(null);
        setViewState('catalog');
    };

    if (viewState === 'booking' && selectedService) {
        return (
            <BookingCalendar
                onSelectSlot={handleCalendarSelect}
                onCancel={() => {
                    setViewState('catalog');
                    setSelectedService(null);
                }}
            />
        );
    }

    if (success) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 p-8">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-xl shadow-emerald-500/20">
                    <CheckCircle className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">¡Solicitud Enviada!</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-lg">
                    {bookingDetails
                        ? <>Hemos recibido tu solicitud para <strong>{selectedService?.title}</strong> el <strong>{format(bookingDetails.date, 'd MMMM', { locale: es })}</strong> a las <strong>{bookingDetails.time}</strong>.</>
                        : <>Hemos registrado tu solicitud para <strong>{selectedService?.title}</strong>.</>
                    }
                    <br /><br />
                    <span className="text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full font-bold">
                        Pendiente de Confirmación y Pago
                    </span>
                    <br />
                    <span className="text-sm mt-4 block">
                        Revisaremos tu solicitud y te enviaremos la confirmación junto con los detalles de pago a tu área de soporte.
                    </span>
                </p>
                <button
                    onClick={handleReset}
                    className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                >
                    Volver al Catálogo
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative">

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            {/* Header & Sub-Nav */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl relative z-10 shrink-0 flex justify-between items-end">
                <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        Marketplace Premium
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Servicios exclusivos para potenciar tu franquicia.</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                        onClick={() => setViewState('catalog')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${viewState === 'catalog' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                    >
                        Catálogo
                    </button>
                    <button
                        onClick={() => setViewState('subscriptions')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${viewState === 'subscriptions' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                    >
                        Mis Suscripciones
                    </button>
                </div>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">

                {viewState === 'subscriptions' ? (
                    <div className="p-8 flex flex-col items-center justify-center h-full text-center opacity-60">
                        <CreditCard className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No tienes suscripciones activas</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-xs">Contrata el "Servicio de Facturación" para verlo aquí.</p>
                        <button onClick={() => setViewState('catalog')} className="mt-6 text-indigo-600 font-bold text-xs uppercase hover:underline">Ir al Catálogo</button>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">

                        {/* Bundles (Horizontal Exclusive) */}
                        <section>
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Package className="w-3 h-3" />
                                Packs Exclusivos
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {bundleServices.map(service => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        selected={selectedService?.id === service.id}
                                        onClick={() => handleServiceClick(service)}
                                        isBundle
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Core Services */}
                        <section>
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Servicios Especializados</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {coreServices.map(service => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        selected={selectedService?.id === service.id}
                                        onClick={() => handleServiceClick(service)}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* Bottom Interaction Bar (Only for non-booking items selected in catalog view) */}
            {selectedService && !bookingDetails && viewState === 'catalog' && (
                <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl relative z-20 animate-in slide-in-from-bottom-4 duration-300 flex justify-between items-center shadow-lg shrink-0">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seleccionado</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{selectedService.title}</p>
                    </div>
                    <button
                        onClick={() => selectedService.type === 'consultancy' || selectedService.type === 'audit' ? setViewState('booking') : submitBooking()}
                        disabled={loading}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
                    >
                        {loading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>...</span>
                            </>
                        ) : (
                            <>
                                {selectedService.type === 'consultancy' || selectedService.type === 'audit' ? <Calendar className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                <span>Solicitar</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

const ServiceCard: React.FC<{ service: ServiceOption, selected: boolean, onClick: () => void, isBundle?: boolean }> = ({ service, selected, onClick, isBundle }) => {
    const Icon = service.icon;

    if (isBundle) {
        return (
            <button
                onClick={onClick}
                className={`
                    relative group w-full text-left rounded-2xl p-5 border transition-all duration-500 flex items-center gap-5 overflow-hidden
                    ${selected
                        ? `bg-slate-900 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 scale-[1.01] z-10 ring-1 ring-indigo-500/50`
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-xl hover:-translate-y-0.5'
                    }
                `}
            >
                {/* Exclusive Sheen/Gradient Background for Selected */}
                {selected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 via-violet-900/40 to-slate-900/0 pointer-events-none" />
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full" style={{ transitionDuration: '1.5s' }} />

                <div className="absolute top-0 right-0">
                    <div className={`${selected ? 'bg-indigo-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'} text-[10px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-widest shadow-sm transition-colors duration-300`}>
                        Recomendado
                    </div>
                </div>

                {/* Left: Icon */}
                <div className={`
                    w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm relative z-10
                    ${selected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'}
                `}>
                    <Icon className="w-7 h-7" />
                </div>

                {/* Middle: Info */}
                <div className="flex-1 min-w-0 relative z-10">
                    <h3 className={`text-lg font-black mb-1.5 transition-colors tracking-tight ${selected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {service.title}
                    </h3>
                    <p className={`text-sm font-medium leading-snug mb-3 line-clamp-1 ${selected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {service.description}
                    </p>
                    {/* Features Row */}
                    <div className="flex flex-wrap gap-2">
                        {service.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${selected ? 'bg-white/10 border-white/10' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-emerald-400 block' : 'bg-indigo-500'}`} />
                                <span className={`text-[11px] font-bold truncate max-w-[150px] ${selected ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Price & Decor */}
                <div className={`text-right shrink-0 flex flex-col items-end pl-6 border-l ${selected ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'}`}>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black tracking-tight ${selected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{service.price}€</span>
                        <span className={`text-[9px] font-bold uppercase ${selected ? 'text-indigo-200' : 'text-slate-400'}`}>+ IVA</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wide mt-1 ${selected ? 'text-emerald-400' : 'text-emerald-500'}`}>Ahorra 15%</span>

                    <div className={`
                        mt-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${selected ? 'bg-white text-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-600 group-hover:text-white'}
                     `}>
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`
                relative group text-left rounded-2xl p-4 border transition-all duration-300 flex flex-col h-full overflow-hidden
                ${selected
                    ? `bg-white dark:bg-slate-900 border-${service.color}-500 shadow-xl shadow-${service.color}-500/10 z-10 ring-1 ring-${service.color}-500/50`
                    : 'bg-white/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5'
                }
            `}
        >
            {/* Glossy sheen effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 dark:from-slate-800/0 dark:via-slate-700/10 dark:to-slate-800/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform -translate-x-full group-hover:translate-x-full" style={{ transitionDuration: '1s' }} />

            <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 shadow-sm
                ${selected
                    ? `bg-${service.color}-500 text-white shadow-lg shadow-${service.color}-500/30 scale-110`
                    : `bg-${service.color}-50 dark:bg-${service.color}-900/10 text-${service.color}-600 dark:text-${service.color}-400 group-hover:bg-${service.color}-500 group-hover:text-white group-hover:scale-110`
                }
            `}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="mb-3 flex-1 relative z-10 w-full">
                <h3 className={`text-base font-black mb-1.5 transition-colors leading-tight tracking-tight ${selected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    {service.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed tracking-wide line-clamp-3">
                    {service.description}
                </p>
            </div>

            <div className="space-y-2 mb-4 relative z-10">
                {service.features.slice(0, 2).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${service.color}-500 shadow-sm shrink-0`} />
                        <span className="truncate">{feature}</span>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between relative z-10">
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{service.price}€</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">+ IVA</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                        {service.duration}
                    </div>
                </div>

                <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                    ${selected
                        ? `bg-${service.color}-500 text-white shadow-lg shadow-${service.color}-500/30 rotate-0`
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 -rotate-45 group-hover:rotate-0'
                    }
                `}>
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </button>
    );
}

export default PremiumServicesPanel;
