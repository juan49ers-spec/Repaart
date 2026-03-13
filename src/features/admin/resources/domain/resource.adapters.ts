import { ResourceItem } from './resource.types';
import { FOLDERS } from './resource.constants';
import { Timestamp } from 'firebase/firestore';

/**
 * Adaptador seguro para estandarizar los datos de documentos Firestore de Recursos.
 * Aplica una política defensiva de defaults para evitar crashes en la UI.
 */
export const adaptToResourceItem = (id: string, data: Record<string, unknown>): ResourceItem => {
    const category = typeof data.category === 'string' ? data.category : 'general';
    const validCategory = FOLDERS.some(f => f.id === category) ? category : 'general';
    
    // Resolve title vs name inconsistency
    const nameStr = typeof data.title === 'string' && data.title 
        ? data.title 
        : (typeof data.name === 'string' && data.name ? data.name : 'Documento sin nombre');

    return {
        id: id,
        name: nameStr,
        title: nameStr,
        category: validCategory,
        size: typeof data.size === 'number' ? data.size : 0,
        type: typeof data.type === 'string' ? data.type : 'application/octet-stream',
        url: typeof data.url === 'string' ? data.url : '',
        storagePath: typeof data.storagePath === 'string' ? data.storagePath : '',
        uploadedBy: typeof data.uploadedBy === 'string' ? data.uploadedBy : 'Admin',
        franchiseId: typeof data.franchiseId === 'string' ? data.franchiseId : undefined,
        status: typeof data.status === 'string' && ['active', 'pending', 'archived'].includes(data.status) 
            ? data.status 
            : 'active',
        isPinned: typeof data.isPinned === 'boolean' ? data.isPinned : false,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        // mock property explicitly checked and handled
        isMock: typeof data.isMock === 'boolean' ? data.isMock : false,
    };
};
