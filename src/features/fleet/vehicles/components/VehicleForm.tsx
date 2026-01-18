import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VehicleFormValues, VehicleFormSchema } from '../../../../schemas/fleet';
import { Button } from '../../../../components/ui/primitives/Button';
import { useVehicleStore } from '../../../../store/useVehicleStore';
// Use a hardcoded franchiseId for now or get from context context, but usually passed via props or store
// Assuming franchiseId is handled by the parent or store for 'addVehicle' call. 
// Wait, store requires franchiseId for 'add'. I should pass it as prop or we grab it from auth store.
// Let's grab global user/franchise ID if possible, or pass as prop.
// For now, I'll assume the parent component knows the franchiseId.

interface VehicleFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: VehicleFormValues & { id: string };
    franchiseId: string; // Required for creating new
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ onSuccess, onCancel, initialData, franchiseId }) => {
    const { addVehicle, updateVehicle } = useVehicleStore();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<VehicleFormValues>({
        resolver: zodResolver(VehicleFormSchema),
        defaultValues: initialData || {
            plate: '',
            model: '',
            currentKm: 0,
            nextRevisionKm: 5000,
            status: 'active'
        }
    });

    const onSubmit = async (data: VehicleFormValues) => {
        try {
            if (initialData?.id) {
                await updateVehicle(initialData.id, data as any);
            } else {
                await addVehicle(franchiseId, data as any);
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving vehicle:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Matrícula */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Matrícula
                </label>
                <input
                    {...register('plate')}
                    className={`
                        w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 
                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                        ${errors.plate
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-700'}
                    `}
                    placeholder="1234-ABC"
                />
                {errors.plate && (
                    <p className="text-xs text-red-500">{errors.plate.message}</p>
                )}
            </div>

            {/* Modelo */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Modelo
                </label>
                <input
                    {...register('model')}
                    className={`
                        w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 
                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                        ${errors.model
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-700'}
                    `}
                    placeholder="Honda PCX 125"
                />
                {errors.model && (
                    <p className="text-xs text-red-500">{errors.model.message}</p>
                )}
            </div>

            {/* Grid for KM & Revision */}
            <div className="grid grid-cols-2 gap-4">
                {/* KM Actuales */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        KM Actuales
                    </label>
                    <input
                        type="number"
                        {...register('currentKm', { valueAsNumber: true })}
                        className={`
                            w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                            ${errors.currentKm
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-slate-200 dark:border-slate-700'}
                        `}
                        placeholder="0"
                    />
                    {errors.currentKm && (
                        <p className="text-xs text-red-500">{errors.currentKm.message}</p>
                    )}
                </div>

                {/* Próxima Revisión */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Próx. Revisión (KM)
                    </label>
                    <input
                        type="number"
                        {...register('nextRevisionKm', { valueAsNumber: true })}
                        className={`
                            w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 
                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                            ${errors.nextRevisionKm
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-slate-200 dark:border-slate-700'}
                        `}
                        placeholder="5000"
                    />
                    {errors.nextRevisionKm && (
                        <p className="text-xs text-red-500">{errors.nextRevisionKm.message}</p>
                    )}
                </div>
            </div>

            {/* Estado */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Estado
                </label>
                <select
                    {...register('status')}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                    <option value="active">Activo</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="out_of_service">Fuera de Servicio</option>
                    <option value="deleted">Baja</option>
                </select>
                {errors.status && (
                    <p className="text-xs text-red-500">{errors.status.message}</p>
                )}
            </div>

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
                    {initialData ? 'Guardar Cambios' : 'Registrar Vehículo'}
                </Button>
            </div>
        </form>
    );
};
