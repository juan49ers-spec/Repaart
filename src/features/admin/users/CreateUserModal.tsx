import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, updateUserSchema, UserRole } from '../../../lib/schemas';
import { getFriendlyFirebaseError } from '../../../utils/firebaseErrors';
import { X, UserPlus, Mail, Shield, Building, Loader2, AlertCircle, Lock, Eye, EyeOff, Edit } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { UserProfile } from '../../../services/userService';
import { z } from 'zod';

// =====================================================
// TYPES & INTERFACES
// =====================================================

// Infer types directly from Zod schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: CreateUserInput, password?: string) => Promise<void>;
    onUpdate: (uid: string, data: Partial<UpdateUserInput>) => Promise<void>;
    userToEdit?: UserProfile | null;
    isLoading?: boolean;
    initialFranchiseId?: string | null;
    initialData?: any;
}

// Helper type for form values (union of create and update for initial state)
type FormValues = CreateUserInput & { id?: string };

// =====================================================
// COMPONENT
// =====================================================

const CreateUserModal: React.FC<CreateUserModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    onUpdate,
    userToEdit = null,
    isLoading = false,
    initialFranchiseId = null,
    initialData = null // New prop
}) => {
    const [showPassword, setShowPassword] = React.useState(true);

    const toastContext = useToast();
    const toast = toastContext?.toast;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        setError,
        formState: { errors }
    } = useForm<FormValues>({
        resolver: zodResolver((userToEdit ? updateUserSchema : createUserSchema) as any),
        defaultValues: {
            email: '',
            password: '',
            displayName: '',
            phoneNumber: '',
            role: (initialFranchiseId ? 'rider' : 'franchise') as UserRole,
            franchiseId: initialFranchiseId || '',
            pack: 'basic',
            status: 'active',
            name: '',
            legalName: '',
            cif: '',
            address: ''
        }
    });

    const role = watch('role');
    const pack = watch('pack');
    const name = watch('name'); // Watch Ciudad Franquicia for password generation

    // 🔐 Auto-generate password from Ciudad Franquicia
    useEffect(() => {
        if (!userToEdit && role === 'franchise' && name) {
            // Generate a secure-ish password based on City (e.g. Madrid2026!) or just the name as requested?
            // User asked: "sera por defecto el nombre de CIUDAD FRANQUICIA"
            // But password schema enforces complexity: "Min 8, Mayús, Minús, Núm"
            // So we must ensure it meets complexity or relax schema?
            // Scheme is: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/
            // I will generate something like "Madrid2026!" to satisfy schema and be predictable, 
            // OR I assume the admin types it manually? 
            // "La primera contraseña... generará el perfil admin que sera por defecto el nombre de CIUDAD FRANQUICIA"
            // If I set it to just "Madrid", it will fail validation.
            // I will make it "Madrid2026" (capitalized, num).
            // Let's try to make it satisfy regex.
            const cleanName = name.trim();
            if (cleanName.length > 2) {
                const generated = `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()}123!`;
                // Check if we haven't manually touched password? 
                // Hard to track touched state easily without more state. 
                // But this is a helper.
                setValue('password', generated);
            }
        }
    }, [name, role, userToEdit, setValue]);

    // 🔄 Effect: Load data for Edit Mode or Reset for Create Mode
    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                reset({
                    email: userToEdit.email || '',
                    password: '',
                    displayName: userToEdit.displayName || '',
                    phoneNumber: userToEdit.phoneNumber || '',
                    role: (userToEdit.role as UserRole) || 'franchise',
                    franchiseId: userToEdit.franchiseId || '',
                    pack: userToEdit.pack || 'basic',
                    status: (userToEdit.status as 'active' | 'pending' | 'banned') || 'active',
                    name: userToEdit.name || '',
                    legalName: (userToEdit.legalName as string) || '',
                    cif: userToEdit.cif || '',
                    address: userToEdit.address || ''
                });
            } else if (initialFranchiseId) {
                reset({
                    email: '',
                    password: '',
                    displayName: '',
                    phoneNumber: '',
                    role: 'rider',
                    franchiseId: initialFranchiseId,
                    pack: 'basic',
                    status: 'active',
                    name: '',
                    legalName: '',
                    cif: '',
                    address: ''
                });
            } else {
                // Default / Create Mode (optionally with initial request data)
                reset({
                    email: initialData?.email || '',
                    password: '',
                    displayName: '',
                    phoneNumber: '',
                    role: (initialFranchiseId ? 'rider' : 'franchise') as UserRole,
                    franchiseId: initialFranchiseId || '',
                    pack: 'basic',
                    status: 'active',
                    name: '',
                    legalName: initialData?.legalName || '', // Pre-fill Razón Social from Request
                    cif: initialData?.cif || '', // Pre-fill CIF from Request
                    address: ''
                });
            }
        }
    }, [isOpen, userToEdit, reset, initialFranchiseId, initialData]);

    if (!isOpen) return null;

    const onSubmit = async (data: FormValues) => {
        try {
            if (userToEdit) {
                // ✏️ EDIT MODE
                const updateData: Partial<UpdateUserInput> = {
                    displayName: data.displayName,
                    phoneNumber: data.phoneNumber,
                    role: data.role,
                    status: data.status
                };

                // Only add franchise specifics if role is franchise
                if (data.role === 'franchise') {
                    updateData.franchiseId = data.franchiseId;
                    updateData.pack = data.pack;
                    updateData.name = data.name;
                    updateData.legalName = data.legalName;
                    updateData.cif = data.cif;
                    updateData.address = data.address;
                }

                // Password handling
                if (data.password) {
                    updateData.password = data.password;
                }

                await onUpdate(userToEdit.uid || userToEdit.id || '', updateData);
                onClose();
            } else {
                // ✨ CREATE MODE
                await onCreate(data, data.password);
                onClose();
            }
        } catch (err: any) {
            console.error("Error en operación de usuario:", err);

            // 2. Mapeo de errores de Auth a Campos del Formulario
            const firebaseCode = err.code;

            const fieldErrorMap: Record<string, 'email' | 'password' | 'displayName' | 'phoneNumber' | 'role' | 'franchiseId' | 'pack' | 'status'> = {
                'auth/email-already-in-use': 'email',
                'auth/invalid-email': 'email',
                'auth/weak-password': 'password',
            };

            if (fieldErrorMap[firebaseCode]) {
                // A) Error de Campo: Marcamos el input específico en rojo
                setError(fieldErrorMap[firebaseCode], {
                    type: 'server',
                    message: getFriendlyFirebaseError(err),
                });
            } else {
                // B) Error de Sistema: Mostramos Toast genérico
                toast?.error(getFriendlyFirebaseError(err));
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl glass-panel-exec rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 sticky top-0 backdrop-blur-md z-10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {userToEdit ? (
                            <>
                                <Edit className="w-5 h-5 text-blue-400" />
                                Editar Usuario
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5 text-indigo-400" />
                                Alta de Nuevo Usuario
                            </>
                        )}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Cerrar modal">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

                    {/* Generic Form Error Display */}
                    {Object.keys(errors).length > 0 && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-200 text-sm">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold">Por favor revisa los siguientes errores:</span>
                                    <ul className="list-disc list-inside text-xs opacity-90">
                                        {Object.entries(errors).map(([field, error]) => (
                                            <li key={field}>
                                                <span className="capitalize">{field}</span>: {(error as any).message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LEFT COL: Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                Credenciales
                            </h3>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email {userToEdit && '(No editable)'}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        {...register('email')}
                                        disabled={!!userToEdit}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border ${errors.email ? 'border-rose-500' : 'border-white/10'} rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none ${userToEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="usuario@repaart.es"
                                    />
                                </div>
                                {errors.email && <p className="text-rose-500 text-[10px] mt-1 font-medium">{String(errors.email.message)}</p>}
                            </div>

                            {/* Password - Only for users who need Auth (admin, franchise, user) */}
                            {!['staff'].includes(role) && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                                            {userToEdit ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal *'}
                                        </label>
                                        {userToEdit && (
                                            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                                Solo si deseas cambiarla
                                            </span>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            {...register('password')}
                                            className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border ${errors.password ? 'border-rose-500' : 'border-amber-500/20'} rounded-xl text-amber-100 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none placeholder:text-slate-600`}
                                            placeholder={userToEdit ? "Dejar vacía para mantener la actual" : "Mínimo 8 caracteres"}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {errors.password ? (
                                        <p className="text-rose-500 text-[10px] mt-1 font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {String(errors.password.message)}
                                        </p>
                                    ) : (
                                        !userToEdit && (
                                            <p className="text-[10px] text-slate-500 ml-1">
                                                Comparte esta contraseña con el usuario. Podrá cambiarla después.
                                            </p>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Personal Details */}
                            <div className="pt-2 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Nombre Completo *</label>
                                    <input
                                        type="text"
                                        {...register('displayName')}
                                        className={`w-full px-4 py-2.5 bg-slate-900/50 border ${errors.displayName ? 'border-rose-500' : 'border-white/10'} rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none`}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                    {errors.displayName && <p className="text-rose-500 text-[10px] mt-1 font-medium">{String(errors.displayName.message)}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        {...register('phoneNumber')}
                                        className={`w-full px-4 py-2.5 bg-slate-900/50 border ${errors.phoneNumber ? 'border-rose-500' : 'border-white/10'} rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none`}
                                        placeholder="+34 600..."
                                    />
                                    {errors.phoneNumber && <p className="text-rose-500 text-[10px] mt-1 font-medium">{String(errors.phoneNumber.message)}</p>}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COL: Access & Roles */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                Configuración de Acceso
                            </h3>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Rol</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <select
                                        {...register('role')}
                                        className="w-full pl-10 pr-8 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                                        disabled={!!initialFranchiseId} // Lock role if franchisee is creating
                                    >
                                        {initialFranchiseId ? (
                                            /* Franchisee Context: Only Riders */
                                            <option value="rider">Rider / Repartidor</option>
                                        ) : (
                                            /* Admin Context: All Roles */
                                            <>
                                                <option value="rider">Rider / Repartidor</option>
                                                <option value="user">Usuario App</option>
                                                <option value="staff">Staff Oficina</option>
                                                <option value="franchise">Franquiciado</option>
                                                <option value="admin">Administrador</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Franchise Specifics */}
                            {(role === 'franchise' || role === 'rider' || role === 'staff' || !!initialFranchiseId) && (
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    {/* ID FIELD */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wider ml-1">
                                            {role === 'franchise' ? 'ID Franquicia (Firebase) *' : 'ID Franquicia'}
                                        </label>
                                        <div className="relative">
                                            {initialFranchiseId ? (
                                                <div className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-green-500/30 rounded-xl text-green-100 text-sm flex items-center">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                                    {initialFranchiseId}
                                                    <input type="hidden" {...register('franchiseId')} value={initialFranchiseId} />
                                                </div>
                                            ) : (
                                                <>
                                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
                                                    <input
                                                        type="text"
                                                        {...register('franchiseId')}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-amber-500/20 rounded-xl text-amber-100 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                                                        placeholder="Ej: AVDV9ZDFZWGF0"
                                                    />
                                                </>
                                            )}
                                        </div>
                                        {errors.franchiseId && <p className="text-rose-500 text-[10px] mt-1 font-medium">{String(errors.franchiseId.message)}</p>}
                                    </div>

                                    {/* PACK SELECTION (FRANCHISE ONLY) */}
                                    {role === 'franchise' && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wider ml-1">Pack Contratado *</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setValue('pack', 'basic')}
                                                    className={`relative px-4 py-3 rounded-xl text-xs font-bold border-2 transition-all duration-300 ${pack === 'basic'
                                                        ? 'bg-slate-700 text-white border-slate-500 shadow-lg shadow-slate-500/20 scale-105'
                                                        : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:border-slate-500 hover:bg-slate-800/50'}`}
                                                >
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span>BÁSICO</span>
                                                        {pack === 'basic' && <div className="w-full h-0.5 bg-slate-400 rounded-full" />}
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setValue('pack', 'premium')}
                                                    className={`relative px-4 py-3 rounded-xl text-xs font-black border-2 transition-all duration-300 overflow-hidden ${pack === 'premium'
                                                        ? 'bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 text-black border-amber-400 shadow-2xl shadow-amber-500/40 scale-105'
                                                        : 'bg-slate-900/50 text-slate-400 border-amber-900/30 hover:border-amber-500/50 hover:bg-amber-950/20'}`}
                                                >
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="flex items-center gap-1">
                                                            PREMIUM
                                                            {pack === 'premium' && <span className="text-yellow-200">✨</span>}
                                                        </span>
                                                        {pack === 'premium' && (
                                                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-200 to-transparent rounded-full animate-pulse" />
                                                        )}
                                                    </div>
                                                    {pack === 'premium' && (
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Only show for franchise role (not for drivers/staff) */}
                                    {role === 'franchise' && (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wider ml-1">Nombre / Razón Social *</label>
                                                <input
                                                    type="text"
                                                    {...register('displayName')}
                                                    className={`w-full px-4 py-2.5 bg-slate-900/80 border ${errors.displayName ? 'border-rose-500' : 'border-amber-500/20'} rounded-xl text-amber-100 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none`}
                                                    placeholder="Ej: Transportes Rápidos S.L."
                                                />
                                                {errors.displayName && <p className="text-rose-500 text-[10px] mt-1 font-medium">{String(errors.displayName.message)}</p>}
                                                <p className="text-[10px] text-slate-500 ml-1">Visible para el administrador y en reportes.</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wider ml-1">CIF / NIF</label>
                                                <input
                                                    type="text"
                                                    {...register('cif')}
                                                    className={`w-full px-4 py-2.5 bg-slate-900/80 border ${errors.cif ? 'border-rose-500' : 'border-amber-500/20'} rounded-xl text-amber-100 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none`}
                                                    placeholder="B12345678"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wider ml-1">Localidad</label>
                                                    <input
                                                        type="text"
                                                        {...register('city')}
                                                        className="w-full px-4 py-2.5 bg-slate-900/80 border border-amber-500/20 rounded-xl text-amber-100 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                                                        placeholder="Madrid"
                                                    />
                                                    <p className="text-[10px] text-slate-500 ml-1">Usado para widget de Clima.</p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wider ml-1">Teléfono</label>
                                                    <input
                                                        type="tel"
                                                        {...register('phoneNumber')}
                                                        className="w-full px-4 py-2.5 bg-slate-900/80 border border-amber-500/20 rounded-xl text-amber-100 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                                                        placeholder="+34 600..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-amber-200/80 uppercase tracking-wider ml-1">Dirección Completa</label>
                                                <input
                                                    type="text"
                                                    {...register('address')}
                                                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-amber-500/20 rounded-xl text-amber-100 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                                                    placeholder="C/ Principal 123, CP 28001"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Status */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Estado</label>
                                <select
                                    {...register('status')}
                                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                                >
                                    <option value="active">Activo (Acceso Completo)</option>
                                    <option value="pending">Pendiente (Solo Recursos/Soporte)</option>
                                    <option value="banned">Bloqueado (Sin Acceso)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex gap-3 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl text-sm font-semibold transition-colors" disabled={isLoading}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={isLoading} className={`flex-1 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${userToEdit
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
                            }`}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (userToEdit ? <Edit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
                            {isLoading ? 'Procesando...' : (userToEdit ? 'Guardar Cambios' : 'Crear Usuario')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;
