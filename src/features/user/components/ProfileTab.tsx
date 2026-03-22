import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Loader, Save, Briefcase, MapPin, Globe, Lock } from 'lucide-react';
import { updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Button from '../../../components/ui/inputs/Button';
import { AuthUser, RoleConfig } from '../../../context/AuthContext';

export interface ProfileTabProps {
    user: AuthUser;
    roleConfig?: RoleConfig;
    isAdmin: boolean;
    showMessage: (type: 'success' | 'error', text: string) => void;
}

interface ProfileFormData {
    displayName: string;
    phone: string;
    email: string;
    photoURL: string;
    location?: string;
    role_description?: string;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, showMessage, roleConfig }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [formData, setFormData] = useState<ProfileFormData>({
        displayName: user?.displayName || '',
        phone: '',
        email: user?.email || '',
        photoURL: user?.photoURL || '',
        location: '',
        role_description: ''
    });

    useEffect(() => {
        const loadUserConfig = async () => {
            if (!user?.uid) return;
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData(prev => ({
                        ...prev,
                        phone: data.phone || user.phoneNumber || '',
                        photoURL: data.photoURL || user.photoURL || '',
                        location: data.location || 'Madrid, España',
                        role_description: data.role_description || (roleConfig?.role === 'admin' ? 'Strategic Operations Director' : 'Franquiciado')
                    }));
                }
            } catch (error) {
                console.error("Error loading user config:", error);
            }
        };
        loadUserConfig();
    }, [user, roleConfig]);

    const handleVerifyEmail = async () => {
        if (!user) return;
        setIsVerifying(true);
        try {
            await sendEmailVerification(user);
            showMessage('success', 'Correo de verificación enviado. Revisa tu bandeja de entrada.');
        } catch (error: unknown) {
            console.error("Error sending verification:", error);
            if (error instanceof Error && (error as { code?: string }).code === 'auth/too-many-requests') {
                showMessage('error', 'Demasiados intentos. Espera unos minutos.');
            } else {
                showMessage('error', 'Error al enviar correo: ' + (error instanceof Error ? error.message : 'Desconocido'));
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSave = async () => {
        const phoneRegex = /^\+?[0-9\s-]{9,}$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            showMessage('error', 'Formato de teléfono inválido');
            return;
        }

        setIsLoading(true);
        try {
            if (user && formData.displayName !== user.displayName) {
                await updateProfile(user, { displayName: formData.displayName });
            }

            await setDoc(doc(db, "users", user.uid), {
                displayName: formData.displayName,
                phone: formData.phone,
                email: user.email,
                location: formData.location,
                role_description: formData.role_description
            }, { merge: true });

            showMessage('success', 'Perfil actualizado con éxito');
        } catch (error: unknown) {
            console.error("Error updating profile:", error);
            showMessage('error', 'Error al actualizar: ' + (error instanceof Error ? error.message : 'Desconocido'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex flex-col gap-10">

                {/* --- HEADER --- */}
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-6">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Perfil de Usuario</h2>
                    <p className="text-sm text-slate-500">Gestiona tu identidad y credenciales de acceso</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* --- LEFT COLUMN: AVATAR & STATUS --- */}
                    <div className="space-y-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Identidad Visual</label>
                            <div className="flex items-center gap-6">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                                        {formData.photoURL ? (
                                            <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-300">
                                                {formData.displayName?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-full transition-colors"></div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900">{formData.displayName || 'Usuario'}</div>
                                    <div className="text-xs text-slate-500 mt-1">{formData.role_description}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Verificación</label>
                            {user?.emailVerified ? (
                                <div className="flex items-center gap-3 text-sm font-medium text-emerald-600 bg-emerald-50/50 px-4 py-3 rounded-xl border border-emerald-100">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    Cuenta Verificada
                                </div>
                            ) : (
                                <div className="flex items-center justify-between text-sm font-medium text-amber-600 bg-amber-50/50 px-4 py-3 rounded-xl border border-amber-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                        Pendiente de verificar
                                    </div>
                                    <button
                                        onClick={handleVerifyEmail}
                                        disabled={isVerifying}
                                        className="text-xs font-bold text-amber-700 hover:underline"
                                    >
                                        {isVerifying ? 'Enviando...' : 'Verificar'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: FORM FIELDS --- */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* PERSONAL DETAILS */}
                        <div className="space-y-6">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Información Personal</label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="group">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre Público</label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-900 font-medium focus:border-slate-900 focus:outline-none transition-colors placeholder:text-slate-300"
                                        placeholder="Tu nombre completo"
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Cargo / Rol</label>
                                    <input
                                        type="text"
                                        value={formData.role_description}
                                        onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
                                        className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-900 font-medium focus:border-slate-900 focus:outline-none transition-colors placeholder:text-slate-300"
                                        placeholder="Ej. Manager"
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Ubicación</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-900 font-medium focus:border-slate-900 focus:outline-none transition-colors placeholder:text-slate-300"
                                        placeholder="Ciudad, País"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CONTACT DETAILS */}
                        <div className="space-y-6 pt-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Contacto</label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="group">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Principal</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-500 font-medium cursor-not-allowed"
                                        />
                                        <Lock className="absolute right-0 top-2 w-4 h-4 text-slate-300" />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono Móvil</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-transparent border-b border-slate-200 py-2 text-slate-900 font-medium focus:border-slate-900 focus:outline-none transition-colors placeholder:text-slate-300"
                                        placeholder="+34 600..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="pt-8 flex justify-end">
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                icon={isLoading ? Loader : Save}
                                className={`px-8 py-3 rounded-full text-sm font-bold shadow-xl shadow-slate-200 hover:shadow-2xl transition-all ${isLoading ? 'opacity-70' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;
