import { useState, type FC, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, Briefcase, UserPlus, ArrowLeft } from 'lucide-react';

import { type FirebaseError } from 'firebase/app';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import logo from '../../assets/logo.jpg';
import { logAction, AUDIT_ACTIONS } from '../../lib/audit';
import { useToast } from '../../hooks/useToast';

const Login: FC = () => {
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [legalName, setLegalName] = useState<string>('');
    const [cif, setCif] = useState<string>('');

    const [loading, setLoading] = useState<boolean>(false);
    const { login } = useAuth();
    const toast = useToast()?.toast;

    // Helper: Map Firebase Auth errors to user-friendly messages
    const mapAuthError = (err: FirebaseError): string => {
        switch (err.code) {
            case 'auth/email-already-in-use': return 'Este email ya está registrado.';
            case 'auth/weak-password': return 'La contraseña es muy debil.';
            case 'auth/invalid-credential': return 'Credenciales incorrectas.';
            case 'auth/user-not-found': return 'Usuario no encontrado.';
            case 'auth/wrong-password': return 'Contraseña incorrecta.';
            default: return err.message || 'Error de autenticación.';
        }
    };

    // Logic: Handle Login
    const processLogin = async (): Promise<void> => {
        const userCredential = await login(email, password);
        if (userCredential?.user) {
            logAction(userCredential.user, AUDIT_ACTIONS.LOGIN_SUCCESS);
        }
        toast?.success('¡Bienvenido de nuevo!');
        // Allow App.tsx to handle redirect based on user state change
    };

    // Logic: Handle Registration Request (Lead)
    const processRegister = async (): Promise<void> => {
        // Just save a request to Firestore, do NOT create auth user yet
        const requestId = crypto.randomUUID();
        await setDoc(doc(db, "registration_requests", requestId), {
            email,
            legalName,
            cif,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        toast?.success('Solicitud enviada. Contactaremos contigo en breve.');
        setIsLogin(true); // Return to login view
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                if (typeof login !== 'function') throw new Error("Login function is undefined in Context");
                await processLogin();
            } else {
                await processRegister();
            }
        } catch (err) {
            console.error("Auth Error:", err);
            toast?.error(mapAuthError(err as FirebaseError));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center safe-top safe-bottom">
            {/* Atmospheric Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-orb" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-[80px] animate-orb [animation-delay:2s]" />
            </div>

            <div className="relative z-10 px-6 py-8 max-w-md mx-auto w-full animate-slide-up">
                {/* LOGO SECTION - Larger and more prominent */}
                <div className="text-center mb-10">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-2xl scale-150" />
                        <img
                            src={logo}
                            alt="Logo"
                            className="relative h-28 w-28 mx-auto rounded-full shadow-2xl ring-4 ring-white/20"
                        />
                    </div>
                    <h1 className="mt-8 text-mobile-title text-white">
                        {isLogin ? 'Bienvenido' : 'Únete a nosotros'}
                    </h1>
                    <p className="mt-3 text-mobile-body text-slate-400">
                        {isLogin
                            ? 'Ingresa para acceder a tu panel'
                            : 'Solicita acceso a la plataforma'}
                    </p>
                </div>

                {/* FORM CARD - Glassmorphism style */}
                <div className="card-mobile bg-white/5 backdrop-blur-xl border border-white/10">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {!isLogin && (
                            <>
                                {/* LEGAL NAME */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Razón Social / Nombre
                                    </label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            value={legalName}
                                            onChange={(e) => setLegalName(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                                            placeholder="Nombre Fiscal"
                                        />
                                    </div>
                                </div>

                                {/* CIF */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        NIF / CIF
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            value={cif}
                                            onChange={(e) => setCif(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                                            placeholder="B-12345678"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* EMAIL INPUT (Shared) */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                                Email Corporativo
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                                    placeholder="contacto@franquicia.com"
                                />
                            </div>
                        </div>

                        {/* PASSWORD INPUT (Login Only) */}
                        {isLogin && (
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Procesando...
                                </div>
                            ) : (
                                <>
                                    {isLogin ? <Briefcase className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                                    {isLogin ? 'Entrar' : 'Solicitar Alta'}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* TOGGLE LOGIN/REGISTER */}
                <div className="text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        {isLogin ? '¿Primera vez? Solicita acceso' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default Login;
