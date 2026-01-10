import React, { useState } from 'react';
import { X, Zap, User, Truck, Sun, Moon, Split } from 'lucide-react';

interface Rider {
    id: string;
    name?: string;
    email?: string;
}

interface Moto {
    id: string;
    licensePlate: string;
    model: string;
}

interface WeekDay {
    isoDate: string;
    shortLabel: string;
}

interface Shift {
    riderId: string;
    riderName: string;
    motoId: string | null;
    motoPlate: string | null;
    startAt: string;
    endAt: string;
    date: string;
    startTime: string;
    endTime: string;
}

interface QuickFillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateShifts: (shifts: Shift[]) => void;
    riders: Rider[];
    motos: Moto[];
    weekDays: WeekDay[];
}

type PresetType = 'custom' | 'comida' | 'cena' | 'partido';

const QuickFillModal: React.FC<QuickFillModalProps> = ({ isOpen, onClose, onCreateShifts, riders, motos, weekDays }) => {
    // Estado local del formulario
    const [selectedRiderId, setSelectedRiderId] = useState('');
    const [selectedMotoId, setSelectedMotoId] = useState('');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    // Preset State
    const [activePreset, setActivePreset] = useState<PresetType>('custom');

    // Horas (Editable if custom)
    const [startHour, setStartHour] = useState('12');
    const [endHour, setEndHour] = useState('16');

    if (!isOpen) return null;

    const toggleDay = (isoDate: string) => {
        setSelectedDays(prev =>
            prev.includes(isoDate) ? prev.filter(d => d !== isoDate) : [...prev, isoDate]
        );
    };

    const applyPreset = (preset: PresetType) => {
        setActivePreset(preset);
        if (preset === 'comida') {
            setStartHour('12');
            setEndHour('16');
        } else if (preset === 'cena') {
            setStartHour('20');
            setEndHour('24');
        } else if (preset === 'partido') {
            // Visualmente mostramos el rango completo o indicamos que es especial
            setStartHour('12');
            setEndHour('24'); // Indicativo
        }
    };

    const handleGenerate = () => {
        if (!selectedRiderId || selectedDays.length === 0) {
            alert("Selecciona al menos un rider y un día.");
            return;
        }

        const generatedShifts: Shift[] = [];
        const rider = riders.find(r => r.id === selectedRiderId);
        if (!rider) return;

        const moto = motos.find(m => m.id === selectedMotoId);

        selectedDays.forEach(dayIso => {
            // LOGIC FOR SPLIT SHIFTS (TURNO PARTIDO)
            if (activePreset === 'partido') {
                // Shift 1: Comida (12-16)
                generatedShifts.push(createShiftObject(rider, moto, dayIso, '12', '16'));
                // Shift 2: Cena (20-24)
                generatedShifts.push(createShiftObject(rider, moto, dayIso, '20', '24'));
            } else {
                // Standard Single Shift (Custom or Preset)
                if (parseInt(startHour) >= parseInt(endHour)) {
                    alert("La hora de fin debe ser posterior a la de inicio");
                    return;
                }
                generatedShifts.push(createShiftObject(rider, moto, dayIso, startHour, endHour));
            }
        });

        onCreateShifts(generatedShifts);
        onClose();
        // Reset simple
        setSelectedDays([]);
    };

    const createShiftObject = (rider: any, moto: any, dayIso: string, sHour: string, eHour: string): Shift => {
        const startAt = `${dayIso}T${sHour.padStart(2, '0')}:00:00`;
        // Handle midnight (24:00) -> Next Day 00:00 logic
        let endAt;
        if (eHour === '24') {
            // Calculate next day strictly for ISO string
            const d = new Date(dayIso);
            d.setDate(d.getDate() + 1);
            const nextDayIso = d.toISOString().split('T')[0];
            endAt = `${nextDayIso}T00:00:00`;
        } else {
            endAt = `${dayIso}T${eHour.padStart(2, '0')}:00:00`;
        }

        return {
            riderId: rider.id,
            riderName: rider.name || rider.email || 'Unknown',
            motoId: moto?.id || null,
            motoPlate: moto?.licensePlate || null,
            startAt,
            endAt,
            date: dayIso,
            startTime: `${sHour.padStart(2, '0')}:00`,
            endTime: eHour === '24' ? '23:59' : `${eHour.padStart(2, '0')}:00` // Legacy UI field
        };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm transition-all animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ring-1 ring-black/5">

                {/* Header with Glass Effect */}
                <div className="p-6 border-b border-slate-100/50 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                            <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30">
                                <Zap className="w-5 h-5" />
                            </div>
                            Relleno Rápido
                        </h3>
                        <p className="text-xs text-slate-500 font-medium ml-1 mt-1">Generación inteligente de turnos</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-white/50 p-2 rounded-full transition-all"><X size={20} /></button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">

                    {/* 0. PRESETS */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo de Turno</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => applyPreset('comida')}
                                className={`relative p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 group ${activePreset === 'comida'
                                        ? 'bg-amber-100/50 border-amber-200 ring-2 ring-amber-400 ring-offset-2'
                                        : 'bg-slate-50 border-slate-100 hover:bg-amber-50 hover:border-amber-200'
                                    }`}
                            >
                                <Sun className={`w-6 h-6 ${activePreset === 'comida' ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-500'}`} />
                                <div className="text-xs font-bold text-slate-700">Comida</div>
                                <div className="text-[9px] font-mono text-slate-400 bg-white/50 px-2 py-0.5 rounded-full">12:00 - 16:00</div>
                            </button>

                            <button
                                onClick={() => applyPreset('cena')}
                                className={`relative p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 group ${activePreset === 'cena'
                                        ? 'bg-indigo-100/50 border-indigo-200 ring-2 ring-indigo-400 ring-offset-2'
                                        : 'bg-slate-50 border-slate-100 hover:bg-indigo-50 hover:border-indigo-200'
                                    }`}
                            >
                                <Moon className={`w-6 h-6 ${activePreset === 'cena' ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                                <div className="text-xs font-bold text-slate-700">Cena</div>
                                <div className="text-[9px] font-mono text-slate-400 bg-white/50 px-2 py-0.5 rounded-full">20:00 - 00:00</div>
                            </button>

                            <button
                                onClick={() => applyPreset('partido')}
                                className={`relative p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 group ${activePreset === 'partido'
                                        ? 'bg-emerald-100/50 border-emerald-200 ring-2 ring-emerald-400 ring-offset-2'
                                        : 'bg-slate-50 border-slate-100 hover:bg-emerald-50 hover:border-emerald-200'
                                    }`}
                            >
                                <Split className={`w-6 h-6 ${activePreset === 'partido' ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                                <div className="text-xs font-bold text-slate-700">Partido</div>
                                <div className="text-[9px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full">DOBLE TURNO</div>
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 w-full" />

                    {/* 1. Selección de Recursos */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Rider</label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-slate-50 hover:bg-white border border-slate-200 text-slate-900 text-sm rounded-xl p-3 appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm transition-all font-medium"
                                    value={selectedRiderId}
                                    onChange={(e) => setSelectedRiderId(e.target.value)}
                                >
                                    <option value="">Seleccionar Rider...</option>
                                    {riders.map(r => (
                                        <option key={r.id} value={r.id}>{r.name || r.email || r.id}</option>
                                    ))}
                                </select>
                                <User className="absolute right-3 top-3 text-slate-400 group-hover:text-indigo-500 transition-colors w-4 h-4 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Moto (Opcional)</label>
                            <div className="relative group">
                                <select
                                    className="w-full bg-slate-50 hover:bg-white border border-slate-200 text-slate-900 text-sm rounded-xl p-3 appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm transition-all font-medium"
                                    value={selectedMotoId}
                                    onChange={(e) => setSelectedMotoId(e.target.value)}
                                >
                                    <option value="">Sin vehículo</option>
                                    {motos.map(m => (
                                        <option key={m.id} value={m.id}>{m.licensePlate} - {m.model}</option>
                                    ))}
                                </select>
                                <Truck className="absolute right-3 top-3 text-slate-400 group-hover:text-indigo-500 transition-colors w-4 h-4 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* 2. Días */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Días a aplicar</label>
                        <div className="flex flex-wrap gap-2">
                            {weekDays.map(day => {
                                const isSelected = selectedDays.includes(day.isoDate);
                                return (
                                    <button
                                        key={day.isoDate}
                                        onClick={() => toggleDay(day.isoDate)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm active:scale-95 ${isSelected
                                            ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-900/20'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {day.shortLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Horario Custom (Only if not Partido/fixed) - Or allow override? Let's allow override for custom, hide for presets maybe? No, let's keep it visible but disabled or indicative for presets to keep it simple, or editable. For 'Partido' it's complex to show 2 ranges. Let's hide time inputs if 'partido' is selected. */}
                    {activePreset !== 'partido' && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Horario Personalizado</label>
                            <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex-1">
                                    <span className="text-[10px] text-slate-400 mb-1.5 block font-bold uppercase">Inicio</span>
                                    <input
                                        type="number" min="0" max="23"
                                        value={startHour}
                                        onChange={(e) => { setStartHour(e.target.value); setActivePreset('custom'); }}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-center font-mono text-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm transition-all"
                                    />
                                </div>
                                <span className="text-slate-300 font-black text-xl mt-6">:</span>
                                <div className="flex-1">
                                    <span className="text-[10px] text-slate-400 mb-1.5 block font-bold uppercase">Fin</span>
                                    <input
                                        type="number" min="0" max="24"
                                        value={endHour}
                                        onChange={(e) => { setEndHour(e.target.value); setActivePreset('custom'); }}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-center font-mono text-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center rounded-b-3xl backdrop-blur-md">
                    <span className="text-xs font-semibold text-slate-400">
                        {activePreset === 'partido' ? (
                            <>Creará <span className="text-indigo-600 font-bold">{selectedDays.length * 2}</span> turnos (Doble)</>
                        ) : (
                            <>Creará <span className="text-indigo-600 font-bold">{selectedDays.length}</span> turnos</>
                        )}
                    </span>
                    <button
                        onClick={handleGenerate}
                        disabled={selectedDays.length === 0 || !selectedRiderId}
                        className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-slate-900/10 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                    >
                        <Zap size={18} className={activePreset === 'partido' ? 'fill-yellow-400 text-yellow-400' : 'fill-white'} />
                        Generar Turnos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickFillModal;
