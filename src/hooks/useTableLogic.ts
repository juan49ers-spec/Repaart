import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface SortConfig<T> {
    key: keyof T | string;
    direction: 'asc' | 'desc';
}

export interface TableLogicOptions<T> {
    itemsPerPage?: number;
    initialSort?: SortConfig<T>;
    searchableFields?: (keyof T)[];
}

export interface UseTableLogicReturn<T> {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    sortConfig: SortConfig<T>;
    handleSort: (key: keyof T | string) => void;
    selectedIds: Set<string>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    toggleSelection: (id: string) => void;
    toggleAll: () => void;
    processedData: T[];
    paginatedData: T[];
    totalItems: number;
}

/**
 * Enterprise Table Logic Hook
 * - Synchronizes state with URL Query Params (Deep Linking)
 * - Implements Targeted Search (specific fields only)
 */
export const useTableLogic = <T extends { id: string | number } & Record<string, any>>(
    data: T[],
    {
        itemsPerPage = 8,
        initialSort = { key: 'month', direction: 'desc' },
        searchableFields = ['month'] // Default safe search
    }: TableLogicOptions<T> = {}
): UseTableLogicReturn<T> => {

    // 1. URL State Manager
    const [searchParams, setSearchParams] = useSearchParams();

    // 2. Read State from URL (Source of Truth)
    const searchTerm = searchParams.get('q') || '';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const sortKey = searchParams.get('sortKey') || initialSort.key as string;
    const sortDir = (searchParams.get('sortDir') as 'asc' | 'desc') || initialSort.direction;

    // Local state for ephemeral UI (Selection doesn't belong in URL usually)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // 3. Smart Processors
    const processedData = useMemo(() => {
        let processed = [...data];

        // Surgical Search 🧠
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            processed = processed.filter(item =>
                searchableFields.some(field => {
                    const value = item[field];
                    // Safety check + String conversion
                    return value != null && String(value).toLowerCase().includes(lowerTerm);
                })
            );
        }

        // Sort
        if (sortKey) {
            processed.sort((a, b) => {
                const aVal = a[sortKey];
                const bVal = b[sortKey];

                if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return processed;
    }, [data, searchTerm, sortKey, sortDir, searchableFields]);

    // Pagination
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedData.slice(startIndex, startIndex + itemsPerPage);
    }, [processedData, currentPage, itemsPerPage]);

    // 4. URL Updaters (Handlers)
    const updateSearchTerm = (term: string) => {
        setSearchParams(prev => {
            if (term) prev.set('q', term);
            else prev.delete('q');
            prev.set('page', '1'); // Reset pagination on search
            // Preserve sort
            return prev;
        });
    };

    const updateCurrentPage = (page: number) => {
        setSearchParams(prev => {
            prev.set('page', page.toString());
            return prev;
        });
    };

    const handleSort = useCallback((key: keyof T | string) => {
        setSearchParams(prev => {
            const currentKey = prev.get('sortKey') || initialSort.key as string;
            const currentDir = prev.get('sortDir') || initialSort.direction;

            let newDir = 'asc';
            if (currentKey === (key as string) && currentDir === 'asc') newDir = 'desc';

            prev.set('sortKey', key as string);
            prev.set('sortDir', newDir);
            return prev;
        });
    }, [initialSort, setSearchParams]);

    // Selection Handlers (Same as before)
    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        // Safe to use string template for id if it's number
        const pageIds = paginatedData.map(d => `${d.id}`);
        const allSelected = pageIds.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allSelected) pageIds.forEach(id => next.delete(id));
            else pageIds.forEach(id => next.add(id));
            return next;
        });
    }, [paginatedData, selectedIds]);

    return {
        searchTerm, setSearchTerm: updateSearchTerm,
        currentPage, setCurrentPage: updateCurrentPage,
        sortConfig: { key: sortKey, direction: sortDir },
        handleSort,
        selectedIds, setSelectedIds, toggleSelection, toggleAll,
        processedData, paginatedData,
        totalItems: processedData.length
    };
};
