import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fleetService } from '../../services/fleetService';
import { Database, Loader2, CheckCircle } from 'lucide-react';

const MOCK_RIDERS = [
    { fullName: 'Marc Márquez', email: 'marc@repaart.es', phone: '600111001', contractHours: 40 },
    { fullName: 'Jorge Martín', email: 'jorge@repaart.es', phone: '600333003', contractHours: 40 },
    { fullName: 'Álvaro Martín', email: 'alvaro@repaart.es', phone: '600444004', contractHours: 40 }
];

const MOCK_MOTOS = [
    { plate: '1111-AAA', model: 'Silence S02', brand: 'Silence', currentKm: 1500, nextRevisionKm: 5000, type: 'vehicle' as const, status: 'active' as const },
    { plate: '2222-BBB', model: 'Niu NQi', brand: 'Niu', currentKm: 4950, nextRevisionKm: 5000, type: 'vehicle' as const, status: 'active' as const }
];

export const Seeder: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const seedData = async () => {
        // PRIORIDAD: Usamos el UID como franchiseId (Modelo Mohamed)
        const fId = user?.uid;
        if (!fId || user?.role !== 'franchise') {
            return alert("Error: Debes estar logueado como FRANQUICIA para ejecutar esto.");
        }

        setLoading(true);
        try {
            // 1. Inyectar Riders
            for (const r of MOCK_RIDERS) {
                try {
                    await fleetService.createRider({
                        ...r,
                        franchiseId: fId, // Vinculación por UID
                        password: 'Password123!',
                        status: 'active'
                    });
                    console.log(`Rider created: ${r.fullName}`);
                } catch (error: any) {
                    if (error.code === 'auth/email-already-in-use' || error.message?.includes('already-in-use')) {
                        console.log(`Rider ${r.email} already exists. Skipping.`);
                    } else {
                        console.error(`Failed to create rider ${r.fullName}:`, error);
                    }
                }
            }

            // 2. Inyectar Motos
            for (const m of MOCK_MOTOS) {
                try {
                    await fleetService.createVehicle(fId, m);
                    console.log(`Moto created: ${m.plate}`);
                } catch (error) {
                    console.error(`Failed to create moto ${m.plate}:`, error);
                    // Continue seeding even if moto fails
                }
            }

            setDone(true);
            setTimeout(() => setDone(false), 3000);
        } catch (error) {
            console.error("Error en Seeding (General):", error);
            alert("Fallo al inyectar datos. Revisa la consola.");
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'franchise' && user?.role !== 'admin') return null;

    return (
        <button
            onClick={seedData}
            disabled={loading}
            className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-2xl z-[9999] flex items-center gap-2 transition-transform active:scale-90"
        >
            {loading ? <Loader2 className="animate-spin" size={24} /> : done ? <CheckCircle size={24} /> : <Database size={24} />}
            <span className="font-bold uppercase tracking-wider">Poblar Datos {user?.displayName ? `(${user.displayName})` : ''}</span>
        </button>
    );
};
