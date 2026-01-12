import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { Lock, Shield, Save, ArrowLeft, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const securitySchema = z.object({
    currentPassword: z.string().min(1, "Requerido"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type SecurityFormValues = z.infer<typeof securitySchema>;

export const RiderSecurityView: React.FC = () => {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema)
    });

    const onSubmit = async (data: SecurityFormValues) => {
        const user = auth.currentUser;
        if (!user || !user.email) return;

        setIsSaving(true);
        try {
            // 1. Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 2. Update Password
            await updatePassword(user, data.newPassword);

            alert('Contraseña actualizada correctamente');
            reset();
            navigate(-1);
        } catch (error: any) {
            console.error("Error updating password:", error);
            if (error.code === 'auth/wrong-password') {
                alert('La contraseña actual es incorrecta');
            } else {
                alert('Error al actualizar la contraseña: ' + error.message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">Seguridad</h1>
            </div>

            <main className="p-6">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                        <Shield size={32} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs">
                        Mantén tu cuenta segura. Te pediremos tu contraseña actual para confirmar los cambios.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Lock size={14} /> Contraseña Actual
                        </label>
                        <input
                            {...register('currentPassword')}
                            type="password"
                            placeholder="••••••••"
                            className="w-full p-3 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword.message}</p>}
                    </div>

                    <div className="space-y-1.5 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Lock size={14} /> Nueva Contraseña
                        </label>
                        <input
                            {...register('newPassword')}
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="w-full p-3 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Lock size={14} /> Confirmar Nueva Contraseña
                        </label>
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            placeholder="Repite la nueva contraseña"
                            className="w-full p-3 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full mt-8 bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader className="animate-spin" /> : <Save size={20} />}
                        Actualizar Contraseña
                    </button>
                </form>
            </main>
        </div>
    );
};
