import React, { useState, Suspense, lazy, type FC, useRef } from 'react';
import { User, Lock, Bell, LogOut, CheckCircle, AlertTriangle, Camera, Mail, Sparkles, LayoutDashboard } from 'lucide-react'; import { useAuth } from '../../context/AuthContext';
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

interface UserProfileProps {
    setViewMode?: (mode: string) => void;
}

const UserProfile: FC<UserProfileProps> = ({ setViewMode }) => {
    const { user, roleConfig, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showMessage = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const isAdmin = roleConfig?.role === 'admin';

    // --- AVATAR UPLOAD LOGIC ---
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsLoadingAvatar(true);
        try {
            const storageRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // 1. Update Auth
            await updateProfile(user, { photoURL: downloadURL });

            // 2. Update Firestore
            await setDoc(doc(db, "users", user.uid), {
                photoURL: downloadURL
            }, { merge: true });

            showMessage('success', 'Avatar actualizado correctamente');
        } catch (error: any) {
            console.error("Error uploading avatar:", error);
            showMessage('error', 'Error al subir la imagen');
        } finally {
            setIsLoadingAvatar(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-100 rounded-full"></div>
                    <div className="text-slate-400 font-medium">Cargando perfil...</div>
                </div>
            </div>
        );
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

    // --- PRO DESIGN: MESH GRADIENT & GLASS STRUCTURE ---
    return (
        <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50">
            {/* Dynamic Background Mesh */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
            </div>

            {/* Feedback Toast */}
            {message.text && (
                <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center animate-in slide-in-from-right duration-300 backdrop-blur-md border ${message.type === 'error' ? 'bg-rose-500/90 text-white border-rose-400' : 'bg-emerald-500/90 text-white border-emerald-400'}`}>
                    {message.type === 'error' ? <AlertTriangle className="w-5 h-5 mr-3" /> : <CheckCircle className="w-5 h-5 mr-3" />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col gap-8">

                {/* --- HERO SECTION --- */}
                <div className="relative isolate">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8 pb-8">
                        {/* Avatar Container with Glow */}
                        <div className="relative group perspective-1000">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                            <div
                                className="relative w-36 h-36 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white cursor-pointer group-hover:scale-[1.02] transition-all duration-300 ease-out"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-4xl font-black text-slate-300">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                    {isLoadingAvatar ?
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div> :
                                        <Camera className="w-8 h-8 text-white drop-shadow-md transform group-hover:scale-110 transition-transform" />
                                    }
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {/* Status Indicator */}
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg" title="Online"></div>
                        </div>

                        {/* User Identity */}
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/50 backdrop-blur-sm shadow-sm mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">
                                    {roleConfig?.role === 'admin' ? 'Administrador Global' : 'Franquiciado'}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
                                {user.displayName || 'Usuario'}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500 font-medium">
                                <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-lg border border-slate-200/50">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span>{user.email}</span>
                                </div>
                                <span className="hidden md:inline text-slate-300">|</span>
                                <div className="text-sm text-slate-400">
                                    ID: <span className="font-mono">{user.uid.slice(0, 8)}...</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                onClick={handleLogout}
                                icon={LogOut}
                                className="bg-white/80 hover:bg-white text-rose-600 border-white shadow-sm hover:shadow-md backdrop-blur-sm transition-all"
                            >
                                Cerrar Sesión
                            </Button>
                        </div>
                    </div>
                </div>

                {/* --- FLOATING TAB DOCK --- */}
                <div className="sticky top-0 z-30 pt-2 pb-6 -mx-4 px-4 bg-gradient-to-b from-slate-50/50 via-slate-50/80 to-transparent backdrop-blur-[1px]">
                    <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/40 rounded-2xl p-1.5 flex items-center gap-1 max-w-fit mx-auto md:mx-0">
                        <TabButton
                            active={activeTab === 'profile'}
                            onClick={() => setActiveTab('profile')}
                            icon={User}
                            label="Perfil"
                        />
                        <TabButton
                            active={activeTab === 'security'}
                            onClick={() => setActiveTab('security')}
                            icon={Lock}
                            label="Seguridad"
                        />
                        <TabButton
                            active={activeTab === 'notifications'}
                            onClick={() => setActiveTab('notifications')}
                            icon={Bell}
                            label="Alertas"
                        />
                        {isAdmin && (
                            <>
                                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                <TabButton
                                    active={activeTab === 'admin'}
                                    onClick={() => setActiveTab('admin')}
                                    icon={LayoutDashboard}
                                    label="GESTIÓN DE FRANQUICIAS"
                                    variant="admin"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* --- CONTENT AREA (Clean Apple Card) --- */}
                <div className="relative min-h-[500px]">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">

                        {activeTab === 'profile' && (
                            <ProfileTab
                                user={user}
                                roleConfig={roleConfig || undefined}
                                isAdmin={isAdmin}
                                showMessage={showMessage}
                            />
                        )}

                        {activeTab === 'security' && (
                            <SecurityTab
                                user={user}
                                logout={logout}
                                showMessage={showMessage}
                            />
                        )}

                        {activeTab === 'notifications' && (
                            <NotificationsTab
                                user={user}
                                showMessage={showMessage}
                            />
                        )}

                        {isAdmin && activeTab === 'admin' && (
                            <AdminTab setViewMode={setViewMode || (() => { })} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const TabButton = ({ active, onClick, icon: Icon, label, variant = 'default' }: any) => {
    const isAdmin = variant === 'admin';

    // Clean Apple Style Buttons
    return (
        <button
            onClick={onClick}
            className={`
                relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200
                ${active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }
            `}
        >
            <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
            {label}
        </button>
    );
};

export default UserProfile;
