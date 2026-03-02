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
    PenTool,
    FileText,
    Calendar,
    Hash,
    ChevronDown,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import ReactMarkdown from 'react-markdown';
import { useContractAI, ComplianceReport } from '../../../hooks/useContractAI';
import { useContractVersioning } from '../../../hooks/useContractVersioning';
import { extractPlaceholders, fillTemplate, mapRestaurantToPlaceholders, Restaurant, getVariableMeta, VARIABLE_GROUPS, VariableGroup } from './utils/contractUtils';
import { useAuth } from '../../../context/AuthContext';
import { FranchiseFiscalData } from '../../../hooks/useFranchiseData';
import ContractTextEditor from './ContractTextEditor';
import CompliancePanel from './CompliancePanel';
import VersionManager from './VersionManager';
import InlineSnippetPanel from './InlineSnippetPanel';
import ExportModal from './ExportModal';
import DigitalSignatureModal from './DigitalSignatureModal';
import { ClauseSnippet } from './snippets/snippetLibrary';
import { useContractDraft } from './hooks/useContractDraft';
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
    const [editMode, setEditMode] = useState<'vars' | 'text' | 'ai' | 'versions' | 'snippets'>('vars');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<VariableGroup>>(new Set());

    const toggleGroup = (group: VariableGroup) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(group)) {
                next.delete(group);
            } else {
                next.add(group);
            }
            return next;
        });
    };

    // Draft persistence
    const { draft, saveDraft, clearDraft, hasDraft } = useContractDraft(user?.uid);

    // Step 3: Finalize
    const [isSaving, setIsSaving] = useState(false);

    // Signature Modal
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

    // Insert snippet handler
    const handleInsertSnippet = (snippet: ClauseSnippet) => {
        setFinalContent(prev => prev + "\n\n" + snippet.content);
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

    // Blank contract (no client)
    const handleBlankContract = () => {
        setSelectedRestaurant({ id: 'blank', fiscalName: 'Contrato Genérico', cif: 'N/A' } as Restaurant);
        setVariables({});
        setFinalContent(templateContent);
        startSession('blank', 'generic-contract');
        setStep(2);
    };

    // Auto-save (versioning + draft persistence)
    useEffect(() => {
        if (step === 2 && finalContent && selectedRestaurant) {
            const timeoutId = setTimeout(() => {
                autoSave(finalContent, variables, selectedRestaurant.id);
                saveDraft({
                    templateId: contractId,
                    restaurantId: selectedRestaurant.id,
                    restaurantName: selectedRestaurant.fiscalName || '',
                    variables,
                    finalContent,
                    step
                });
            }, 5000);

            return () => clearTimeout(timeoutId);
        }
    }, [finalContent, variables, step, selectedRestaurant, autoSave, saveDraft, contractId]);

    // Restore draft
    const handleRestoreDraft = () => {
        if (!draft) return;
        setSelectedRestaurant({ id: draft.restaurantId, fiscalName: draft.restaurantName, cif: '' } as Restaurant);
        setVariables(draft.variables);
        setFinalContent(draft.finalContent);
        startSession(draft.restaurantId, draft.templateId);
        setStep(draft.step || 2);
    };

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
                                {/* Draft Restoration Banner */}
                                {hasDraft && draft && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <SaveAll className="w-5 h-5 text-amber-600" />
                                            <div>
                                                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Borrador guardado</p>
                                                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                                                    {draft.restaurantName} · {draft.updatedAt.toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleRestoreDraft}
                                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                            >
                                                Continuar
                                            </button>
                                            <button
                                                onClick={clearDraft}
                                                className="px-4 py-2 bg-white dark:bg-white/10 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-slate-200 dark:border-white/10"
                                            >
                                                Descartar
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

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

                                {/* Blank Contract Option */}
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={handleBlankContract}
                                        className="group flex items-center gap-4 px-8 py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                                    >
                                        <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                        <div className="text-left">
                                            <span className="block text-sm font-black text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 uppercase tracking-wider transition-colors">Contrato en blanco</span>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin vincular a cliente</span>
                                        </div>
                                    </button>
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
                            className="h-full flex flex-col md:flex-row overflow-hidden bg-slate-50/50 dark:bg-[#0a0a0a]"
                        >
                            {/* Left Side: Professional Document Control Panel */}
                            <div className="w-full md:w-[480px] border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col z-10 transition-colors shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                                <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Detalles del Documento</h3>
                                        <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-md border border-slate-200 dark:border-white/10 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            Borrador
                                        </div>
                                    </div>

                                    {/* Client Brief */}
                                    {selectedRestaurant && selectedRestaurant.id !== 'blank' ? (
                                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5">
                                            <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-400 font-bold text-sm shadow-sm flex-shrink-0">
                                                <Store className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-none mb-1.5">{selectedRestaurant.fiscalName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-none">
                                                    {selectedRestaurant.cif}{selectedRestaurant.address?.city ? ` · ${selectedRestaurant.address.city}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5">
                                            <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-400 shadow-sm flex-shrink-0">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Plantilla Base</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Sin vincular a cliente</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar Tabs - Clean DocuSign style */}
                                <div className="flex px-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
                                    {[
                                        { id: 'vars' as const, label: 'Campos' },
                                        { id: 'text' as const, label: 'Editor' },
                                        { id: 'snippets' as const, label: 'Cláusulas' },
                                        { id: 'ai' as const, label: 'AI' },
                                        { id: 'versions' as const, label: 'Versiones' },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setEditMode(tab.id)}
                                            className={`relative px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${editMode === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                        >
                                            {tab.label}
                                            {editMode === tab.id && (
                                                <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#0a0a0a]">
                                    <AnimatePresence mode="wait">
                                        {/* Variables Tab */}
                                        {editMode === 'vars' && (
                                            <motion.div
                                                key="tab-vars"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="flex flex-col min-h-full"
                                            >
                                                {/* === MINIMALIST PROGRESS === */}
                                                {(() => {
                                                    const filled = placeholders.filter(k => variables[k]?.trim()).length;
                                                    const total = placeholders.length;
                                                    const pct = total > 0 ? (filled / total) * 100 : 0;

                                                    return (
                                                        <div className="bg-white dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Progreso del documento</span>
                                                                <span className="text-xs font-semibold text-slate-500">{Math.round(pct)}% • {filled} de {total} campos</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${pct}%` }}
                                                                    transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                                                                    className={`h-full transition-colors duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                                />
                                                            </div>
                                                            {pct < 100 && (
                                                                <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5 font-medium">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                                    Faltan {total - filled} campos obligatorios por completar
                                                                </p>
                                                            )}
                                                            {pct >= 100 && (
                                                                <p className="text-[11px] text-emerald-600 mt-3 flex items-center gap-1.5 font-medium">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    Todos los campos han sido completados
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* === GROUPED VARIABLE SECTIONS === */}
                                                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                                                    {(['fecha', 'franquicia', 'restaurante', 'condiciones'] as VariableGroup[]).map(groupId => {
                                                        const groupKeys = placeholders.filter(k => getVariableMeta(k).group === groupId);
                                                        if (groupKeys.length === 0) return null;
                                                        const groupInfo = VARIABLE_GROUPS[groupId];
                                                        const groupFilled = groupKeys.filter(k => variables[k]?.trim()).length;
                                                        const isCollapsed = collapsedGroups.has(groupId);
                                                        const isComplete = groupFilled === groupKeys.length;

                                                        return (
                                                            <div key={groupId} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                                                                {/* Group Header */}
                                                                <button
                                                                    onClick={() => toggleGroup(groupId)}
                                                                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-left"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${isComplete ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>
                                                                            {isComplete ? <CheckCircle2 className="w-4 h-4" /> : groupInfo.icon}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{groupInfo.label}</h4>
                                                                            <p className="text-[11px] text-slate-500 mt-0.5">{groupFilled} de {groupKeys.length} completados</p>
                                                                        </div>
                                                                    </div>
                                                                    <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
                                                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                                                    </motion.div>
                                                                </button>

                                                                {/* Group Fields */}
                                                                <AnimatePresence initial={false}>
                                                                    {!isCollapsed && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: 'auto', opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="overflow-hidden"
                                                                        >
                                                                            <div className="px-5 pb-5 grid gap-4 border-t border-slate-100 dark:border-white/5 pt-4 bg-slate-50/50 dark:bg-slate-800/20">
                                                                                {groupKeys.map((key) => {
                                                                                    const meta = getVariableMeta(key);
                                                                                    const isFilled = !!variables[key]?.trim();
                                                                                    const isAuto = meta.autoFill && isFilled;
                                                                                    const showPrefix = meta.type === 'currency' ? '€' : meta.type === 'number' && meta.label.toLowerCase().includes('km') ? 'km' : null;

                                                                                    return (
                                                                                        <div key={key} className="relative group/field">
                                                                                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                                                                                {meta.label}
                                                                                                {isAuto && (
                                                                                                    <span className="text-[9px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                                                        Autocompletado
                                                                                                    </span>
                                                                                                )}
                                                                                            </label>
                                                                                            <div className="relative">
                                                                                                {showPrefix && (
                                                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none z-10">
                                                                                                        {showPrefix}
                                                                                                    </span>
                                                                                                )}
                                                                                                <input
                                                                                                    type="text"
                                                                                                    inputMode={meta.type === 'number' || meta.type === 'currency' ? 'decimal' : 'text'}
                                                                                                    id={`var-${key}`}
                                                                                                    value={variables[key] || ''}
                                                                                                    onChange={(e) => updateVariable(key, e.target.value)}
                                                                                                    className={`w-full rounded-md border text-sm transition-all outline-none focus:ring-2 focus:ring-offset-0 ${showPrefix ? 'pl-8' : 'pl-3'} pr-8 py-2.5 ${isAuto
                                                                                                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 focus:ring-slate-200 cursor-default'
                                                                                                        : isFilled
                                                                                                            ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500'
                                                                                                            : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-300/50 dark:border-amber-700/30 text-slate-900 dark:text-white focus:ring-amber-500 focus:border-amber-500 hover:border-amber-400'
                                                                                                        }`}
                                                                                                    placeholder={meta.hint}
                                                                                                />
                                                                                                {/* DocuSign style required indicator */}
                                                                                                {!isFilled && !isAuto && (
                                                                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
                                                                                                )}
                                                                                                {isFilled && !isAuto && (
                                                                                                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* === CTA FOOTER === */}
                                                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 mt-auto shrink-0 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.1)]">
                                                    {(() => {
                                                        const filled = placeholders.filter(k => variables[k]?.trim()).length;
                                                        const total = placeholders.length;
                                                        const allDone = filled === total && total > 0;

                                                        return (
                                                            <button
                                                                disabled={!allDone}
                                                                onClick={() => setEditMode('text')}
                                                                className={`w-full py-3.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${allDone
                                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'}`}
                                                            >
                                                                {allDone ? 'Siguiente: Revisar Documento' : 'Completa los campos requeridos'}
                                                                {allDone && <ArrowRight className="w-4 h-4" />}
                                                            </button>
                                                        );
                                                    })()}
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

                                        {/* Snippets Tab */}
                                        {editMode === 'snippets' && (
                                            <motion.div
                                                key="tab-snippets"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                            >
                                                <InlineSnippetPanel onInsertSnippet={handleInsertSnippet} />
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
                                        className="w-full h-full bg-white text-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.15)] rounded-sm relative overflow-hidden flex flex-col overflow-y-auto custom-scrollbar"
                                    >
                                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

                                        {/* Legal Document Header */}
                                        <div className="px-12 pt-10 pb-6 border-b border-slate-200/60 relative z-10 flex-shrink-0">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h1 className="text-[15px] font-black text-slate-900 tracking-tight uppercase">REPAART</h1>
                                                    <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-[0.25em] mt-0.5">Soporte a Franquiciados y Restaurantes</p>
                                                </div>
                                                <div className="text-right text-[8px] text-slate-400 leading-relaxed">
                                                    <p className="font-semibold">Teléfono: 613319713</p>
                                                    <p>Email: hola@repaart.es</p>
                                                </div>
                                            </div>
                                            <div className="h-px bg-gradient-to-r from-indigo-600/40 via-indigo-600/20 to-transparent" />
                                        </div>

                                        {/* Document Body */}
                                        <div className="flex-1 px-12 py-8">
                                            <div className="prose prose-slate max-w-none prose-sm !text-slate-800 selection:bg-indigo-100 [&_p]:!text-[11px] [&_p]:!leading-[1.75] [&_p]:!mb-2 [&_h1]:!text-[14px] [&_h1]:!font-black [&_h1]:!uppercase [&_h1]:!tracking-tight [&_h1]:!mt-5 [&_h1]:!mb-2 [&_h2]:!text-[12px] [&_h2]:!font-extrabold [&_h2]:!uppercase [&_h2]:!tracking-wide [&_h2]:!mt-4 [&_h2]:!mb-1.5 [&_h3]:!text-[11px] [&_h3]:!font-bold [&_h3]:!mt-3 [&_h3]:!mb-1 [&_ul]:!text-[10.5px] [&_ul]:!leading-[1.6] [&_ol]:!text-[10.5px] [&_ol]:!leading-[1.6] [&_li]:!text-[10.5px] [&_li]:!mb-0.5 [&_strong]:!font-extrabold [&_hr]:!my-4 [&_table]:!text-[10px] [&_td]:!py-1 [&_th]:!py-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                                <ReactMarkdown>{finalContent}</ReactMarkdown>
                                            </div>
                                        </div>

                                        {/* Professional Footer */}
                                        <div className="px-12 py-5 border-t border-slate-100 flex-shrink-0 relative z-10">
                                            <div className="flex justify-between items-end">
                                                <div className="text-[7px] font-semibold uppercase tracking-[0.4em] text-slate-300 leading-relaxed">
                                                    <p>REPAART Legal Infrastructure</p>
                                                    <p className="mt-0.5">Ref: {selectedRestaurant?.id?.slice(0, 8).toUpperCase() || 'DRAFT'}-{new Date().getFullYear()}</p>
                                                </div>
                                                <div className="text-right text-[7px] text-slate-300">
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                                        <span className="font-bold uppercase tracking-[0.3em]">Documento Certificado</span>
                                                    </div>
                                                    <p className="mt-0.5 font-medium">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                                </div>
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
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full flex flex-col items-center justify-center p-8 md:p-12 scrollable-area"
                        >
                            <div className="w-full max-w-2xl space-y-10">
                                {/* Success Icon */}
                                <div className="flex justify-center">
                                    <div className="w-28 h-28 bg-emerald-500/5 rounded-full flex items-center justify-center relative">
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="absolute inset-0 bg-emerald-500 rounded-full"
                                        />
                                        <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] rotate-3 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40">
                                            <CheckCircle2 size={40} />
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-3 italic uppercase tracking-tighter leading-none">
                                        CONTRATO <span className="text-emerald-500">EMITIDO</span>
                                    </h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                        Indexado en la bóveda con integridad verificada
                                    </p>
                                </div>

                                {/* Executive Summary Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/50 dark:border-white/5 shadow-lg space-y-5">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 dark:border-white/5 pb-3">Resumen Ejecutivo</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <Store className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedRestaurant?.fiscalName || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Variables</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{placeholders.filter(k => variables[k]?.trim()).length}/{placeholders.length} completadas</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Hash className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Extensión</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{finalContent.split(/\s+/).filter(Boolean).length} palabras · {versions.length} versiones</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={handleExport}
                                        className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-xl"
                                    >
                                        <Download className="w-4 h-4" /> Descargar
                                    </button>
                                    <button
                                        onClick={() => setIsSignatureModalOpen(true)}
                                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20"
                                    >
                                        <PenTool className="w-4 h-4" /> Firmar
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20"
                                    >
                                        Finalizar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main >



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
