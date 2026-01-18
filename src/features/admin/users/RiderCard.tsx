import React, { useState } from 'react';
import { Mail, Phone, Calendar, Shield, MapPin, Award, FileText, Upload } from 'lucide-react';
import { User as UserType } from '../../../services/userService';
import { toast } from 'react-hot-toast';

interface RiderCardProps {
    user: UserType;
    onEdit: (user: UserType) => void;
    onStatusToggle: (user: UserType) => void;
}

const RiderCard: React.FC<RiderCardProps> = ({ user, onEdit }) => {
    // Mock status for now - in real app, derive from live shift data
    const isOnline = user.status === 'active';
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Status Ring Color
    const statusColor = user.status === 'active' ? 'ring-emerald-500' : 'ring-slate-300';
    const statusBg = user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300';

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);

        if (files.length > 0) {
            setUploading(true);
            const file = files[0];
            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success(`Documento "${file.name}" vinculado a ${user.displayName}`);
            setUploading(false);
        }
    };

    return (
        <div
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 overflow-hidden"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {(isDragging || uploading) && (
                <div className="absolute inset-0 z-50 bg-indigo-500/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
                    {uploading ? (
                        <>
                            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-white font-bold animate-pulse">Subiendo documento...</p>
                        </>
                    ) : (
                        <>
                            <Upload className="w-12 h-12 text-white mb-3 animate-bounce" />
                            <p className="text-white font-black text-lg text-center">¡Suelta para vincular!</p>
                            <p className="text-white/80 text-xs mt-1">Contratos, Bajas, Licencias...</p>
                        </>
                    )}
                </div>
            )}

            {/* Header Background */}
            <div className={`h-24 w-full bg-gradient-to-r ${isOnline ? 'from-emerald-500/10 to-teal-500/10' : 'from-slate-100 to-slate-200'} relative`}>
                <div className="absolute top-3 right-3 flex gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-white/50 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-slate-600 border border-white/20">
                        {user.role}
                    </span>
                </div>
            </div>

            {/* Avatar & Status Ring */}
            <div className="px-6 -mt-10 flex justify-between items-end">
                <div className={`relative rounded-full p-1 bg-white dark:bg-slate-900 ${statusColor} ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-2`}>
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-indigo-500">
                                {(user.displayName || user.email || '?').substring(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>
                    {/* Online Dot */}
                    <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${statusBg}`} />
                </div>

                {/* Quick Actions */}
                <button
                    onClick={() => onEdit(user)}
                    aria-label="Ver ficha completa"
                    className="mb-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                >
                    <FileText size={16} />
                </button>
            </div>

            {/* Body */}
            <div className="p-6 pt-3 space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {user.displayName || 'Sin Nombre'}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {user.email}
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Licencia</p>
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-sm">
                            <Shield className="w-3.5 h-3.5 text-indigo-500" />
                            {/* Static for now, envisioning dynamic field */}
                            <span>125cc (B)</span>
                        </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Nivel</p>
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-sm">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>Pro</span>
                        </div>
                    </div>
                </div>

                {/* Next Shift Preview */}
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Próximo Turno</span>
                        <Calendar className="w-3 h-3 text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Hoy, 14:00 - 18:00
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin size={10} />
                        <span>Zona Centro</span>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs text-slate-500">
                    <Phone className="w-3 h-3 mr-2" />
                    {user.phoneNumber || 'Sin teléfono'}
                </div>
            </div>
        </div>
    );
};

export default RiderCard;
