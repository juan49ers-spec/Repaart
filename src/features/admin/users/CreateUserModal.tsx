import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, updateUserSchema, UserRole } from '../../../lib/schemas';
import { X, Mail, Building, Loader2, Lock, Briefcase, User } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { UserProfile } from '../../../services/userService';
import { z } from 'zod';

// =====================================================
// TYPES
// =====================================================
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
    initialData = null
}) => {
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
            role: (initialFranchiseId ? 'rider' : 'franchise') as UserRole,
            pack: 'basic',
            status: 'active'
        }
    });

    const role = watch('role');
    const pack = watch('pack');
    const name = watch('name');

    // Auto-password logic
    useEffect(() => {
        if (!userToEdit && role === 'franchise' && name) {
            const cleanName = name.trim();
            if (cleanName.length > 2) {
                const generated = `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()}123!`;
                setValue('password', generated);
            }
        }
    }, [name, role, userToEdit, setValue]);

    // Initialization Effect
    useEffect(() => {
        if (isOpen) {
            // Logic to pre-fill form... (omitted for brevity, copied from previous logic)
            // Simplified here for clarity of Rewrite
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
            } else {
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
                    legalName: initialData?.legalName || '',
                    cif: initialData?.cif || '',
                    address: ''
                });
            }
        }
    }, [isOpen, userToEdit, reset, initialFranchiseId, initialData]);

    if (!isOpen) return null;

    const onSubmit = async (data: FormValues) => {
        try {
            if (userToEdit) {
                const updateData: Partial<UpdateUserInput> = {
                    displayName: data.displayName,
                    phoneNumber: data.phoneNumber,
                    role: data.role,
                    status: data.status,
                    ...(data.role === 'franchise' && {
                        franchiseId: data.franchiseId,
                        pack: data.pack,
                        name: data.name,
                        legalName: data.legalName,
                        cif: data.cif,
                        address: data.address
                    }),
                    ...(data.password && { password: data.password })
                };
                await onUpdate(userToEdit.uid || userToEdit.id || '', updateData);
            } else {
                await onCreate(data, data.password);
            }
            onClose();
        } catch (err: any) {
            const firebaseCode = err.code;
            if (firebaseCode && firebaseCode.includes('email')) {
                setError('email', { message: 'El email ya está en uso o es inválido' });
            } else {
                toast?.error('Error al guardar');
            }
        }
    };

    const getTitle = () => {
        if (userToEdit) return 'Editar Perfil';
        if (role === 'franchise') return 'Crear Franquicia';
        return 'Nuevo Usuario';
    };

    return (
        // OVERLAY
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">

            {/* MODAL WINDOW */}
            <div className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-2xl shadow-2xl ring-1 ring-black/5 flex flex-col max-h-[85vh] relative overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                            {getTitle()}
                        </h2>
                        {!userToEdit && (
                            <p className="text-xs text-slate-500">Completa la información requerida</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form id="create-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                        {/* SECTION 1: CREDENTIALS */}
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                <Lock className="w-3 h-3" /> Credenciales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Corporativo</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            {...register('email')}
                                            disabled={!!userToEdit}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="ejemplo@repaart.es"
                                        />
                                    </div>
                                    {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message as string}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
                                    <input
                                        type="password"
                                        {...register('password')}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder={userToEdit ? "••••••••" : "Mínimo 8 caracteres"}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="h-px bg-slate-100 dark:bg-slate-800" />

                        {/* SECTION 2: PERSONAL INFO */}
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                <User className="w-3 h-3" /> Datos de Perfil
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre / Razón Social</label>
                                    <input
                                        {...register('displayName')}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
                                    <input
                                        {...register('phoneNumber')}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="h-px bg-slate-100 dark:bg-slate-800" />

                        {/* SECTION 3: ROLE & CONTEXT */}
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                <Briefcase className="w-3 h-3" /> Rol y Permisos
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rol de Sistema</label>
                                        <select
                                            {...register('role')}
                                            disabled={!!initialFranchiseId}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        >
                                            <option value="franchise">Franquicia</option>
                                            <option value="admin">Administrador Global</option>
                                            <option value="staff">Staff / Soporte</option>
                                            <option value="rider">Rider / Repartidor</option>
                                            <option value="user">Usuario Final</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
                                        <select
                                            {...register('status')}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        >
                                            <option value="active">Activo</option>
                                            <option value="pending">Pendiente</option>
                                            <option value="banned">Suspendido</option>
                                        </select>
                                    </div>
                                </div>

                                {/* FRANCHISE FIELDS */}
                                {role === 'franchise' && (
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Datos de Franquicia</h4>
                                            <Building className="w-4 h-4 text-slate-400" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-slate-500">ID de Plaza (City)</label>
                                                <input {...register('name')} placeholder="Madrid" className="w-full p-2 text-sm border border-slate-200 rounded-md" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-slate-500">ID Único (Firebase)</label>
                                                <input {...register('franchiseId')} placeholder="MAD01" className="w-full p-2 text-sm border border-slate-200 rounded-md" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-slate-500">Plan de Servicio</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setValue('pack', 'basic')}
                                                    className={`py-2 text-xs font-medium rounded-lg border ${pack === 'basic' ? 'bg-white shadow-sm border-slate-300 text-slate-900' : 'text-slate-500 border-transparent hover:bg-slate-200'}`}
                                                >
                                                    Basic
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setValue('pack', 'premium')}
                                                    className={`py-2 text-xs font-medium rounded-lg border ${pack === 'premium' ? 'bg-slate-800 text-white border-slate-900' : 'text-slate-500 border-transparent hover:bg-slate-200'}`}
                                                >
                                                    Premium
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </form>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        form="create-user-form"
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {userToEdit ? 'Guardar Cambios' : 'Crear'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;
