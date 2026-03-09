import { User, getIdTokenResult } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { RoleConfig } from "./AuthContextCore";

// --- CACHE SYSTEM ---
let userCache: { uid: string; claims: Record<string, unknown>; data: RoleConfig } | null = null;
let cacheExpiry: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

export const getCustomClaims = async (user: User, forceRefresh = false): Promise<Record<string, unknown> | null> => {
    if (!user?.uid) return null;
    const now = Date.now();
    if (!forceRefresh && userCache && userCache.uid === user.uid && cacheExpiry && now < cacheExpiry) {
        return userCache.claims;
    }
    try {
        const tokenResult = await getIdTokenResult(user, forceRefresh);
        return tokenResult.claims;
    } catch (e) {
        console.error("[Auth] Error getting custom claims:", e);
        return null;
    }
};

export const getUserData = async (user: User, forceRefresh = false): Promise<RoleConfig | null> => {
    if (!user?.uid) return null;
    const claims = await getCustomClaims(user, forceRefresh);
    let firestoreData: Partial<RoleConfig> | null = null;
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            firestoreData = docSnap.data() as RoleConfig;
        }
    } catch (e) {
        console.error("[Auth] Error fetching user metadata:", e);
    }
    const roleConfig: RoleConfig = {
        role: (claims?.role as string) || (firestoreData?.role as string) || 'user',
        franchiseId: (claims?.franchiseId as string) || (firestoreData?.franchiseId as string) || undefined,
        status: firestoreData?.status || 'active',
        name: firestoreData?.name || '',
        pack: firestoreData?.pack || 'basic',
        permissions: (claims?.permissions as string[]) || (firestoreData?.permissions as string[]) || []
    };
    userCache = { uid: user.uid, claims: claims || {}, data: roleConfig };
    cacheExpiry = Date.now() + CACHE_DURATION;
    return roleConfig;
};

export const clearAuthCache = () => {
    userCache = null;
    cacheExpiry = null;
};
