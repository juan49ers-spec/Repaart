import React, { useState, useContext, useEffect, useRef } from 'react';
import { FranchiseId } from '../../../schemas/scheduler';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { LogisticsRatesEditor } from '../../franchise/components/LogisticsRatesEditor';
import {
    Building, MapPin, Save, User, Camera,
    Mail, Lock, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ToastContext } from '../../../context/contexts';
import { userService, User as AppUser } from '../../../services/userService';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { notificationService } from '../../../services/notificationService';

import { LogisticsRate } from '../../../types/franchise';

// Removed local LogisticsRate interface

interface FranchiseProfileFormData {
    // Franchise Data
    legalName: string;
    name: string;
    cif: string;
    city: string; // New field for specific location
    address: string;
    email: string; // Business Email
    phone: string; // Business Phone
    role: string;
    franchiseId: string;
    pack: 'basic' | 'premium';
    zipCodes: string[];
    logisticsRates: LogisticsRate[];

    // User Data (Personal)
    userDisplayName: string;
    userPhone: string;
    userPhotoURL: string;
}

interface FranchiseProfileProps {
    franchiseId?: string;
    readOnly?: boolean;
}

const FranchiseProfile: React.FC<FranchiseProfileProps> = ({ franchiseId }) => {
    const { user, isAdmin } = useAuth();
    const { addToast } = useContext(ToastContext) || { addToast: () => { } };
    const navigate = useNavigate();
    const location = useLocation();

    // If no franchiseId provided, we assume we are editing the current user's franchise profile
    // But if we are an admin editing another franchise, we might not want to edit *that user's personal profile* 
    // (admins usually edit franchise data, not the personal user data of the owner unless specified).
    // For this unification, if franchiseId is provided (Admin View), we hide the "User" tab to avoid confusion.
    const isSelfProfile = !franchiseId || franchiseId === user?.uid;

    const [activeTab, setActiveTab] = useState('user'); // Default to User for a personal feel
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initialRatesRef = useRef<LogisticsRate[]>([]);

    // Handle Deep Linking to Tabs
    useEffect(() => {
        const state = location.state as { tab?: string } | null;
        if (state && state.tab) {
            const targetTab = state.tab;
            if (['user', 'general', 'logistics'].includes(targetTab)) {
                setActiveTab(targetTab);
            }
        }
    }, [location.state]);

    // --- RHF CONFIGURATION ---
    const { register, control, handleSubmit, reset, watch, setValue, formState: { isDirty } } = useForm<FranchiseProfileFormData>({
        defaultValues: {
            legalName: '',
            name: '',
            cif: '',
            city: '',
            address: '',
            email: '',
            phone: '',
            role: 'franchise',
            franchiseId: '',
            pack: 'basic',
            zipCodes: [],
            logisticsRates: [],

            userDisplayName: '',
            userPhone: '',
            userPhotoURL: ''
        }
    });



    const watchedUserPhoto = watch('userPhotoURL');

    // --- LOAD DATA ---
    useEffect(() => {
        const loadProfile = async () => {
            const targetId = franchiseId || user?.uid;
            if (!targetId) return;

            try {
                // 1. Load Franchise Data
                const franchiseData = await userService.getUserProfile(targetId);
                const data = (franchiseData || {}) as AppUser;

                // 2. Load User Data (if self)
                let userData = {
                    displayName: user?.displayName || '',
                    phone: user?.phoneNumber || '',
                    photoURL: user?.photoURL || ''
                };

                if (isSelfProfile && user?.uid) {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const uData = userDoc.data();
                        userData = {
                            displayName: uData.displayName || userData.displayName,
                            phone: uData.phone || userData.phone,
                            photoURL: uData.photoURL || userData.photoURL
                        };
                    }
                }

                reset({
                    // Franchise
                    legalName: (data as any).legalName || (data as any).businessName || '',
                    name: data.displayName || (data as any).franchiseName || '',
                    cif: data.cif || (data as any).taxId || '',
                    city: data.city || '',
                    address: data.address || '',
                    email: data.email || (targetId === user?.uid ? (user?.email || '') : ''),
                    phone: data.phoneNumber || '', // Business phone
                    franchiseId: data.franchiseId || '',
                    role: data.role || 'franchise',
                    zipCodes: data.zipCodes || [],
                    logisticsRates: data.logisticsRates || [],
                    pack: data.pack || 'basic',

                    // User
                    userDisplayName: userData.displayName,
                    userPhone: userData.phone, // Personal phone
                    userPhotoURL: userData.photoURL
                });

                // Save initial rates for comparison
                initialRatesRef.current = data.logisticsRates || [];

            } catch (e: any) {
                addToast("Error al cargar perfil: " + (e.message || String(e)), "error");
            }
        };
        loadProfile();
    }, [user, reset, franchiseId, addToast, isSelfProfile]);

    // --- HANDLERS ---

    // Avatar Upload (User Personal)
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);
        try {
            const storageRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update Auth & Firestore immediately for Avatar
            await updateProfile(user, { photoURL: downloadURL });
            await setDoc(doc(db, "users", user.uid), { photoURL: downloadURL }, { merge: true });

            setValue('userPhotoURL', downloadURL, { shouldDirty: true });
            addToast("Foto de perfil actualizada", "success");
        } catch (error: any) {
            console.error("[FranchiseProfile] Avatar upload failed:", error);
            addToast("Error al subir imagen", "error");
        } finally {
            setLoading(false);
        }
    };



    // --- MAIN SUBMIT ---
    const onSubmit: SubmitHandler<FranchiseProfileFormData> = async (data) => {
        const targetId = franchiseId || user?.uid;
        if (!targetId) return;

        setLoading(true);
        try {
            // 1. Update User Profile (Personal) if self
            if (isSelfProfile && user) {
                if (data.userDisplayName !== user.displayName) {
                    await updateProfile(user, { displayName: data.userDisplayName });
                }
                await setDoc(doc(db, "users", user.uid), {
                    displayName: data.userDisplayName,
                    phone: data.userPhone, // Personal Phone
                    photoURL: data.userPhotoURL
                }, { merge: true });
            }

            // 2. Update Franchise Profile (Business)
            const cleanFranchiseId = (data.franchiseId || '').toUpperCase().replace(/\s+/g, '-').trim();
            const franchisePayload = {
                displayName: data.name,
                legalName: data.legalName,
                cif: data.cif,
                address: data.address,
                email: data.email,
                phoneNumber: data.phone,
                role: data.role,
                franchiseId: cleanFranchiseId as FranchiseId,
                pack: data.pack,
                zipCodes: data.zipCodes,

                logisticsRates: (data.logisticsRates || []).map(rate => ({
                    ...rate,
                    min: Number(rate.min || 0),
                    max: Number(rate.max || 0),
                    price: Number(rate.price || 0),
                    name: (rate.min !== undefined && rate.max !== undefined)
                        ? `${rate.min}-${rate.max} km`
                        : (rate.name || 'Tarifa')
                })),
                city: data.city || (data.address ? data.address.split(',')[1]?.trim() : '')
            };

            await userService.updateUser(targetId, franchisePayload);

            // 3. Smart Rate Notification
            const newRates = franchisePayload.logisticsRates;
            const ancientRates = initialRatesRef.current;

            // Check for changes
            let hasChanges = false;
            let maxVariance = 0;
            const changeDetails: string[] = [];

            if (JSON.stringify(newRates) !== JSON.stringify(ancientRates)) {
                hasChanges = true;

                // Analyze variance
                newRates.forEach(nr => {
                    const oldRate = ancientRates.find(ar => ar.name === nr.name || (ar.min === nr.min && ar.max === nr.max));
                    if (oldRate) {
                        const variance = oldRate.price > 0 ? Math.abs((nr.price - oldRate.price) / oldRate.price) * 100 : 100;
                        if (nr.price !== oldRate.price) {
                            changeDetails.push(`${nr.name}: ${oldRate.price}€ -> ${nr.price}€`);
                            if (variance > maxVariance) maxVariance = variance;
                        }
                    } else {
                        changeDetails.push(`Nueva tarifa: ${nr.name} (${nr.price}€)`);
                        maxVariance = 100; // Treat new rate as major change
                    }
                });
            }

            if (hasChanges) {
                const isHighPriority = maxVariance > 20; // >20% change is high priority
                await notificationService.notify(
                    'RATE_CHANGE',
                    cleanFranchiseId,
                    data.name || 'Franquicia',
                    {
                        title: isHighPriority ? '⚠️ Cambio Brusco de Tarifas' : 'Actualización de Tarifas',
                        message: `La franquicia ha modificado sus tarifas logísticas. \n${changeDetails.join('\n')}`,
                        priority: isHighPriority ? 'high' : 'normal',
                        metadata: {
                            oldRates: ancientRates,
                            newRates: newRates,
                            variance: maxVariance
                        }
                    }
                );
                // Update ref
                initialRatesRef.current = newRates;
            }

            addToast("Perfil unificado guardado correctamente", "success");
            reset(data); // Reset form state
        } catch (error: any) {
            addToast("Error al guardar: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-24">

            <div className="max-w-[1600px] mx-auto w-full px-6 md:px-10 pt-10 relative z-10 flex flex-col gap-10">



                {/* --- BACK BUTTON (Admin View) --- */}
                {!isSelfProfile && (
                    <button
                        onClick={() => navigate(-1)}
                        className="self-start flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white font-bold text-sm transition-all border border-white/20 shadow-lg"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </button>
                )}

                {/* --- HEADER IDENTITY SECTION --- */}
                <div className="flex flex-col md:flex-row items-end gap-6 pb-6 border-b border-slate-200/60">
                    {/* Avatar / Logo */}
                    {isSelfProfile ? (
                        <div className="relative group">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="relative cursor-pointer"
                                aria-label="Cambiar foto de perfil"
                            >
                                <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center relative">
                                    {watchedUserPhoto ? (
                                        <img src={watchedUserPhoto} alt="Foto de perfil" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-4xl font-black text-slate-300">
                                            {user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                        <Camera className="w-8 h-8 text-white drop-shadow-md" aria-hidden="true" />
                                    </div>
                                </div>
                                {/* Online Status Dot */}
                                <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm" aria-hidden="true"></div>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                aria-label="Seleccionar imagen de perfil"
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center relative">
                                {watchedUserPhoto ? (
                                    <img src={watchedUserPhoto} alt="Foto de perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-4xl font-black text-slate-300">
                                        {user?.email?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm" aria-hidden="true"></div>
                        </div>
                    )}

                    {/* Text Info */}
                    <div className="flex-1 mb-2">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            {isSelfProfile ? (watch('userDisplayName') || 'Tu Perfil') : (watch('name') || 'Franquicia')}
                        </h1>
                        <div className="flex items-center gap-3 text-slate-500 font-medium mt-1">
                            <Mail className="w-4 h-4" aria-hidden="true" />
                            <span>{user?.email}</span>
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                {isAdmin ? 'Administrador' : 'Franquicia'}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-1 space-y-8">

                    {/* TABS COMPACTOS */}
                    <div className="flex p-1 bg-slate-200/50 rounded-xl border border-slate-200 w-fit backdrop-blur-sm sticky top-0 z-20 shadow-sm">

                        {isSelfProfile && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('user')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'user'
                                    ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px]'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                <User className="w-4 h-4" /> Datos Personales
                            </button>
                        )}

                        {[
                            { id: 'general', label: 'Empresa', icon: Building },
                            { id: 'logistics', label: 'Logística', icon: MapPin },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-white text-slate-800 shadow-md translate-y-[-1px]'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* --- TAB CONTENT AREA --- */}
                    <div className="min-h-[400px]">

                        {/* TAB: USUARIO (PERSONAL) */}
                        {activeTab === 'user' && isSelfProfile && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Información de Usuario</h3>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</label>
                                        <div className="relative group h-12">
                                            <input
                                                {...register('userDisplayName')}
                                                autoComplete="name"
                                                inputMode="text"
                                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                                placeholder="Tu nombre real"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono Personal</label>
                                        <div className="relative group h-12">
                                            <input
                                                {...register('userPhone')}
                                                type="tel"
                                                autoComplete="tel"
                                                inputMode="tel"
                                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                                placeholder="+34 600 000 000"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
                                        <Lock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" aria-hidden="true" />
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-900">Seguridad de la Cuenta</h4>
                                            <p className="text-xs text-indigo-700/80 mt-1">Para cambiar tu contraseña o email, contacta con soporte o usa la opción de recuperación en el login.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: GENERAL (EMPRESA) */}
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* NOMBRE COMERCIAL */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Comercial</label>
                                    <div className="relative group h-12">
                                        <input
                                            {...register('name')}
                                            autoComplete="organization"
                                            inputMode="text"
                                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            placeholder="Ej: Burger King Centro"
                                        />
                                    </div>
                                </div>

                                {/* RAZON SOCIAL */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Razón Social</label>
                                    <div className="relative group h-12">
                                        <input
                                            {...register('legalName')}
                                            autoComplete="organization-title"
                                            inputMode="text"
                                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            placeholder="Ej: Burger King Spain S.L."
                                        />
                                    </div>
                                </div>

                                {/* CIF */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CIF / NIF</label>
                                    <div className="relative group h-12">
                                        <input
                                            {...register('cif')}
                                            autoComplete="off"
                                            inputMode="text"
                                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            placeholder="B12345678"
                                        />
                                    </div>
                                </div>

                                {/* TELEFONO EMPRESA */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono de Contacto (Público)</label>
                                    <div className="relative group h-12">
                                        <input
                                            {...register('phone')}
                                            type="tel"
                                            autoComplete="tel"
                                            inputMode="tel"
                                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            placeholder="+34 600 000 000"
                                        />
                                    </div>
                                </div>

                                {/* EMAIL EMPRESA */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Operativo</label>
                                    <div className="relative group h-12">
                                        <input
                                            {...register('email')}
                                            type="email"
                                            autoComplete="email"
                                            inputMode="email"
                                            spellCheck={false}
                                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            placeholder="contacto@restaurante.com"
                                        />
                                    </div>
                                </div>


                                {/* CIUDAD (LOCALIDAD) */}
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Localidad (Para el Tiempo)</label>
                                    <div className="relative group h-12">
                                        <input
                                            {...register('city', { required: true })}
                                            autoComplete="address-level2"
                                            inputMode="text"
                                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            placeholder="Ej: Barcelona"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 ml-1">Escribe solo la ciudad. El sistema asumirá que es en España.</p>
                                </div>

                                {/* DIRECCION */}
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección Completa</label>
                                    <div className="relative group h-12">
                                        <input
                                            {...register('address')}
                                            autoComplete="street-address"
                                            inputMode="text"
                                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            placeholder="Calle Ejemplo 123, Ciudad"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: LOGISTICS */}
                        {activeTab === 'logistics' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Controller
                                    control={control}
                                    name="logisticsRates"
                                    render={({ field }) => (
                                        <LogisticsRatesEditor
                                            rates={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        )}


                    </div>
                </form>

                {/* FOOTER ACTIONS - Fixed at bottom */}
                <form onSubmit={handleSubmit(onSubmit)} className="fixed bottom-0 left-0 right-0 md:left-64 z-50 p-4 border-t border-slate-200 bg-white/90 backdrop-blur-sm flex justify-end shrink-0">
                    <button
                        type="submit"
                        disabled={loading || !isDirty}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    >
                        <Save className="w-4 h-4" aria-hidden="true" /> {loading ? 'Guardando…' : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FranchiseProfile;
