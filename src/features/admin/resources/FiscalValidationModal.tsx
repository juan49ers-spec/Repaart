import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    AlertTriangle, 
    Building2, 
    User, 
    MapPin, 
    FileText,
    CheckCircle2,
    ChevronRight,
    Edit3
} from 'lucide-react';
import { FiscalValidation, FranchiseFiscalData } from '../../../hooks/useFranchiseData';

interface FiscalValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
    onEdit: () => void;
    validation: FiscalValidation;
    franchiseData: FranchiseFiscalData | null;
}

const FIELD_LABELS: Record<string, string> = {
    legalName: 'Nombre Fiscal / Razón Social',
    cif: 'CIF / NIF',
    address: 'Dirección Fiscal',
    city: 'Ciudad',
    province: 'Provincia',
    postalCode: 'Código Postal',
    legalRepresentative: 'Representante Legal',
    dniRepresentative: 'DNI del Representante',
    phone: 'Teléfono',
    email: 'Email'
};

const FIELD_ICONS: Record<string, React.ReactNode> = {
    legalName: <Building2 className="w-4 h-4" strokeWidth={1.5} />,
    cif: <FileText className="w-4 h-4" strokeWidth={1.5} />,
    address: <MapPin className="w-4 h-4" strokeWidth={1.5} />,
    city: <MapPin className="w-4 h-4" strokeWidth={1.5} />,
    province: <MapPin className="w-4 h-4" strokeWidth={1.5} />,
    postalCode: <MapPin className="w-4 h-4" strokeWidth={1.5} />,
    legalRepresentative: <User className="w-4 h-4" strokeWidth={1.5} />,
    dniRepresentative: <FileText className="w-4 h-4" strokeWidth={1.5} />,
    phone: <FileText className="w-4 h-4" strokeWidth={1.5} />,
    email: <FileText className="w-4 h-4" strokeWidth={1.5} />
};

const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: { duration: 0.3 }
    },
    exit: { 
        opacity: 0, 
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};

export const FiscalValidationModal: React.FC<FiscalValidationModalProps> = ({
    isOpen,
    onClose,
    onContinue,
    onEdit,
    validation,
    franchiseData
}) => {
    if (!isOpen) return null;

    const completedFields = franchiseData 
        ? Object.keys(FIELD_LABELS).filter(key => {
            const value = franchiseData[key as keyof FranchiseFiscalData];
            return value && String(value).trim() !== '';
        })
        : [];

    const missingFields = franchiseData
        ? Object.keys(FIELD_LABELS).filter(key => {
            const value = franchiseData[key as keyof FranchiseFiscalData];
            return !value || String(value).trim() === '';
        })
        : Object.keys(FIELD_LABELS);

    const progress = Math.round((completedFields.length / Object.keys(FIELD_LABELS).length) * 100);

    const getProgressColor = () => {
        if (progress === 100) return 'bg-emerald-500';
        if (progress >= 60) return 'bg-amber-500';
        if (progress >= 30) return 'bg-orange-500';
        return 'bg-rose-500';
    };

    const getStatusConfig = () => {
        if (validation.isValid) {
            return {
                icon: CheckCircle2,
                bgColor: 'bg-emerald-500',
                shadowColor: 'shadow-emerald-500/25',
                textColor: 'text-emerald-600',
                message: 'Todos los datos fiscales están completos'
            };
        }
        return {
            icon: AlertTriangle,
            bgColor: 'bg-amber-500',
            shadowColor: 'shadow-amber-500/25',
            textColor: 'text-amber-600',
            message: 'Se requieren datos fiscales para generar contratos'
        };
    };

    const status = getStatusConfig();
    const StatusIcon = status.icon;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl"
        >
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header Premium */}
                <motion.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative px-10 py-8 border-b border-slate-100 dark:border-slate-800 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50" />
                    
                    <div className="relative flex items-center justify-between"
                    >
                        <div className="flex items-center gap-5">
                            <motion.div 
                                className={`p-4 ${status.bgColor} rounded-2xl shadow-xl ${status.shadowColor}`}
                                whileHover={{ scale: 1.05, rotate: 2 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <StatusIcon className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </motion.div>
                            
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
                                >
                                    Datos <span className={status.textColor}>Fiscales</span>
                                </h2>
                                <p className="text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
                                    {status.message}
                                </p>
                            </div>
                        </div>
                        
                        <motion.button 
                            onClick={onClose}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors group"
                        >
                            <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" strokeWidth={1.5} />
                        </motion.button>
                    </div>
                </motion.header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
                    {/* Progress Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-800/40 dark:to-slate-900/40 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm"
                    >
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completitud del perfil</span>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {completedFields.length} de {Object.keys(FIELD_LABELS).length} campos completados
                                </p>
                            </div>
                            <span className={`text-4xl font-black ${status.textColor}`}>{progress}%</span>
                        </div>
                        
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full ${getProgressColor()} shadow-lg`}
                            />
                        </div>

                        {validation.errors.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-6 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-2xl"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-5 h-5 text-rose-500" strokeWidth={1.5} />
                                    <span className="font-bold text-rose-700 dark:text-rose-400 text-sm">Errores de validación</span>
                                </div>
                                <ul className="space-y-2">
                                    {validation.errors.map((error, idx) => (
                                        <li key={idx} className="text-sm text-rose-600 dark:text-rose-400 flex items-start gap-2"
                                        >
                                            <span className="text-rose-400 mt-1">•</span>
                                            {error}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Missing Fields */}
                    <AnimatePresence>
                        {missingFields.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Campos pendientes
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {missingFields.map((field, idx) => (
                                        <motion.div 
                                            key={field}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + idx * 0.05 }}
                                            className="flex items-center gap-3 p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30 rounded-2xl hover:bg-amber-50 transition-colors group cursor-pointer"
                                            onClick={onEdit}
                                        >
                                            <div className="text-amber-500 group-hover:scale-110 transition-transform">
                                                {FIELD_ICONS[field]}
                                            </div>
                                            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                                {FIELD_LABELS[field]}
                                            </span>
                                            
                                            <ChevronRight className="w-4 h-4 text-amber-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Completed Fields */}
                    <AnimatePresence>
                        {completedFields.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Campos completados
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {completedFields.map((field, idx) => (
                                        <motion.div 
                                            key={field}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + idx * 0.05 }}
                                            className="flex items-center gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/30 rounded-2xl"
                                        >
                                            <div className="text-emerald-500">
                                                {FIELD_ICONS[field]}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold uppercase tracking-wider">
                                                    {FIELD_LABELS[field]}
                                                </p>
                                                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold truncate"
                                                >
                                                    {franchiseData?.[field as keyof FranchiseFiscalData]}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <motion.footer 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 dark:from-slate-900/50 dark:via-slate-900 dark:to-slate-900/50 flex justify-between items-center"
                >
                    <motion.button
                        onClick={onClose}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-8 py-4 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-all text-sm"
                    >
                        Cerrar
                    </motion.button>

                    {validation.isValid ? (
                        <motion.button
                            onClick={onContinue}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/30 overflow-hidden"
                        >
                            <div className="relative flex items-center gap-3">
                                <span>Seleccionar Plantilla</span>
                                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </div>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={onEdit}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 overflow-hidden"
                        >
                            <div className="relative flex items-center gap-3">
                                <Edit3 className="w-5 h-5" strokeWidth={2} />
                                <span>Completar Datos</span>
                                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </div>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </motion.button>
                    )}
                </motion.footer>
            </motion.div>
        </div>
    );
};

export default FiscalValidationModal;
