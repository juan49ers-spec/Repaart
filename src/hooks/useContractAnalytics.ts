import { useState, useEffect, useCallback } from 'react';
import { ContractAnalyticsService } from '../services/contractAnalyticsService';
import { useAuth } from '../context/AuthContext';

export interface ContractMetrics {
    contractsGenerated: number;
    contractsByMonth: Record<string, number>;
    averageCompletionTime: number; // en segundos
    totalEditingTime: number; // en segundos
    snippetsUsed: Record<string, number>;
    templatesUsed: Record<string, number>;
    aiSuggestionsAccepted: number;
    aiSuggestionsTotal: number;
    exportsByFormat: Record<string, number>;
    lastSession?: {
        startTime: number;
        endTime?: number;
        documentId: string;
    };
}

const STORAGE_KEY = 'repaart_contract_analytics';
const SESSION_KEY = 'repaart_current_session';

export const useContractAnalytics = () => {
    const { user } = useAuth();
    const [service, setService] = useState<ContractAnalyticsService | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    const [metrics, setMetrics] = useState<ContractMetrics>({
        contractsGenerated: 0,
        contractsByMonth: {},
        averageCompletionTime: 0,
        totalEditingTime: 0,
        snippetsUsed: {},
        templatesUsed: {},
        aiSuggestionsAccepted: 0,
        aiSuggestionsTotal: 0,
        exportsByFormat: {}
    });

    const [currentSession, setCurrentSession] = useState<{
        startTime: number;
        documentId: string;
        templateId?: string;
    } | null>(null);

    // Inicializar servicio cuando hay usuario
    useEffect(() => {
        if (user?.uid) {
            const analyticsService = new ContractAnalyticsService(user.uid);
            setService(analyticsService);
        }
    }, [user?.uid]);

    // Cargar métricas desde Firebase (con fallback a localStorage)
    useEffect(() => {
        const loadMetrics = async () => {
            if (!service) {
                // Fallback a localStorage
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setMetrics(JSON.parse(stored));
                }
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const analyticsData = await service.getAnalytics();
                
                if (analyticsData) {
                    setMetrics({
                        contractsGenerated: analyticsData.contractsGenerated,
                        contractsByMonth: analyticsData.contractsByMonth,
                        averageCompletionTime: analyticsData.averageCompletionTime,
                        totalEditingTime: analyticsData.totalEditingTime,
                        snippetsUsed: analyticsData.snippetsUsed,
                        templatesUsed: analyticsData.templatesUsed,
                        aiSuggestionsAccepted: analyticsData.aiSuggestionsAccepted,
                        aiSuggestionsTotal: analyticsData.aiSuggestionsTotal,
                        exportsByFormat: analyticsData.exportsByFormat
                    });
                    setIsOnline(true);
                }
            } catch (error) {
                console.error('Error loading analytics from Firebase:', error);
                setIsOnline(false);
                // Fallback a localStorage
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setMetrics(JSON.parse(stored));
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadMetrics();
    }, [service]);

    // Guardar métricas (local + Firebase)
    const saveMetrics = useCallback(async (newMetrics: ContractMetrics) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMetrics));
        setMetrics(newMetrics);
    }, []);

    // Iniciar sesión de edición
    const startSession = useCallback((documentId: string, templateId?: string) => {
        const session = {
            startTime: Date.now(),
            documentId,
            templateId
        };
        setCurrentSession(session);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }, []);

    // Finalizar sesión
    const endSession = useCallback(async (completed: boolean = false) => {
        if (!currentSession) return;

        const duration = Math.floor((Date.now() - currentSession.startTime) / 1000);
        const month = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        setMetrics(prev => {
            const newMetrics = { ...prev };
            
            // Actualizar tiempo total
            newMetrics.totalEditingTime += duration;
            
            // Si se completó el contrato
            if (completed) {
                newMetrics.contractsGenerated += 1;
                
                // Actualizar por mes
                newMetrics.contractsByMonth[month] = (newMetrics.contractsByMonth[month] || 0) + 1;
                
                // Actualizar tiempo promedio
                const totalContracts = newMetrics.contractsGenerated;
                newMetrics.averageCompletionTime = 
                    ((newMetrics.averageCompletionTime * (totalContracts - 1)) + duration) / totalContracts;
                
                // Registrar plantilla usada
                if (currentSession.templateId) {
                    newMetrics.templatesUsed[currentSession.templateId] = 
                        (newMetrics.templatesUsed[currentSession.templateId] || 0) + 1;
                }
            }
            
            saveMetrics(newMetrics);
            return newMetrics;
        });

        // Sincronizar con Firebase si está online
        if (service && isOnline && completed) {
            try {
                await service.incrementContract(month, duration, currentSession.templateId);
            } catch (error) {
                console.error('Error syncing with Firebase:', error);
                setIsOnline(false);
            }
        }

        setCurrentSession(null);
        localStorage.removeItem(SESSION_KEY);
    }, [currentSession, service, isOnline, saveMetrics]);

    // Registrar uso de snippet
    const trackSnippetUsage = useCallback(async (snippetId: string) => {
        setMetrics(prev => {
            const newMetrics = { ...prev };
            newMetrics.snippetsUsed[snippetId] = (newMetrics.snippetsUsed[snippetId] || 0) + 1;
            saveMetrics(newMetrics);
            return newMetrics;
        });

        // Sincronizar con Firebase
        if (service && isOnline) {
            try {
                await service.trackSnippetUsage(snippetId);
            } catch (error) {
                console.error('Error tracking snippet:', error);
            }
        }
    }, [service, isOnline, saveMetrics]);

    // Registrar exportación
    const trackExport = useCallback(async (format: string) => {
        setMetrics(prev => {
            const newMetrics = { ...prev };
            newMetrics.exportsByFormat[format] = (newMetrics.exportsByFormat[format] || 0) + 1;
            saveMetrics(newMetrics);
            return newMetrics;
        });

        // Sincronizar con Firebase
        if (service && isOnline) {
            try {
                await service.trackExport(format);
            } catch (error) {
                console.error('Error tracking export:', error);
            }
        }
    }, [service, isOnline, saveMetrics]);

    // Registrar sugerencia de IA
    const trackAISuggestion = useCallback(async (accepted: boolean) => {
        setMetrics(prev => {
            const newMetrics = { ...prev };
            newMetrics.aiSuggestionsTotal += 1;
            if (accepted) {
                newMetrics.aiSuggestionsAccepted += 1;
            }
            saveMetrics(newMetrics);
            return newMetrics;
        });

        // Sincronizar con Firebase
        if (service && isOnline) {
            try {
                await service.trackAISuggestion(accepted);
            } catch (error) {
                console.error('Error tracking AI suggestion:', error);
            }
        }
    }, [service, isOnline, saveMetrics]);

    // Obtener estadísticas del mes actual
    const getCurrentMonthStats = useCallback(() => {
        const month = new Date().toISOString().slice(0, 7);
        return {
            contracts: metrics.contractsByMonth[month] || 0,
            totalContracts: metrics.contractsGenerated,
            avgTime: metrics.averageCompletionTime,
            aiAcceptanceRate: metrics.aiSuggestionsTotal > 0 
                ? Math.round((metrics.aiSuggestionsAccepted / metrics.aiSuggestionsTotal) * 100)
                : 0
        };
    }, [metrics]);

    // Obtener snippets más usados
    const getTopSnippets = useCallback((limit: number = 5) => {
        return Object.entries(metrics.snippetsUsed)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
    }, [metrics.snippetsUsed]);

    // Resetear métricas
    const resetMetrics = useCallback(async () => {
        const emptyMetrics: ContractMetrics = {
            contractsGenerated: 0,
            contractsByMonth: {},
            averageCompletionTime: 0,
            totalEditingTime: 0,
            snippetsUsed: {},
            templatesUsed: {},
            aiSuggestionsAccepted: 0,
            aiSuggestionsTotal: 0,
            exportsByFormat: {}
        };
        await saveMetrics(emptyMetrics);

        // Resetear en Firebase
        if (service && isOnline) {
            try {
                await service.resetMetrics();
            } catch (error) {
                console.error('Error resetting Firebase metrics:', error);
            }
        }
    }, [service, isOnline, saveMetrics]);

    // Sincronizar datos locales con Firebase
    const syncWithFirebase = useCallback(async () => {
        if (!service) return;

        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (localData) {
                await service.syncLocalData(JSON.parse(localData));
                setIsOnline(true);
                // Recargar datos
                const analyticsData = await service.getAnalytics();
                if (analyticsData) {
                    setMetrics({
                        contractsGenerated: analyticsData.contractsGenerated,
                        contractsByMonth: analyticsData.contractsByMonth,
                        averageCompletionTime: analyticsData.averageCompletionTime,
                        totalEditingTime: analyticsData.totalEditingTime,
                        snippetsUsed: analyticsData.snippetsUsed,
                        templatesUsed: analyticsData.templatesUsed,
                        aiSuggestionsAccepted: analyticsData.aiSuggestionsAccepted,
                        aiSuggestionsTotal: analyticsData.aiSuggestionsTotal,
                        exportsByFormat: analyticsData.exportsByFormat
                    });
                }
            }
        } catch (error) {
            console.error('Error syncing with Firebase:', error);
            setIsOnline(false);
        }
    }, [service]);

    return {
        metrics,
        currentSession,
        isLoading,
        isOnline,
        startSession,
        endSession,
        trackSnippetUsage,
        trackExport,
        trackAISuggestion,
        getCurrentMonthStats,
        getTopSnippets,
        resetMetrics,
        syncWithFirebase
    };
};

export default useContractAnalytics;