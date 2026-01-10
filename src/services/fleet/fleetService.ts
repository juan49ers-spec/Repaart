import { db } from '../../lib/firebase';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import {
    Moto,
    MotoSchema,
    CreateMotoInput,
    toMotoId
} from '../../schemas/fleet';
import { FranchiseId } from '../../schemas/scheduler';

export const FleetService = {

    /**
     * Creates a new Moto.
     * @param franchiseId The franchise owning the moto.
     * @param data The moto data (without ID).
     * @returns The created Moto object.
     */
    async createMoto(franchiseId: FranchiseId, data: CreateMotoInput): Promise<Moto> {
        // Generate a new ID (could use uuid, but random string is fine for now if consisten)
        // using Firestore auto-id style usually better, but keeping consistency with schema
        const newRef = doc(collection(db, 'fleet_assets'));
        const motoId = toMotoId(newRef.id);

        const newMoto: Moto = {
            id: motoId,
            franchiseId,
            createAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data,
            status: 'active' as const
        } as unknown as Moto;

        // Validate before write
        const validated = MotoSchema.parse({
            ...newMoto,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await setDoc(newRef, validated);
        return validated;
    },

    /**
     * Subscribe to active motos for a franchise.
     */
    subscribeToMotos(franchiseId: FranchiseId, callback: (motos: Moto[]) => void): () => void {
        const q = query(
            collection(db, 'fleet_assets'),
            where('franchiseId', '==', franchiseId),
            // OPTIMIZATION: Use 'in' instead of '!=' to avoid custom index requirement for simple exclusion
            where('status', 'in', ['active', 'maintenance', 'out_of_service'])
        );

        return onSnapshot(q, (snap) => {
            const motos = snap.docs.map(d => {
                try {
                    return MotoSchema.parse(d.data());
                } catch (e) {
                    console.error(`[FleetService] Invalid moto data for ${d.id}`, e);
                    return null;
                }
            }).filter((m): m is Moto => m !== null);

            callback(motos);
        });
    },

    /**
     * Update moto details.
     */
    async updateMoto(motoId: string, data: Partial<Moto>): Promise<void> {
        const ref = doc(db, 'fleet_assets', motoId);
        // We can't easily validate Partial with Zod Schema.partial() without strictness loss
        // But we rely on TS + partial validation if needed.
        await updateDoc(ref, {
            ...data,
            updatedAt: new Date().toISOString()
        });
    }
};
