import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { riderSchema, RiderFormValues } from '../schemas/RiderSchema';
import { Button } from '../../../components/ui/primitives/Button';
import { useFleetStore } from '../../../store/useFleetStore';
import { Eye, EyeOff } from 'lucide-react';

interface RiderFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: RiderFormValues & { id: string };
    franchiseId?: string;
}

export const RiderForm: React.FC<RiderFormProps> = ({ onSuccess, onCancel, initialData, franchiseId }) => {
    const { addRider, updateRider } = useFleetStore();
    const [showPassword, setShowPassword] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(riderSchema),
        defaultValues: {
            fullName: initialData?.fullName || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
            status: initialData?.status || 'active',
            contractHours: initialData?.contractHours || 40,
            licenseType: (initialData?.licenseType as "125cc" | "49cc") || '125cc',
            password: '',
            joinedAt: initialData?.joinedAt || new Date().toISOString().split('T')[0]
        }
    });

    const getFirebaseErrorMessage = (error: any) => {
        const code = error.code || error.message;
        if (code?.includes('auth/email-already-in-use')) {
            return 'Este correo electrónico ya está registrado. Intenta con otro o busca al usuario existente.';
        }
        if (code?.includes('auth/weak-password')) {
            return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
        }
        if (code?.includes('auth/invalid-email')) {
            return 'El formato del correo electrónico no es válido.';
        }
        if (code?.includes('permission-denied')) {
            return 'No tienes permisos para realizar esta acción.';
        }
        return error.message || "Error al guardar el Rider. Inténtalo de nuevo.";
    };

    const onSubmit = async (data: RiderFormValues) => {
        setSubmitError(null);
        try {
            const payload = {
                ...data,
                contractHours: data.contractHours || 40 // Default handled by schema but good for safety
            };

            if (initialData?.id) {
                await updateRider(initialData.id, payload);
            } else {
                await addRider({ ...payload, franchiseId });
            }
            onSuccess();
        } catch (error: any) {
            console.error('Error saving rider:', error);
            setSubmitError(getFirebaseErrorMessage(error));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nombre Completo
                </label>
                <input
                    {...register('fullName')}
                    className={`
                        w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 
                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                        ${errors.fullName
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-700'}
                    `}
                    placeholder="Ej: Juan Pérez"
                />
                {errors.fullName && (
                    <p className="text-xs text-red-500">{errors.fullName.message}</p>
                )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                </label>
                <input
                    {...register('email')}
                    type="email"
                    className={`
                        w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 
                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                        ${errors.email
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-700'}
                    `}
                    placeholder="rider@repaart.com"
                />
                {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
            </div>

            {/* Password (Only for new Riders) */}
            {!initialData && (
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Contraseña Inicial
                    </label>
                    <div className="relative">
                        <input
                            {...register('password')}
                            type={showPassword ? "text" : "password"}
                            className={`
                                w-full px-4 py-2 pr-10 rounded-lg border bg-white dark:bg-slate-800 
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                                ${errors.password
                                    ? 'border-red-500 focus:border-red-500'
                                    : 'border-slate-200 dark:border-slate-700'}
                            `}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-xs text-red-500">{errors.password.message}</p>
                    )}
                    <p className="text-xs text-slate-400">
                        El Rider usará este email y contraseña para acceder a su App.
                    </p>
                </div>
            )}

            {/* Phone */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Teléfono
                </label>
                <input
                    {...register('phone')}
                    type="tel"
                    className={`
                        w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 
                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                        ${errors.phone
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-700'}
                    `}
                    placeholder="+34 600 000 000"
                />
                {errors.phone && (
                    <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Contract Hours */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Horas/Semana
                    </label>
                    <div className="relative">
                        <input
                            {...register('contractHours', { valueAsNumber: true })}
                            type="number"
                            className={`
                                w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                                ${errors.contractHours
                                    ? 'border-red-500 focus:border-red-500'
                                    : 'border-slate-200 dark:border-slate-700'}
                            `}
                            placeholder="40"
                        />
                        <span className="absolute right-4 top-2 text-slate-400 text-sm">h</span>
                    </div>
                </div>

                {/* License Type */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Licencia
                    </label>
                    <select
                        {...register('licenseType')}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                        <option value="125cc">125cc (B)</option>
                        <option value="49cc">49cc (AM)</option>
                    </select>
                </div>
            </div>

            {/* Joined At (Alta) */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Fecha de Alta
                </label>
                <input
                    {...register('joinedAt')}
                    type="date"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Estado
                </label>
                <select
                    {...register('status')}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="on_route">En Ruta</option>
                    <option value="maintenance">Mantenimiento</option>
                </select>
            </div>

            {/* Error Message */}
            {submitError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                    {submitError}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    isLoading={isSubmitting}
                >
                    {initialData ? 'Guardar Cambios' : 'Crear Rider'}
                </Button>
            </div>
        </form>
    );
};
