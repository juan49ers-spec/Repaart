import React from 'react';
import { Activity } from 'lucide-react';

const AdminOverviewSkeleton = () => {
    return (
        <div className="space-y-8 pb-10 max-w-[1700px] mx-auto animate-pulse">
            {/* CONTROL HUB AREA - Header */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-[42px] h-[42px] bg-slate-800 dark:bg-[#12141A] rounded-xl border border-slate-700/50 dark:border-white/5 flex items-center justify-center relative overflow-hidden">
                            <Activity className="w-5 h-5 text-slate-600 dark:text-slate-700 relative z-10" />
                        </div>
                        <div className="space-y-2">
                            <div className="w-[180px] h-[22px] bg-slate-300 dark:bg-slate-800 rounded" />
                            <div className="w-[240px] h-[12px] bg-slate-200 dark:bg-slate-800/60 rounded" />
                        </div>
                    </div>
                    <div className="hidden md:flex w-[110px] h-[26px] bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>

                {/* 3 Main Widgets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[460px] bg-white dark:bg-[#12141A] rounded-3xl border border-slate-200/60 dark:border-white/5 overflow-hidden p-6 flex flex-col justify-between">
                            {/* Widget Header Skeleton */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-2">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/80 rounded-2xl" />
                                    <div className="w-24 h-5 bg-slate-200 dark:bg-slate-800 mt-2 rounded" />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/50" />
                            </div>

                            {/* Widget Content Skeleton (List items) */}
                            <div className="flex-1 space-y-4">
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/60" />
                                            <div className="space-y-1.5 flex flex-col">
                                                <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700/50 rounded" />
                                                <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded" />
                                            </div>
                                        </div>
                                        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* INTELLIGENCE LAYER */}
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-[180px] h-[30px] bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-300/20 dark:border-white/5 shadow-sm" />
                </div>
                <div className="h-[400px] bg-white dark:bg-[#12141A] rounded-3xl border border-slate-200/60 dark:border-white/5 p-6 flex flex-col justify-between">
                     <div className="space-y-3 mb-8">
                         <div className="w-48 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
                         <div className="w-[80%] h-3 bg-slate-100 dark:bg-slate-800/60 rounded" />
                     </div>
                     <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[1, 2, 3, 4].map(i => (
                              <div key={i} className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 border border-slate-100 dark:border-white/5">
                                 <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                 <div className="w-20 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                              </div>
                          ))}
                     </div>
                </div>
            </section>
        </div>
    );
};

export default AdminOverviewSkeleton;
