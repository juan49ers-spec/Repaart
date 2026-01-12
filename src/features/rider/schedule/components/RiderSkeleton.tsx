import React from 'react';

export const RiderSkeleton: React.FC = () => {
    return (
        <div className="space-y-4 p-4 animate-pulse">
            {/* Hero Skeleton */}
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full" />

            {/* List Header */}
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32 mt-6 mb-4" />

            {/* List Skeleton Items */}
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex h-24 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 gap-4">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
};
