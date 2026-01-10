import { Suspense, lazy, type FC } from 'react';

// Lazy load heavy component
const ShiftPlanner = lazy(() => import('../ShiftPlanner'));

interface ShiftManagerViewProps {
    franchiseId: string;
    readOnly?: boolean;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    overrideScheduleState?: any; // To be refined if possible
}

const ShiftManagerView: FC<ShiftManagerViewProps> = ({ franchiseId, readOnly = false, selectedDate, onDateChange, overrideScheduleState }) => {
    return (
        <div className="h-full w-full">
            {/* Wrapper allows for future injection of specific toolbar or context for the editor specifically */}
            <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando planificador...</div>}>
                <ShiftPlanner
                    franchiseId={franchiseId}
                    readOnly={readOnly}
                    selectedDate={selectedDate}
                    onDateChange={onDateChange}
                    overrideScheduleState={overrideScheduleState}
                />
            </Suspense>
        </div>
    );
};

export default ShiftManagerView;
