import { useState, type FC, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { type FirebaseError } from 'firebase/app';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { logAction, AUDIT_ACTIONS } from '../../lib/audit';
import { useToast } from '../../hooks/useToast';
import riderImage from '../../assets/login-hero.png';
import repaartLogoFull from '../../assets/repaart-logo-full.png';
import yamimotoLogo from '../../assets/YamimotoCapa-1.png';
import flyderTransparent from '../../assets/flyder-logo-new-transparent.png';

import { OptimizedImage } from '../../components/ui/media/OptimizedImage';

const Login: FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'admin' | 'franchise' | 'rider'>('rider');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Auth internals
    const { login } = useAuth();
    const { toast } = useToast() || {};
    const navigate = useNavigate();

    // Need direct access for signup since it's not exposed in context
    const handleSignup = async () => {
        const { createUserWithEmailAndPassword, getAuth } = await import("firebase/auth");
        const auth = getAuth();
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const result = await login(email, password);
                toast?.success('Inicio de sesión exitoso');

                // Navegación explícita basada en el rol inyectado o por defecto
                const userRole = result.user.role || role; // Intentamos usar el rol inyectado
                if (userRole === 'rider') {
                    navigate('/rider/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                const userCredential = await handleSignup();
                if (userCredential.user) {
                    await setDoc(doc(db, 'users', userCredential.user.uid), {
                        email,
                        name,
                        role,
                        createdAt: new Date(),
                        status: 'active'
                    });

                    await logAction(
                        { uid: userCredential.user.uid, email, role },
                        AUDIT_ACTIONS.CREATE_USER, // Using correct action enum
                        { role, email }
                    );
                    toast?.success('Cuenta creada exitosamente');
                }
            }
        } catch (error) {
            const firebaseError = error as FirebaseError;
            console.error('Auth error:', firebaseError);
            let errorMessage = 'Ha ocurrido un error';

            switch (firebaseError.code) {
                case 'auth/invalid-credential':
                    errorMessage = 'Credenciales incorrectas';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'Usuario no encontrado';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña incorrecta';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'El correo ya está registrado';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña es muy débil';
                    break;
            }
            toast?.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-slate-950">

            {/* LEFT SIDE - FORM */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center items-center px-8 py-12 lg:px-24 xl:px-32 relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
                <div className="w-full max-w-sm">

                    {/* Logo - Increased Size */}
                    <div className="mb-12">
                        <img src={repaartLogoFull} alt="Repaart" className="h-28 w-auto" />
                    </div>

                    {/* Header - Modern & Bold */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                            {isLogin ? 'Te damos la bienvenida' : 'Únete a Repaart'}
                        </h1>
                        <p className="mt-2 text-slate-500 dark:text-slate-400 text-base font-medium">
                            {isLogin ? 'Gestiona tu negocio con inteligencia.' : 'La plataforma líder para franquicias.'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-5 animate-slide-up">
                                {/* Name */}
                                <div className="group">
                                    <label htmlFor="name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 ml-1">
                                        Nombre completo
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Ej. Juan Pérez"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-white placeholder-slate-400 transition-all duration-150 outline-none"
                                        required
                                    />
                                </div>

                                {/* Role */}
                                <div className="group">
                                    <label htmlFor="role" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 ml-1">
                                        Tipo de cuenta
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="role"
                                            aria-label="Selecciona tu rol"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as 'admin' | 'franchise' | 'rider')}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-white transition-all duration-150 outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="rider">Repartidor</option>
                                            <option value="franchise">Franquicia</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                        <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="group">
                            <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 ml-1">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="nombre@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-white placeholder-slate-400 transition-all duration-150 outline-none"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="group">
                            <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 ml-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-white placeholder-slate-400 transition-all duration-150 outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit - Monochrome Professional */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-4 px-6 bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold tracking-wide rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 transform hover:-translate-y-0.5 active:scale-[0.98]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    <span>{isLogin ? 'Acceder al Portal' : 'Crear Cuenta'}</span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer Actions */}
                    <div className="mt-8 flex items-center justify-between text-sm px-1">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold"
                        >
                            {isLogin ? 'Crear nueva cuenta' : 'Ya tengo cuenta'}
                        </button>

                        {isLogin && (
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium">
                                ¿Olvidaste la contraseña?
                            </button>
                        )}
                    </div>

                    {/* Partners - Minimalist Grey */}
                    <div className="mt-16 border-t border-slate-100 dark:border-slate-800 pt-8">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mb-4">Trusted Partners</p>
                        <div className="flex items-center justify-center gap-8 opacity-50 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100 group/partners">
                            <img src={yamimotoLogo} alt="Yamimoto" className="h-6 w-auto transition-transform group-hover/partners:scale-105" />
                            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800" />
                            <img src={flyderTransparent} alt="Flyder" className="h-9 w-auto transition-transform group-hover/partners:scale-105" />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - IMAGE (Desktop Only) */}
            <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 opacity-40 mix-blend-overlay z-10 bg-slate-900"></div>
                <OptimizedImage
                    src={riderImage}
                    alt="Repaart Operations"
                    className="absolute inset-0 w-full h-full opacity-90 scale-105"
                    priority={true}
                />

                {/* Dark Overlay for Text Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-20" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-20 z-30">
                    <div className="max-w-xl">
                        <h2 className="text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
                            Control total para tu negocio de delivery.
                        </h2>
                        <div className="h-1 w-20 bg-white/30 mb-6" />
                        <p className="text-lg text-slate-300 leading-relaxed font-light">
                            Repaart centraliza tus operaciones, gestión de flotas y finanzas en una interfaz elegante y eficiente.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Login;
