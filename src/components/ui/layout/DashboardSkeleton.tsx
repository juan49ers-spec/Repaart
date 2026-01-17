import { type FC } from 'react';
import Skeleton from './Skeleton';

const DashboardSkeleton: FC = () => {
    return (
        <div className="p-5 md:p-8 space-y-6 md:space-y-8 animate-fade-in-up">
            {/* Header / Title Area */}
            <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-32" />
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-40 flex flex-col justify-between">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton variant="circular" className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-40 flex flex-col justify-between">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton variant="circular" className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-40 flex flex-col justify-between">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton variant="circular" className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-40 flex flex-col justify-between">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton variant="circular" className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>

            {/* Health Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="lg:col-span-2 h-80 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
            </div>
        </div>
    );
};

export default DashboardSkeleton;
