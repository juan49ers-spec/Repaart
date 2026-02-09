import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User, type UserCredential, getIdTokenResult } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { logAction, AUDIT_ACTIONS } from "../lib/audit";

// Cache en memoria para custom claims (reducir fetches del documento users)
let userCache: { uid: string; claims: any; data: any } | null = null;
let cacheExpiry: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Helper para obtener custom claims del token con caching
const getCustomClaims = async (user: User, forceRefresh = false): Promise<any> => {
    if (!user || !user.uid) return null;

    const now = Date.now();

    // Si hay caché válida y no forzamos refresh, usar cache
    if (!forceRefresh && userCache?.uid === user.uid && cacheExpiry && now < cacheExpiry) {
        console.debug("[Auth] Using cached claims for:", user.uid);
        return userCache.claims;
    }

    try {
        // Obtener custom claims del token (es más rápido que fetch del documento)
        const idTokenResult = await getIdTokenResult(user, forceRefresh);
        const claims = idTokenResult.claims;

        // Actualizar cache
        userCache = { uid: user.uid, claims, data: userCache?.data || null };
        cacheExpiry = now + CACHE_DURATION;

        console.debug("[Auth] Custom claims from token:", claims);
        return claims;
    } catch (error) {
        console.error("[Auth] Error getting custom claims:", error);
        return null;
    }
};

// Helper para obtener datos del usuario con caching
const getUserData = async (user: User, forceRefresh = false): Promise<RoleConfig | null> => {
    if (!user || !user.uid) return null;

    // Primero intentar obtener desde custom claims (más rápido)
    const claims = await getCustomClaims(user, forceRefresh);
    if (claims && claims.role && claims.franchiseId) {
        return {
            role: claims.role,
            franchiseId: claims.franchiseId,
            status: claims.status,
            pack: claims.pack
        };
    }

    // Si no hay custom claims, hacer fetch del documento users (fallback)
    try {
        const configRef = doc(db, "users", user.uid);
        const configSnap = await getDoc(configRef);

        let userData: RoleConfig | null = null;

        if (configSnap.exists()) {
            userData = configSnap.data() as RoleConfig;

            // Actualizar cache en memoria
            userCache = {
                uid: user.uid,
                claims: claims || {},
                data: userData
            };
        }

        return userData;
    } catch (error) {
        console.error("[Auth] Error fetching user data:", error);
        return null;
    }
};

// Helper para actualizar custom claims en el token
const updateCustomClaims = async (user: User, claims: Record<string, any>): Promise<void> => {
    try {
        // Actualizar documento users (fuente de verdad)
        await setDoc(doc(db, "users", user.uid), claims, { merge: true });

        // Forzar refresh del token para obtener nuevos custom claims
        await user.getIdToken(true);

        // Invalidar cache local
        userCache = null;
        cacheExpiry = null;

        console.info("[Auth] Custom claims updated and token refreshed");
    } catch (error) {
        console.error("[Auth] Error updating custom claims:", error);
    }
};

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface RoleConfig {
    role?: string;
    franchiseId?: string;
    status?: 'active' | 'pending' | 'banned' | 'deleted';
    pack?: 'basic' | 'premium' | 'admin';
    [key: string]: unknown;
}

export interface AuthUser extends User {
    role?: string;
    franchiseId?: string;
    status?: 'active' | 'pending' | 'banned' | 'deleted';
}

export interface AuthContextType {
    user: AuthUser | null;
    roleConfig: RoleConfig | null;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<UserCredential & { user: AuthUser }>;
    logout: () => Promise<void>;
    assignRole: (
        targetUid: string,
        role: string,
        franchiseId?: string | null,
        targetEmail?: string | null
    ) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    loading: boolean;
    // Impersonation feature
    impersonatedFranchiseId: string | null;
    startImpersonation: (franchiseId: string) => void;
    stopImpersonation: () => void;
    // Force refresh token to get latest custom claims
    forceTokenRefresh: () => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
}

