
import React, { useState, useEffect } from 'react';
import { financeService } from '../../../services/financeService';
import type { FinancialRecord } from '../../../types/finance';
import {
    CheckCircle,
    XCircle,
    FileText,
    Clock,
    DollarSign
} from 'lucide-react';

interface AuditModal {
    isOpen: boolean;
    record: FinancialRecord | null;
    type: 'approve' | 'reject' | null;
}

const AdminFinanceInbox: React.FC = () => {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [auditModal, setAuditModal] = useState<AuditModal>({ isOpen: false, record: null, type: null });
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadPendingRecords();
    }, []);

    const loadPendingRecords = async () => {
        setLoading(true);
        try {
            const data = await financeService.getGlobalPendingRecords();
            setRecords(data);
        } catch (error) {
            console.error("Error loading inbox:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (record: FinancialRecord, type: 'approve' | 'reject') => {
        setAuditModal({ isOpen: true, record, type });
        setRejectionReason('');
    };

    const confirmAction = async () => {
        if (!auditModal.record) return;

        try {
            if (auditModal.type === 'approve') {
                await financeService.updateStatus(auditModal.record.id, 'approved', 'ADMIN_UID'); // TODO: Pass real Admin UID
            } else {
                if (!rejectionReason.trim()) return alert("Debes indicar un motivo de rechazo");
                await financeService.updateStatus(auditModal.record.id, 'rejected', undefined, rejectionReason);
            }

            // Refresh list
            setRecords(prev => prev.filter(r => r.id !== auditModal.record!.id));
            setAuditModal({ isOpen: false, record: null, type: null });
        } catch (error) {
            console.error("Error processing record:", error);
            alert("Error al procesar la solicitud");
        }
    };

    if (loading) return (
        <div className="p-8 text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-400">Buscando solicitudes pendientes...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <FileText className="text-blue-600 dark:text-blue-400" />
                        Bandeja de Entrada Global
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Hay <span className="text-slate-900 dark:text-white font-bold">{records.length}</span> transacciones esperando revisión.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button onClick={loadPendingRecords} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors" aria-label="Actualizar registros">
                        <Clock size={20} />
                    </button>
                </div>
            </div>

            {/* List */}
            {records.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
                    <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Todo al día</h3>
                    <p className="text-slate-500">No hay solicitudes pendientes de aprobación.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {records.map(record => (
                        <div key={record.id} className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all flex justify-between items-center group shadow-sm hover:shadow-md">

                            {/* Info */}
                            <div className="flex items-start gap-4">
                                <div className={`p - 3 rounded - lg ${record.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'} `}>
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-900 dark:text-white text-lg">
                                            {Number(record.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            {record.franchiseId.substring(0, 5)}...
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{record.description || 'Sin descripción'}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 capitalize">
                                        {record.category} • {new Date((record.date as any)?.seconds * 1000 || record.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleActionClick(record, 'reject')}
                                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                                >
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleActionClick(record, 'approve')}
                                    className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <CheckCircle size={16} /> Aprobar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Audit Modal */}
            {auditModal.isOpen && auditModal.record && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 transition-colors">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            {auditModal.type === 'approve' ? (
                                <><CheckCircle className="text-emerald-500" /> Confirmar Aprobación</>
                            ) : (
                                <><XCircle className="text-rose-500" /> Rechazar Solicitud</>
                            )}
                        </h3>

                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Transacción</p>
                            <div className="flex justify-between items-center font-bold uppercase tracking-wider">
                                <span className="text-slate-800 dark:text-white">{auditModal.record.description}</span>
                                <span className={auditModal.record.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                    {Number(auditModal.record.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </span>
                            </div>
                        </div>

                        {auditModal.type === 'reject' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Motivo del rechazo <span className="text-rose-500">*</span></label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none resize-none h-24 text-sm"
                                    placeholder="Indica por qué rechazas este registro..."
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setAuditModal({ isOpen: false, record: null, type: null })}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={auditModal.type === 'reject' && !rejectionReason.trim()}
                                className={`flex - 1 py - 2.5 rounded - xl font - bold text - white transition - colors shadow - lg ${auditModal.type === 'approve'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20 dark:shadow-emerald-900/20'
                                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20 dark:shadow-rose-900/20 disabled:opacity-50 disabled:cursor-not-allowed'
                                    } `}
                            >
                                {auditModal.type === 'approve' ? 'Validar' : 'Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFinanceInbox;
