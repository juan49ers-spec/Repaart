import React from 'react';
import { cn } from '../../../lib/utils';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: unknown, record: T) => React.ReactNode;
  responsive?: {
    '@xs'?: boolean;
    '@sm'?: boolean;
    '@md'?: boolean;
    '@lg'?: boolean;
  };
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  striped?: boolean;
  hover?: boolean;
  emptyText?: string;
  onRowClick?: (record: T) => void;
}

/**
 * ResponsiveTable - Tabla con Container Queries
 * 
 * Features:
 * - @container: Se adapta al tamaño del contenedor
 * - Horizontal scroll: En móviles cuando no cabe
 * - Columnas responsivas: Ocultar/mostrar según breakpoint
 * - Fluid typography: Texto adaptable
 * - Striped rows: Alternar colores
 * - Hover effect: Interacción visual
 * 
 * Breakpoints para columnas:
 * - @xs (320px): Solo columnas esenciales
 * - @sm (480px): Columnas principales
 * - @md (768px): Columnas secundarias
 * - @lg (1024px): Todas las columnas
 */
export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  className = '',
  striped = false,
  hover = false,
  emptyText = 'No hay datos disponibles',
  onRowClick
}: ResponsiveTableProps<T>) {
  const renderCell = (column: Column<T>, record: T) => {
    if (column.render) {
      return column.render(record[column.key as keyof T], record);
    }
    return record[column.key as keyof T] as React.ReactNode;
  };

  const getResponsiveClasses = (column: Column<T>) => {
    if (!column.responsive) return '';
    
    const classes: string[] = [];
    
    // Por defecto, ocultar en xs si no se especifica
    if (column.responsive['@xs'] === false) {
      classes.push('hidden @sm:table-cell');
    }
    
    // Mostrar solo en sm si se especifica
    if (column.responsive['@sm'] === true && column.responsive['@xs'] === false) {
      classes.push('@sm:table-cell');
    }
    
    // Mostrar solo en md+
    if (column.responsive['@md'] === true && !column.responsive['@sm']) {
      classes.push('hidden @md:table-cell');
    }
    
    // Mostrar solo en lg+
    if (column.responsive['@lg'] === true && !column.responsive['@md']) {
      classes.push('hidden @lg:table-cell');
    }
    
    return classes.join(' ');
  };

  if (data.length === 0) {
    return (
      <div className={cn(
        '@container',
        'bg-white dark:bg-slate-900',
        'rounded-lg',
        'border border-slate-200 dark:border-slate-800',
        'p-4 @xs:p-5 @sm:p-6',
        'text-center',
        className
      )}>
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      '@container',
      'rounded-lg',
      'border border-slate-200 dark:border-slate-800',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    'text-left',
                    'px-2 py-1.5 @xs:px-2.5 @xs:py-2 @sm:px-3 @sm:py-2 @md:px-3 @md:py-2.5',
                    'text-[10px] font-semibold',
                    'text-slate-600 dark:text-slate-400',
                    'uppercase tracking-wide',
                    'border-b border-slate-200 dark:border-slate-800',
                    getResponsiveClasses(column),
                    column.className
                  )}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.map((record, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(record)}
                className={cn(
                  striped && rowIndex % 2 === 1 && 'bg-slate-50 dark:bg-slate-800/30',
                  hover && 'hover:bg-slate-100 dark:hover:bg-slate-800/50',
                  onRowClick && 'cursor-pointer',
                  'transition-colors'
                )}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      'px-2 py-1.5 @xs:px-2.5 @xs:py-2 @sm:px-3 @sm:py-2 @md:px-3 @md:py-2.5',
                      'text-xs',
                      'text-slate-900 dark:text-slate-100',
                      getResponsiveClasses(column),
                      column.className
                    )}
                  >
                    {renderCell(column, record)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResponsiveTable;