// =====================================================
// CONTEXT
// =====================================================

console.log("[AuthContext] 📁 Module Loaded");

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    console.log("[AuthProvider] 🏗️ Rendering Provider...");
    const [user, setUser] = useState<AuthUser | null>(null);
    const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
    const [loading, setLoading] = useState(true);
    // ✅ NUEVO: Estado calculado para facilitar la vida a los componentes
    const [isAdmin, setIsAdmin] = useState(false);
    // 🎭 IMPERSONATION: Para que el admin vea la app como una franquicia
    const [impersonatedFranchiseId, setImpersonatedFranchiseId] = useState<string | null>(null);

    useEffect(() => {
        console.debug("[Auth] Initializing onAuthStateChanged...");
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    console.debug(`[Auth] User detected: ${currentUser.email}, fetching profile...`);

                    // 🚀 NUEVO: Obtenemos datos CON CACHING de custom claims
                    const userData = await getUserData(currentUser);

                    let finalConfig: RoleConfig | null = null;

                    if (userData) {
                        finalConfig = userData;
                        console.debug("[Auth] Profile loaded with cached claims");
                    } else {
                        console.warn("[Auth] Profile not found in Firestore for UID:", currentUser.uid);
                    }

                    // 🚨 SECURITY: BAN/DELETE VERIFICATION
                    if (!finalConfig || finalConfig.status === 'banned' || finalConfig.status === 'deleted') {
                        const reason = !finalConfig ? 'NOT_FOUND' : (finalConfig.status === 'banned' ? 'BANNED' : 'DELETED');
                        console.error(`[Auth] User is ${reason}. Signing out...`);
                        await signOut(auth);
                        setUser(null);
                        setRoleConfig(null);
                        setIsAdmin(false);
                        return;
                    }

                    setRoleConfig(finalConfig);

                    // 🔥 LA MAGIA: Inyectamos el rol DENTRO del objeto usuario
                    const enhancedUser = currentUser as AuthUser;
                    if (finalConfig) {
                        if (finalConfig.role) enhancedUser.role = finalConfig.role;
                        if (finalConfig.franchiseId) enhancedUser.franchiseId = finalConfig.franchiseId;
                        if (finalConfig.status) enhancedUser.status = finalConfig.status;
                    }

                    // 🚑 SELF-HEALING: Ensure role is NEVER undefined
                    if (!enhancedUser.role) {
                        if (currentUser.email?.includes('rider')) {
                            enhancedUser.role = 'rider';
                        } else {
                            enhancedUser.role = 'user'; // Default safe role
                        }
                    }

                    console.info(`[Auth] Logged in as: ${enhancedUser.email} (${enhancedUser.role})`);

                    // Calculamos si es admin de una vez por todas
                    setIsAdmin(enhancedUser.role === 'admin');

                    // Guardamos el usuario "dopado" con su rol
                    setUser(enhancedUser);

                } else {
                    console.debug("[Auth] No user detected");
                    setUser(null);
                    setRoleConfig(null);
                    setIsAdmin(false);
                }
            } catch (err) {
                console.error("❌ [Auth] Initialization Error:", err);
                setRoleConfig(null);
                setIsAdmin(false);
                setUser(null);
            } finally {
                setLoading(false);
                console.debug("[Auth] Loading finished");
            }
        });
        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        const result = await signInWithEmailAndPassword(auth, email, password);

        // 🚀 NUEVO: Obtenemos datos del usuario CON CACHING de custom claims
        const userData = await getUserData(result.user);

        const enhancedUser = result.user as AuthUser;
        if (userData) {
            enhancedUser.role = userData.role;
            enhancedUser.franchiseId = userData.franchiseId;
            if (userData.status) enhancedUser.status = userData.status;
        }

        // 🚨 SECURITY: Check status immediately after login
        if (!userData || userData.status === 'banned' || userData.status === 'deleted') {
            const reason = !userData ? 'not found' : (userData.status === 'banned' ? 'banned' : 'deleted');
            console.error(`[Auth] User is ${reason}. Logging out...`);
            await signOut(auth);
            throw new Error(`Tu cuenta ${reason === 'not found' ? 'no existe' : (reason === 'banned' ? 'está bloqueada' : 'está eliminada')}. Contacta con soporte.`);
        }

        logAction(result.user, AUDIT_ACTIONS.LOGIN_SUCCESS, { method: 'email_password' });
        return { ...result, user: enhancedUser };
    };

    const logout = async (): Promise<void> => {
        if (user) {
            await logAction(user, AUDIT_ACTIONS.LOGOUT);
        }
        return signOut(auth);
    };

    const assignRole = async (
        targetUid: string,
        role: string,
        franchiseId: string | null = null,
        targetEmail: string | null = null
    ): Promise<void> => {
        // NEW ARCHITECTURE: Single Source of Truth -> 'users'
        const payload: Record<string, unknown> = { role, franchiseId };
        if (targetEmail) payload.email = targetEmail;

        // 🚀 NUEVO: Actualizar documento y custom claims (usando updateCustomClaims)
        await setDoc(doc(db, "users", targetUid), payload, { merge: true });

        if (user && targetUid === user.uid) {
            // 🚀 NUEVO: Actualizar custom claims y forzar refresh del token
            await updateCustomClaims(user, { role, franchiseId });

            const newConfig: RoleConfig = { ...roleConfig, role, franchiseId: franchiseId || undefined };
            setRoleConfig(newConfig);
            // Actualizamos también el helper
            setIsAdmin(role === 'admin');
            // Y el usuario en memoria
            user.role = role;
            user.franchiseId = franchiseId || undefined;
            setUser({ ...user });
        }
    };

    const startImpersonation = (franchiseId: string) => {
        if (!isAdmin) return;
        setImpersonatedFranchiseId(franchiseId);
        if (user) {
            setUser({ ...user, franchiseId, role: 'franchise' });
        }
    };

    const stopImpersonation = () => {
        setImpersonatedFranchiseId(null);
        if (user && roleConfig) {
            setUser({ ...user, franchiseId: roleConfig.franchiseId, role: roleConfig.role });
        }
    };

    const forceTokenRefresh = async () => {
        if (!user) return;

        try {
            console.log("[Auth] Forcing token refresh...");
            // Forzar el refresco del token con forceRefresh=true
            await user.getIdToken(true);

            // Invalidar cache local para forzar una nueva lectura
            userCache = null;
            cacheExpiry = null;

            // Obtener nuevos datos del usuario con claims actualizados
            const userData = await getUserData(user, true);

            if (userData) {
                setRoleConfig(userData);

                const enhancedUser = user as AuthUser;
                if (userData.role) enhancedUser.role = userData.role;
                if (userData.franchiseId) enhancedUser.franchiseId = userData.franchiseId;
                if (userData.status) enhancedUser.status = userData.status;

                setIsAdmin(enhancedUser.role === 'admin');
                setUser({ ...enhancedUser });

                console.log("[Auth] Token refreshed successfully. New role:", userData.role);
            }
        } catch (error) {
            console.error("[Auth] Error forcing token refresh:", error);
        }
    };

    // 📦 EXPORTAMOS EL PAQUETE COMPLETO
    const value: AuthContextType = {
        user,
        roleConfig,
        isAdmin,
        login,
        logout,
        assignRole,
        resetPassword: async (email: string): Promise<void> => {
            const { sendPasswordResetEmail } = await import("firebase/auth");
            return sendPasswordResetEmail(auth, email);
        },
        loading,
        impersonatedFranchiseId,
        startImpersonation,
        stopImpersonation,
        forceTokenRefresh
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white">
                <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
                <p className="text-slate-400 font-medium animate-pulse tracking-wide text-sm">
                    INICIANDO SISTEMA...
                </p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
