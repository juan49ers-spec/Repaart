import { type FC } from 'react';

interface TableSkeletonProps {
    rows?: number;
}

const TableSkeleton: FC<TableSkeletonProps> = ({ rows = 8 }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse border-l-2 border-l-transparent">
                    <td className="p-5"><div className="h-4 w-4 bg-slate-800 rounded" /></td>
                    <td className="p-5">
                        <div className="h-4 w-24 bg-slate-800 rounded mb-2" />
                        <div className="h-3 w-16 bg-slate-800/50 rounded" />
                    </td>
                    <td className="p-5"><div className="h-6 w-20 bg-slate-800 rounded-full" /></td>
                    <td className="p-5"><div className="h-4 w-20 bg-slate-800 rounded ml-auto" /></td>
                    <td className="p-5"><div className="h-4 w-20 bg-slate-800 rounded ml-auto" /></td>
                    <td className="p-5"><div className="h-4 w-12 bg-slate-800 rounded ml-auto" /></td>
                    <td className="p-5"><div className="h-4 w-4 bg-slate-800 rounded ml-auto" /></td>
                </tr>
            ))}
        </>
    );
};

export default TableSkeleton;
