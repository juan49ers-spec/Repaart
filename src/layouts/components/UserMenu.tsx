import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface UserMenuProps {
    placement?: 'top' | 'bottom' | 'right';
}

const UserMenu: React.FC<UserMenuProps> = ({ placement = 'bottom' }) => {
    const { user, logout, resetPassword } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigation = (path: string) => {
        setIsOpen(false);
        navigate(path);
    };

    const handleLogout = async () => {
        if (!window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            return;
        }
        setIsOpen(false);
        await logout();
        navigate('/login');
    };

    const handleResetPassword = async () => {
        // ... (keep existing implementation or assume it's same)
        setIsOpen(false);
        if (user?.email) {
            /* ... */
            try {
                await resetPassword(user.email);
                alert(`Correo de recuperación enviado a ${user.email}`);
            } catch (error) {
                console.error("Error sending reset email:", error);
                alert("Error al enviar el correo. Inténtelo más tarde.");
            }
        }
    };

    const getMenuPositionClass = () => {
        switch (placement) {
            case 'top': return 'bottom-full mb-2 origin-bottom-right';
            case 'right': return 'left-full ml-2 bottom-0 origin-bottom-left';
            default: return 'mt-2 origin-top-right';
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
                <img
                    src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}&background=random`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover"
                />
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute right-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[9999] animate-in fade-in zoom-in-95 duration-100 ${getMenuPositionClass()}`}>
                    <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-sm font-bold text-slate-800 truncate">{user?.displayName || 'Usuario'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                        <button
                            onClick={() => handleNavigation('/profile')}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center transition-colors font-medium"
                        >
                            <Settings className="w-4 h-4 mr-3" />
                            Configuración
                        </button>

                        <button
                            onClick={handleResetPassword}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-amber-600 flex items-center transition-colors font-medium"
                        >
                            <KeyRound className="w-4 h-4 mr-3" />
                            Restablecer Contraseña
                        </button>
                    </div>

                    <div className="border-t border-slate-50 mt-1 pt-1">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center transition-colors font-medium"
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
