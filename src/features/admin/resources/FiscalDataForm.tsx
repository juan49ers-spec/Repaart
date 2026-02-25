import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Building2, 
    MapPin, 
    User, 
    Save,
    CheckCircle2,
    AlertCircle,
    Building,
    Mail,
    Phone,
    Hash,
    CreditCard,
    FileCheck
} from 'lucide-react';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

interface FiscalDataFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    legalName: string;
    cif: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    legalRepresentative: string;
    dniRepresentative: string;
    phone: string;
    email: string;
}

const INITIAL_FORM_DATA: FormData = {
    legalName: '',
    cif: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    legalRepresentative: '',
    dniRepresentative: '',
    phone: '',
    email: ''
};

// Animaciones refinadas
const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
            duration: 0.3,
            ease: "easeOut" as const,
            staggerChildren: 0.05
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" as const }
    }
};

export const FiscalDataForm: React.FC<FiscalDataFormProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [success, setSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState<keyof FormData | null>(null);

    // Cargar datos actuales del usuario
    useEffect(() => {
        const loadUserData = async () => {
            if (!user?.uid || !isOpen) return;
            
            setLoading(true);
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setFormData({
                        legalName: data.legalName || data.displayName || '',
                        cif: data.cif || data.taxId || '',
                        address: data.address || data.fiscalAddress || '',
                        city: data.city || '',
                        province: data.province || '',
                        postalCode: data.postalCode || data.zipCode || '',
                        legalRepresentative: data.legalRepresentative || data.representative || '',
                        dniRepresentative: data.dniRepresentative || data.representativeDni || '',
                        phone: data.phone || '',
                        email: data.email || ''
                    });
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [user, isOpen]);

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        if (!formData.legalName.trim()) {
            newErrors.legalName = 'El nombre fiscal es obligatorio';
        }

        if (!formData.cif.trim()) {
            newErrors.cif = 'El CIF/NIF es obligatorio';
        } else if (!/^[A-Z0-9]{9}$/i.test(formData.cif)) {
            newErrors.cif = 'El CIF/NIF debe tener 9 caracteres';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'La dirección es obligatoria';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'La ciudad es obligatoria';
        }

        if (!formData.province.trim()) {
            newErrors.province = 'La provincia es obligatoria';
        }

        if (!formData.postalCode.trim()) {
            newErrors.postalCode = 'El código postal es obligatorio';
        } else if (!/^\d{5}$/.test(formData.postalCode)) {
            newErrors.postalCode = 'El código postal debe tener 5 dígitos';
        }

        if (!formData.legalRepresentative.trim()) {
            newErrors.legalRepresentative = 'El representante legal es obligatorio';
        }

        if (!formData.dniRepresentative.trim()) {
            newErrors.dniRepresentative = 'El DNI del representante es obligatorio';
        } else if (!/^[0-9]{8}[A-Z]$/i.test(formData.dniRepresentative)) {
            newErrors.dniRepresentative = 'Formato de DNI inválido (8 números + letra)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm() || !user?.uid) return;

        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                legalName: formData.legalName,
                cif: formData.cif.toUpperCase(),
                address: formData.address,
                city: formData.city,
                province: formData.province,
                postalCode: formData.postalCode,
                legalRepresentative: formData.legalRepresentative,
                dniRepresentative: formData.dniRepresentative.toUpperCase(),
                phone: formData.phone,
                email: formData.email,
                fiscalDataCompleted: true,
                updatedAt: new Date().toISOString()
            });

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error saving fiscal data:', error);
            setErrors({ 
                legalName: 'Error al guardar los datos. Inténtalo de nuevo.' 
            });
        } finally {
            setSaving(false);
        }
    };

    // Input component refinado
    const FormInput = ({
        label,
        field,
        type = 'text',
        placeholder,
        icon: Icon,
        required = false,
        maxLength
    }: {
        label: string;
        field: keyof FormData;
        type?: string;
        placeholder: string;
        icon: React.ElementType;
        required?: boolean;
        maxLength?: number;
    }) => {
        const isFocused = focusedField === field;
        const hasError = errors[field];
        const hasValue = formData[field];

        return (
            <motion.div variants={itemVariants} className="relative">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    {label}
                    {required && <span className="text-rose-500 ml-0.5">*</span>}
                </label>
                
                <div className={`relative group transition-all duration-300 ${
                    isFocused ? 'transform scale-[1.02]' : ''
                }`}>
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                        isFocused ? 'text-indigo-500' : 
                        hasError ? 'text-rose-400' : 
                        hasValue ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                        <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    
                    <input
                        type={type}
                        value={formData[field]}
                        onChange={(e) => handleChange(field, e.target.value)}
                        onFocus={() => setFocusedField(field)}
                        onBlur={() => setFocusedField(null)}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        className={`w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 rounded-2xl text-sm font-medium
                            outline-none transition-all duration-300
                            ${hasError 
                                ? 'border-rose-200 focus:border-rose-500 focus:shadow-lg focus:shadow-rose-500/10' 
                                : isFocused 
                                    ? 'border-indigo-500 shadow-xl shadow-indigo-500/10' 
                                    : hasValue 
                                        ? 'border-emerald-200 dark:border-emerald-800' 
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                            }
                            placeholder:text-slate-400 placeholder:font-normal
                        `}
                    />
                    
                    {/* Indicador visual de estado */}
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                        hasValue && !hasError ? 'opacity-100' : 'opacity-0'
                    }`}>
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                </div>
                
                <AnimatePresence>
                    {hasError && (
                        <motion.p 
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="mt-2 text-xs text-rose-500 flex items-center gap-1.5 ml-1"
                        >
                            <AlertCircle className="w-3.5 h-3.5" />
                            {hasError}
                        </motion.p>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl"
        >
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header Premium */}
                <motion.header 
                    variants={itemVariants}
                    className="relative px-10 py-8 border-b border-slate-100 dark:border-slate-800 overflow-hidden"
                >
                    {/* Gradiente de fondo sutil */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20" />
                    
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <motion.div 
                                className="p-3.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/25"
                                whileHover={{ scale: 1.05, rotate: 2 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <Building2 className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </motion.div>
                            
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
                                >
                                    Datos <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Fiscales</span>
                                </h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    Complete la información de su empresa para generar contratos legales
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

                {success ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col items-center justify-center p-16"
                    >
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30"
                        >
                            <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={1.5} />
                        </motion.div>
                        
                        <motion.h4 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-black text-slate-900 dark:text-white mb-3"
                        >
                            ¡Datos Guardados!
                        </motion.h4>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-slate-500 text-lg"
                        >
                            Sus datos fiscales han sido actualizados correctamente
                        </motion.p>
                    </motion.div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-10"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center h-64"
                                >
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-12 h-12 border-3 border-slate-200 border-t-indigo-600 rounded-full"
                                    />
                                </div>
                            ) : (
                                <form id="fiscal-form" onSubmit={handleSubmit} className="space-y-8"
                                >
                                    {/* Sección 1: Datos de la Empresa */}
                                    <motion.div 
                                        variants={itemVariants}
                                        className="relative"
                                    >
                                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                                        
                                        <div className="bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-800/40 dark:to-slate-900/40 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm"
                                        >
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl"
                                                >
                                                    <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white"
                                                >Información de la Empresa</h4>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5">
                                                <div className="lg:col-span-2">
                                                    <FormInput
                                                        label="Nombre Fiscal / Razón Social"
                                                        field="legalName"
                                                        placeholder="Ej: REPAART LOGISTICS SL"
                                                        icon={Building}
                                                        required
                                                    />
                                                </div>

                                                <FormInput
                                                    label="CIF / NIF"
                                                    field="cif"
                                                    placeholder="Ej: B12345678"
                                                    icon={FileCheck}
                                                    required
                                                    maxLength={9}
                                                />

                                                <FormInput
                                                    label="Teléfono"
                                                    field="phone"
                                                    type="tel"
                                                    placeholder="Ej: 912345678"
                                                    icon={Phone}
                                                />

                                                <div className="lg:col-span-2">
                                                    <FormInput
                                                        label="Email Corporativo"
                                                        field="email"
                                                        type="email"
                                                        placeholder="Ej: info@empresa.com"
                                                        icon={Mail}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Sección 2: Dirección */}
                                    <motion.div 
                                        variants={itemVariants}
                                        className="relative"
                                    >
                                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                                        
                                        <div className="bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-800/40 dark:to-slate-900/40 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm"
                                        >
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"
                                                >
                                                    <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white"
                                                >Dirección Fiscal</h4>
                                            </div>

                                            <div className="space-y-5">
                                                <FormInput
                                                    label="Dirección"
                                                    field="address"
                                                    placeholder="Ej: Calle Mayor, 123, Planta 2"
                                                    icon={MapPin}
                                                    required
                                                />

                                                <div className="grid grid-cols-3 gap-4">
                                                    <FormInput
                                                        label="Código Postal"
                                                        field="postalCode"
                                                        placeholder="28001"
                                                        icon={Hash}
                                                        required
                                                        maxLength={5}
                                                    />

                                                    <FormInput
                                                        label="Ciudad"
                                                        field="city"
                                                        placeholder="Madrid"
                                                        icon={Building}
                                                        required
                                                    />

                                                    <FormInput
                                                        label="Provincia"
                                                        field="province"
                                                        placeholder="Madrid"
                                                        icon={MapPin}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Sección 3: Representante Legal */}
                                    <motion.div 
                                        variants={itemVariants}
                                        className="relative"
                                    >
                                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                                        
                                        <div className="bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-800/40 dark:to-slate-900/40 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm"
                                        >
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl"
                                                >
                                                    <User className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white"
                                                >Representante Legal</h4>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormInput
                                                    label="Nombre Completo"
                                                    field="legalRepresentative"
                                                    placeholder="Ej: Juan García López"
                                                    icon={User}
                                                    required
                                                />

                                                <FormInput
                                                    label="DNI / NIE"
                                                    field="dniRepresentative"
                                                    placeholder="Ej: 12345678A"
                                                    icon={CreditCard}
                                                    required
                                                    maxLength={9}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                </form>
                            )}
                        </div>

                        <motion.footer 
                            variants={itemVariants}
                            className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 dark:from-slate-900/50 dark:via-slate-900 dark:to-slate-900/50 flex justify-between items-center"
                        >
                            <motion.button
                                type="button"
                                onClick={onClose}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-8 py-4 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-all text-sm"
                            >
                                Cancelar
                            </motion.button>

                            <motion.button
                                type="submit"
                                form="fiscal-form"
                                disabled={saving}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 overflow-hidden"
                            >
                                <div className="relative flex items-center gap-3"
                                >
                                    {saving ? (
                                        <>
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                            />
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 transition-transform group-hover:scale-110" strokeWidth={2} />
                                            <span>Guardar Datos Fiscales</span>
                                        </>
                                    )}
                                </div>
                                
                                {/* Efecto shimmer */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            </motion.button>
                        </motion.footer>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default FiscalDataForm;
