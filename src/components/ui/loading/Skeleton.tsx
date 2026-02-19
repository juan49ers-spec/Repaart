import { cn } from '../../../lib/utils';

interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
}

/**
 * Skeleton Base — Bloque de carga con efecto shimmer.
 * Reutiliza la animación `.shimmer` definida en index.css.
 */
const Skeleton = ({ className, width, height }: SkeletonProps) => (
    <div
        className={cn(
            'shimmer rounded-lg bg-slate-200/70 dark:bg-slate-700/50',
            className
        )}
        style={width || height ? { width, height } : undefined}
        aria-hidden="true"
    />
);

/* ─── Presets composables ─── */

/** Línea de texto skeleton */
const Text = ({ width = '100%', className }: SkeletonProps) => (
    <Skeleton className={cn('h-3.5 rounded-md', className)} width={width} />
);

/** Círculo (avatar, icono) */
const Circle = ({ className, width = '40px' }: SkeletonProps) => (
    <Skeleton
        className={cn('rounded-full aspect-square', className)}
        width={width}
        height={width}
    />
);

/** KPI Card completa */
const KPI = ({ className }: { className?: string }) => (
    <div
        className={cn(
            'workstation-card p-6 space-y-4',
            className
        )}
        aria-hidden="true"
    >
        {/* Header: icono + título */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="space-y-1.5">
                    <Skeleton className="h-3 rounded-md" width="80px" />
                    <Skeleton className="h-2.5 rounded-md" width="50px" />
                </div>
            </div>
            <Skeleton className="h-5 rounded-md" width="48px" />
        </div>
        {/* Valor principal */}
        <Skeleton className="h-8 rounded-lg" width="140px" />
        {/* Progress bar */}
        <Skeleton className="h-1.5 rounded-full" width="100%" />
        {/* Sparkline area */}
        <Skeleton className="h-12 rounded-lg -mx-2" />
    </div>
);

/** Chart area skeleton */
const Chart = ({ className, height = '200px' }: SkeletonProps) => (
    <div className={cn('workstation-card p-6 space-y-3', className)} aria-hidden="true">
        <div className="flex items-center justify-between">
            <Skeleton className="h-4 rounded-md" width="120px" />
            <div className="flex gap-2">
                <Skeleton className="h-6 rounded-md" width="60px" />
                <Skeleton className="h-6 rounded-md" width="60px" />
            </div>
        </div>
        <Skeleton className="rounded-xl" width="100%" height={height} />
    </div>
);

/** Card genérica */
const Card = ({ className }: { className?: string }) => (
    <div className={cn('workstation-card p-6 space-y-3', className)} aria-hidden="true">
        <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 rounded-md" width="60%" />
                <Skeleton className="h-2.5 rounded-md" width="40%" />
            </div>
        </div>
        <Skeleton className="h-3 rounded-md" width="100%" />
        <Skeleton className="h-3 rounded-md" width="85%" />
        <Skeleton className="h-3 rounded-md" width="70%" />
    </div>
);

/** Dashboard Grid — Muestra un grid completo de skeletons KPI */
const DashboardGrid = ({ count = 4, className }: { count?: number; className?: string }) => (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
            <KPI key={i} />
        ))}
    </div>
);

// Attach sub-components
Skeleton.Text = Text;
Skeleton.Circle = Circle;
Skeleton.KPI = KPI;
Skeleton.Chart = Chart;
Skeleton.Card = Card;
Skeleton.DashboardGrid = DashboardGrid;

export default Skeleton;
export { Skeleton };
