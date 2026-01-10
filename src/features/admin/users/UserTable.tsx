import React, { useRef, useState, useEffect } from 'react';
import { Shield, Trash2, Ban, Edit } from 'lucide-react';
import { getRoleConfig, getStatusConfig } from '../../../lib/constants';
import { formatDate } from '../../../utils/formatDate';
import { UserProfile } from '../../../services/userService';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type UserAction = 'edit' | 'delete' | 'toggleStatus';

interface UserRowProps {
    user: UserProfile;
    style?: React.CSSProperties;
    onAction: (action: UserAction, user: UserProfile) => void;
    currentUserRole: string;
    readOnly?: boolean;
    franchiseId?: string | null;
}

interface UserTableProps {
    users: UserProfile[];
    onAction: (action: UserAction, user: UserProfile) => void;
    currentUserRole: string;
    readOnly?: boolean;
    franchiseId?: string | null;
}

// =====================================================
// COMPONENTS
// =====================================================

// --- ROW COMPONENT (Pure for performance) ---
const UserRow: React.FC<UserRowProps> = ({ user, style, onAction, currentUserRole, readOnly, franchiseId }) => {
    const roleConfig = getRoleConfig(user.role ?? 'user');
    const statusConfig = getStatusConfig(user.status ?? 'active');

    return (
        <div style={style} className="flex items-center border-b border-white/5 hover:bg-white/5 transition-colors px-4 group">
            {/* User Info */}
            <div className="flex-1 flex items-center gap-3 min-w-[200px]">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
                    {(user.email || 'XX').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-tight">{user.displayName || 'Usuario Sin Nombre'}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{user.email || 'Sin email'}</span>
                </div>
            </div>

            {/* Role */}
            <div className="w-[150px] hidden md:flex">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${roleConfig.bg === 'bg-slate-100' ? 'bg-slate-800 text-slate-300 border-slate-700' :
                    roleConfig.bg.replace('bg-', 'bg-').replace('100', '500/10') + ' ' + roleConfig.text.replace('800', '400') + ' ' + roleConfig.border.replace('200', '500/20')
                    } flex items-center gap-1`}>
                    <Shield className="w-3 h-3" />
                    {roleConfig.label}
                </span>
            </div>

            {/* Status */}
            <div className="w-[120px] hidden sm:flex">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusConfig.bg === 'bg-emerald-100' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Franchise Column (Admin Only) */}
            {!franchiseId && (
                <div className="w-[150px] hidden xl:flex text-xs text-slate-500 font-medium">
                    {user.franchiseId || '-'}
                </div>
            )}

            {/* Date */}
            <div className="w-[150px] hidden lg:flex text-xs text-slate-500 font-bold uppercase tracking-wider">
                {formatDate(user.createdAt as any)}
            </div>

            {/* Actions */}
            <div className="w-[60px] flex justify-end">
                {currentUserRole === 'admin' && !readOnly && (
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onAction('toggleStatus', user)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-amber-500/10 transition-colors"
                            title={user.status === 'active' ? "Bloquear" : "Desbloquear"}
                        >
                            <Ban className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onAction('edit', user)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 rounded hover:bg-blue-500/10 transition-colors"
                            title="Editar Usuario"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onAction('delete', user)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                            title="Eliminar Usuario"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- VIRTUALIZED TABLE ---

const ROW_HEIGHT = 60; // Fixed height strictly enforced

const UserTable: React.FC<UserTableProps> = ({ users, onAction, currentUserRole, readOnly }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);

    // Dynamic resize handler
    useEffect(() => {
        const handleResize = (): void => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        };
        // Initial set
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Virtualization Logic
    const totalContentHeight = users.length * ROW_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 2); // Buffer top
    const endIndex = Math.min(users.length, Math.floor((scrollTop + containerHeight) / ROW_HEIGHT) + 2); // Buffer bottom
    const visibleUsers = users.slice(startIndex, endIndex);
    const offsetY = startIndex * ROW_HEIGHT;

    const handleScroll = (e: React.UIEvent<HTMLDivElement>): void => {
        requestAnimationFrame(() => {
            setScrollTop(e.currentTarget.scrollTop);
        });
    };

    if (users.length === 0) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 border-0 rounded-xl glass-panel-exec">
                <p className="font-bold">No se encontraron usuarios</p>
            </div>
        );
    }

    return (
        <div className="glass-panel-exec rounded-xl overflow-hidden shadow-lg flex flex-col h-full ring-1 ring-white/10">
            {/* Header - Fixed to avoid scroll */}
            <div className="bg-white/5 border-b border-white/5 flex items-center px-4 h-[40px] shrink-0 backdrop-blur-sm">
                <div className="flex-1 text-xs font-bold text-indigo-300 uppercase tracking-wider">Usuario</div>
                <div className="w-[150px] hidden md:block text-xs font-bold text-indigo-300 uppercase tracking-wider">Rol</div>
                <div className="w-[120px] hidden sm:block text-xs font-bold text-indigo-300 uppercase tracking-wider">Estado</div>
                <div className="w-[150px] hidden lg:block text-xs font-bold text-indigo-300 uppercase tracking-wider">Fecha Registro</div>
                <div className="w-[60px]" />
            </div>

            {/* Virtual Scroll Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto relative custom-scrollbar"
                style={{ height: '100%' }}
            >
                <div style={{ height: totalContentHeight, position: 'relative' }}>
                    <div style={{ transform: `translateY(${offsetY}px)` }}>
                        {visibleUsers.map((user) => (
                            <UserRow
                                key={user.uid || user.id}
                                user={user}
                                style={{ height: ROW_HEIGHT }}
                                onAction={onAction}
                                currentUserRole={currentUserRole}
                                readOnly={readOnly}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserTable;
