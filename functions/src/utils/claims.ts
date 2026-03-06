export type UserRole = 'admin' | 'franchise' | 'rider' | 'user';
export type UserStatus = 'active' | 'pending' | 'banned' | 'deleted';

export interface BaseClaims {
    role: UserRole;
    status: UserStatus;
    franchiseId?: string;
}

/**
 * Builds a strict set of Custom Claims to avoid legacy pollution and pises.
 * Explicitly manages which claims are allowed and required.
 */
export function buildClaims(params: {
    role: UserRole;
    status: UserStatus;
    franchiseId?: string | null;
}): BaseClaims {
    const claims: BaseClaims = {
        role: params.role,
        status: params.status || 'active'
    };

    // Only allowed franchiseId for franchise and rider roles
    if (params.role === 'franchise' || params.role === 'rider') {
        if (!params.franchiseId || params.franchiseId.trim() === '') {
            throw new Error(`franchiseId is required for role ${params.role}`);
        }
        claims.franchiseId = params.franchiseId;
    }

    // Ensure no other keys are present
    return claims;
}
