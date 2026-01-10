import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Loader, Save } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Button from '../../../ui/inputs/Button';
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
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, showMessage }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<ProfileFormData>({
        displayName: user?.displayName || '',
        phone: '', // Will load from firestore
        email: user?.email || '',
        photoURL: user?.photoURL || ''
    });

    // Load extra data from users (NEW ARCHITECTURE)
    useEffect(() => {
        const loadUserConfig = async () => {
            if (!user?.uid) return;
            try {
                // ✅ CORRECTO: Leemos de 'users', donde están los permisos y perfil
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData(prev => ({
                        ...prev,
                        phone: data.phone || user.phoneNumber || '',
                        photoURL: data.photoURL || user.photoURL || ''
                    }));
                }
            } catch (error) {
                console.error("Error loading user config:", error);
            }
        };
        loadUserConfig();
    }, [user]);

    const handleSave = async () => {
        // Validation
        const phoneRegex = /^\+?[0-9\s-]{9,}$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            showMessage('error', 'Formato de teléfono inválido');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Update Auth (Display Name)
            if (user && formData.displayName !== user.displayName) {
                await updateProfile(user as any, { displayName: formData.displayName });
            }

            // 2. Update Firestore (Sync Name/Photo)
            await setDoc(doc(db, "users", user.uid), {
                displayName: formData.displayName,
                phone: formData.phone,
                email: user.email // Ensure email is present
            }, { merge: true });

            showMessage('success', 'Información personal actualizada');
        } catch (error: any) {
            console.error("Error updating profile:", error);
            showMessage('error', 'Error al actualizar perfil: ' + (error.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header section removed - moved to UserProfile */}

            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4 transition-colors">Información Personal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre Completo</label>
                    <div className="relative">
                        <User className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Teléfono</label>
                    <div className="relative">
                        <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="+34 600 000 000"
                        />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email (No editable)</label>
                    <div className="relative opacity-70">
                        <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end transition-colors">
                <Button
                    variant="primary"
                    onClick={handleSave}
                    icon={isLoading ? Loader : Save}
                    className={`shadow-lg hover:scale-105 transform transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        </div>
    );
};

export default ProfileTab;
