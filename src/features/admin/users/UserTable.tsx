import React, { useRef, useState, useEffect } from 'react';
import { Shield, Trash2, Ban, Edit, Building, User } from 'lucide-react';
import { getStatusConfig } from '../../../lib/constants';
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

    const statusConfig = getStatusConfig(user.status ?? 'active');

    // Role Badge Logic
    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return { label: 'ADMINISTRADOR', bg: 'bg-indigo-500 text-white border-indigo-600', icon: <Shield className="w-3 h-3" /> };
            case 'franchise':
                return { label: 'FRANQUICIA', bg: 'bg-amber-500 text-black border-amber-600 font-extrabold', icon: <Building className="w-3 h-3" /> };
            case 'rider':
                return { label: 'RIDER', bg: 'bg-slate-700 text-slate-300 border-slate-600', icon: <User className="w-3 h-3" /> };
            default:
                return { label: role.toUpperCase(), bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: <User className="w-3 h-3" /> };
        }
    };

    const roleBadge = getRoleBadge(user.role || 'user');

    return (
        <div style={style} className="flex items-center border-b border-white/5 hover:bg-white/5 transition-colors px-4 group">
            {/* User Info */}
            <div className="flex-1 flex items-center gap-3 min-w-[200px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-inset ${user.role === 'franchise' ? 'bg-amber-500/20 text-amber-400 ring-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/30'}`}>
                    {(user.displayName || user.email || 'XX').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-tight truncate max-w-[180px]" title={user.displayName}>{user.displayName || 'Usuario Sin Nombre'}</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate max-w-[180px]" title={user.email}>{user.email || 'Sin email'}</span>
                </div>
            </div>

            {/* Role */}
            <div className="w-[140px] hidden md:flex">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1.5 shadow-sm ${roleBadge.bg}`}>
                    {roleBadge.icon}
                    {roleBadge.label}
                </span>
            </div>

            {/* Pack (Franchise Only) */}
            <div className="w-[100px] hidden lg:flex items-center">
                {user.role === 'franchise' && user.pack && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border tracking-tight ${user.pack === 'premium'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-amber-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                        {user.pack}
                    </span>
                )}
            </div>

            {/* Status */}
            <div className="w-[100px] hidden sm:flex">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusConfig.bg === 'bg-emerald-100' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    user.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                    {user.status === 'active' ? 'ACTIVO' : user.status === 'pending' ? 'PENDIENTE' : 'BLOQUEADO'}
                </span>
            </div>

            {!franchiseId && (
                <div className="w-[120px] hidden xl:flex text-xs text-slate-500 font-medium truncate" title={user.role === 'franchise' ? `UID: ${user.uid || user.id}` : user.franchiseId}>
                    {user.role === 'franchise'
                        ? <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">{(user.uid || user.id || '').substring(0, 8)}...</span>
                        : (user.franchiseId || '-')
                    }
                </div>
            )}

            {/* Date */}
            <div className="w-[100px] hidden 2xl:flex text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                {formatDate(user.createdAt as any)}
            </div>

            {/* Actions */}
            <div className="w-[60px] flex justify-end">
                {currentUserRole === 'admin' && !readOnly && (
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onAction('toggleStatus', user)}
                            className={`p-1.5 rounded transition-colors ${user.status === 'active' ? 'text-green-500 hover:bg-green-500/10' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'}`}
                            title={user.status === 'active' ? "Usuario Activo" : "Usuario Bloqueado/Pendiente"}
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

const UserTable: React.FC<UserTableProps> = ({ users, onAction, currentUserRole, readOnly, franchiseId }) => {
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
                <div className="w-[140px] hidden md:block text-xs font-bold text-indigo-300 uppercase tracking-wider">Rol</div>
                <div className="w-[100px] hidden lg:block text-xs font-bold text-indigo-300 uppercase tracking-wider">Pack</div>
                <div className="w-[100px] hidden sm:block text-xs font-bold text-indigo-300 uppercase tracking-wider">Estado</div>
                {!franchiseId && <div className="w-[120px] hidden xl:block text-xs font-bold text-indigo-300 uppercase tracking-wider">ID Franq.</div>}
                <div className="w-[100px] hidden 2xl:block text-xs font-bold text-indigo-300 uppercase tracking-wider">Fecha</div>
                <div className="w-[60px]" />
            </div>

            {/* Virtual Scroll Container */}
            {/* Virtual Scroll Container with Horizontal Scroll Support */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto relative custom-scrollbar overflow-x-auto"
                style={{ height: '100%' }}
            >
                {/* Min-width wrapper to force horizontal scroll on small screens */}
                <div style={{ height: totalContentHeight, position: 'relative', minWidth: '800px' }}>
                    <div style={{ transform: `translateY(${offsetY}px)` }}>
                        {visibleUsers.map((user) => (
                            <UserRow
                                key={user.uid || user.id}
                                user={user}
                                style={{ height: ROW_HEIGHT }}
                                onAction={onAction}
                                currentUserRole={currentUserRole}
                                readOnly={readOnly}
                                franchiseId={franchiseId}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserTable;
