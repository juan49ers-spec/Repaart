import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown, KeyRound, Bell } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotificationBadge } from '../../features/layouts/hooks/useNotificationBadge';
import { cn } from '../../lib/utils';

interface UserMenuProps {
    placement?: 'top' | 'bottom' | 'right';
    isFranchise?: boolean;
    isRider?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ placement = 'bottom', isFranchise = false, isRider = false }) => {
    const { user, logout, resetPassword } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { unreadCount, hasUnread } = useNotificationBadge();

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
        setIsOpen(false);
        if (user?.email) {
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
            case 'top': return 'bottom-full mb-3 origin-bottom-right';
            case 'right': return 'left-full ml-3 bottom-0 origin-bottom-left';
            default: return 'mt-3 origin-top-right';
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 rounded-full transition-all duration-300 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 group focus:outline-none"
            >
                <div className="relative">
                    <img
                        src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}&background=random`}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-white/10 shadow-sm object-cover transition-transform group-hover:scale-105"
                    />
                    
                    {/* Notification Badge */}
                    {hasUnread && (
                        <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full shadow-lg">
                            <span className="text-[10px] font-bold text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </div>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Premium Dropdown */}
            {isOpen && (
                <div className={cn(
                    "absolute right-0 w-72",
                    "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
                    "rounded-[20px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]",
                    "border border-slate-100 dark:border-white/10",
                    "py-2.5 z-[9999]",
                    "animate-in fade-in zoom-in-95 duration-200",
                    getMenuPositionClass()
                )}>
                    {/* User Info */}
                    <div className="px-5 py-4 border-b border-slate-50 dark:border-white/5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user?.displayName || (user?.email?.split('@')[0]) || 'Usuario'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5 font-medium">
                            {user?.email}
                        </p>
                    </div>

                    {/* Menu Items */}
                    <div className="px-2 py-2 flex flex-col gap-0.5">
                        {/* Notifications Link */}
                        {(isFranchise || isRider) && (
                            <NavLink
                                to="/notifications"
                                onClick={() => setIsOpen(false)}
                                className="w-full text-left px-3 py-2.5 text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-all rounded-xl font-medium active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3">
                                    <Bell className="w-4 h-4 opacity-70" />
                                    <span>Notificaciones</span>
                                </div>
                                {hasUnread && (
                                    <div className="flex items-center justify-center min-w-[20px] h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                )}
                            </NavLink>
                        )}

                        <button
                            onClick={() => handleNavigation('/profile')}
                            className="w-full text-left px-3 py-2.5 text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-all rounded-xl font-medium active:scale-[0.98]"
                        >
                            <Settings className="w-4 h-4 mr-3 opacity-70" />
                            Configuración
                        </button>

                        <button
                            onClick={handleResetPassword}
                            className="w-full text-left px-3 py-2.5 text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-amber-600 dark:hover:text-amber-400 flex items-center transition-all rounded-xl font-medium active:scale-[0.98]"
                        >
                            <KeyRound className="w-4 h-4 mr-3 opacity-70" />
                            Restablecer Contraseña
                        </button>

                        <div className="h-px bg-slate-50 dark:bg-white/5 my-1 mx-3" />

                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center transition-all rounded-xl font-bold active:scale-[0.98]"
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
