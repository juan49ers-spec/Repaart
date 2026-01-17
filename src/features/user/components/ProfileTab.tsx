import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Loader, Save, Briefcase, MapPin, Globe } from 'lucide-react';
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
            await sendEmailVerification(user as any);
            showMessage('success', 'Correo de verificación enviado. Revisa tu bandeja de entrada.');
        } catch (error: any) {
            console.error("Error sending verification:", error);
            if (error.code === 'auth/too-many-requests') {
                showMessage('error', 'Demasiados intentos. Espera unos minutos.');
            } else {
                showMessage('error', 'Error al enviar correo: ' + error.message);
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
                await updateProfile(user as any, { displayName: formData.displayName });
            }

            await setDoc(doc(db, "users", user.uid), {
                displayName: formData.displayName,
                phone: formData.phone,
                email: user.email,
                location: formData.location,
                role_description: formData.role_description
            }, { merge: true });

            showMessage('success', 'Perfil actualizado con éxito');
        } catch (error: any) {
            console.error("Error updating profile:", error);
            showMessage('error', 'Error al actualizar: ' + (error.message || 'Desconocido'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- LEFT COLUMN: IDENTITY CARD --- */}
                <div className="w-full lg:w-1/3 space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Identidad Corporativa</h3>
                        <div className="space-y-4">
                            <div className="group">
                                <label htmlFor="displayName" className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Nombre Público</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        id="displayName"
                                        title="Nombre Público"
                                        aria-label="Nombre Público"
                                        placeholder="Tu nombre completo"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Cargo / Rol</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        title="Cargo o Rol"
                                        aria-label="Cargo o Rol"
                                        value={formData.role_description}
                                        onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                        placeholder="Ej. Operations Manager"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Ubicación</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        title="Ubicación"
                                        aria-label="Ubicación"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                        placeholder="Ciudad, País"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: CONTACT & SETTINGS --- */}
                <div className="flex-1 space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Información de Contacto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="group md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Correo Electrónico (Principal)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        title="Correo Electrónico"
                                        aria-label="Correo Electrónico"
                                        placeholder="email@ejemplo.com"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed shadow-inner"
                                    />
                                    <div className="absolute right-3 top-2.5 flex items-center gap-2">
                                        {user?.emailVerified ? (
                                            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                Verificado
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                                    No Verificado
                                                </span>
                                                <button
                                                    onClick={handleVerifyEmail}
                                                    disabled={isVerifying}
                                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 hover:underline disabled:opacity-50"
                                                >
                                                    {isVerifying ? 'Enviando...' : 'Verificar ahora'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="group">
                                <label htmlFor="phone" className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Teléfono Móvil</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="tel"
                                        id="phone"
                                        title="Teléfono Móvil"
                                        aria-label="Teléfono Móvil"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                        placeholder="+34 600 000 000"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Sitio Web / Enlace</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        disabled
                                        title="Sitio Web"
                                        aria-label="Sitio Web"
                                        placeholder="https://repaartfinanzas.web.app"
                                        value="repaartfinanzas.web.app"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-400 cursor-not-allowed shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-end pt-4">
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            icon={isLoading ? Loader : Save}
                            className={`px-8 py-3 text-sm shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 transform transition-all ${isLoading ? 'opacity-70' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Guardando Cambios...' : 'Guardar Perfil'}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProfileTab;
