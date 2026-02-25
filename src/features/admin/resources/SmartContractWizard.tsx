import React, { useState, useEffect } from 'react';
import {
    X,
    Store,
    Sparkles,
    Download,
    CheckCircle2,
    Search,
    Loader2,
    SaveAll,
    Eye,
    Edit3,
    BookOpen,
    PenTool,
    History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import ReactMarkdown from 'react-markdown';
import { useContractAI, ComplianceReport } from '../../../hooks/useContractAI';
import { useContractVersioning } from '../../../hooks/useContractVersioning';
import { extractPlaceholders, fillTemplate, mapRestaurantToPlaceholders, Restaurant } from './utils/contractUtils';
import { useAuth } from '../../../context/AuthContext';
import { FranchiseFiscalData } from '../../../hooks/useFranchiseData';
import ContractTextEditor from './ContractTextEditor';
import CompliancePanel from './CompliancePanel';
import VersionManager from './VersionManager';
import SnippetLibrary from './SnippetLibrary';
import ExportModal from './ExportModal';
import DigitalSignatureModal from './DigitalSignatureModal';
import { ClauseSnippet } from './snippets/snippetLibrary';
import { useContractAnalytics } from '../../../hooks/useContractAnalytics';

interface SmartContractWizardProps {
    isOpen: boolean;
    onClose: () => void;
    templateName: string;
    templateContent: string;
    franchiseData: FranchiseFiscalData | null;
}

const SmartContractWizard: React.FC<SmartContractWizardProps> = ({
    isOpen,
    onClose,
    templateContent,
    franchiseData
}) => {
    const { user } = useAuth();
    const { suggestClause, reviewContract, loading: aiLoading } = useContractAI();
    const { trackSnippetUsage, trackExport, trackAISuggestion, startSession, endSession } = useContractAnalytics();

    // Steps: 1: Select Client, 2: Edit/AI, 3: Finalize/Export
    const [step, setStep] = useState(1);

    // Step 1: Clients
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

    // Versioning
    const contractId = selectedRestaurant?.id || 'draft';
    const {
        versions,
        autoSaveData,
        createVersion,
        autoSave,
        deleteVersion,
        compareVersions,
        restoreVersion,
        clearAutoSave,
        hasAutoSave
    } = useContractVersioning(contractId);

    // Step 2: Editor
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [finalContent, setFinalContent] = useState(templateContent);
    const [placeholders, setPlaceholders] = useState<string[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiReview, setAiReview] = useState<ComplianceReport | null>(null);
    const [editMode, setEditMode] = useState<'vars' | 'text' | 'ai' | 'versions'>('vars');
    const [isSnippetLibraryOpen, setIsSnippetLibraryOpen] = useState(false);

    // Step 3: Finalize
    const [isSaving, setIsSaving] = useState(false);

    // Signature Modal
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    // Insert snippet handler
    const handleInsertSnippet = (snippet: ClauseSnippet) => {
        setFinalContent(prev => prev + "\n\n" + snippet.content);
        setIsSnippetLibraryOpen(false);
        // Track snippet usage
        trackSnippetUsage(snippet.id);
    };

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

        // Combinar datos del usuario autenticado con datos fiscales de franquicia
        const enrichedUserData = {
            ...user,
            legalName: franchiseData?.legalName || user?.displayName,
            cif: franchiseData?.cif,
            fiscalAddress: franchiseData?.address,
            city: franchiseData?.city,
            province: franchiseData?.province,
            postalCode: franchiseData?.postalCode,
            legalRepresentative: franchiseData?.legalRepresentative,
            representativeDni: franchiseData?.dniRepresentative,
            phone: franchiseData?.phone,
            email: franchiseData?.email
        };

        const autoFilled = mapRestaurantToPlaceholders(rest, enrichedUserData || {});
        setVariables(autoFilled);
        setFinalContent(fillTemplate(templateContent, autoFilled));
        // Start analytics session
        startSession(rest.id, 'service-contract');
        setStep(2);
    };

    // Form Update
    const updateVariable = (key: string, value: string) => {
        const newVars = { ...variables, [key]: value };
        setVariables(newVars);
        setFinalContent(fillTemplate(templateContent, newVars));
    };

    const handleManualEdit = (val: string) => {
        setFinalContent(val);
    };

    // Auto-save
    useEffect(() => {
        if (step === 2 && finalContent && selectedRestaurant) {
            const timeoutId = setTimeout(() => {
                autoSave(finalContent, variables, selectedRestaurant.id);
            }, 5000); // Auto-save después de 5 segundos de inactividad

            return () => clearTimeout(timeoutId);
        }
    }, [finalContent, variables, step, selectedRestaurant, autoSave]);

    // AI Logic
    const handleAddClause = async () => {
        if (!aiPrompt) return;
        try {
            const newClause = await suggestClause(aiPrompt, finalContent);
            setFinalContent(prev => prev + "\n\n" + newClause);
            setAiPrompt('');
            // Track AI suggestion accepted
            trackAISuggestion(true);
        } catch (error) {
            console.error("Error con la IA:", error);
            alert("Error con la IA");
            // Track AI suggestion rejected/failed
            trackAISuggestion(false);
        }
    };

    const handleRunReview = async () => {
        try {
            const review = await reviewContract(finalContent);
            setAiReview(review);
        } catch (error) {
            console.error("Error en la auditoría:", error);
            alert("Error en la auditoría");
        }
    };

    // Export Logic
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const handleExport = () => {
        setIsExportModalOpen(true);
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
            await addDoc(collection(db, "resources"), {
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

            // Limpiar auto-save después de guardar exitosamente
            clearAutoSave();
            // End analytics session (completed = true)
            endSession(true);
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
        <div className="flex-1 flex flex-col min-h-[100dvh] bg-[#f8fafc] dark:bg-black overflow-hidden selection:bg-indigo-500/30">
            {/* Header */}
            <header className="h-20 flex items-center justify-between px-12 border-b border-slate-200/50 dark:border-white/5 relative z-50 backdrop-blur-xl bg-white/50 dark:bg-black/50">
                <div className="flex flex-col">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-none italic uppercase"
                    >
                        {step === 1 ? 'Selección' : step === 2 ? 'Zen Editor' : 'Certificado'}
                    </motion.h2>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1 ml-1">Smart Contract Orchestrator v4</span>
                </div>

                <div className="flex items-center gap-6">
                    {/* Progress Stepper - Asymmetric Positioning */}
                    <div className="hidden lg:flex items-center gap-4 mr-12 bg-slate-100 dark:bg-white/5 p-1.5 rounded-full border border-slate-200/50 dark:border-white/5">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${step >= s ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400'}`}
                            >
                                {s}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all mechanical-press shadow-sm group"
                        aria-label="Cerrar asistente"
                    >
                        <X className="w-5 h-5 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="h-full flex flex-col items-center justify-center p-8 scrollable-area"
                        >
                            <div className="w-full max-w-5xl space-y-16">
                                <div className="text-center space-y-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", delay: 0.2 }}
                                        className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-3 border border-indigo-500/20"
                                    >
                                        <Store className="w-12 h-12 text-indigo-600" />
                                    </motion.div>
                                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-[0.85]">
                                        BUSCAR <br /><span className="text-indigo-600">CLIENTE</span>
                                    </h1>
                                    <p className="text-slate-400 max-w-lg mx-auto font-bold text-sm tracking-wide uppercase leading-relaxed pt-4">
                                        Selección de entidad para mapeo legal automático
                                    </p>
                                </div>

                                <div className="relative group max-w-3xl mx-auto">
                                    <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <div className="relative glass-premium-v2 rounded-[3rem] p-4 flex items-center gap-4 transition-all focus-within:ring-8 focus-within:ring-indigo-500/5 shadow-2xl overflow-hidden border-2 border-slate-200 dark:border-white/10">
                                        <Search className="w-8 h-8 text-slate-300 ml-6" />
                                        <input
                                            id="restaurant-search"
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Nombre del restaurante / CIF..."
                                            className="flex-1 bg-transparent text-3xl font-black italic tracking-tighter outline-none placeholder:text-slate-200 py-6"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {searching ? (
                                        <div className="col-span-full flex justify-center p-20">
                                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                                        </div>
                                    ) : restaurants.filter(r => r.fiscalName?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6).map((rest, idx) => (
                                        <motion.button
                                            key={rest.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleSelectRestaurant(rest)}
                                            className="group p-10 glass-premium-v2 rounded-[2.5rem] hover:border-indigo-500/50 transition-all text-left relative overflow-hidden mechanical-press shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 border border-slate-200/50 dark:border-white/5"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                                            <div className="relative z-10">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                                                    <Store className="w-7 h-7 text-slate-400 group-hover:text-white" />
                                                </div>
                                                <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tighter leading-tight mb-3 uppercase italic">{rest.fiscalName}</h3>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{rest.cif}</span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{rest.address?.city}</span>
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col md:flex-row overflow-hidden bg-[#f8fafc] dark:bg-black"
                        >
                            {/* Left Side: High-Agency Control Center */}
                            <div className="w-full md:w-[480px] border-r border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-3xl p-10 overflow-y-auto custom-scrollbar flex flex-col gap-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Protocolo Activo</span>
                                    </div>
                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase">CONFIGURACIÓN</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Entidad: <span className="text-indigo-600">{selectedRestaurant?.fiscalName}</span></p>
                                </div>

                                {/* Sidebar Tabs - 4 focused panels */}
                                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                    {[
                                        { id: 'vars' as const, icon: Eye, label: 'Variables' },
                                        { id: 'text' as const, icon: Edit3, label: 'Editor' },
                                        { id: 'ai' as const, icon: Sparkles, label: 'AI' },
                                        { id: 'versions' as const, icon: History, label: 'Versiones' },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setEditMode(tab.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${editMode === tab.id ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-[0_8px_16px_rgba(0,0,0,0.04)]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                        >
                                            <tab.icon className="w-3.5 h-3.5" />
                                            <span className="hidden xl:inline">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <AnimatePresence mode="wait">
                                        {/* Variables Tab */}
                                        {editMode === 'vars' && (
                                            <motion.div
                                                key="tab-vars"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="space-y-6"
                                            >
                                                {/* Progress Bar */}
                                                {(() => {
                                                    const filled = placeholders.filter(k => variables[k]?.trim()).length;
                                                    const total = placeholders.length;
                                                    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
                                                    const barBg = pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                                                    const badgeBg = pct >= 100 ? 'bg-emerald-500/10 text-emerald-600' : pct >= 50 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600';
                                                    const glowColor = pct >= 100 ? 'shadow-emerald-500/30' : pct >= 50 ? 'shadow-amber-500/30' : 'shadow-rose-500/30';
                                                    return (
                                                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-white/5 shadow-sm space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Progreso</span>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${badgeBg}`}>
                                                                    {filled}/{total} · {pct}%
                                                                </span>
                                                            </div>
                                                            <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${pct}%` }}
                                                                    transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                                                                    className={`h-full rounded-full ${barBg} shadow-lg ${glowColor}`}
                                                                />
                                                            </div>
                                                            {pct >= 100 && (
                                                                <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    Todos los campos completados — listo para finalizar
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                                                    CAMPOS DINÁMICOS
                                                    <span className="text-indigo-600">{placeholders.length} Detectados</span>
                                                </h4>
                                                <div className="grid gap-5">
                                                    {placeholders.map((key, i) => {
                                                        const isFilled = !!variables[key]?.trim();
                                                        return (
                                                            <motion.div
                                                                key={key}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: i * 0.03 }}
                                                            >
                                                                <label className="flex items-center gap-2 text-[9px] font-black text-slate-500 mb-2 ml-1 uppercase tracking-widest">
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${isFilled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                                    {key}
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    id={`var-${key}`}
                                                                    value={variables[key] || ''}
                                                                    onChange={(e) => updateVariable(key, e.target.value)}
                                                                    className={`w-full bg-white dark:bg-slate-900 border rounded-2xl px-5 py-3.5 text-sm font-bold shadow-sm focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none ${isFilled ? 'border-emerald-200 dark:border-emerald-500/20' : 'border-slate-200 dark:border-white/10'}`}
                                                                    placeholder="Fijar valor..."
                                                                />
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Editor Tab */}
                                        {editMode === 'text' && (
                                            <motion.div
                                                key="tab-text"
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                className="min-h-[400px]"
                                            >
                                                <ContractTextEditor
                                                    value={finalContent}
                                                    onChange={handleManualEdit}
                                                    placeholders={placeholders}
                                                />
                                            </motion.div>
                                        )}

                                        {/* AI Tab */}
                                        {editMode === 'ai' && (
                                            <motion.div
                                                key="tab-ai"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="space-y-6"
                                            >
                                                <div className="bg-slate-900 dark:bg-slate-900 rounded-[2rem] p-7 space-y-5 shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-indigo-500/20 rounded-xl">
                                                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                                            </div>
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Legal Engine</span>
                                                        </div>
                                                        {aiLoading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                                                    </div>

                                                    <textarea
                                                        value={aiPrompt}
                                                        onChange={(e) => setAiPrompt(e.target.value)}
                                                        placeholder="Describa la cláusula deseada..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 min-h-[120px] transition-all relative z-10"
                                                    />

                                                    <div className="flex gap-3 relative z-10">
                                                        <button
                                                            onClick={handleAddClause}
                                                            disabled={aiLoading || !aiPrompt}
                                                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mechanical-press shadow-lg shadow-indigo-600/30"
                                                        >
                                                            Generar Cláusula
                                                        </button>
                                                        <button
                                                            onClick={handleRunReview}
                                                            disabled={aiLoading}
                                                            className="px-5 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all mechanical-press border border-white/10"
                                                            title="Revisión de Cumplimiento"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <CompliancePanel report={aiReview} loading={aiLoading} />
                                            </motion.div>
                                        )}

                                        {/* Versions Tab */}
                                        {editMode === 'versions' && (
                                            <motion.div
                                                key="tab-versions"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                            >
                                                <VersionManager
                                                    versions={versions}
                                                    autoSaveData={autoSaveData}
                                                    currentContent={finalContent}
                                                    currentVariables={variables}
                                                    onCreateVersion={(name) => createVersion(name, finalContent, variables, selectedRestaurant?.id)}
                                                    onRestoreVersion={(version) => {
                                                        const restored = restoreVersion(version);
                                                        setFinalContent(restored.content);
                                                        setVariables(restored.variables);
                                                    }}
                                                    onDeleteVersion={deleteVersion}
                                                    onCompareVersions={compareVersions}
                                                    onRestoreAutoSave={() => {
                                                        if (autoSaveData) {
                                                            setFinalContent(autoSaveData.content);
                                                            setVariables(autoSaveData.variables);
                                                        }
                                                    }}
                                                    hasAutoSave={hasAutoSave()}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Action Footbar */}
                                <div className="space-y-4 pt-6 border-t border-slate-200/50 dark:border-white/5">
                                    <button
                                        onClick={handleSaveToVault}
                                        disabled={isSaving}
                                        className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl hover:scale-[1.02] mechanical-press flex items-center justify-center gap-4"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <SaveAll className="w-5 h-5" />}
                                        Finalizar Protocolo
                                    </button>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Volver al Inicio
                                    </button>
                                </div>
                            </div>

                            {/* Right Side: Artsy Paper Preview */}
                            <div className="flex-1 bg-[#f0f2f5] dark:bg-black/40 overflow-hidden relative flex items-center justify-center p-12">
                                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[150px] rounded-full animate-aurora-slow" />
                                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[150px] rounded-full animate-aurora-reverse" />
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        y: 0,
                                        transition: { type: "spring", stiffness: 50 }
                                    }}
                                    className="relative w-full max-w-[850px] h-full"
                                >
                                    <div
                                        className="w-full h-full bg-white text-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.15)] rounded-sm p-[60px] md:p-[100px] relative overflow-hidden flex flex-col overflow-y-auto custom-scrollbar"
                                    >
                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600/20 to-transparent" />

                                        <div className="flex-1 prose prose-slate max-w-none prose-sm md:prose-base !text-slate-900 font-serif selection:bg-indigo-100">
                                            <ReactMarkdown>{finalContent}</ReactMarkdown>
                                        </div>

                                        <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.5em] text-slate-300 relative z-10">
                                            <span>REPAART LEGAL INFRASTRUCTURE</span>
                                            <div className="flex items-center gap-4">
                                                <span>DOCUMENTO CERTIFICADO</span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Tool Floating Bar */}
                                <div className="absolute top-10 right-10 flex flex-col gap-4">
                                    <button
                                        onClick={handleExport}
                                        className="w-14 h-14 glass-premium-v2 rounded-2xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all shadow-xl hover:-translate-y-1 active:scale-90"
                                        title="Exportar Documento"
                                    >
                                        <Download className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => setIsSnippetLibraryOpen(true)}
                                        className="w-14 h-14 glass-premium-v2 rounded-2xl flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-all shadow-xl hover:-translate-y-1 active:scale-90"
                                        title="Librería de Cláusulas"
                                    >
                                        <BookOpen className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full flex flex-col items-center justify-center p-12 text-center"
                        >
                            <div className="w-40 h-40 bg-emerald-500/5 rounded-full flex items-center justify-center mb-12 relative">
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 bg-emerald-500 rounded-full"
                                />
                                <div className="w-28 h-28 bg-emerald-500 rounded-[2.5rem] rotate-3 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40">
                                    <CheckCircle2 size={56} />
                                </div>
                            </div>
                            <h3 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 italic uppercase tracking-tighter leading-none">
                                CONTRATO <br /><span className="text-emerald-500">EMITIDO</span>
                            </h3>
                            <p className="text-slate-400 max-w-md font-bold uppercase tracking-widest text-xs leading-loose mb-12">
                                Protocolo finalizado. El documento ha sido indexado en la bóveda con integridad criptográfica.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <button
                                    onClick={handleExport}
                                    className="px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 shadow-2xl"
                                >
                                    <Download className="w-5 h-5" /> Descargar
                                </button>
                                <button
                                    onClick={() => setIsSignatureModalOpen(true)}
                                    className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 shadow-2xl shadow-indigo-600/20"
                                >
                                    <PenTool className="w-5 h-5" /> Firmar Digitalmente
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 shadow-2xl shadow-emerald-600/20"
                                >
                                    Finalizar
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main >

            <AnimatePresence>
                {isSnippetLibraryOpen && (
                    <SnippetLibrary
                        onClose={() => setIsSnippetLibraryOpen(false)}
                        onInsertSnippet={handleInsertSnippet}
                        isOpen={isSnippetLibraryOpen}
                    />
                )}
            </AnimatePresence>

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                content={finalContent}
                filename={selectedRestaurant?.fiscalName || 'Contrato'}
                onExport={trackExport}
            />

            {/* Digital Signature Modal */}
            <DigitalSignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                documentId={contractId}
                documentName={selectedRestaurant?.fiscalName || 'Contrato'}
                documentContent={finalContent}
            />
        </div >
    );
};

export default SmartContractWizard;
