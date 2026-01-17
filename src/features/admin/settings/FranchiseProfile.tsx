import React, { useState, useContext, useEffect, useRef } from 'react';
import { ToastContext } from '../../../context/contexts';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import {
    Building, MapPin, Save, User, Camera,
    Mail, Phone, Shield, Trash2, Plus, DollarSign, Lock, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { userService, UserProfile } from '../../../services/userService';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { notificationService } from '../../../services/notificationService';

// --- INTERFACES ---

interface LogisticsRate {
    id?: string;
    min: number;
    max: number;
    price: number;
    name: string;
}

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
        if (location.state && (location.state as any).tab) {
            const targetTab = (location.state as any).tab;
            if (['user', 'general', 'logistics'].includes(targetTab)) {
                setActiveTab(targetTab);
            }
        }
    }, [location.state]);

    // --- RHF CONFIGURATION ---
    const { register, control, handleSubmit, reset, watch, setValue, getValues, formState: { isDirty } } = useForm<FranchiseProfileFormData>({
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

    const { fields: rateFields, append: appendRate, remove: removeRate } = useFieldArray({
        control,
        name: "logisticsRates" as const
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
                const data = (franchiseData || {}) as UserProfile;

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
                    name: data.name || (data as any).franchiseName || '',
                    cif: data.cif || (data as any).taxId || '',
                    city: data.city || '',
                    address: data.address || '',
                    email: data.email || (targetId === user?.uid ? (user?.email || '') : ''),
                    phone: data.phone || '', // Business phone (was data.phone)
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
                legalName: data.legalName,
                name: data.name,
                cif: data.cif,
                address: data.address,
                email: data.email, // Business Email
                phone: data.phone, // Business Phone
                role: data.role,
                franchiseId: cleanFranchiseId,
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
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-20">

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
                    <div className="relative group cursor-pointer" onClick={() => isSelfProfile && fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center relative">
                            {watchedUserPhoto ? (
                                <img src={watchedUserPhoto} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-4xl font-black text-slate-300">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {isSelfProfile && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                    <Camera className="w-8 h-8 text-white drop-shadow-md" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            disabled={!isSelfProfile}
                            title="Cambiar foto de perfil"
                        />
                        {/* Online Status Dot */}
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
                    </div>

                    {/* Text Info */}
                    <div className="flex-1 mb-2">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            {isSelfProfile ? (watch('userDisplayName') || 'Tu Perfil') : (watch('name') || 'Franquicia')}
                        </h1>
                        <div className="flex items-center gap-3 text-slate-500 font-medium mt-1">
                            <Mail className="w-4 h-4" />
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
                                        <div className="relative group">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                            <input {...register('userDisplayName')} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" placeholder="Tu nombre real" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono Personal</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                            <input {...register('userPhone')} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm" placeholder="+34 600 000 000" />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
                                        <Lock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
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
                                    <div className="relative group">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input {...register('name')} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="Ej: Burger King Centro" />
                                    </div>
                                </div>

                                {/* RAZON SOCIAL */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Razón Social</label>
                                    <div className="relative group">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input {...register('legalName')} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="Ej: Burger King Spain S.L." />
                                    </div>
                                </div>

                                {/* CIF */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CIF / NIF</label>
                                    <div className="relative group">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input {...register('cif')} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="B12345678" />
                                    </div>
                                </div>

                                {/* TELEFONO EMPRESA */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono de Contacto (Público)</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input {...register('phone')} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="+34 600 000 000" />
                                    </div>
                                </div>

                                {/* EMAIL EMPRESA */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Operativo</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input {...register('email')} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="contacto@restaurante.com" />
                                    </div>
                                </div>


                                {/* CIUDAD (LOCALIDAD) */}
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Localidad (Para el Tiempo)</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input {...register('city', { required: true })} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="Ej: Barcelona" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 ml-1">Escribe solo la ciudad. El sistema asumirá que es en España.</p>
                                </div>

                                {/* DIRECCION */}
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección Completa</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input {...register('address')} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" placeholder="Calle Ejemplo 123, Ciudad" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: LOGISTICS */}
                        {activeTab === 'logistics' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* SECTION 2: TARIFAS (COMPACT GRID) */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-emerald-500" /> Tarifas por Distancia
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentRates = getValues().logisticsRates;
                                                const lastRate = currentRates && currentRates.length > 0 ? currentRates[currentRates.length - 1] : null;
                                                const newMin = lastRate ? (Number(lastRate.max) || 0) : 0;
                                                const newMax = newMin + 2;
                                                appendRate({ min: newMin, max: newMax, price: 0, name: `${newMin}-${newMax} km` });
                                            }}
                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Añadir Rango
                                        </button>
                                    </div>

                                    {rateFields.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {/* Header Row */}
                                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/30 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <div className="col-span-1 text-center">#</div>
                                                <div className="col-span-5 md:col-span-6">Distancia (KM)</div>
                                                <div className="col-span-4 md:col-span-4 text-right pr-8">Precio</div>
                                                <div className="col-span-2 md:col-span-1"></div>
                                            </div>

                                            {/* Rows */}
                                            {rateFields.map((field, index) => (
                                                <div key={field.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group">

                                                    {/* Index */}
                                                    <div className="col-span-1 flex justify-center">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center border border-slate-200">
                                                            {index + 1}
                                                        </div>
                                                    </div>

                                                    {/* Distance Range Inputs */}
                                                    <div className="col-span-5 md:col-span-6 flex items-center gap-3">
                                                        <div className="relative w-20 md:w-24">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                {...register(`logisticsRates.${index}.min` as const, { valueAsNumber: true })}
                                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-center text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <span className="text-slate-300 font-bold">-</span>
                                                        <div className="relative w-20 md:w-24">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                {...register(`logisticsRates.${index}.max` as const, { valueAsNumber: true })}
                                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-center text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                                placeholder="Max"
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-400 hidden md:inline-block">km</span>

                                                        {/* Hidden Name Input */}
                                                        <input type="hidden" {...register(`logisticsRates.${index}.name` as const)} />
                                                    </div>

                                                    {/* Price Input */}
                                                    <div className="col-span-4 md:col-span-4 flex items-center justify-end gap-2 pr-4 md:pr-8">
                                                        <div className="relative w-24 md:w-28">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                {...register(`logisticsRates.${index}.price` as const, { valueAsNumber: true })}
                                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-3 text-right text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Delete Action */}
                                                    <div className="col-span-2 md:col-span-1 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRate(index)}
                                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Eliminar tarifa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <MapPin className="w-8 h-8 text-slate-300 p-0" />
                                            </div>
                                            <h3 className="text-slate-900 font-bold mb-1">Sin tarifas configuradas</h3>
                                            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Configura los precios de envío según la distancia para calcular los costes automáticamente.</p>
                                            <button
                                                type="button"
                                                onClick={() => appendRate({ min: 0, max: 3, price: 3.50, name: '0-3 km' })}
                                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" /> Crear Primera Tarifa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                    </div>
                </form>

                {/* FOOTER ACTIONS - Fixed at bottom */}
                <div className="p-4 border-t border-slate-200 bg-white/90 backdrop-blur-sm flex justify-end shrink-0 fixed bottom-0 left-0 right-0 md:left-64 z-50">
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={loading || !isDirty}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" /> {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FranchiseProfile;
