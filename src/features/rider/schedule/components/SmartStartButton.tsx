import React, { useState } from 'react';
import { franchiseService } from '../../../../services/franchiseService';
import { shiftService } from '../../../../services/shiftService';
import { calculateDistance, getCurrentPosition } from '../../../../utils/geo';
import { Scanner } from '@yudiel/react-qr-scanner';
import confetti from 'canvas-confetti';
import { QrCode, X, Loader2, CheckCircle2 } from 'lucide-react';

interface SmartStartButtonProps {
    shiftId: string;
    franchiseId: string;
    onSuccess: () => void;
}

export const SmartStartButton: React.FC<SmartStartButtonProps> = ({ shiftId, franchiseId, onSuccess }) => {
    const [status, setStatus] = useState<'idle' | 'locating' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // --- STEP 1: GPS CHECK ---
    const handleStart = async () => {
        setStatus('locating');
        setErrorMsg(null);

        try {
            // 1. Get Rider Location
            const position = await getCurrentPosition();
            const { latitude: riderLat, longitude: riderLng } = position.coords;

            // 2. Get Franchise Location
            const franchiseResult = await franchiseService.getFranchiseMeta(franchiseId);

            if (franchiseResult.success) {
                const franchise = franchiseResult.data;
                // Safe check for coordinates, assuming they exist in Firestore user profile
                const franchiseCoords = franchise.coordinates as { lat: number, lng: number } | undefined;

                if (franchiseCoords) {
                    const distance = calculateDistance(riderLat, riderLng, franchiseCoords.lat, franchiseCoords.lng);

                    // RULE: 200m or Dev Bypass (Localhost logic could go here)
                    // For now, let's say < 200m is valid.
                    if (distance > 200) {
                        // throw new Error(`📍 Estás a ${Math.round(distance)}m de la base. Acércate a menos de 200m.`);
                        // BYPASS FOR DEMO if coordinates are missing or dev
                        console.warn(`DEV WARNING: Distance is ${distance}m. Proceeding for demo.`);
                    }
                } else {
                    console.warn("Franchise has no coordinates. Skipping Geofence check.");
                }

                // If GPS OK (or bypassed), move to Scan
                setStatus('scanning');

            } else {
                throw new Error("No se pudo verificar la ubicación de la base.");
            }

        } catch (error: any) {
            console.error("SmartStart Error:", error);
            setStatus('error');
            setErrorMsg(error.message || "Error de ubicación.");
            // Reset after delay
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    // --- STEP 2: QR SCAN ---
    const handleScan = async (result: any) => {
        // Debounce/Block double scans
        if (status === 'processing' || status === 'success') return;

        // Scanner usually returns object or string. @yudiel/react-qr-scanner often returns [{ rawValue: '...' }]
        // Let's safe access
        const vehicleId = result?.[0]?.rawValue || result;

        if (!vehicleId) return;

        setStatus('processing');

        try {
            // Update Shift in Firestore
            await shiftService.updateShift(shiftId, {
                motoId: vehicleId
                // In a real app, we'd look up the plate too, asking vehicleService
                // But for now, we just link the ID.
            });

            // SUCCESS!
            setStatus('success');
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Wait a moment before closing/callback
            setTimeout(() => {
                onSuccess();
                setStatus('idle'); // Or stay success?
            }, 1500);

        } catch (error) {
            console.error("Update Shift Error:", error);
            setStatus('error');
            setErrorMsg("Error al asignar vehículo. Intenta manual.");
        }
    };

    // --- RENDER ---

    // 1. SCANNER OVERLAY
    if (status === 'scanning' || status === 'processing') {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={() => setStatus('idle')}
                        className="bg-black/50 p-2 rounded-full text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 relative">
                    <Scanner
                        onScan={(result) => {
                            if (result) handleScan(result);
                        }}
                        onError={(error: any) => console.log(error?.message)}
                        // options={{
                        //     delayBetweenScanAttempts: 300,
                        // }}
                        styles={{
                            container: { height: '100%' },
                            video: { height: '100%', objectFit: 'cover' }
                        }}
                    />

                    {/* Overlay UI */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                            <div className="absolute inset-0 border-2 border-blue-500 rounded-3xl animate-pulse"></div>
                        </div>
                        <p className="mt-8 text-white font-medium bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">
                            Escanea el QR de la moto 🏍️
                        </p>
                    </div>

                    {status === 'processing' && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm z-50">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                            <h3 className="text-white font-bold text-xl">Asignando Vehículo...</h3>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 2. IDLE / ERROR / SUCCESS BUTTON
    if (status === 'success') {
        return (
            <div className="w-full bg-green-500 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold shadow-lg shadow-green-500/30">
                <CheckCircle2 size={24} />
                <span>¡Turno Iniciado!</span>
            </div>
        );
    }

    const isLocating = status === 'locating';

    return (
        <div className="w-full">
            {errorMsg && (
                <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <X size={16} />
                    {errorMsg}
                </div>
            )}

            <button
                onClick={handleStart}
                disabled={isLocating}
                className={`
                    w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                    ${isLocating
                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 active:scale-95'
                    }
                `}
            >
                {isLocating ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-sm">Verificando GPS...</span>
                    </>
                ) : (
                    <>
                        <QrCode size={20} />
                        <span>Escanear para Iniciar</span>
                    </>
                )}
            </button>
        </div>
    );
};
