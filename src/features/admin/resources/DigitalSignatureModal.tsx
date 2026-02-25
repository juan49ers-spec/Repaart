import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PenTool, 
    X, 
    Check,
    Shield,
    FileCheck,
    Download,
    AlertCircle,
    Fingerprint
} from 'lucide-react';
import { useDigitalSignature } from '../../../hooks/useDigitalSignature';
import { SignatureType, SignatureMetadata } from '../../../services/digitalSignatureService';

interface DigitalSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    documentName: string;
    documentContent: string;
    onSigned?: (signatureData: SignatureMetadata) => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
    isOpen,
    onClose,
    documentId,
    documentName,
    documentContent,
    onSigned
}) => {
    const [step, setStep] = useState<'type' | 'confirm' | 'signing' | 'success'>('type');
    const [signatureType, setSignatureType] = useState<SignatureType>('simple');
    const [agreed, setAgreed] = useState(false);

    const {
        error,
        signatureData,
        signDocument,
        clearError
    } = useDigitalSignature();

    const handleSign = async () => {
        setStep('signing');
        clearError();

        const result = await signDocument(
            documentContent,
            documentId,
            documentName,
            signatureType
        );

        if (result) {
            setStep('success');
            onSigned?.(result);
        } else {
            setStep('confirm');
        }
    };

    const handleDownloadCertificate = async () => {
        if (!signatureData) return;
        // El certificado se descarga desde el componente padre
        onClose();
    };

    const signatureTypes = [
        {
            id: 'simple' as SignatureType,
            name: 'Firma Simple',
            description: 'Firma electrónica básica con verificación de email',
            icon: PenTool,
            color: 'emerald'
        },
        {
            id: 'advanced' as SignatureType,
            name: 'Firma Avanzada',
            description: 'Mayor seguridad con autenticación de dos factores',
            icon: Shield,
            color: 'blue'
        },
        {
            id: 'qualified' as SignatureType,
            name: 'Firma Cualificada',
            description: 'Máxima validez legal con certificado digital',
            icon: Fingerprint,
            color: 'purple'
        }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                    <div className="flex items-center gap-4">
                        <motion.div 
                            className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/20"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <PenTool className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                                Firma <span className="text-emerald-600">Digital</span>
                            </h3>
                            <p className="text-sm text-slate-500">{documentName}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Select Signature Type */}
                        {step === 'type' && (
                            <motion.div
                                key="type"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                        Selecciona el tipo de firma
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        Elige el nivel de seguridad y validez legal que necesitas
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {signatureTypes.map((type) => {
                                        const Icon = type.icon;
                                        const isSelected = signatureType === type.id;
                                        
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => setSignatureType(type.id)}
                                                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                                                    isSelected
                                                        ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${
                                                        isSelected 
                                                            ? `bg-${type.color}-600` 
                                                            : 'bg-slate-100 dark:bg-slate-800'
                                                    }`}>
                                                        <Icon className={`w-6 h-6 ${
                                                            isSelected ? 'text-white' : 'text-slate-600'
                                                        }`} />
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-slate-900 dark:text-white">
                                                            {type.name}
                                                        </h5>
                                                        <p className="text-sm text-slate-500">
                                                            {type.description}
                                                        </p>
                                                    </div>
                                                    
                                                    {isSelected && (
                                                        <div className={`w-6 h-6 bg-${type.color}-600 rounded-full flex items-center justify-center`}>
                                                            <Check className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Confirm */}
                        {step === 'confirm' && (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileCheck className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                        Confirmar firma
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        Revisa los detalles antes de firmar
                                    </p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Documento</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
                                            {documentName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Tipo de firma</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                            {signatureType === 'simple' ? 'Simple' :
                                             signatureType === 'advanced' ? 'Avanzada' : 'Cualificada'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Hash SHA-256</span>
                                        <span className="text-xs font-mono text-slate-400 truncate max-w-[150px]">
                                            {documentContent ? 
                                                documentContent.substring(0, 8) + '...' + 
                                                documentContent.substring(documentContent.length - 8)
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                                        <div className="flex items-center gap-2 text-rose-600">
                                            <AlertCircle className="w-5 h-5" />
                                            <span className="text-sm font-medium">{error}</span>
                                        </div>
                                    </div>
                                )}

                                <label className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="mt-0.5 w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Confirmo que he revisado el documento y autorizo su firma digital. 
                                        Entiendo que esta firma tiene validez legal según el tipo seleccionado.
                                    </span>
                                </label>
                            </motion.div>
                        )}

                        {/* Step 3: Signing */}
                        {step === 'signing' && (
                            <motion.div
                                key="signing"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-12"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="w-16 h-16 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 rounded-full mb-6"
                                />
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                    Firmando documento...
                                </h4>
                                <p className="text-sm text-slate-500 text-center max-w-sm">
                                    Estamos generando el hash SHA-256 y registrando la firma en nuestra base de datos segura.
                                </p>
                            </motion.div>
                        )}

                        {/* Step 4: Success */}
                        {step === 'success' && signatureData && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30"
                                >
                                    <Check className="w-10 h-10 text-white" />
                                </motion.div>

                                <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                                    ¡Documento firmado!
                                </h4>
                                <p className="text-slate-500 mb-6">
                                    Tu firma ha sido registrada exitosamente
                                </p>

                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 text-left mb-6">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">ID de firma</span>
                                            <span className="font-mono text-slate-900 dark:text-white truncate max-w-[150px]">
                                                {signatureData.id}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Fecha</span>
                                            <span className="text-slate-900 dark:text-white">
                                                {signatureData.signedAt?.toDate?.() 
                                                    ? signatureData.signedAt.toDate().toLocaleString('es-ES')
                                                    : new Date().toLocaleString('es-ES')
                                                }
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Hash</span>
                                            <span className="font-mono text-xs text-slate-400 truncate max-w-[120px]">
                                                {signatureData.hash.substring(0, 16)}...
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDownloadCertificate}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Descargar certificado
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                {step !== 'signing' && step !== 'success' && (
                    <footer className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between">
                        <button
                            onClick={() => {
                                if (step === 'type') onClose();
                                else setStep('type');
                            }}
                            className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 transition-all"
                        >
                            {step === 'type' ? 'Cancelar' : 'Anterior'}
                        </button>

                        <button
                            onClick={() => {
                                if (step === 'type') setStep('confirm');
                                else if (step === 'confirm') handleSign();
                            }}
                            disabled={step === 'confirm' && !agreed}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase tracking-widest transition-all"
                        >
                            {step === 'type' ? 'Continuar' : 'Firmar ahora'}
                        </button>
                    </footer>
                )}
            </motion.div>
        </div>
    );
};

export default DigitalSignatureModal;
