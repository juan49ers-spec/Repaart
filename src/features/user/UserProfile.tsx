import React, { useState, Suspense, lazy, type FC, useRef } from 'react';
import { User, Lock, Bell, Shield, LogOut, CheckCircle, AlertTriangle, Camera, Mail, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../ui/inputs/Button';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';

// Sub-components
import ProfileTab from './components/ProfileTab';
import SecurityTab from './components/SecurityTab';
import NotificationsTab from './components/NotificationsTab';
import AdminTab from './components/AdminTab';

// Lazy load heavy components
const FranchiseProfile = lazy(() => import('../admin/settings/FranchiseProfile'));
import RealMadridWidget from './components/RealMadridWidget';

interface UserProfileProps {
    setViewMode?: (mode: string) => void;
}

const UserProfile: FC<UserProfileProps> = ({ setViewMode }) => {
    const { user, roleConfig, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const isAdmin = roleConfig?.role === 'admin';

    const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- AVATAR UPLOAD LOGIC (Moved from ProfileTab) ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsLoadingAvatar(true);
        try {
            const storageRef = ref(storage, `avatars/${user.uid}`);
            // Force strict type, although usually inferred
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // 1. Update Auth
            await updateProfile(user, { photoURL: downloadURL });

            // 2. Update Firestore
            await setDoc(doc(db, "users", user.uid), {
                photoURL: downloadURL
            }, { merge: true });

            showMessage('success', 'Avatar actualizado correctamente');
            // Force refresh or local update could be handled by Context, 
            // but for now the user object in context might take a moment to update.
        } catch (error: any) {
            console.error("Error uploading avatar:", error);
            showMessage('error', 'Error al subir la imagen');
        } finally {
            setIsLoadingAvatar(false);
        }
    };

    if (!user) {
        return <div className="p-8 text-center text-slate-500">Cargando perfil...</div>;
    }

    const handleLogout = () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            logout();
        }
    };

    // --- UNIFIED VIEW FOR FRANCHISE ---
    if (roleConfig?.role === 'franchise') {
        return (
            <div className="h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
                <Suspense fallback={<div className="p-10 flex items-center justify-center text-slate-400">Cargando perfil unificado...</div>}>
                    <FranchiseProfile />
                </Suspense>
            </div>
        );
    }

    // --- UNIFIED VIEW FOR ADMINISTRATOR (New Design) ---
    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-y-auto pb-20 relative">
            {/* Feedback Message */}
            {message.text && (
                <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center animate-in slide-in-from-right duration-300 backdrop-blur-md border ${message.type === 'error' ? 'bg-rose-500/90 text-white border-rose-400' : 'bg-emerald-500/90 text-white border-emerald-400'}`}>
                    {message.type === 'error' ? <AlertTriangle className="w-5 h-5 mr-3" /> : <CheckCircle className="w-5 h-5 mr-3" />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            {/* Banner Superior */}
            <div className="h-48 w-full bg-gradient-to-r from-slate-200 to-slate-100 relative border-b border-slate-200">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50 to-transparent" />
                {/* Logout Button (Top Right Absolute) */}
                <div className="absolute top-6 right-6 z-10">
                    <Button
                        variant="secondary"
                        onClick={handleLogout}
                        icon={LogOut}
                        className="bg-white/50 backdrop-blur-sm border-white/50 hover:bg-white text-slate-700 shadow-sm"
                    >
                        Cerrar Sesión
                    </Button>
                </div>
                {isAdmin && (
                    <div className="absolute top-6 left-6 z-10 w-64 hidden xl:block">
                        <RealMadridWidget variant="header" className="shadow-lg bg-white/90 backdrop-blur-md" />
                    </div>
                )}
            </div>

            <div className="max-w-5xl mx-auto w-full px-6 md:px-10 -mt-20 relative z-10 flex flex-col gap-8">

                {/* --- HEADER IDENTITY SECTION --- */}
                <div className="flex flex-col md:flex-row items-end gap-6 pb-6 border-b border-slate-200/60">
                    {/* Avatar / Logo */}
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center relative">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-4xl font-black text-slate-300">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                {isLoadingAvatar ? <Loader className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white drop-shadow-md" />}
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Text Info */}
                    <div className="flex-1 mb-2">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            {user.displayName || 'Usuario'}
                        </h1>
                        <div className="flex items-center gap-3 text-slate-500 font-medium mt-1">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {roleConfig?.role || 'User'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- TABS & CONTENT --- */}
                <div className="flex flex-col gap-6">
                    {/* TABS COMPACTOS */}
                    <div className="flex p-1 bg-slate-200/50 rounded-xl border border-slate-200 w-fit backdrop-blur-sm sticky top-0 z-20 shadow-sm overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'profile'
                                ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px]'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            <User className="w-4 h-4" /> Datos Personales
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'security'
                                ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px]'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            <Lock className="w-4 h-4" /> Seguridad
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'notifications'
                                ? 'bg-white text-indigo-600 shadow-md translate-y-[-1px]'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            <Bell className="w-4 h-4" /> Notificaciones
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === 'admin'
                                    ? 'bg-slate-800 text-white shadow-md translate-y-[-1px]'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                                    }`}
                            >
                                <Shield className="w-4 h-4" /> Zona Admin
                            </button>
                        )}
                    </div>

                    {/* CONTENT AREA */}
                    <div className="min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <ProfileTab
                                user={user}
                                roleConfig={roleConfig || undefined}
                                isAdmin={isAdmin}
                                showMessage={showMessage}
                            />
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'security' && (
                            <SecurityTab
                                user={user}
                                logout={logout}
                                showMessage={showMessage}
                            />
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <NotificationsTab
                                user={user}
                                showMessage={showMessage}
                            />
                        )}

                        {/* ADMIN TAB */}
                        {isAdmin && activeTab === 'admin' && (
                            <AdminTab setViewMode={setViewMode || (() => { })} />
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserProfile;
