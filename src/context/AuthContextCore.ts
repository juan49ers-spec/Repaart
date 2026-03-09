import {
    createContext,
    useContext
} from "react";
import { User, type UserCredential } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

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

export interface AuthUser extends User {
    role?: string;
    franchiseId?: string;
    status?: 'active' | 'pending' | 'banned' | 'deleted';
    pack?: 'basic' | 'premium' | 'admin';
}

export interface UserSession {
    sessionId: string;
    userId: string;
    lastActive: Timestamp | Date | null | unknown;
    userAgent: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export interface AuthContextType {
    user: AuthUser | null;
    roleConfig: RoleConfig | null;
    loading: boolean;
    isAdmin: boolean;
    login: (email: string, pass: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    assignRole: (uid: string, role: string, franchiseId?: string | null) => Promise<void>;
    forceTokenRefresh: () => Promise<void>;
    impersonatedFranchiseId: string | null;
    startImpersonation: (franchiseId: string) => void;
    stopImpersonation: () => void;
    sessionId: string | null;
    updateUser: (uid: string, data: Partial<AuthUser>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
