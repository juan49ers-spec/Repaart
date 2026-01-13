import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, ArrowRight, FileText, TrendingUp, ShieldCheck, Package, CreditCard, Loader2 } from 'lucide-react';
import { notificationService } from '../../../services/notificationService';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import BookingCalendar from './BookingCalendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { premiumServiceService, PremiumService } from '../../../services/premiumServiceService';

// Fallback/Default Icons map based on type or title keywords
const getIconForService = (service: PremiumService) => {
    const lowerTitle = service.title.toLowerCase();
    if (lowerTitle.includes('factur')) return FileText;
    if (lowerTitle.includes('audit')) return ShieldCheck;
    if (lowerTitle.includes('estrat')) return TrendingUp;
    if (lowerTitle.includes('pack')) return Package;
    return Clock; // Default
};

const getColorForService = (service: PremiumService) => {
    switch (service.type) {
        case 'audit': return 'amber';
        case 'bundle': return 'rose';
        case 'recurring': return 'emerald';
        default: return 'indigo';
    }
};

const PremiumServicesPanel: React.FC = () => {
    const { user } = useAuth();
    const [selectedService, setSelectedService] = useState<PremiumService | null>(null);
    const [viewState, setViewState] = useState<'catalog' | 'booking' | 'payment' | 'subscriptions'>('catalog');
    const [bookingDetails, setBookingDetails] = useState<{ date: Date, time: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Data State
    const [services, setServices] = useState<PremiumService[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        setFetching(true);
        const data = await premiumServiceService.getActiveServices();
        setServices(data);
        setFetching(false);
    };

    const coreServices = services.filter(s => s.type !== 'bundle');
    const bundleServices = services.filter(s => s.type === 'bundle');

    const handleServiceClick = (service: PremiumService) => {
        setSelectedService(service);
        // If it needs booking (Consultancy/Audit), go to Calendar first
        // If it's pure recurring or simple bundle without scheduling, go straight to Payment
        // For now, let's assume Bundles might need scheduling too if they contain calls.
        if (service.type === 'consultancy' || service.type === 'audit' || service.type === 'bundle') {
            setViewState('booking');
        } else {
            setViewState('payment');
        }
    };

    const handleCalendarSelect = (date: Date, time: string) => {
        setBookingDetails({ date, time });
        setViewState('payment'); // Proceed to Payment
    };

    const processPayment = async () => {
        if (!selectedService || !user) return;
        setLoading(true);

        // SIMULATE STRIPE PAYMENT
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay

        await submitOrder(true); // Paid = true
    };

    const submitOrder = async (paid: boolean) => {
        if (!selectedService || !user) return;

        // Use 'paid' variable to log or handling future logic if needed
        console.log("Processing order, paid status:", paid);

        try {
            const dateStr = bookingDetails?.date ? format(bookingDetails.date, 'yyyy-MM-dd') : null;
            const timeStr = bookingDetails?.time || null;

            const desc = bookingDetails
                ? `Reserva Confirmada (Pagada):\nFecha: ${format(bookingDetails.date, 'd MMMM yyyy', { locale: es })}\nHora: ${bookingDetails.time}\nServicio: ${selectedService.title}\nPrecio: ${selectedService.price}€`
                : `Suscripción/Compra Confirmada (Pagada):\nServicio: ${selectedService.title}\nPrecio: ${selectedService.price}€`;

            // Create Ticket
            await addDoc(collection(db, "tickets"), {
                subject: `[NUEVO PEDIDO] ${selectedService.title} - ${user.displayName || 'Franquiciado'}`,
                description: `${desc}\nUsuario: ${user.email}\nEstado: PAGADO (Stripe Mock)\n\nACCIÓN REQUERIDA:\n1. Verificar pedido.\n2. Ejecutar servicio.`,
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
                    bookingTime: timeStr,
                    paid: true,
                    transactionId: `mock_${Date.now()}`
                }
            });

            // Notification
            try {
                await notificationService.notify(
                    'PREMIUM_SERVICE_REQUEST', // Using generic for now
                    user.uid,
                    user.displayName || 'Franquiciado',
                    {
                        title: `Pedido Confirmado: ${selectedService.title}`,
                        message: `Hemos recibido tu pago y tu solicitud. Te contactaremos en breve.`,
                        priority: 'high',
                    }
                );
            } catch (e) {
                console.warn('Notify failed', e);
            }

            setSuccess(true);
            setViewState('catalog');

        } catch (error) {
            console.error("Error processing order:", error);
            alert("Error al procesar el pedido.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSuccess(false);
        setSelectedService(null);
        setBookingDetails(null);
        setViewState('catalog');
    };

    if (fetching) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

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

    if (viewState === 'payment' && selectedService) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full relative overflow-hidden">
                    {/* Stripe-like Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-lg">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            Pasarela Segura
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-bold">Total a Pagar</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedService.price}€</p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6 text-sm">
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-500">Servicio</span>
                            <span className="font-bold text-slate-900 dark:text-white">{selectedService.title}</span>
                        </div>
                        {bookingDetails && (
                            <div className="flex justify-between mb-2">
                                <span className="text-slate-500">Fecha</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {format(bookingDetails.date, 'd MMM', { locale: es })} - {bookingDetails.time}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                            <span className="font-bold text-slate-900 dark:text-white">Total</span>
                            <span className="font-bold text-indigo-600">{selectedService.price} EUR</span>
                        </div>
                    </div>

                    {/* Mock Card Form */}
                    <div className="space-y-4 mb-8 opacity-75 grayscale hover:grayscale-0 transition-all pointer-events-none select-none">
                        <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2">
                            <p className="text-xs text-slate-400 mb-1">Número de tarjeta</p>
                            <p className="font-mono text-slate-600 dark:text-slate-300">4242 4242 4242 4242</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2">
                                <p className="text-xs text-slate-400 mb-1">Caducidad</p>
                                <p className="font-mono text-slate-600 dark:text-slate-300">12 / 28</p>
                            </div>
                            <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2">
                                <p className="text-xs text-slate-400 mb-1">CVC</p>
                                <p className="font-mono text-slate-600 dark:text-slate-300">123</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={processPayment}
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Pagar {selectedService.price}€
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => setViewState('catalog')}
                        className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 font-medium pb-2"
                    >
                        Cancelar Transacción
                    </button>

                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                </div>
                <p className="mt-4 text-xs text-slate-400 max-w-xs text-center">
                    <ShieldCheck className="w-3 h-3 inline-block mr-1" />
                    Pagos procesados de forma segura (Simulación). No se realizará ningún cargo real.
                </p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300 p-8">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-xl shadow-emerald-500/20">
                    <CheckCircle className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">¡Pedido Confirmado!</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-lg">
                    {bookingDetails
                        ? <>Tu reserva para <strong>{selectedService?.title}</strong> el <strong>{format(bookingDetails.date, 'd MMMM', { locale: es })}</strong> ha sido confirmada.</>
                        : <>Has adquirido <strong>{selectedService?.title}</strong> con éxito.</>
                    }
                    <br /><br />
                    <span className="text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                        Pago Completado
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
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] bg-[length:32px_32px]" />

            {/* Hero Header */}
            <div className="relative h-48 shrink-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] bg-[length:24px_24px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                </div>

                <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                                    Premium Access
                                </span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight mb-1">
                                Marketplace <span className="text-indigo-400">Exclusive</span>
                            </h1>
                            <p className="text-slate-400 text-sm max-w-md font-medium">
                                Servicios diseñados para escalar tu operación al siguiente nivel.
                            </p>
                        </div>

                        {/* Glass Nav */}
                        <div className="flex bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl">
                            <button
                                onClick={() => setViewState('catalog')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${viewState === 'catalog' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Catálogo
                            </button>
                            <button
                                onClick={() => setViewState('subscriptions')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${viewState === 'subscriptions' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Mis Suscripciones
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">

                {viewState === 'subscriptions' ? (
                    <div className="p-8 flex flex-col items-center justify-center h-full text-center opacity-60">
                        <CreditCard className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No tienes suscripciones activas</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-xs">Contrata los servicios disponibles en el catálogo.</p>
                        <button onClick={() => setViewState('catalog')} className="mt-6 text-indigo-600 font-bold text-xs uppercase hover:underline">Ir al Catálogo</button>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {services.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <Package className="w-10 h-10 mx-auto mb-2" />
                                <p className="text-sm">No hay servicios disponibles.</p>
                            </div>
                        )}

                        {/* Bundles (Horizontal Exclusive) */}
                        {bundleServices.length > 0 && (
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
                        )}

                        {/* Core Services */}
                        {coreServices.length > 0 && (
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
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Interaction Bar */}
            {selectedService && !bookingDetails && viewState === 'catalog' && (
                <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl relative z-20 animate-in slide-in-from-bottom-4 duration-300 flex justify-between items-center shadow-lg shrink-0">
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seleccionado</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{selectedService.title}</p>
                    </div>
                    <button
                        onClick={() => handleServiceClick(selectedService)}
                        disabled={loading}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
                    >
                        {selectedService.type === 'consultancy' || selectedService.type === 'audit' ? <Calendar className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                        <span>{selectedService.type === 'consultancy' || selectedService.type === 'audit' ? 'Reservar' : 'Contratar'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

const ServiceCard: React.FC<{ service: PremiumService, selected: boolean, onClick: () => void, isBundle?: boolean }> = ({ service, selected, onClick, isBundle }) => {
    const Icon = getIconForService(service);
    const color = getColorForService(service);

    if (isBundle) {
        return (
            <button
                onClick={onClick}
                className={`
                    relative group w-full text-left rounded-2xl p-6 border transition-all duration-500 flex items-center gap-6 overflow-hidden
                    ${selected
                        ? `bg-slate-900 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 scale-[1.01] z-10 ring-1 ring-indigo-500/50`
                        : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm'
                    }
                `}
            >
                {/* Exclusive Sheen/Gradient Background for Selected */}
                {selected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 via-violet-900/40 to-slate-900/0 pointer-events-none" />
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-[1500ms] pointer-events-none transform -translate-x-full group-hover:translate-x-full" />

                <div className="absolute top-0 right-0">
                    <div className={`${selected ? 'bg-indigo-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'} text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-lg transition-colors duration-300`}>
                        Recomendado
                    </div>
                </div>

                {/* Left: Icon */}
                <div className={`
                    w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg relative z-10
                    ${selected ? 'bg-indigo-500 text-white shadow-indigo-500/40' : 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'}
                `}>
                    <Icon className="w-8 h-8" />
                </div>

                {/* Middle: Info */}
                <div className="flex-1 min-w-0 relative z-10">
                    <h3 className={`text-xl font-black mb-2 transition-colors tracking-tight ${selected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {service.title}
                    </h3>
                    <p className={`text-sm font-medium leading-relaxed mb-4 line-clamp-2 ${selected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {service.description}
                    </p>
                    {/* Features Row */}
                    <div className="flex flex-wrap gap-2">
                        {service.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-colors ${selected ? 'bg-white/10 border-white/10' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-emerald-400 block' : 'bg-indigo-500'}`} />
                                <span className={`text-[11px] font-bold truncate max-w-[150px] ${selected ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Price & Decor */}
                <div className={`text-right shrink-0 flex flex-col items-end pl-8 border-l ${selected ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'}`}>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-black tracking-tight ${selected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{service.price}€</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase mb-4 ${selected ? 'text-indigo-200' : 'text-slate-400'}`}>+ IVA</span>

                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
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
                relative group text-left rounded-2xl p-5 border transition-all duration-300 flex flex-col h-full overflow-hidden
                ${selected
                    ? `bg-white dark:bg-slate-900 border-${color}-500 shadow-xl shadow-${color}-500/10 z-10 ring-1 ring-${color}-500/50 scale-[1.02]`
                    : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-2xl hover:-translate-y-1 backdrop-blur-sm'
                }
            `}
        >
            {/* Glossy sheen effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform -translate-x-full group-hover:translate-x-full duration-1000" />

            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 shadow-sm
                ${selected
                    ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/30 scale-110`
                    : `bg-${color}-50 dark:bg-${color}-900/10 text-${color}-600 dark:text-${color}-400 group-hover:bg-${color}-500 group-hover:text-white group-hover:scale-110`
                }
            `}>
                <Icon className="w-6 h-6" />
            </div>

            <div className="mb-4 flex-1 relative z-10 w-full">
                <h3 className={`text-lg font-black mb-2 transition-colors leading-tight tracking-tight ${selected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    {service.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed tracking-wide line-clamp-3">
                    {service.description}
                </p>
            </div>

            <div className="space-y-2 mb-6 relative z-10">
                {service.features.slice(0, 2).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500 shadow-sm shrink-0`} />
                        <span className="truncate">{feature}</span>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between relative z-10">
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{service.price}€</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">+ IVA</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                        {service.duration}
                    </div>
                </div>

                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${selected
                        ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/30 rotate-0`
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 -rotate-45 group-hover:rotate-0'
                    }
                `}>
                    <ArrowRight className="w-5 h-5" />
                </div>
            </div>
        </button>
    );
}

export default PremiumServicesPanel;
