import React, { useState } from 'react';
import { Users, UserPlus, ShieldAlert, Search, Loader2, RefreshCw, Inbox, Check, X, Building } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useUserManager } from '../../../hooks/useUserManager';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useToast } from '../../../hooks/useToast';
import UserTable from './UserTable';
import CriticalActionModal from '../../../ui/overlays/CriticalActionModal';
import CreateUserModal, { CreateUserInput, UpdateUserInput } from './CreateUserModal';
import { UserProfile } from '../../../services/userService';

// --- SUB-COMPONENTS (Local for now to keep orchestrator clean) ---



// --- MAIN ORCHESTRATOR ---

export interface UserManagementPanelProps {
    franchiseId?: string | null;
    readOnly?: boolean;
}

interface ModalConfig {
    isOpen: boolean;
    type: 'create' | 'edit' | 'delete' | 'ban' | null;
    target: UserProfile | null;
    requestData?: any; // For approval flow
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ franchiseId = null, readOnly = false }) => {
    // 1. Usamos el hook con el filtro
    const { user: currentUser } = useAuth();
    const toastContext = useToast();
    const toast = toastContext?.toast;

    // --- NEW: Pending Requests Listener ---
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    React.useEffect(() => {
        if (franchiseId || readOnly) return; // Only global admin sees requests

        const q = query(collection(db, "registration_requests"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setPendingRequests(reqs);
        });
        return () => unsubscribe();
    }, [franchiseId, readOnly]);

    const handleApproveRequest = (request: any) => {
        setModalConfig({
            isOpen: true,
            type: 'create',
            target: null,
            requestData: request // Pass the lead data
        });
    };

    const handleRejectRequest = async (requestId: string) => {
        if (!confirm("¿Rechazar y eliminar solicitud?")) return;
        try {
            await deleteDoc(doc(db, "registration_requests", requestId));
            toast?.success("Solicitud eliminada");
        } catch (e) {
            toast?.error("Error al eliminar");
        }
    };

    // --- STATE FOR TABS ---
    // 'structure' = Admin + Franchise
    // 'riders' = Users
    // 'maintenance' = DB Tools
    // If franchiseId is present, we FORCE 'riders' view and hide structure
    const [activeTab, setActiveTab] = useState<'structure' | 'riders' | 'maintenance'>(franchiseId ? 'riders' : 'structure');

    // Logic Hook
    const {
        users,
        loading,
        error: fetchError,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        refetch // ✅ Get refetch
    } = useUserManager(currentUser, franchiseId);

    // Force "all" on mount/tab switch if needed, but logic below filters client-side from the "all" list
    // Ideally useUserManager should allow fetching all. We assume it does by default.

    // --- CLIENT SIDE FILTERING BASED ON TABS ---
    const filteredUsers = users.filter((u: UserProfile) => { // ✅ Fix type
        const role = u.role || 'user';
        if (activeTab === 'structure') {
            return role === 'admin' || role === 'franchise' || role === 'franchisee';
        } else {
            return role === 'user';
        }
    });

    const isGlobalAdmin = !franchiseId && currentUser?.role === 'admin';

    // Orchestrator State
    const [modalConfig, setModalConfig] = useState<ModalConfig>({ isOpen: false, type: null, target: null });
    const [actionLoading, setActionLoading] = useState(false);

    const handleAction = (type: string, targetUser: UserProfile) => {
        if (readOnly) return; // Guard clause
        if (type === 'delete') {
            setModalConfig({
                isOpen: true,
                type: 'delete',
                target: targetUser
            });
        } else if (type === 'edit') { // ✏️ Handle Edit
            setModalConfig({
                isOpen: true,
                type: 'edit', // Reusing the same modal but with type edit
                target: targetUser
            });
        } else if (type === 'toggleStatus') {
            if (targetUser.status === 'active') {
                setModalConfig({
                    isOpen: true,
                    type: 'ban',
                    target: targetUser
                });
            } else {
                executeStatusToggle(targetUser);
            }
        }
    };



    const executeCreate = async (userData: CreateUserInput, tempPassword?: string) => {
        setActionLoading(true);
        try {
            await createUser(userData, tempPassword);
            if (tempPassword) {
                toast?.success('Usuario creado exitosamente. Esperando primer login.');
            } else {
                toast?.success('Ficha de personal creada correctamente.');
            }

            // If this was from a request, delete the request doc
            if (modalConfig.requestData?.id) {
                await deleteDoc(doc(db, "registration_requests", modalConfig.requestData.id));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const executeUpdate = async (uid: string, updateData: Partial<UpdateUserInput>) => {
        setActionLoading(true);
        try {
            await updateUser(uid, updateData);
            toast?.success('Usuario actualizado correctamente');
            setModalConfig({ isOpen: false, type: null, target: null });
        } finally {
            setActionLoading(false);
        }
    };

    const executeDelete = async () => {
        if (!modalConfig.target) return;
        setActionLoading(true);
        try {
            await deleteUser(modalConfig.target.uid);
            toast?.success('Usuario eliminado permanentemente');
            setModalConfig({ isOpen: false, type: null, target: null });
        } catch (err: any) {
            toast?.error(err.message || 'Error al eliminar usuario');
        } finally {
            setActionLoading(false);
        }
    };

    const executeStatusToggle = async (target: UserProfile | null = modalConfig.target) => {
        if (!target) return;
        setActionLoading(true);
        try {
            await toggleUserStatus(target.uid, target.status ?? 'active');
            toast?.success(`Estado de usuario actualizado`);
            setModalConfig({ isOpen: false, type: null, target: null });
        } catch (err: any) {
            toast?.error(err.message || 'Error al cambiar estado');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center animate-pulse">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-500 font-bold text-lg">Cargando Usuarios...</p>
                </div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="p-8 bg-rose-50 border border-rose-100 rounded-2xl text-center max-w-md">
                    <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-rose-900 mb-2">Error de Acceso</h3>
                    <p className="text-rose-700">{fetchError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 min-h-screen bg-transparent font-sans text-slate-100 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 glass-panel-exec border-0 rounded-xl shadow-sm">
                        <Users className="w-6 h-6 text-indigo-400" />
                    </div>
                    {franchiseId ? 'Equipo de la Franquicia' : 'Gestión Global de Usuarios'}
                </h1>
                <p className="text-slate-400 font-medium ml-[52px]">
                    {franchiseId ? `Gestionando personal operativo para ${franchiseId}` : 'Administra accesos, roles y seguridad de la plataforma.'}
                </p>
            </div>

            {/* --- TABS --- */}
            <div className="mb-6 flex gap-2 border-b border-white/10 pb-1">
                <button
                    onClick={() => setActiveTab('structure')}
                    className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'structure' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Building className="w-4 h-4" />
                    <span>Estructura (Admin/Franquicias)</span>
                </button>
                <button
                    onClick={() => setActiveTab('riders')}
                    className={`px-4 py-2 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'riders' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Users className="w-4 h-4" />
                    <span>Riders (Usuarios)</span>
                </button>
            </div>

            {/* Toolbar (Simplified - No Role Filter in UI) */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between items-end lg:items-center">
                {/* Search */}
                <div className="relative flex-1 w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por email, nombre..."
                        className="pl-9 pr-4 py-2.5 w-full glass-panel-exec text-slate-200 border-0 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-sm placeholder-slate-500"
                    />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="glass-panel-exec border-0 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <option value="all" className="bg-slate-900 text-slate-200">Todos los Estados</option>
                        <option value="active" className="bg-slate-900 text-slate-200">Activos</option>
                        <option value="banned" className="bg-slate-900 text-slate-200">Bloqueados</option>
                    </select>

                    <button
                        onClick={() => refetch()} // ✅ Use refetch
                        className="p-2.5 text-slate-400 hover:bg-white/10 rounded-xl transition-colors"
                        title="Refrescar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    {!readOnly && (
                        <button
                            onClick={() => setModalConfig({ isOpen: true, type: 'create', target: null })}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">
                                {activeTab === 'structure' ? 'Nuevo Admin/Franq.' : 'Nuevo Rider'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* PENDING REQUESTS (Global Admin Only) */}
            {pendingRequests.length > 0 && isGlobalAdmin && (
                <div className="mb-6 animate-in slide-in-from-top-2 duration-500">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Inbox className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Solicitudes de Alta Pendientes ({pendingRequests.length})</h3>
                        </div>
                        <div className="grid gap-2">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between bg-slate-900/50 border border-white/5 p-3 rounded-xl hover:border-indigo-500/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                        <div>
                                            <p className="text-sm font-bold text-white">{req.legalName}</p>
                                            <p className="text-xs text-slate-400">{req.email} • CIF: {req.cif}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRejectRequest(req.id)}
                                            className="p-2 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                                            title="Rechazar"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleApproveRequest(req)}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            VALIDAR
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Data Layer */}
            <div className="h-[calc(100vh-280px)] min-h-[500px]">
                <UserTable
                    users={filteredUsers}
                    onAction={handleAction}
                    currentUserRole={currentUser?.role || 'user'}
                    readOnly={readOnly}
                    franchiseId={franchiseId}
                />
            </div>

            {/* Create / Edit Modal */}
            <CreateUserModal
                isOpen={modalConfig.isOpen && (modalConfig.type === 'create' || modalConfig.type === 'edit')}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onCreate={executeCreate}
                onUpdate={executeUpdate}
                userToEdit={modalConfig.type === 'edit' ? modalConfig.target : null}
                isLoading={actionLoading}
                initialFranchiseId={franchiseId}
                initialData={modalConfig.requestData}
            />

            {/* Security Modals */}
            <CriticalActionModal
                isOpen={modalConfig.isOpen && modalConfig.type === 'delete'}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={executeDelete}
                title="Eliminación Crítica de Usuario"
                description={`Estás a punto de eliminar a ${modalConfig.target?.email}. Esta acción es IRREVERSIBLE y borrará todos los datos asociados.`}
                confirmKeyword={modalConfig.target?.email || ''}
                confirmButtonText="Eliminar Definitivamente"
                isLoading={actionLoading}
                variant="danger"
            />

            <CriticalActionModal
                isOpen={modalConfig.isOpen && modalConfig.type === 'ban'}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={() => executeStatusToggle()}
                title="Bloqueo de Seguridad"
                description={`¿Seguro que deseas bloquear el acceso a ${modalConfig.target?.email}? El usuario será desconectado inmediatamente.`}
                confirmKeyword="BLOQUEAR"
                confirmButtonText="Bloquear Acceso"
                isLoading={actionLoading}
                variant="warning"
            />
        </div>
    );
};

export default UserManagementPanel;
