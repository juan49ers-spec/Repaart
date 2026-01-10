/**
 * Franchise Domain Types
 */

export interface FranchiseMetadata {
    id: string;
    name: string;
    code?: string;
    manager?: string;
    location?: string;
    status?: string;
    [key: string]: any;
}

/**
 * Discriminated union of all possible franchise errors
 * Each error type carries specific context for debugging and UX
 */
export type FranchiseError =
    | { type: 'NOT_FOUND'; franchiseId: string }
    | { type: 'PERMISSION_DENIED'; franchiseId: string }
    | { type: 'NETWORK_ERROR'; cause: Error };
