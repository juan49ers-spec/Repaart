import { ResourceItem, SortMode } from './resource.types';
import { FOLDERS, MAX_STORAGE_BYTES } from './resource.constants';

export const calculateStorageStats = (resources: ResourceItem[]) => {
    const totalBytes = resources.reduce((acc, r) => acc + (r.size || 0), 0);
    const percentage = Math.min((totalBytes / MAX_STORAGE_BYTES) * 100, 100);
    
    const formatStorage = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
        if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    };

    return { 
        totalBytes, 
        maxBytes: MAX_STORAGE_BYTES, 
        percentage, 
        formatted: formatStorage(totalBytes) 
    };
};

export const calculateFolderCounts = (resources: ResourceItem[]) => {
    const counts: Record<string, number> = {};
    for (const folder of FOLDERS) {
        counts[folder.id] = resources.filter(r => (r.category || 'general') === folder.id).length;
    }
    return counts;
};

export const filterAndSortResources = (
    resources: ResourceItem[],
    activeCategory: string,
    searchTerm: string,
    sortMode: SortMode
): ResourceItem[] => {
    return resources.filter(r => {
        // 1. Category Filter
        if (activeCategory && (r.category || 'general') !== activeCategory) {
            return false;
        }
        // 2. Search Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            if (!(r.title || r.name || '').toLowerCase().includes(lower)) {
                return false;
            }
        }
        return true;
    }).sort((a, b) => {
        // 3. Sort (Pinned first, then by sortMode)
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        switch (sortMode) {
            case 'newest': {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            }
            case 'oldest': {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return aTime - bTime;
            }
            case 'name_asc':
                return (a.title || a.name || '').localeCompare(b.title || b.name || '');
            case 'name_desc':
                return (b.title || b.name || '').localeCompare(a.title || a.name || '');
            case 'size_desc':
                return (b.size || 0) - (a.size || 0);
            case 'size_asc':
                return (a.size || 0) - (b.size || 0);
            default:
                return 0;
        }
    });
};
