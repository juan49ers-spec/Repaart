import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { ToastContext } from '../../../context/contexts';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import {
    Building, MapPin, Save, User, Camera,
    Mail, Phone, Shield, Trash2, Plus, DollarSign, Lock as LockIcon
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { userService, User as UserProfile } from '../../../services/userService';
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
    legalName: string;
    name: string;
    cif: string;
    city: string;
    address: string;
    email: string;
    phone: string;
    role: string;
    franchiseId: string;
    pack: 'basic' | 'premium';
    zipCodes: string[];
    logisticsRates: LogisticsRate[];
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
    const toastCtx = useContext(ToastContext);
    const addToast = useMemo(() => toastCtx?.addToast || (() => { }), [toastCtx]);

    const isSelfProfile = !franchiseId || franchiseId === user?.uid;

    const [activeTab, setActiveTab] = useState('user');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initialRatesRef = useRef<LogisticsRate[]>([]);

    const { register, control, handleSubmit, reset, watch, setValue, getValues, formState: { isDirty } } = useForm<FranchiseProfileFormData>({
        defaultValues: {
            legalName: '', name: '', cif: '', city: '', address: '',
            email: '', phone: '', role: 'franchise', franchiseId: '',
            pack: 'basic', zipCodes: [], logisticsRates: [],
            userDisplayName: '', userPhone: '', userPhotoURL: ''
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
                const franchiseData = await userService.getUserProfile(targetId);
                const data = (franchiseData || {}) as UserProfile & { name?: string; phone?: string; franchiseName?: string; businessName?: string; taxId?: string; legalName?: string };

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
                    legalName: data.legalName || data.businessName || '',
                    name: data.name || data.franchiseName || '',
                    cif: data.cif || data.taxId || '',
                    city: data.city || '',
                    address: data.address || '',
                    email: data.email || (targetId === user?.uid ? (user?.email || '') : ''),
                    phone: data.phone || '',
                    franchiseId: data.franchiseId || '',
                    role: data.role || 'franchise',
                    zipCodes: data.zipCodes || [],
                    logisticsRates: data.logisticsRates || [],
                    pack: data.pack || 'basic',
                    userDisplayName: userData.displayName,
                    userPhone: userData.phone,
                    userPhotoURL: userData.photoURL
                });

                initialRatesRef.current = data.logisticsRates || [];
            } catch (e: unknown) {
                addToast("Error al cargar perfil: " + (e instanceof Error ? e.message : String(e)), "error");
            }
        };
        loadProfile();
    }, [user, reset, franchiseId, addToast, isSelfProfile]);

    // --- HANDLERS ---

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);
        try {
            const storageRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            await updateProfile(user, { photoURL: downloadURL });
            await setDoc(doc(db, "users", user.uid), { photoURL: downloadURL }, { merge: true });

            setValue('userPhotoURL', downloadURL, { shouldDirty: true });
            addToast("Foto de perfil actualizada", "success");
        } catch (error: unknown) {
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
            if (isSelfProfile && user) {
                if (data.userDisplayName !== user.displayName) {
                    await updateProfile(user, { displayName: data.userDisplayName });
                }
                await setDoc(doc(db, "users", user.uid), {
                    displayName: data.userDisplayName,
                    phone: data.userPhone,
                    photoURL: data.userPhotoURL
                }, { merge: true });
            }

            const cleanFranchiseId = (data.franchiseId || '').toUpperCase().replace(/\s+/g, '-').trim();
            const franchisePayload = {
                legalName: data.legalName,
                name: data.name,
                cif: data.cif,
                address: data.address,
                email: data.email,
                phone: data.phone,
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

            await userService.updateUser(targetId, franchisePayload as unknown as Parameters<typeof userService.updateUser>[1]);

            // Smart Rate Notification
            const newRates = franchisePayload.logisticsRates;
            const ancientRates = initialRatesRef.current;

            let hasChanges = false;
            let maxVariance = 0;
            const changeDetails: string[] = [];

            if (JSON.stringify(newRates) !== JSON.stringify(ancientRates)) {
                hasChanges = true;

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
                        maxVariance = 100;
                    }
                });
            }

            if (hasChanges) {
                const isHighPriority = maxVariance > 20;
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
                initialRatesRef.current = newRates;
            }

            addToast("Perfil unificado guardado correctamente", "success");
            reset(data);
        } catch (error: unknown) {
            addToast("Error al guardar: " + (error instanceof Error ? error.message : String(error)), "error");
        } finally {
            setLoading(false);
        }
    };

    // --- TAB CONFIG ---
    const tabs = [
        ...(isSelfProfile ? [{ id: 'user', label: 'Personal', icon: User }] : []),
        { id: 'general', label: 'Empresa', icon: Building },
        { id: 'logistics', label: 'Logística', icon: MapPin },
    ];

    return (
        <div className="min-h-0 flex-1 bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <div className="max-w-[1100px] mx-auto px-3 sm:px-4 md:px-8 py-4 md:py-8">

                {/* IDENTITY HEADER — Harmonized with Dashboard */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden mb-6 shadow-sm">
                    {/* Gradient Banner */}
                    <div className="h-28 sm:h-32 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950 relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.08]" />
                    </div>

                    <div className="px-5 sm:px-8 pb-6 -mt-12 sm:-mt-14 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
                            {/* Avatar */}
                            <div
                                className="relative group cursor-pointer shrink-0"
                                onClick={() => isSelfProfile && fileInputRef.current?.click()}
                            >
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
                                    {watchedUserPhoto ? (
                                        <img src={watchedUserPhoto} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-3xl sm:text-4xl font-black text-slate-300 dark:text-slate-600">
                                            {user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {isSelfProfile && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] rounded-full">
                                            <Camera className="w-6 h-6 text-white drop-shadow-md" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file" ref={fileInputRef} className="hidden"
                                    accept="image/*" onChange={handleAvatarChange}
                                    disabled={!isSelfProfile} title="Cambiar foto de perfil"
                                />
                                <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-[3px] border-white dark:border-slate-900 rounded-full shadow-sm" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left pb-1">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    {isSelfProfile ? (watch('userDisplayName') || 'Tu Perfil') : (watch('name') || 'Franquicia')}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400 mt-1 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[200px]">{user?.email}</span>
                                    </div>
                                    <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                        {isAdmin ? 'Admin' : 'Franquicia'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABS + FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Tab Bar — Harmonized */}
                    <div className="flex justify-center sm:justify-start">
                        <div className="inline-flex p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-0.5">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${activeTab === tab.id
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TAB CONTENT */}
                    <div className="min-h-[300px]">

                        {/* PERSONAL TAB */}
                        {activeTab === 'user' && isSelfProfile && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[.15em]">Información Personal</h3>
                                </div>
                                <div className="p-5 sm:p-6 space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                <input {...register('userDisplayName')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="Tu nombre real" />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teléfono Personal</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                <input {...register('userPhone')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="+34 600 000 000" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-start gap-3">
                                        <LockIcon className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Seguridad de la Cuenta</h4>
                                            <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">Para cambiar tu contraseña o email, contacta con soporte o usa la opción de recuperación en el login.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EMPRESA TAB */}
                        {activeTab === 'general' && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[.15em]">Datos de la Empresa</h3>
                                </div>
                                <div className="p-5 sm:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* Nombre Comercial */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre Comercial (Sede)</label>
                                            <div className="relative group">
                                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input {...register('name')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Ej: Burger King Centro" />
                                            </div>
                                        </div>

                                        {/* Razón Social */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Razón Social</label>
                                            <div className="relative group">
                                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input {...register('legalName')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Ej: Burger King Spain S.L." />
                                            </div>
                                        </div>

                                        {/* CIF */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CIF / NIF</label>
                                            <div className="relative group">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input {...register('cif')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="B12345678" />
                                            </div>
                                        </div>

                                        {/* Teléfono */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teléfono Público</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input {...register('phone')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="+34 600 000 000" />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Operativo</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input {...register('email')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="contacto@empresa.com" />
                                            </div>
                                        </div>

                                        {/* Localidad */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Localidad</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input {...register('city', { required: true })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Ej: Barcelona" />
                                            </div>
                                        </div>

                                        {/* Dirección Completa — Full width */}
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dirección Completa</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input {...register('address')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Calle Ejemplo 123, Ciudad" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LOGISTICS TAB */}
                        {activeTab === 'logistics' && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[.15em] flex items-center gap-2">
                                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Tarifas por Distancia
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Precios de envío escalonados por km</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentRates = getValues().logisticsRates;
                                            const lastRate = currentRates?.length > 0 ? currentRates[currentRates.length - 1] : null;
                                            const newMin = lastRate ? (Number(lastRate.max) || 0) : 0;
                                            const newMax = newMin + 2;
                                            appendRate({ min: newMin, max: newMax, price: 0, name: `${newMin}-${newMax} km` });
                                        }}
                                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider"
                                    >
                                        <Plus className="w-3 h-3" /> Añadir
                                    </button>
                                </div>

                                {rateFields.length > 0 ? (
                                    <div className="p-4 sm:p-5 space-y-3">
                                        {rateFields.map((field, index) => (
                                            <div key={field.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group">
                                                {/* Index */}
                                                <div className="hidden sm:flex shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold items-center justify-center border border-slate-200 dark:border-slate-600">
                                                    {index + 1}
                                                </div>

                                                {/* Distance Range */}
                                                <div className="flex-1 flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider sm:hidden">Distancia (km)</span>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number" step="0.1"
                                                            {...register(`logisticsRates.${index}.min` as const, { valueAsNumber: true })}
                                                            className="w-full sm:w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2 text-center text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                            placeholder="0"
                                                        />
                                                        <span className="text-slate-300 font-bold">—</span>
                                                        <input
                                                            type="number" step="0.1"
                                                            {...register(`logisticsRates.${index}.max` as const, { valueAsNumber: true })}
                                                            className="w-full sm:w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2 text-center text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                            placeholder="Max"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">km</span>
                                                    </div>
                                                    <input type="hidden" {...register(`logisticsRates.${index}.name` as const)} />
                                                </div>

                                                {/* Price */}
                                                <div className="flex items-center gap-2 sm:w-32">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider sm:hidden">Precio</span>
                                                    <div className="relative flex-1 sm:flex-none sm:w-28">
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold pointer-events-none">€</span>
                                                        <input
                                                            type="number" step="0.01"
                                                            {...register(`logisticsRates.${index}.price` as const, { valueAsNumber: true })}
                                                            className="w-full bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg py-1.5 pl-3 pr-8 text-center text-sm font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeRate(index)}
                                                    className="self-end sm:self-center p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                                                    title="Eliminar tarifa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                                            <MapPin className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <h3 className="text-slate-800 dark:text-white font-bold mb-1 text-sm">Sin tarifas configuradas</h3>
                                        <p className="text-slate-400 text-xs mb-5 max-w-xs mx-auto">Configura los precios de envío según la distancia para calcular los costes automáticamente.</p>
                                        <button
                                            type="button"
                                            onClick={() => appendRate({ min: 0, max: 3, price: 3.50, name: '0-3 km' })}
                                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Crear Primera Tarifa
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SAVE BAR — Sticky bottom, inside content flow */}
                    {isDirty && (
                        <div className="sticky bottom-4 z-30 flex justify-end animate-in slide-in-from-bottom-4 duration-300">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default FranchiseProfile;
