import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { WeekService } from '../../../services/scheduler/weekService';
import { WeekData, toFranchiseId, toWeekId } from '../../../schemas/scheduler';

const SeedWeeks: React.FC = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState('idle');

    const handleSeed = async () => {
        const franchiseId = user?.uid;
        if (!franchiseId) {
            setStatus('Error: No franchise ID');
            return;
        }

        setStatus('Seeding...');

        // 1. Define the 2025_42 sample data
        const weekIdStr = "2025_42";
        const sampleData: WeekData = {
            id: weekIdStr,
            startDate: "2025-10-13",
            endDate: "2025-10-19",
            status: "published",
            metrics: {
                totalHours: 140,
                activeRiders: 12,
                motosInUse: 8
            },
            shifts: [
                {
                    shiftId: "uuid_generado_1",
                    id: "uuid_generado_1",
                    riderId: "rider_abc123",
                    riderName: "Carlos Ruiz",
                    // Use ISO Strings strict format
                    startAt: "2025-10-13T19:00:00.000Z",
                    endAt: "2025-10-13T23:00:00.000Z",
                    motoId: "moto_zx99",
                    motoPlate: "1234-XYZ",
                    notes: "Turno seeding"
                },
                {
                    shiftId: "uuid_generado_2",
                    id: "uuid_generado_2",
                    riderId: "rider_xyz789",
                    riderName: "Ana Gómez",
                    startAt: "2025-10-13T22:00:00.000Z",
                    endAt: "2025-10-14T02:00:00.000Z",
                    notes: "Turno cross-midnight"
                }
            ]
        };

        try {
            await WeekService.saveWeek(toFranchiseId(franchiseId), toWeekId(weekIdStr), sampleData);
            setStatus(`Success! Week ${weekIdStr} seeded.`);
        } catch (e: any) {
            console.error(e);
            setStatus('Error: ' + e.message);
        }
    };

    return (
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 my-4">
            <h3 className="text-white font-bold mb-2">Dev Tools: Seeder</h3>
            <button
                onClick={handleSeed}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors"
            >
                Inyectar Semana 2025_42
            </button>
            <p className="text-slate-400 mt-2 text-sm">{status}</p>
        </div>
    );
};

export default SeedWeeks;
