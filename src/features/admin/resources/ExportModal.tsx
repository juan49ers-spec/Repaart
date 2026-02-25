import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Download, 
    FileText, 
    FileType2, 
    FileType,
    X,
    Check,
    Droplets,
    Sparkles
} from 'lucide-react';
import { useContractExport, ExportFormat } from '../../../hooks/useContractExport';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    filename: string;
    onExport?: (format: string) => void;
}

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

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    content,
    filename,
    onExport
}) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
    const [includeWatermark, setIncludeWatermark] = useState(false);
    const [watermarkText, setWatermarkText] = useState('BORRADOR');
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    
    const { exportContract } = useContractExport();

    const formats = [
        { 
            id: 'pdf' as ExportFormat, 
            label: 'PDF', 
            icon: FileType2, 
            description: 'Documento portátil ideal para firmas',
            color: 'text-rose-500',
            bgColor: 'bg-rose-50 dark:bg-rose-900/20',
            borderColor: 'border-rose-200 dark:border-rose-800',
            gradient: 'from-rose-500 to-pink-600'
        },
        { 
            id: 'docx' as ExportFormat, 
            label: 'Word (DOC)', 
            icon: FileType, 
            description: 'Editable para negociaciones',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            gradient: 'from-blue-500 to-indigo-600'
        },
        { 
            id: 'txt' as ExportFormat, 
            label: 'Texto Plano', 
            icon: FileText, 
            description: 'Formato simple y ligero',
            color: 'text-slate-500',
            bgColor: 'bg-slate-50 dark:bg-slate-900/20',
            borderColor: 'border-slate-200 dark:border-slate-800',
            gradient: 'from-slate-500 to-slate-600'
        }
    ];

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportContract(content, {
                format: selectedFormat,
                filename,
                includeWatermark,
                watermarkText
            });
            // Track export
            if (onExport) {
                onExport(selectedFormat);
            }
            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false);
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Export error:', error);
            alert('Error al exportar el documento');
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl"
        >
            <AnimatePresence mode="wait">
                {exportSuccess ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-12 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30"
                        >
                            <Check className="w-12 h-12 text-white" strokeWidth={2.5} />
                        </motion.div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">¡Exportado!</h3>
                        <p className="text-slate-500">Su documento ha sido descargado</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {/* Header Premium */}
                        <header className="relative px-10 py-8 border-b border-slate-100 dark:border-slate-800 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20" />
                            
                            <div className="relative flex items-center justify-between"
                            >
                                <div className="flex items-center gap-5">
                                    <motion.div 
                                        className="p-3.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/25"
                                        whileHover={{ scale: 1.05, rotate: 2 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <Download className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </motion.div>
                                    
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
                                        >
                                            Exportar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Documento</span>
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium mt-1">{filename}</p>
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
                        </header>

                        <div className="p-10 space-y-8">
                            {/* Format Selection */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                                >Selecciona formato</h4>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    {formats.map((format, idx) => {
                                        const Icon = format.icon;
                                        const isSelected = selectedFormat === format.id;
                                        
                                        return (
                                            <motion.button
                                                key={format.id}
                                                onClick={() => setSelectedFormat(format.id)}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                whileHover={{ scale: 1.02, y: -4 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                                                    isSelected 
                                                        ? `border-transparent shadow-xl` 
                                                        : `border-slate-200 dark:border-slate-700 hover:border-slate-300`
                                                }`}
                                                style={{
                                                    background: isSelected 
                                                        ? `linear-gradient(135deg, ${format.bgColor.replace('bg-', '').replace('dark:', '')} 0%, white 100%)`
                                                        : 'white'
                                                }}
                                            >
                                                {/* Background gradient cuando está seleccionado */}
                                                {isSelected && (
                                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${format.gradient} opacity-5`} />
                                                )}
                                                
                                                <div className="relative">
                                                    <div className={`${format.color} mb-4`}>
                                                        <Icon className="w-10 h-10" strokeWidth={1.5} />
                                                    </div>
                                                    
                                                    <div className="font-bold text-slate-900 dark:text-white text-lg mb-2">
                                                        {format.label}
                                                    </div>
                                                    
                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                        {format.description}
                                                    </p>
                                                    
                                                    {isSelected && (
                                                        <motion.div 
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                                                        >
                                                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Watermark Option */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-800/40 dark:to-slate-900/40 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/60"
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                                            <Droplets className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Marca de agua</h4>
                                            <p className="text-xs text-slate-500">Añadir marca de borrador</p>
                                        </div>
                                    </div>
                                    
                                    <motion.button
                                        onClick={() => setIncludeWatermark(!includeWatermark)}
                                        className={`relative w-14 h-7 rounded-full transition-colors ${
                                            includeWatermark ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-200 dark:bg-slate-700'
                                        }`}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <motion.div 
                                            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                                            animate={{ 
                                                left: includeWatermark ? '32px' : '4px'
                                            }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </motion.button>
                                </div>

                                <AnimatePresence>
                                    {includeWatermark && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1"
                                            >
                                                Texto de la marca
                                            </label>
                                            
                                            <div className="relative">
                                                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" strokeWidth={1.5} />
                                                <input
                                                    type="text"
                                                    value={watermarkText}
                                                    onChange={(e) => setWatermarkText(e.target.value)}
                                                    placeholder="BORRADOR"
                                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-amber-500 transition-all placeholder:text-slate-400"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Action Button */}
                            <motion.button
                                onClick={handleExport}
                                disabled={isExporting}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-2xl font-bold text-base tracking-wide transition-all shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 flex items-center justify-center gap-3 overflow-hidden relative group"
                            >
                                {isExporting ? (
                                    <>
                                        <motion.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                                        />
                                        <span>Exportando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-6 h-6 transition-transform group-hover:scale-110" strokeWidth={2} />
                                        <span>Exportar {formats.find(f => f.id === selectedFormat)?.label}</span>
                                    </>
                                )}
                                
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExportModal;
