import { db } from '../lib/firebase';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    increment,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export interface AnalyticsData {
    userId: string;
    contractsGenerated: number;
    contractsByMonth: Record<string, number>;
    averageCompletionTime: number;
    totalEditingTime: number;
    snippetsUsed: Record<string, number>;
    templatesUsed: Record<string, number>;
    aiSuggestionsAccepted: number;
    aiSuggestionsTotal: number;
    exportsByFormat: Record<string, number>;
    lastUpdated: Timestamp;
}

const ANALYTICS_COLLECTION = 'contract_analytics';

export class ContractAnalyticsService {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    // Obtener o crear documento de analytics del usuario
    async getAnalytics(): Promise<AnalyticsData | null> {
        try {
            const docRef = doc(db, ANALYTICS_COLLECTION, this.userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as AnalyticsData;
            }

            // Crear documento inicial si no existe
            const initialData: AnalyticsData = {
                userId: this.userId,
                contractsGenerated: 0,
                contractsByMonth: {},
                averageCompletionTime: 0,
                totalEditingTime: 0,
                snippetsUsed: {},
                templatesUsed: {},
                aiSuggestionsAccepted: 0,
                aiSuggestionsTotal: 0,
                exportsByFormat: {},
                lastUpdated: serverTimestamp() as Timestamp
            };

            await setDoc(docRef, initialData);
            return initialData;
        } catch (error) {
            console.error('Error getting analytics:', error);
            return null;
        }
    }

    // Incrementar contador de contratos generados
    async incrementContract(month: string, duration: number, templateId?: string): Promise<void> {
        try {
            const docRef = doc(db, ANALYTICS_COLLECTION, this.userId);
            const updates: any = {
                contractsGenerated: increment(1),
                [`contractsByMonth.${month}`]: increment(1),
                totalEditingTime: increment(duration),
                lastUpdated: serverTimestamp()
            };

            if (templateId) {
                updates[`templatesUsed.${templateId}`] = increment(1);
            }

            // Calcular nuevo tiempo promedio
            const current = await this.getAnalytics();
            if (current) {
                const totalContracts = current.contractsGenerated + 1;
                const newAvg = ((current.averageCompletionTime * current.contractsGenerated) + duration) / totalContracts;
                updates.averageCompletionTime = newAvg;
            }

            await updateDoc(docRef, updates);
        } catch (error) {
            console.error('Error incrementing contract:', error);
            throw error;
        }
    }

    // Registrar uso de snippet
    async trackSnippetUsage(snippetId: string): Promise<void> {
        try {
            const docRef = doc(db, ANALYTICS_COLLECTION, this.userId);
            await updateDoc(docRef, {
                [`snippetsUsed.${snippetId}`]: increment(1),
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error('Error tracking snippet:', error);
        }
    }

    // Registrar exportación
    async trackExport(format: string): Promise<void> {
        try {
            const docRef = doc(db, ANALYTICS_COLLECTION, this.userId);
            await updateDoc(docRef, {
                [`exportsByFormat.${format}`]: increment(1),
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error('Error tracking export:', error);
        }
    }

    // Registrar sugerencia de IA
    async trackAISuggestion(accepted: boolean): Promise<void> {
        try {
            const docRef = doc(db, ANALYTICS_COLLECTION, this.userId);
            const updates: any = {
                aiSuggestionsTotal: increment(1),
                lastUpdated: serverTimestamp()
            };

            if (accepted) {
                updates.aiSuggestionsAccepted = increment(1);
            }

            await updateDoc(docRef, updates);
        } catch (error) {
            console.error('Error tracking AI suggestion:', error);
        }
    }

    // Sincronizar datos locales con Firebase (para migración)
    async syncLocalData(localData: any): Promise<void> {
        try {
            const docRef = doc(db, ANALYTICS_COLLECTION, this.userId);
            const current = await this.getAnalytics();

            if (!current) return;

            // Fusionar datos locales con datos de Firebase
            const mergedData = {
                ...current,
                contractsGenerated: current.contractsGenerated + (localData.contractsGenerated || 0),
                totalEditingTime: current.totalEditingTime + (localData.totalEditingTime || 0),
                aiSuggestionsAccepted: current.aiSuggestionsAccepted + (localData.aiSuggestionsAccepted || 0),
                aiSuggestionsTotal: current.aiSuggestionsTotal + (localData.aiSuggestionsTotal || 0),
                lastUpdated: serverTimestamp()
            };

            // Fusionar objetos anidados
            ['contractsByMonth', 'snippetsUsed', 'templatesUsed', 'exportsByFormat'].forEach(key => {
                if (localData[key]) {
                    Object.entries(localData[key]).forEach(([subKey, value]) => {
                        const currentValue = (current as any)[key]?.[subKey] || 0;
                        const localValue = value as number;
                        if (!mergedData[key as keyof AnalyticsData]) {
                            (mergedData as any)[key] = {};
                        }
                        (mergedData as any)[key][subKey] = currentValue + localValue;
                    });
                }
            });

            await setDoc(docRef, mergedData);
        } catch (error) {
            console.error('Error syncing local data:', error);
        }
    }

    // Resetear métricas
    async resetMetrics(): Promise<void> {
        try {
            const docRef = doc(db, ANALYTICS_COLLECTION, this.userId);
            await setDoc(docRef, {
                userId: this.userId,
                contractsGenerated: 0,
                contractsByMonth: {},
                averageCompletionTime: 0,
                totalEditingTime: 0,
                snippetsUsed: {},
                templatesUsed: {},
                aiSuggestionsAccepted: 0,
                aiSuggestionsTotal: 0,
                exportsByFormat: {},
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error('Error resetting metrics:', error);
            throw error;
        }
    }
}

// Hook para obtener el servicio
export const useAnalyticsService = () => {
    const { user } = useAuth();
    
    if (!user?.uid) {
        return null;
    }

    return new ContractAnalyticsService(user.uid);
};

export default ContractAnalyticsService;