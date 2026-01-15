import { useCallback } from 'react';
import { formatMoney } from '../lib/finance';

interface ReportItem {
    name: string;
    type: string;
    value: number;
}

export interface ReportData {
    revenue: number;
    taxes?: {
        netProfitPostTax?: number;
    };
    metrics?: {
        costPerKm?: number;
        dropDensity?: number;
    };
    breakdown?: ReportItem[];
}

export const useExport = () => {
    const exportCSV = useCallback((report: ReportData, selectedMonth: string, titlePrefix: string = 'REPORTE FINANCIERO') => {
        if (!report) return;

        const rows: (string | number)[][] = [
            [`${titlePrefix} [${selectedMonth}]`, new Date().toLocaleDateString()],
            [],
            ["METRICAS PRINCIPALES"],
            ["Ingresos Totales", formatMoney(report.revenue)],
            ["Beneficio Neto Real", formatMoney(report.taxes?.netProfitPostTax || 0)],
            [],
            ["LOGISTICA AVANZADA"],
            ["Coste / Km", (report.metrics?.costPerKm || 0).toFixed(3)],
            ["Drop Density", (report.metrics?.dropDensity || 0).toFixed(2)],
            [],
            ["DESGLOSE DE COSTES"],
            ["Concepto", "Tipo", "Valor"],
            ...(report.breakdown || []).map((item: ReportItem) => [item.name, item.type, formatMoney(item.value)])
        ];

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);

        // Create temporal link element
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    return { exportCSV };
};
