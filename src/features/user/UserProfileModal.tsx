import { useState, type FC, type FormEvent } from 'react';
import { X, Lock, User, Save, Loader2, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
// const AUDIT_ACTIONS  = { ... } from '../../lib/audit'; // Removed unused import to prevent lint error

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: FirebaseUser | null;
    isForced?: boolean;
}

const UserProfileModal: FC<UserProfileModalProps> = ({ isOpen, onClose, user, isForced = false }) => {
    // const [activeTab, setActiveTab] = useState('password'); // Not used yet
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        currentPassword: '', // Not actually needed for updatePassword if re-auth not required immediately.
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    if (!isOpen) return null;

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.newPassword.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);
        try {
            // 1. Update in Auth
            if (user) {
                await updatePassword(user, formData.newPassword);

                // 2. If forced, remove the flag
                if (isForced) {
                    await updateDoc(doc(db, "users_config", user.uid), {
                        mustChangePassword: false
                    });
                }

                setSuccess("Contraseña actualizada con éxito.");
                setFormData({ ...formData, newPassword: '', confirmPassword: '' });

                if (isForced) {
                    setTimeout(() => {
                        // Success handled by hook
                        // window.location.reload(); // Removed to prevent jarring UX
                    }, 1500);
                }
            }
        } catch (err) {
            console.error(err);
            setError("Error al actualizar contraseña. Es posible que debas cerrar sesión y volver a entrar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md glass-panel-exec rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className={`px-6 py-4 border-b border-white/5 flex items-center justify-between ${isForced ? 'bg-amber-500/10' : 'bg-white/5'}`}>
                    <h2 className={`text-lg font-bold flex items-center gap-2 ${isForced ? 'text-amber-400' : 'text-white'}`}>
                        {isForced ? <ShieldAlert className="w-5 h-5" /> : <User className="w-5 h-5 text-indigo-400" />}
                        {isForced ? 'Cambio de Contraseña Obligatorio' : 'Mi Perfil'}
                    </h2>
                    {!isForced && (
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    {isForced && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-sm">
                            <p className="flex gap-2">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                Por seguridad, debes establecer una contraseña propia antes de continuar.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-200 text-sm flex gap-2">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-200 text-sm flex gap-2">
                            <CheckCircle className="w-5 h-5 shrink-0" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nueva Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmar Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                    placeholder="Repite la contraseña"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isForced
                                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                }`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? 'Actualizando...' : 'Guardar Contraseña'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
