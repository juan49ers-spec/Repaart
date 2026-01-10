import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
    User,
    UserSchema,
    CreateUserInput,
    UserId,
    UserRole
} from '../../schemas/users';
import { FranchiseId } from '../../schemas/scheduler';

const COLLECTION_NAME = 'users';

export const UserService = {
    /**
     * Subscribe to users, optionally filtered by franchise and role.
     * Validates data with Zod schema.
     */
    subscribeToUsers(
        franchiseId: FranchiseId | undefined,
        role: UserRole | undefined,
        callback: (users: User[]) => void
    ): () => void {
        let q = query(collection(db, COLLECTION_NAME));

        if (franchiseId) {
            q = query(q, where('franchiseId', '==', franchiseId));
        }

        if (role) {
            q = query(q, where('role', '==', role));
        }

        return onSnapshot(q, (snap) => {
            const users = snap.docs.map(d => {
                try {
                    const data = d.data();
                    return UserSchema.parse({
                        ...data,
                        uid: d.id, // Ensure UID matches doc ID
                        id: d.id
                    });
                } catch (e) {
                    console.error(`[UserService] Invalid user data for ${d.id}`, e);
                    return null;
                }
            }).filter((u): u is User => u !== null);

            callback(users);
        });
    },

    /**
     * Fetch available riders (role=driver) for a franchise.
     */
    async getAvailableRiders(franchiseId: FranchiseId): Promise<User[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('franchiseId', '==', franchiseId),
            where('role', '==', 'driver'),
            where('status', '==', 'active')
        );

        const snap = await getDocs(q);
        return snap.docs.map(d => {
            try {
                return UserSchema.parse({ ...d.data(), uid: d.id, id: d.id });
            } catch {
                return null;
            }
        }).filter((u): u is User => u !== null);
    },

    /**
     * Create a new user doc in Firestore (Note: Auth creation is handled separately/cloud function usually)
     * This puts the user metadata in the DB.
     */
    async createUser(uid: UserId, data: CreateUserInput): Promise<User> {
        const ref = doc(db, COLLECTION_NAME, uid);

        const timestamp = new Date().toISOString();
        const userPayload = {
            ...data,
            uid,
            id: uid,
            createdAt: timestamp,
            status: 'active'
        };

        const validated = UserSchema.parse(userPayload);

        // We cast to any because Zod types vs Firestore types can differ slightly (dates)
        // essentially we trust Zod validation passed.
        await setDoc(ref, validated);

        return validated;
    },

    /**
     * Update user details safely.
     */
    async updateUser(uid: UserId, data: Partial<User>): Promise<void> {
        const ref = doc(db, COLLECTION_NAME, uid);
        // Validating partials is tricky with Zod pure strict, but we can do a partial parse if needed.
        // For now, simpler to just update.
        await updateDoc(ref, data);
    }
};
