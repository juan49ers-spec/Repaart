import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback
} from "react";
import { Loader2 } from "lucide-react";
import { auth, db, functions } from "../lib/firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User,
    type UserCredential,
    getIdTokenResult
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

// --- TYPES & INTERFACES ---

export type UserRole = 'admin' | 'franchise' | 'rider' | 'user' | 'owner';

export interface RoleConfig {
    role: string;
    franchiseId?: string;
    name?: string;
    status?: 'active' | 'pending' | 'banned' | 'deleted';
    pack?: 'basic' | 'premium' | 'admin';
    permissions?: string[];
}

interface AuthUser extends User {
    role?: string;
    franchiseId?: string;
    status?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    roleConfig: RoleConfig | null;
    loading: boolean;
    isAdmin: boolean;
    login: (email: string, pass: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    assignRole: (uid: string, role: string, franchiseId?: string | null) => Promise<void>;
    forceTokenRefresh: () => Promise<void>;
    impersonatedFranchiseId: string | null;
    startImpersonation: (franchiseId: string) => void;
    stopImpersonation: () => void;
}

// --- CACHE SYSTEM ---
let userCache: { uid: string; claims: Record<string, unknown>; data: RoleConfig } | null = null;
let cacheExpiry: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Helper to get claims with basic memoization
const getCustomClaims = async (user: User, forceRefresh = false): Promise<Record<string, unknown> | null> => {
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

// --- DATA SERVICE (Separation of Concerns) ---
/**
 * Refined logic: 
 * - Authority (role/franchiseId) comes from CUSTOM CLAIMS (SSoT)
 * - Profile/Meta (status, name, pack) comes from FIRESTORE
 */
const getUserData = async (user: User, forceRefresh = false): Promise<RoleConfig | null> => {
    if (!user?.uid) return null;

    const claims = await getCustomClaims(user, forceRefresh);
    let firestoreData: Partial<RoleConfig> | null = null;

    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            firestoreData = docSnap.data() as Partial<RoleConfig>;
        }
    } catch (e) {
        console.error("[Auth] Firestore fetch error:", e);
    }

    // If we have claims, we override the sensitive governance fields
    if (claims && claims.role) {
        const merged: RoleConfig = {
            status: 'active', // Default
            ...firestoreData,
            role: (claims.role as string),
            franchiseId: (claims.franchiseId as string) || (firestoreData?.franchiseId),
        };

        // Cache for 5 minutes
        userCache = {
            uid: user.uid,
            claims,
            data: merged
        };
        cacheExpiry = Date.now() + CACHE_DURATION;

        return merged;
    }

    // Fallback if claims aren't ready but Firestore is present (might happen during registration)
    if (firestoreData) {
        return firestoreData as RoleConfig;
    }

    return null;
};

// --- CONTEXT ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [impersonatedFranchiseId, setImpersonatedFranchiseId] = useState<string | null>(null);

    // --- REFRESH LOGIC ---
    const forceTokenRefresh = useCallback(async () => {
        if (!user) return;
        try {
            console.log("[Auth] Forcing token refresh...");
            await getIdTokenResult(user, true); // Firebase forces refresh of the underlying JWT

            // Clear local cache for fresh fetch
            userCache = null;
            cacheExpiry = null;

            const newData = await getUserData(user, true);
            if (newData) {
                setRoleConfig(newData);
                setIsAdmin(newData.role === 'admin');
                setUser(prev => prev ? ({ ...prev, role: newData.role, franchiseId: newData.franchiseId }) : null);
                console.log("[Auth] Global state synced with fresh claims.");
            }
        } catch (e) {
            console.error("[Auth] Token refresh failure:", e);
        }
    }, [user]);

    // --- MUTATION (The Secure Way) ---
    const assignRole = useCallback(async (
        targetUid: string,
        role: string,
        franchiseId: string | null = null
    ): Promise<void> => {
        try {
            console.log(`[Auth] Assigning role '${role}' to ${targetUid} via Cloud Function...`);

            // SSoT: Calling the secure Cloud Function with naming alignment
            const setRoleFn = httpsCallable(functions, "setRole");
            await setRoleFn({
                targetUid,
                newRole: role, // Aligned with callable expectation
                franchiseId
            });

            // If the target is the current user (e.g. self-promotion or self-demotion), refresh local state
            if (user && targetUid === user.uid) {
                console.log("[Auth] Self-update detected. Re-validating claims...");
                await forceTokenRefresh();
            }
        } catch (error) {
            console.error("[Auth] Error in assignRole (Cloud Function):", error);
            throw error;
        }
    }, [user, forceTokenRefresh]);

    // --- IMPERSONATION ---
    const startImpersonation = useCallback((franchiseId: string) => {
        if (!isAdmin) return;
        setImpersonatedFranchiseId(franchiseId);
        if (user) {
            setUser({ ...user, franchiseId, role: 'franchise' });
        }
    }, [isAdmin, user]);

    const stopImpersonation = useCallback(() => {
        setImpersonatedFranchiseId(null);
        if (user && roleConfig) {
            setUser({ ...user, franchiseId: roleConfig.franchiseId, role: roleConfig.role });
        }
    }, [user, roleConfig]);

    // --- AUTH LISTENER ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    const data = await getUserData(firebaseUser);
                    if (data) {
                        const enhancedUser = firebaseUser as AuthUser;
                        enhancedUser.role = data.role;
                        enhancedUser.franchiseId = data.franchiseId;
                        enhancedUser.status = data.status;

                        setRoleConfig(data);
                        setIsAdmin(data.role === 'admin');
                        setUser(enhancedUser);
                    } else {
                        setUser(firebaseUser as AuthUser);
                    }
                } else {
                    setUser(null);
                    setRoleConfig(null);
                    setIsAdmin(false);
                    userCache = null;
                }
            } catch (error) {
                console.error("[Auth] Listener error:", error);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- CORE METHODS ---
    const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
    const logout = () => signOut(auth);

    // --- SESSION HEARTBEAT ---
    const [sessionId, setSessionId] = useState<string | null>(null);
    useEffect(() => {
        const stored = sessionStorage.getItem('repaart_session_id');
        if (stored) setSessionId(stored);
        else {
            const sid = crypto.randomUUID();
            sessionStorage.setItem('repaart_session_id', sid);
            setSessionId(sid);
        }
    }, []);

    useEffect(() => {
        if (!user || !sessionId) return;
        const interval = setInterval(async () => {
            try {
                const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);
                await setDoc(sessionRef, {
                    lastActive: serverTimestamp(),
                    userAgent: navigator.userAgent
                }, { merge: true });
            } catch (e) {
                console.warn("[Auth] Heartbeat error:", e);
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [user, sessionId]);

    const value = {
        user, roleConfig, loading, isAdmin,
        login, logout, assignRole, forceTokenRefresh,
        impersonatedFranchiseId, startImpersonation, stopImpersonation
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="h-screen flex items-center justify-center bg-slate-50">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};