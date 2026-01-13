import React, { useState, useEffect } from 'react';
import {
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    FileText,
    Paperclip,
    Send,
    Loader2,
    UploadCloud
} from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { resourceRequestService, DocumentRequest } from '../../../services/resourceRequestService';
import { useAuth } from '../../../context/AuthContext';

import ResourceUploadModal from './ResourceUploadModal';

interface Resource {
    id: string;
    title?: string;
    name?: string;
    category?: string;
    [key: string]: any;
}

const RequestsInbox = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<DocumentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);

    // Response State
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [responseType, setResponseType] = useState<'fulfill' | 'reject'>('fulfill');
    const [resources, setResources] = useState<Resource[]>([]);
    const [selectedResourceId, setSelectedResourceId] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadRequests();
        loadResources();
    }, []);

    const loadRequests = async () => {
        // setLoading(true); // Don't block UI on refresh
        const data = await resourceRequestService.getPendingRequests();
        setRequests(data);
        setLoading(false);
    };

    const loadResources = async () => {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
    };

    const handleOpenResponse = (req: DocumentRequest) => {
        setSelectedRequest(req);
        setResponseType('fulfill');
        setRejectionReason('');
        setSelectedResourceId('');
        setIsResponseModalOpen(true);
    };

    const handleUploadSuccess = async (resourceId?: string) => {
        await loadResources();
        if (resourceId) {
            setSelectedResourceId(resourceId);
        }
    };

    const handleSubmitResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest || !user) return;

        setIsSubmitting(true);
        try {
            if (responseType === 'fulfill') {
                if (!selectedResourceId) {
                    alert("Debes seleccionar un archivo para adjuntar.");
                    setIsSubmitting(false);
                    return;
                }
                const selectedRes = resources.find(r => r.id === selectedResourceId);
                // Pass category name if possible in future service update
                await resourceRequestService.fulfillRequest(selectedRequest.id, selectedResourceId, user.uid, selectedRes?.category);
            } else {
                if (!rejectionReason.trim()) {
                    alert("Debes indicar un motivo para el rechazo.");
                    setIsSubmitting(false);
                    return;
                }
                await resourceRequestService.rejectRequest(selectedRequest.id, rejectionReason, user.uid);
            }

            // Success
            setIsResponseModalOpen(false);
            loadRequests(); // Refresh list
        } catch (error) {
            console.error("Error submitting response:", error);
            alert("Error al procesar la respuesta.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    }

    return (
        <div className="p-6 h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="relative">
                                <FileText className="w-6 h-6 text-indigo-600" />
                                {requests.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-50 dark:border-slate-950" />}
                            </span>
                            Bandeja de Solicitudes
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona las peticiones de documentación de las franquicias.</p>
                    </div>
                    <button title="Recargar solicitudes" onClick={() => { setLoading(true); loadRequests(); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <Clock className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {requests.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">¡Todo al día!</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">No hay solicitudes pendientes de gestionar.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {req.priority === 'urgent' ? (
                                            <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-rose-200 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> URGENTE
                                            </span>
                                        ) : (
                                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-indigo-100">
                                                NORMAL
                                            </span>
                                        )}
                                        <span className="text-xs font-mono text-slate-400">
                                            {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Hoy'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {req.franchiseName}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{req.explanation}</h4>
                                    <p className="text-xs text-slate-500">Categoría solicitada: <span className="font-medium text-slate-700 dark:text-slate-300 uppercase">{req.category}</span></p>
                                </div>
                                <button
                                    onClick={() => handleOpenResponse(req)}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                                >
                                    <Send className="w-4 h-4" />
                                    Gestionar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Response Modal */}
            {isResponseModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsResponseModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Gestionar Solicitud</h3>
                            <p className="text-xs text-slate-500">Para: {selectedRequest.franchiseName}</p>
                        </div>

                        <form onSubmit={handleSubmitResponse} className="p-6 space-y-5">
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setResponseType('fulfill')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${responseType === 'fulfill'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Paperclip className="w-3 h-3" />
                                    Adjuntar Documento
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResponseType('reject')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${responseType === 'reject'
                                        ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <XCircle className="w-3 h-3" />
                                    Rechazar Petición
                                </button>
                            </div>

                            {responseType === 'fulfill' ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="resource-select" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Seleccionar Documento</label>
                                        <div className="flex gap-2">
                                            <select
                                                id="resource-select"
                                                title="Seleccionar documento"
                                                value={selectedResourceId}
                                                onChange={(e) => setSelectedResourceId(e.target.value)}
                                                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                            >
                                                <option value="">-- Selecciona un archivo --</option>
                                                {resources.map(res => (
                                                    <option key={res.id} value={res.id}>{res.title || res.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setIsUploadModalOpen(true)}
                                                className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 px-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                                                title="Subir nuevo archivo"
                                            >
                                                <UploadCloud className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            {selectedResourceId
                                                ? "Archivo seleccionado correctamente."
                                                : "Selecciona un archivo existente o sube uno nuevo."}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                                        <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                            <strong className="block mb-1">Nota:</strong>
                                            Al enviar, el franquiciado recibirá una notificación y podrá acceder al documento desde su sección de &quot;Recursos&quot;.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Motivo del Rechazo</label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explica por qué no se puede facilitar el documento..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
                                    />
                                </div>
                            )}

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsResponseModalOpen(false)}
                                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-6 py-2 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 ${responseType === 'fulfill'
                                        ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                                        }`}
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {responseType === 'fulfill' ? 'Enviar Documento' : 'Confirmar Rechazo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ResourceUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={handleUploadSuccess}
            />
        </div>
    );
};

export default RequestsInbox;
