import { useState } from 'react';
import { CheckCircle, ChevronRight, Building, CreditCard, Shield, Save, ArrowLeft } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Card from '../../ui/layout/Card';
import Button from '../../ui/inputs/Button';

// Initial State
const INITIAL_DATA = {
    name: '',
    email: '',
    city: '',
    taxId: '',
    adminName: '',
    adminPassword: '', // In a real app, use Auth service. Here we simulate config.
    tariffPlan: 'standard' as 'standard' | 'premium', // standard, premium
    baseFee: 15
};

interface FranchiseOnboardingProps {
    onCancel: () => void;
    onComplete: (name: string) => void;
}

const FranchiseOnboarding: React.FC<FranchiseOnboardingProps> = ({ onCancel, onComplete }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState(INITIAL_DATA);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: keyof typeof INITIAL_DATA, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            // Generate a simplified ID
            const franchiseId = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

            // 1. Create Franchise Config
            await setDoc(doc(db, "users_config", franchiseId), {
                name: data.name,
                email: data.email,
                role: 'franchise',
                city: data.city,
                taxId: data.taxId,
                active: true,
                createdAt: serverTimestamp(),
                plan: data.tariffPlan,
                ownerName: data.adminName,
                // In production, never store passwords in plain text. 
                // This is a config simulation for the "factory" demo.
                tempPassword: data.adminPassword
            });

            // 2. Initialize Financial Config (Optional - simulation)
            // await setDoc(doc(db, "financial_config", franchiseId), { ... });

            onComplete(data.name);
        } catch (err) {
            console.error("Error creating franchise:", err);
            setError("Error al crear la franquicia. Revisa la consola o intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Alta de Nueva Franquicia</h2>
                    <p className="text-slate-500 mt-1">Wizard de configuración inicial para expansión de red.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    <span className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    <span className={`h-2 w-16 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                </div>
            </div>

            <Card className="p-8 min-h-[400px] relative shadow-lg border-blue-100">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold flex items-center text-slate-700">
                            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                            Identidad Operativa
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre Comercial</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500"
                                    placeholder="Ej: Repaart Sevilla Este"
                                    value={data.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ciudad / Zona</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500"
                                    placeholder="Ej: Sevilla"
                                    value={data.city}
                                    onChange={e => handleChange('city', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">CIF / ID Fiscal</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500"
                                    placeholder="B-12345678"
                                    value={data.taxId}
                                    onChange={e => handleChange('taxId', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email Corporativo</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        className="w-full pl-10 rounded-lg border-slate-300 focus:ring-blue-500"
                                        placeholder="sevilla@repaart.com"
                                        value={data.email}
                                        onChange={e => handleChange('email', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold flex items-center text-slate-700">
                            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                            Configuración Financiera
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div
                                onClick={() => handleChange('tariffPlan', 'standard')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${data.tariffPlan === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-700">Plan Estándar</span>
                                    {data.tariffPlan === 'standard' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                                </div>
                                <p className="text-sm text-slate-500 mb-3">Tarifas base sin descuentos por volumen.</p>
                                <p className="font-bold text-2xl text-slate-800">15% <span className="text-xs font-normal text-slate-400">Royalty</span></p>
                            </div>

                            <div
                                onClick={() => handleChange('tariffPlan', 'premium')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${data.tariffPlan === 'premium' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-700">Plan Premium</span>
                                    {data.tariffPlan === 'premium' && <CheckCircle className="w-5 h-5 text-purple-500" />}
                                </div>
                                <p className="text-sm text-slate-500 mb-3">Para franquicias con alta proyección.</p>
                                <p className="font-bold text-2xl text-slate-800">12% <span className="text-xs font-normal text-slate-400">Royalty (fijo + variable)</span></p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                            <CreditCard className="w-5 h-5 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-slate-700">Clonación de Tarifas</p>
                                <p className="text-xs text-slate-500">Se copiarán automáticamente las 35 tarifas vigentes del modelo {data.tariffPlan === 'standard' ? 'Estándar 2024' : 'Growth 2025'}.</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold flex items-center text-slate-700">
                            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                            Seguridad y Acceso
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Administrador</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500"
                                    placeholder="Nombre Apellido"
                                    value={data.adminName}
                                    onChange={e => handleChange('adminName', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña Temporal</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 rounded-lg border-slate-300 focus:ring-blue-500 font-bold uppercase tracking-wider"
                                        placeholder="Generar..."
                                        value={data.adminPassword}
                                        onChange={e => handleChange('adminPassword', e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">El usuario deberá cambiarla en el primer login.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm mt-4">
                            <strong>Resumen de Alta:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                                <li>Franquicia: <strong>{data.name}</strong> ({data.city})</li>
                                <li>ID del Sistema: <strong>{data.email.split('@')[0]}</strong></li>
                                <li>Plan: <strong>{data.tariffPlan.toUpperCase()}</strong></li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="absolute bottom-20 left-8 right-8 bg-rose-100 text-rose-600 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Footer Controls */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center border-t border-slate-100 pt-6">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={handleBack} icon={ArrowLeft}>Anterior</Button>
                    ) : (
                        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                    )}

                    {step < 3 ? (
                        <Button variant="primary" onClick={handleNext} disabled={!data.name || !data.email}>
                            Siguiente <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={handleSubmit} icon={loading ? (undefined) : Save} disabled={loading}>
                            {loading ? 'Creando Franquicia...' : 'Finalizar Alta'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default FranchiseOnboarding;
