import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { logAction, AUDIT_ACTIONS } from "../lib/audit";

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface RoleConfig {
    role?: string;
    franchiseId?: string;
    status?: 'active' | 'pending' | 'banned';
    pack?: 'basic' | 'premium' | 'admin';
    [key: string]: unknown;
}

export interface AuthUser extends User {
    role?: string;
    franchiseId?: string;
}

export interface AuthContextType {
    user: AuthUser | null;
    roleConfig: RoleConfig | null;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
    assignRole: (
        targetUid: string,
        role: string,
        franchiseId?: string | null,
        targetEmail?: string | null
    ) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    loading: boolean;
}

interface AuthProviderProps {
    children: ReactNode;
}

// =====================================================
// CONTEXT
// =====================================================

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
    const [user, setUser] = useState<AuthUser | null>(null);
    const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
    const [loading, setLoading] = useState(true);
    // ✅ NUEVO: Estado calculado para facilitar la vida a los componentes
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (typeof getDoc !== 'function') console.error("CRITICAL: getDoc is not a function");
            try {
                if (currentUser) {
                    // 1. Obtener la configuración real de la DB (NEW ARCHITECTURE: 'users')
                    const configRef = doc(db, "users", currentUser.uid);
                    const configSnap = await getDoc(configRef);

                    let finalConfig: RoleConfig | null = null;

                    if (configSnap.exists()) {
                        finalConfig = configSnap.data() as RoleConfig;
                    }

                    // 🚨 SECURITY: BAN VERIFICATION
                    if (finalConfig && finalConfig.status === 'banned') {
                        await signOut(auth);
                        setUser(null);
                        return;
                    }

                    setRoleConfig(finalConfig);

                    // 🔥 LA MAGIA: Inyectamos el rol DENTRO del objeto usuario
                    const enhancedUser = currentUser as AuthUser;
                    if (finalConfig) {
                        if (finalConfig.role) enhancedUser.role = finalConfig.role;
                        if (finalConfig.franchiseId) enhancedUser.franchiseId = finalConfig.franchiseId;
                    }

                    // Calculamos si es admin de una vez por todas
                    setIsAdmin(finalConfig?.role === 'admin' || currentUser.email === 'hola@repaart.es');

                    // Guardamos el usuario "dopado" con su rol
                    setUser(enhancedUser);

                } else {
                    setUser(null);
                    setRoleConfig(null);
                    setIsAdmin(false);
                }
            } catch (err) {
                console.error("Auth Initialization Error:", err);
                setRoleConfig(null);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        logAction(result.user, AUDIT_ACTIONS.LOGIN_SUCCESS, { method: 'email_password' });
        return result;
    };

    const logout = async (): Promise<void> => {
        if (user) {
            logAction(user, AUDIT_ACTIONS.LOGOUT);
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

        // Escribimos directamente en 'users' (identity + access)
        await setDoc(doc(db, "users", targetUid), payload, { merge: true });

        if (user && targetUid === user.uid) {
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

    // 📦 EXPORTAMOS EL PAQUETE COMPLETO
    const value: AuthContextType = {
        user,           // El usuario (ahora con .role inyectado)
        roleConfig,     // La config pura
        isAdmin,        // ✅ El booleano mágico para abrir puertas
        login,
        logout,
        assignRole,
        resetPassword: async (email: string): Promise<void> => {
            const { sendPasswordResetEmail } = await import("firebase/auth");
            return sendPasswordResetEmail(auth, email);
        },
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
