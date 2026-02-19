import React from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface FinancialSyncStatusProps {
    isRealTime: boolean;
    loader?: boolean;
    lastUpdated?: Date;
}

export const FinancialSyncStatus: React.FC<FinancialSyncStatusProps> = ({
    isRealTime,
    loader = false,
    lastUpdated
}) => {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all duration-300">
            {loader ? (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                </motion.div>
            ) : isRealTime ? (
                <div className="relative flex items-center justify-center">
                    <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 relative z-10" />
                </div>
            ) : (
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
            )}

            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight">
                    {loader ? 'Sincronizando...' : isRealTime ? 'En Vivo' : 'Offline'}
                </span>
                {lastUpdated && !loader && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none scale-90 origin-left">
                        {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        </div>
    );
};

export default FinancialSyncStatus;
