import React, { useRef, useState, useEffect } from 'react';
import { Shield, Trash2, Edit, Building, User as UserIcon, Settings, Inbox } from 'lucide-react';
import { getStatusConfig } from '../../../lib/constants';
import { formatDate } from '../../../utils/formatDate';
import { User } from '../../../services/userService';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type UserAction = 'edit' | 'delete' | 'toggleStatus' | 'viewFranchise';

interface UserRowProps {
    user: User;
    style?: React.CSSProperties;
    onAction: (action: UserAction, user: User) => void;
    currentUserRole: string;
    readOnly?: boolean;
    franchiseId?: string | null;
}

interface UserTableProps {
    users: User[];
    onAction: (action: UserAction, user: User) => void;
    currentUserRole: string;
    readOnly?: boolean;
    franchiseId?: string | null;
}

// =====================================================
// COMPONENTS
// =====================================================

// --- ROW COMPONENT (Responsive) ---
const UserRow: React.FC<UserRowProps> = ({ user, style, onAction, currentUserRole, readOnly, franchiseId }) => {

    const statusConfig = getStatusConfig(user.status ?? 'active');

    // Role Badge Logic
    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return { label: 'ADMIN', bg: 'bg-indigo-500 text-white border-indigo-600', icon: <Shield className="w-3 h-3" /> };
            case 'franchise':
                return { label: 'FRANQ', bg: 'bg-amber-500 text-black border-amber-600 font-extrabold', icon: <Building className="w-3 h-3" /> };
            case 'rider':
                return { label: 'RIDER', bg: 'bg-slate-700 text-slate-300 border-slate-600', icon: <UserIcon className="w-3 h-3" /> };
            default:
                return { label: role.toUpperCase().substring(0, 4), bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: <UserIcon className="w-3 h-3" /> };
        }
    };

    const roleBadge = getRoleBadge(user.role || 'user');

    return (
        <div style={style} className="flex items-center border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors px-3 sm:px-4 group relative">
            {/* User Info & Mobile Stack */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ring-1 ring-inset ${user.role === 'franchise' ? 'bg-amber-500/20 text-amber-400 ring-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/30'}`}>
                    {(user.displayName || user.email || 'XX').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate" title={user.displayName}>{user.displayName || 'Usuario Sin Nombre'}</span>
                        {/* Mobile Role Badge */}
                        <span className={`md:hidden px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border flex items-center gap-1 ${roleBadge.bg}`}>
                            {roleBadge.label}
                        </span>
                    </div>
                    {/* Mobile Status Dot + Email */}
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full sm:hidden ${user.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate" title={user.email}>{user.email || 'Sin email'}</span>
                    </div>
                </div>
            </div>

            {/* Desktop Columns */}

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
                {formatDate(user.createdAt)}
            </div>

            {/* Actions */}
            <div className="w-[100px] flex justify-end gap-1">
                {currentUserRole === 'admin' && !readOnly && (
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        {/* Ver detalles de franquicia */}
                        {user.role === 'franchise' && (
                            <button
                                onClick={() => onAction('viewFranchise', user)}
                                className="p-2 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 rounded-full hover:bg-emerald-500/10 transition-colors md:p-1.5"
                                title="Ver detalles y módulos"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        )}

                        {/* Mobile: Only Edit */}
                        <button
                            onClick={() => onAction('edit', user)}
                            className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-full hover:bg-blue-500/10 transition-colors md:p-1.5"
                            title="Editar"
                        >
                            <Edit className="w-4 h-4" />
                        </button>

                        {/* Desktop: All actions */}
                        <button
                            onClick={() => onAction('delete', user)}
                            className="hidden md:block p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
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
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 m-4">
                <Inbox className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-bold text-slate-700 dark:text-slate-300">No se encontraron usuarios</p>
                <p className="text-sm mt-2">Prueba ajustando los filtros de búsqueda</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full">
            {/* Header - Fixed to avoid scroll */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 h-[40px] shrink-0">
                <div className="flex-1 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuario</div>
                <div className="w-[140px] hidden md:block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rol</div>
                <div className="w-[100px] hidden lg:block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pack</div>
                <div className="w-[100px] hidden sm:block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</div>
                {!franchiseId && <div className="w-[120px] hidden xl:block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID Franq.</div>}
                <div className="w-[100px] hidden 2xl:block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</div>
                <div className="w-[100px]" />
            </div>

            {/* Virtual Scroll Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto relative custom-scrollbar"
                style={{ height: '100%' }}
            >
                {/* Responsive wrapper: min-width only on desktop to allow mobile flex behavior */}
                <div style={{ height: totalContentHeight, position: 'relative' }} className="min-w-full md:min-w-[800px]">
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
