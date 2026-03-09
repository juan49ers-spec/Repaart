import {
    useState,
    useEffect,
    ReactNode
} from "react";
import { Loader2 } from "lucide-react";
import { auth, db } from "../lib/firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
    AuthContext,
    AuthUser,
    RoleConfig,
    AuthContextType,
    UserSession,
    UserRole,
    useAuth
} from "./AuthContextCore";
import { getUserData, clearAuthCache } from "./AuthServices";

export {
    AuthContext,
    useAuth
};
export type {
    AuthUser,
    RoleConfig,
    AuthContextType,
    UserSession,
    UserRole
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [impersonatedFranchiseId, setImpersonatedFranchiseId] = useState<string | null>(null);

    const forceTokenRefresh = async () => {
        if (auth.currentUser) {
            const data = await getUserData(auth.currentUser, true);
            if (data) {
                setRoleConfig(data);
                setIsAdmin(data.role === 'admin');
            }
        }
    };

    const startImpersonation = (franchiseId: string) => {
        if (isAdmin) setImpersonatedFranchiseId(franchiseId);
    };

    const stopImpersonation = () => setImpersonatedFranchiseId(null);

    const assignRole = async (_uid: string, _role: string, _franchiseId?: string | null) => {
        // Implementation omitted for brevity as it's likely a cloud function call
        console.warn("[Auth] assignRole is not implemented in the client");
    };

    const updateUser = async (uid: string, data: Partial<AuthUser>) => {
        try {
            const userRef = doc(db, "users", uid);
            await setDoc(userRef, {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });

            // If updating current user, refresh
            if (uid === user?.uid) {
                await forceTokenRefresh();
            }
        } catch (e) {
            console.error("[Auth] Error updating user:", e);
            throw e;
        }
    };


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const data = await getUserData(firebaseUser);
                if (data) {
                    const authUser = firebaseUser as AuthUser;
                    authUser.role = data.role;
                    authUser.franchiseId = data.franchiseId;
                    authUser.status = data.status;
                    setUser(authUser);
                    setRoleConfig(data);
                    setIsAdmin(data.role === 'admin');
                }
            } else {
                setUser(null);
                setRoleConfig(null);
                setIsAdmin(false);
                clearAuthCache();
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
    const logout = () => signOut(auth);
    const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

    const [sessionId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        const stored = sessionStorage.getItem('repaart_session_id');
        if (stored) return stored;
        const sid = crypto.randomUUID();
        sessionStorage.setItem('repaart_session_id', sid);
        return sid;
    });

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

    const value: AuthContextType = {
        user, roleConfig, loading, isAdmin,
        login, logout, resetPassword, assignRole, forceTokenRefresh,
        impersonatedFranchiseId, startImpersonation, stopImpersonation,
        sessionId, updateUser
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

export default AuthProvider;
