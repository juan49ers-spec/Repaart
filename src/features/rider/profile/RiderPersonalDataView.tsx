import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { storage } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Phone, Mail, MapPin, Save, ArrowLeft, Loader, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';

// Schema for personal data
const personalDataSchema = z.object({
    displayName: z.string().min(2, "El nombre es muy corto"),
    phoneNumber: z.string().min(9, "Teléfono inválido"),
    address: z.string().optional(),
});

type PersonalDataInput = z.infer<typeof personalDataSchema>;

export const RiderPersonalDataView: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast() || {};
    const [isSaving, setIsSaving] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<PersonalDataInput>({
        resolver: zodResolver(personalDataSchema),
        defaultValues: {
            displayName: user?.displayName || '',
            phoneNumber: user?.phoneNumber || '',
            address: (user as any)?.address || '',
        }
    });

    // Update form when user data loads
    useEffect(() => {
        if (user) {
            reset({
                displayName: user.displayName || '',
                phoneNumber: user.phoneNumber || '',
                address: (user as any)?.address || '',
            });
        }
    }, [user, reset]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user?.uid) return;

        // Validation: Max 5MB, Image only
        if (file.size > 5 * 1024 * 1024) {
            toast?.error("La imagen es demasiado grande (Máx 5MB)");
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast?.error("Solo se permiten imágenes");
            return;
        }

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update Firestore immediately to reflect change
            await updateDoc(doc(db, 'users', user.uid), {
                photoURL: downloadURL,
                updatedAt: new Date()
            });

            toast?.success('Foto de perfil actualizada');
            // Allow Firebase Auth to propagate change naturally
        } catch (error) {
            console.error("Error uploading image:", error);
            toast?.error("Error al subir la imagen");
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: PersonalDataInput) => {
        if (!user?.uid) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                displayName: data.displayName,
                phoneNumber: data.phoneNumber,
                address: data.address,
                updatedAt: new Date()
            });
            toast?.success('Datos guardados correctamente');
        } catch (error) {
            console.error("Error updating profile:", error);
            toast?.error('Error al guardar datos');
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
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">Datos Personales</h1>
            </div>

            <main className="p-6">
                <div className="flex justify-center mb-8">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg relative">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="text-slate-400" />
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader className="animate-spin text-white" size={24} />
                                </div>
                            )}
                        </div>

                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-blue-700 transition-colors active:scale-90">
                            <Camera size={16} />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User size={14} /> Nombre Completo
                        </label>
                        <input
                            {...register('displayName')}
                            className="w-full p-3 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.displayName && <p className="text-xs text-red-500">{errors.displayName.message}</p>}
                    </div>

                    {/* Email (Read Only) */}
                    <div className="space-y-1.5 opacity-60">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Mail size={14} /> Email
                        </label>
                        <input
                            value={user?.email || ''}
                            disabled
                            className="w-full p-3 bg-slate-100 dark:bg-slate-700/50 border-none rounded-2xl shadow-inner text-slate-600 dark:text-slate-400"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Phone size={14} /> Teléfono
                        </label>
                        <input
                            {...register('phoneNumber')}
                            type="tel"
                            className="w-full p-3 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <MapPin size={14} /> Dirección
                        </label>
                        <input
                            {...register('address')}
                            placeholder="Tu dirección principal"
                            className="w-full p-3 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full mt-8 bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader className="animate-spin" /> : <Save size={20} />}
                        Guardar Cambios
                    </button>
                </form>
            </main>
        </div>
    );
};
