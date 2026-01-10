import { useState, type FC } from 'react';
import { updatePassword, type User } from 'firebase/auth';
import { Loader, Save } from 'lucide-react';
import Button from '../../../ui/inputs/Button';

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
        <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4">Seguridad</h2>
            <div className="space-y-4 max-w-md">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Contraseña Actual (Opcional)</label>
                    <input
                        type="password"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nueva Contraseña</label>
                    <input
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Confirmar Contraseña</label>
                    <input
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <Button
                    variant="primary"
                    onClick={handleSecurityUpdate}
                    icon={isLoading ? Loader : Save}
                    className={`shadow-lg hover:scale-105 transform transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Procesando...' : 'Actualizar Contraseña'}
                </Button>
            </div>
        </div>
    );
};

export default SecurityTab;
