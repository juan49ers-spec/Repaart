import { Timestamp } from 'firebase/firestore';

export interface ResourceItem {
    id: string;
    title?: string;
    name?: string;
    category?: string;
    type?: string;
    size?: number;
    url?: string;
    storagePath?: string;
    createdAt?: Timestamp;
    isPinned?: boolean;
    isMock?: boolean;
    [key: string]: unknown;
}

export type SortMode = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';
export type ViewMode = 'list' | 'grid';
export type ActiveTab = 'vault' | 'guides' | 'requests' | 'services';
