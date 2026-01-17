import React, { useState } from 'react';
import { Trophy, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { userService } from '../../../services/userService';
import { useAuth } from '../../../context/AuthContext';

interface GoalSettingModalProps {
    currentGoal: number;
    currentRevenue: number;
    onClose: () => void;
    onSave: (newGoal: number) => void;
    mode?: 'default' | 'monthly_kickoff'; // New mode
}

export const GoalSettingModal: React.FC<GoalSettingModalProps> = ({ currentGoal, currentRevenue, onClose, onSave, mode = 'default' }) => {
    const { user } = useAuth();
    const [goal, setGoal] = useState<number>(currentGoal || 16000);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!user?.uid) return;
        setSaving(true);
        try {
            // Save to user profile
            await userService.updateUser(user.uid, {
                monthlyRevenueGoal: goal
            });

            // Celebration!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 100
            });

            onSave(goal);

            // Delay closing slightly to see animation
            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (error) {
            console.error("Failed to save goal", error);
            setSaving(false);
        }
    };

    const percentageGrowth = currentRevenue > 0 ? ((goal - currentRevenue) / currentRevenue) * 100 : 0;
    const isStretch = percentageGrowth > 20;

    const isKickoff = mode === 'monthly_kickoff';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full relative animate-in zoom-in-95 duration-300 overflow-hidden">

                {/* Decorative Background */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10 opacity-50 ${isKickoff ? 'bg-amber-100' : 'bg-indigo-50'}`} />

                <button
                    title="Cerrar"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border ${isKickoff ? 'bg-amber-100/50 text-amber-600 border-amber-100' : 'bg-indigo-100/50 text-indigo-600 border-indigo-100'}`}>
                        <Trophy className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">
                        {isKickoff ? '¡Nuevo Mes, Nuevo Objetivo!' : 'Define tu Meta Mensual'}
                    </h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                        {isKickoff
                            ? "Empieza el mes con fuerza. ¿Cuál es tu objetivo de facturación para este mes?"
                            : "Establece un objetivo ambicioso pero alcanzable. Tu progreso se medirá contra esta cifra."}
                    </p>
                </div>

                <div className="mb-8">
                    <div className="relative group">
                        <div className="absolute top-1/2 left-8 -translate-y-1/2 text-slate-400 font-light text-3xl">€</div>
                        <input
                            title="Objetivo de Facturación"
                            placeholder="0"
                            type="number"
                            value={goal}
                            onChange={(e) => setGoal(parseFloat(e.target.value) || 0)}
                            className="w-full text-center text-5xl font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-200 py-4 border-b-2 border-slate-100 focus:border-indigo-500 transition-colors"
                            autoFocus
                        />
                        <div className="absolute -bottom-6 left-0 right-0 text-center">
                            {percentageGrowth > 0 ? (
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${isStretch ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {percentageGrowth.toFixed(0)}% por encima de tu facturación actual
                                </span>
                            ) : (
                                <span className="text-xs text-slate-400">Introduce tu objetivo de facturación</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full py-3.5 text-white rounded-xl font-bold text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group ${isKickoff
                                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                            }`}
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {isKickoff ? '¡A por ello!' : 'Guardar Objetivo'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};
