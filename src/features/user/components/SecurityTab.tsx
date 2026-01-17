import { useState, type FC } from 'react';
import { updatePassword, type User } from 'firebase/auth';
import { Loader, Save, ShieldCheck, KeyRound, AlertOctagon, Check } from 'lucide-react';
import Button from '../../../components/ui/inputs/Button';

interface SecurityTabProps {
    user: User;
    logout: () => void;
    showMessage: (type: string, text: string) => void;
}

const SecurityTab: FC<SecurityTabProps> = ({ user, logout, showMessage }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });

    // Calculate dynamic security score (Visual only for now)
    const securityScore = user.emailVerified ? 100 : 50;

    const handleSecurityUpdate = async () => {
        if (passwords.new !== passwords.confirm) {
            showMessage('error', 'Las contraseñas no coinciden');
            return;
        }
        if (passwords.new.length < 6) {
            showMessage('error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);
        try {
            await updatePassword(user, passwords.new);
            setPasswords({ new: '', confirm: '' });
            showMessage('success', 'Contraseña actualizada. Por favor inicia sesión de nuevo.');
            setTimeout(() => logout(), 2000);
        } catch (error: any) {
            console.error("Error updating password:", error);
            showMessage('error', 'Error al cambiar contraseña (Requerido login reciente): ' + (error.message || 'Error desconocido'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- LEFT COLUMN: SECURITY HEALTH --- */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        {/* Background Deco */}
                        <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="mb-4 relative">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-white/10"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={351.86}
                                        strokeDashoffset={351.86 - (351.86 * securityScore) / 100}
                                        className="text-emerald-400 transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-3xl font-black tracking-tighter">{securityScore}%</span>
                                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Seguro</span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold mb-1">Tu cuenta está protegida</h3>
                            <p className="text-sm text-white/60 mb-6">
                                {user.emailVerified ? 'Tu identidad ha sido verificada.' : 'Te recomendamos verificar tu email.'}
                            </p>

                            <div className="w-full space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                    <span className="text-sm font-medium">Autenticación Segura</span>
                                    <Check className="w-4 h-4 text-emerald-400 ml-auto" />
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                    <AlertOctagon className="w-5 h-5 text-indigo-400" />
                                    <span className="text-sm font-medium">Monitor de Accesos</span>
                                    <Check className="w-4 h-4 text-indigo-400 ml-auto" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: PASSWORD CHANGE --- */}
                <div className="flex-1">
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <KeyRound className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Cambiar Contraseña</h3>
                                <p className="text-sm text-slate-500">Asegúrate de usar caracteres especiales</p>
                            </div>
                        </div>

                        <div className="space-y-6 max-w-lg">
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nueva Contraseña</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Min. 6 caracteres"
                                    />
                                    <div className="absolute right-0 top-0 h-full w-2 bg-transparent group-focus-within:bg-indigo-500 rounded-r-xl transition-colors"></div>
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Confirmar Contraseña</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Repite tu contraseña"
                                    />
                                    {passwords.confirm && passwords.new === passwords.confirm && (
                                        <Check className="absolute right-4 top-3.5 w-5 h-5 text-emerald-500 animate-in zoom-in" />
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    variant="primary"
                                    onClick={handleSecurityUpdate}
                                    icon={isLoading ? Loader : Save}
                                    className={`w-full md:w-auto px-8 py-3 shadow-lg shadow-indigo-200 ${isLoading ? 'opacity-70' : ''}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Actualizando...' : 'Actualizar Credenciales'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SecurityTab;
