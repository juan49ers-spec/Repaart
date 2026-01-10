import React from 'react';
import logo from '../../../assets/logo.jpg';
import { formatMoney } from '../../../lib/finance'; // Adjusted path

interface ReportItem {
    name: string;
    value: number;
}

interface ReportMetrics {
    costPerKm: number;
    revenuePerKm: number;
    totalKm: number;
    dropDensity: number;
    productivity: number;
    profitPerRider: number;
}

interface ReportTaxes {
    ivaRepercutido: number;
    ivaSoportado: number;
    ivaAPagar: number;
    netProfitPostTax: number;
}

interface FinancialReport {
    revenue: number;
    expenses: number;
    profit: number;
    metrics: ReportMetrics;
    taxes: ReportTaxes;
    breakdown: ReportItem[];
}

interface PrintReportProps {
    report: FinancialReport | null; // Allow null
}

const PrintReport: React.FC<PrintReportProps> = ({ report }) => {
    if (!report) return null;

    return (
        <div className="hidden print:block font-serif text-black p-4 md:p-8 w-full max-w-[210mm] mx-auto bg-white responsive-print-container">
            {/* Header */}
            <div className="flex justify-between items-end border-b-2 border-gray-900 pb-6 mb-8">
                <div className="flex items-center">
                    {/* LARGE LOGO FOR PRINT */}
                    <img src={logo} alt="REPAART" className="h-24 w-auto mr-6 grayscale" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-wider">INFORME FINANCIERO</h1>
                        <p className="text-sm text-gray-600 uppercase tracking-widest mt-1">REPAART Franchise System</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">FECHA DE EMISIÓN</p>
                    <p className="text-lg font-bold text-gray-900">{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-8 break-inside-avoid">
                <h2 className="text-sm font-bold uppercase border-b border-gray-400 mb-4 pb-1 tracking-widest">Resumen Ejecutivo</h2>
                <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 border border-gray-200 bg-gray-50">
                        <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Ingresos Totales</p>
                        <p className="text-xl font-bold mt-1 text-gray-900">{formatMoney(report.revenue)}€</p>
                    </div>
                    <div className="p-4 border border-gray-200 bg-gray-50">
                        <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Costes (Base)</p>
                        <p className="text-xl font-bold mt-1 text-gray-900">{formatMoney(report.expenses)}€</p>
                    </div>
                    <div className="p-4 border border-gray-200 bg-gray-50">
                        <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Beneficio Bruto</p>
                        <p className="text-xl font-bold mt-1 text-gray-900">{formatMoney(report.profit)}€</p>
                    </div>
                    <div className="p-4 border border-gray-900 bg-gray-100">
                        <p className="text-[10px] uppercase text-gray-900 font-bold tracking-wider">Beneficio Neto Real</p>
                        <p className="text-xl font-bold mt-1 text-gray-900">{formatMoney(report.taxes.netProfitPostTax)}€</p>
                    </div>
                </div>
            </div>

            {/* Logistics & Metrics Block */}
            <div className="mb-8 break-inside-avoid">
                <h2 className="text-sm font-bold uppercase border-b border-gray-400 mb-4 pb-1 tracking-widest">Indicadores de Flota</h2>
                <div className="grid grid-cols-3 gap-8 text-sm">
                    <div>
                        <p className="font-bold border-b border-gray-200 mb-2 text-xs text-gray-500">EFICIENCIA</p>
                        <div className="flex justify-between mb-1">
                            <span>Coste / Km:</span>
                            <span className="font-bold">{formatMoney(report.metrics.costPerKm, 3)}€</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Ingreso / Km:</span>
                            <span className="font-bold">{formatMoney(report.metrics.revenuePerKm, 3)}€</span>
                        </div>
                    </div>
                    <div>
                        <p className="font-bold border-b border-gray-200 mb-2 text-xs text-gray-500">OPERATIVA</p>
                        <div className="flex justify-between mb-1">
                            <span>Km Totales:</span>
                            <span className="font-bold">{report.metrics.totalKm} km</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Drop Density:</span>
                            <span className="font-bold">{formatMoney(report.metrics.dropDensity, 1)} /100km</span>
                        </div>
                    </div>
                    <div>
                        <p className="font-bold border-b border-gray-200 mb-2 text-xs text-gray-500">RENDIMIENTO</p>
                        <div className="flex justify-between mb-1">
                            <span>Productividad:</span>
                            <span className="font-bold">{formatMoney(report.metrics.productivity, 2)} ped/h</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Beneficio / Rider:</span>
                            <span className="font-bold">{formatMoney(report.metrics.profitPerRider, 2)}€</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Taxes */}
            <div className="mb-8 break-inside-avoid">
                <h2 className="text-sm font-bold uppercase border-b border-gray-400 mb-4 pb-1 tracking-widest">Liquidación de Impuestos</h2>
                <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                        <tr>
                            <td className="py-2 pl-2">IVA Repercutido (21%)</td>
                            <td className="text-right pr-2 text-green-700 font-medium">+{formatMoney(report.taxes.ivaRepercutido)}€</td>
                        </tr>
                        <tr>
                            <td className="py-2 pl-2">IVA Soportado (Deducible)</td>
                            <td className="text-right pr-2 text-red-700 font-medium">-{formatMoney(report.taxes.ivaSoportado)}€</td>
                        </tr>
                        <tr className="bg-gray-100 font-bold border-t border-gray-800">
                            <td className="py-2 pl-2 uppercase tracking-wider">IVA A Pagar</td>
                            <td className="text-right pr-2">{formatMoney(report.taxes.ivaAPagar)}€</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Detailed Expenses */}
            <div className="mb-8 break-inside-avoid">
                <h2 className="text-sm font-bold uppercase border-b border-gray-400 mb-4 pb-1 tracking-widest">Detalle de Costes Operativos</h2>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-gray-300">
                            <th className="py-2 w-1/2 font-semibold text-gray-600">Concepto</th>
                            <th className="text-right py-2 font-semibold text-gray-600">Base Imponible</th>
                            <th className="text-right py-2 font-semibold text-gray-600">Total Caja</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {report.breakdown.map((item, idx) => {
                            const hasIva = [
                                'Renting Motos', 'Royalty', 'Gasolina', 'Reparaciones',
                                'Servicios Prof.', 'Gestoría', 'PRL', 'Serv. Financieros',
                                'Otros Costes', 'App Flyder'
                            ].includes(item.name);
                            const ivaAmount = hasIva ? item.value * 0.21 : 0;
                            return (
                                <tr key={idx}>
                                    <td className="py-1.5 text-gray-700">{item.name}</td>
                                    <td className="text-right py-1.5 font-medium">{formatMoney(item.value)}€</td>
                                    <td className="text-right py-1.5">{formatMoney(item.value + ivaAmount)}€</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Signature */}
            <div className="mt-12 pt-8 border-t border-gray-400 break-inside-avoid">
                <p className="text-xs text-gray-500 mb-4 uppercase tracking-widest">Firma del Responsable</p>
                <div className="border-b border-dashed border-gray-400 w-64 mb-2" />
            </div>

            <div className="mt-8 text-center text-[10px] text-gray-400 uppercase tracking-widest">
                Documento generado automáticamente por REPAART Financial System. Confidencial.
            </div>
        </div>
    );
};

export default PrintReport;
