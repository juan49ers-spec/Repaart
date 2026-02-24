import React, { useState, useEffect } from 'react';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Store,
    FileText,
    Sparkles,
    Download,
    Save,
    CheckCircle2,
    Search,
    MessageSquare,
    Loader2,
    SaveAll,
    Plus
} from 'lucide-react';
import { db, storage } from '../../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import ReactMarkdown from 'react-markdown';
import { useContractAI } from '../../../hooks/useContractAI';
import { extractPlaceholders, fillTemplate, mapRestaurantToPlaceholders } from './utils/contractUtils';
import { useAuth } from '../../../context/AuthContext';
import { jsPDF } from 'jspdf';

interface Restaurant {
    id: string;
    fiscalName: string;
    cif: string;
    address?: {
        street: string;
        city: string;
        province: string;
    };
    legalRepresentative?: string;
}

interface SmartContractWizardProps {
    isOpen: boolean;
    onClose: () => void;
    templateName: string; // e.g., 'PLANTILLA CONTRATO RESTAURANTES.md'
    templateContent: string;
}

const SmartContractWizard: React.FC<SmartContractWizardProps> = ({ isOpen, onClose, templateContent }) => {
    const { user } = useAuth();
    const { suggestClause, reviewContract, loading: aiLoading } = useContractAI();

    // Steps: 1: Select Client, 2: Edit/AI, 3: Finalize/Export
    const [step, setStep] = useState(1);

    // Step 1: Clients
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

    // Step 2: Editor
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [finalContent, setFinalContent] = useState(templateContent);
    const [placeholders, setPlaceholders] = useState<string[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiReview, setAiReview] = useState<string | null>(null);

    // Step 3: Finalize
    const [isSaving, setIsSaving] = useState(false);
    const [savedResourceId, setSavedResourceId] = useState<string | null>(null);

    // Initial parsing
    useEffect(() => {
        if (templateContent) {
            setPlaceholders(extractPlaceholders(templateContent));
            setFinalContent(templateContent);
        }
    }, [templateContent]);

    // Fetch restaurants for Step 1
    useEffect(() => {
        if (step === 1 && isOpen) {
            const fetchRestaurants = async () => {
                setSearching(true);
                try {
                    const q = query(collection(db, 'restaurants'), where('status', '==', 'active'));
                    const snap = await getDocs(q);
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Restaurant));
                    setRestaurants(list);
                } catch (e) {
                    console.error("Error fetching restaurants:", e);
                } finally {
                    setSearching(false);
                }
            };
            fetchRestaurants();
        }
    }, [step, isOpen]);

    // Handle Auto-fill when restaurant selected
    const handleSelectRestaurant = (rest: Restaurant) => {
        setSelectedRestaurant(rest);
        const autoFilled = mapRestaurantToPlaceholders(rest, user || {});
        setVariables(autoFilled);
        setStep(2);
    };

    // Form Update
    const updateVariable = (key: string, value: string) => {
        const newVars = { ...variables, [key]: value };
        setVariables(newVars);
        setFinalContent(fillTemplate(templateContent, newVars));
    };

    // AI Logic
    const handleAddClause = async () => {
        if (!aiPrompt) return;
        try {
            const newClause = await suggestClause(aiPrompt, finalContent);
            setFinalContent(prev => prev + "\n\n" + newClause);
            setAiPrompt('');
        } catch (e) {
            alert("Error con la IA");
        }
    };

    const handleRunReview = async () => {
        try {
            const review = await reviewContract(finalContent);
            setAiReview(review);
        } catch (e) {
            alert("Error en la auditoría");
        }
    };

    // Export Logic
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const splitText = doc.splitTextToSize(finalContent.replace(/[#*]/g, ''), 180);
        doc.setFontSize(10);
        doc.text(splitText, 15, 20);
        doc.save(`${selectedRestaurant?.fiscalName || 'Contrato'}_final.pdf`);
    };

    const handleSaveToVault = async () => {
        if (!selectedRestaurant) return;
        setIsSaving(true);
        try {
            const fileName = `Contrato_${selectedRestaurant.fiscalName}_${Date.now()}.md`;
            const storagePath = `resources/generated/${fileName}`;
            const storageRef = ref(storage, storagePath);

            // Upload generated markdown
            await uploadString(storageRef, finalContent);
            const url = await getDownloadURL(storageRef);

            // Save to Firestore
            const docRef = await addDoc(collection(db, "resources"), {
                title: `Contrato: ${selectedRestaurant.fiscalName}`,
                name: fileName,
                category: 'contracts',
                url,
                storagePath,
                type: 'text/markdown',
                size: finalContent.length,
                isPinned: true,
                restaurantId: selectedRestaurant.id,
                createdAt: serverTimestamp(),
                generatedBy: 'SmartContractOrchestrator'
            });

            setSavedResourceId(docRef.id);
            setStep(3);
        } catch (e) {
            console.error("Save error:", e);
            alert("Error al guardar en la bóveda.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">

                {/* Header with Progress */}
                <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Smart <span className="text-indigo-600">Contract</span> Orchestrator</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${step >= 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>1. Cliente</span>
                                <ChevronRight className="w-3 h-3 text-slate-300" />
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${step >= 2 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>2. Configuración</span>
                                <ChevronRight className="w-3 h-3 text-slate-300" />
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${step >= 3 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>3. Finalizar</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </header>

                <main className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* STEP 1: RESTAURANT SELECTION */}
                    {step === 1 && (
                        <div className="flex-1 p-8 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
                            <div className="max-w-2xl mx-auto w-full space-y-8">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Selecciona un <span className="text-indigo-600">Cliente</span></h3>
                                    <p className="text-sm text-slate-500 font-medium">Auto-completa el contrato con los datos existentes en la red.</p>
                                </div>

                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar restaurante..."
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {searching ? (
                                        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                                    ) : restaurants.filter(r => r.fiscalName.toLowerCase().includes(searchQuery.toLowerCase())).map(rest => (
                                        <button
                                            key={rest.id}
                                            onClick={() => handleSelectRestaurant(rest)}
                                            className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                                                    <Store size={24} />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{rest.fiscalName}</h4>
                                                    <p className="text-[10px] font-mono text-slate-400 tracking-widest">{rest.cif}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: DYNAMIC EDITOR & AI */}
                    {step === 2 && (
                        <>
                            {/* Left Side: Controls & Form */}
                            <div className="w-full md:w-[450px] border-r border-slate-100 dark:border-slate-800 p-6 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-950/30">
                                <div className="space-y-8">
                                    {/* Auto-fill Info */}
                                    <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-600/20">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Store className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Cliente Vinculado</span>
                                        </div>
                                        <h4 className="font-black italic uppercase tracking-tight truncate">{selectedRestaurant?.fiscalName}</h4>
                                    </div>

                                    {/* Variable Form */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5" />
                                            Campos Dinámicos
                                        </h3>
                                        <div className="grid gap-4">
                                            {placeholders.map(key => (
                                                <div key={key}>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase">{key}</label>
                                                    <input
                                                        type="text"
                                                        value={variables[key] || ''}
                                                        onChange={(e) => updateVariable(key, e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI Assistant Section */}
                                    <div className="bg-slate-900 dark:bg-black rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">AI legal Assistant</span>
                                            </div>
                                            {aiLoading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                                        </div>
                                        <textarea
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            placeholder="Ej: Añade una cláusula de exclusividad..."
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50 min-h-[80px]"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAddClause}
                                                disabled={aiLoading || !aiPrompt}
                                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Añadir Cláusula
                                            </button>
                                            <button
                                                onClick={handleRunReview}
                                                disabled={aiLoading}
                                                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                                                title="Auditoría IA"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {aiReview && (
                                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                                <p className="text-[10px] text-indigo-300 font-medium italic">{aiReview}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Real-time Markdown Preview */}
                            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800">
                                <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Document Preview</h3>
                                    <div className="flex gap-2">
                                        <button onClick={handleExportPDF} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Exportar PDF">
                                            <Download size={16} />
                                        </button>
                                        <button
                                            onClick={() => setStep(1)}
                                            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase transition-all"
                                        >
                                            Cerrar Editor
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-12 bg-white dark:bg-slate-950/20 prose dark:prose-invert prose-indigo max-w-none prose-sm selection:bg-indigo-500/20 custom-scrollbar">
                                    <ReactMarkdown>{finalContent}</ReactMarkdown>
                                </div>
                                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                                    <button
                                        onClick={handleSaveToVault}
                                        disabled={isSaving}
                                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-indigo-600/30 active:scale-95 disabled:opacity-70"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <SaveAll className="w-5 h-5" />}
                                        Finalizar y Guardar en Bóveda
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* STEP 3: SUCCESS & RETENTION */}
                    {step === 3 && (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-500">
                            <div className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center mb-10 relative">
                                <div className="absolute inset-0 bg-emerald-500 animate-ping opacity-10 rounded-full" />
                                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/50">
                                    <CheckCircle2 size={48} />
                                </div>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4 italic uppercase tracking-tighter">CONTRATO <span className="text-emerald-600">CERTIFICADO</span></h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md font-medium text-lg leading-relaxed mb-10">
                                El documento ha sido generado, auditado por IA y guardado exitosamente en tu bóveda digital de contratos.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleExportPDF}
                                    className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    <Download className="w-5 h-5" /> Descargar PDF
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    Finalizar Wizard
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SmartContractWizard;
