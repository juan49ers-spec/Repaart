import React from 'react';
import { Archive } from 'lucide-react';
import { Card } from '../primitives/Card';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
}

export const Table = <T extends { id?: string | number }>({
    data,
    columns,
    onRowClick,
    isLoading = false,
    emptyMessage = "No hay datos disponibles"
}: TableProps<T>) => {

    // Empty State
    if (!isLoading && data.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center p-12 text-center min-h-[300px] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Archive className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">
                    {emptyMessage}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    No se encontraron registros para mostrar en esta vista.
                </p>
            </Card>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {isLoading ? (
                        // Loading Skeleton
                        [...Array(5)].map((_, idx) => (
                            <tr key={idx} className="animate-pulse">
                                {columns.map((__, colIdx) => (
                                    <td key={colIdx} className="px-6 py-4">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        data.map((item, rowIdx) => (
                            <tr
                                key={item.id || rowIdx}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`
                                    group transition-colors duration-150
                                    ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
                                `}
                            >
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={`px-6 py-4 text-slate-700 dark:text-slate-300 ${col.className || ''}`}>
                                        {col.cell ? col.cell(item) : (item[col.accessorKey as keyof T] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
