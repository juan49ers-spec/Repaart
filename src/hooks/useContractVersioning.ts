import { useState, useEffect, useCallback } from 'react';

export interface ContractVersion {
    id: string;
    name: string;
    content: string;
    timestamp: number;
    variables: Record<string, string>;
    restaurantId?: string;
    auto?: boolean;
}

export interface VersionComparison {
    added: string[];
    removed: string[];
    modified: { old: string; new: string; line: number }[];
}

const STORAGE_KEY = 'repaart_contract_versions';
const AUTOSAVE_KEY = 'repaart_contract_autosave';
const MAX_VERSIONS = 20;
const MAX_AUTO_VERSIONS = 5;

export const useContractVersioning = (contractId: string) => {
    const [versions, setVersions] = useState<ContractVersion[]>([]);
    const [autoSaveData, setAutoSaveData] = useState<ContractVersion | null>(null);

    // Cargar versiones del localStorage
    useEffect(() => {
        const loadVersions = () => {
            try {
                const stored = localStorage.getItem(`${STORAGE_KEY}_${contractId}`);
                if (stored) {
                    setVersions(JSON.parse(stored));
                }
                
                const autoStored = localStorage.getItem(`${AUTOSAVE_KEY}_${contractId}`);
                if (autoStored) {
                    setAutoSaveData(JSON.parse(autoStored));
                }
            } catch (e) {
                console.error('Error loading versions:', e);
            }
        };
        
        loadVersions();
    }, [contractId]);

    // Guardar versiones en localStorage
    const saveVersions = useCallback((newVersions: ContractVersion[]) => {
        try {
            localStorage.setItem(`${STORAGE_KEY}_${contractId}`, JSON.stringify(newVersions));
            setVersions(newVersions);
        } catch (e) {
            console.error('Error saving versions:', e);
        }
    }, [contractId]);

    // Crear nueva versión
    const createVersion = useCallback((
        name: string, 
        content: string, 
        variables: Record<string, string>,
        restaurantId?: string,
        auto: boolean = false
    ): ContractVersion => {
        const version: ContractVersion = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: auto ? `Auto-guardado ${new Date().toLocaleTimeString()}` : name,
            content,
            timestamp: Date.now(),
            variables,
            restaurantId,
            auto
        };

        setVersions(prev => {
            let newVersions = [version, ...prev];
            
            // Limitar número total de versiones
            if (newVersions.length > MAX_VERSIONS) {
                // Mantener solo versiones manuales más recientes y algunas auto
                const manualVersions = newVersions.filter(v => !v.auto).slice(0, MAX_VERSIONS - MAX_AUTO_VERSIONS);
                const autoVersions = newVersions.filter(v => v.auto).slice(0, MAX_AUTO_VERSIONS);
                newVersions = [...manualVersions, ...autoVersions].sort((a, b) => b.timestamp - a.timestamp);
            }
            
            localStorage.setItem(`${STORAGE_KEY}_${contractId}`, JSON.stringify(newVersions));
            return newVersions;
        });

        return version;
    }, [contractId]);

    // Auto-guardar
    const autoSave = useCallback((
        content: string,
        variables: Record<string, string>,
        restaurantId?: string
    ) => {
        const autoSaveVersion: ContractVersion = {
            id: 'autosave',
            name: 'Auto-guardado',
            content,
            timestamp: Date.now(),
            variables,
            restaurantId,
            auto: true
        };

        try {
            localStorage.setItem(`${AUTOSAVE_KEY}_${contractId}`, JSON.stringify(autoSaveVersion));
            setAutoSaveData(autoSaveVersion);
        } catch (e) {
            console.error('Error auto-saving:', e);
        }
    }, [contractId]);

    // Eliminar versión
    const deleteVersion = useCallback((versionId: string) => {
        setVersions(prev => {
            const newVersions = prev.filter(v => v.id !== versionId);
            localStorage.setItem(`${STORAGE_KEY}_${contractId}`, JSON.stringify(newVersions));
            return newVersions;
        });
    }, [contractId]);

    // Comparar dos versiones
    const compareVersions = useCallback((versionA: ContractVersion, versionB: ContractVersion): VersionComparison => {
        const linesA = versionA.content.split('\n');
        const linesB = versionB.content.split('\n');
        
        const comparison: VersionComparison = {
            added: [],
            removed: [],
            modified: []
        };

        const maxLines = Math.max(linesA.length, linesB.length);
        
        for (let i = 0; i < maxLines; i++) {
            const lineA = linesA[i];
            const lineB = linesB[i];
            
            if (lineA === undefined && lineB !== undefined) {
                comparison.added.push(lineB);
            } else if (lineA !== undefined && lineB === undefined) {
                comparison.removed.push(lineA);
            } else if (lineA !== lineB) {
                comparison.modified.push({
                    old: lineA,
                    new: lineB,
                    line: i + 1
                });
            }
        }

        return comparison;
    }, []);

    // Restaurar versión
    const restoreVersion = useCallback((version: ContractVersion) => {
        return {
            content: version.content,
            variables: version.variables,
            restaurantId: version.restaurantId
        };
    }, []);

    // Limpiar auto-save
    const clearAutoSave = useCallback(() => {
        localStorage.removeItem(`${AUTOSAVE_KEY}_${contractId}`);
        setAutoSaveData(null);
    }, [contractId]);

    // Verificar si hay auto-save disponible
    const hasAutoSave = useCallback(() => {
        return autoSaveData !== null;
    }, [autoSaveData]);

    return {
        versions,
        autoSaveData,
        createVersion,
        autoSave,
        deleteVersion,
        compareVersions,
        restoreVersion,
        clearAutoSave,
        hasAutoSave,
        saveVersions
    };
};

export default useContractVersioning;
