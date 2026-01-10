import { formatMoney } from './finance';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';
// Dynamic imports used in function for performance

interface ReportData {
    revenue: number;
    expenses: number;
    profit: number;
    taxes: {
        netProfitPostTax: number;
        ivaRepercutido: number;
        ivaSoportado: number;
        ivaAPagar: number;
        // ... other tax fields
    };
    metrics: {
        productivity: number;
        costPerKm: number;
        totalKm: number;
        profitPerRider: number;
        dropDensity: number;
        profitMargin: number;
    };
    breakdown: Array<{
        name: string;
        value: number;
    }>;
}

export const generatePDFReport = async (report: ReportData | null, franchiseName: string = 'Franchise Partner', month: string = 'Current'): Promise<void> => {
    try {
        if (!report) {
            console.error("PDF Generation failed: Report data is missing.");
            alert("No hay datos para generar el informe.");
            return;
        }

        // Dynamic imports for performance (lazy load ~600kB)
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- HEADER ---
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.text("REPAART", 15, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text("FRANCHISE FINANCIAL SYSTEM", 15, 25);

        // Date & Info
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`FRANQUICIA: ${franchiseName.toUpperCase()}`, 15, 40);
        doc.text(`PERIODO: ${month.toUpperCase()}`, 15, 45);
        doc.text(`FECHA EMISIÓN: ${new Date().toLocaleDateString()}`, pageWidth - 15, 20, { align: 'right' });

        // --- EXECUTIVE SUMMARY ---
        let yPos = 60;
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.rect(15, yPos, pageWidth - 30, 25, 'F');

        doc.setFontSize(14);
        doc.text("RESUMEN EJECUTIVO", 20, yPos + 10);

        doc.setFontSize(10);
        doc.text("INGRESOS", 20, yPos + 20);
        doc.text("GASTOS", 70, yPos + 20);
        doc.text("BENEFICIO NETO", 120, yPos + 20);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${formatMoney(report.revenue)}€`, 20, yPos + 17);
        doc.text(`${formatMoney(report.expenses)}€`, 70, yPos + 17);

        const profitColor = report.taxes.netProfitPostTax >= 0 ? [22, 163, 74] : [220, 38, 38]; // Green/Red
        doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
        doc.text(`${formatMoney(report.taxes.netProfitPostTax)}€`, 120, yPos + 17);
        doc.setTextColor(0, 0, 0); // Reset
        doc.setFont('helvetica', 'normal');

        // --- METRICS GRID ---
        yPos += 35;
        doc.setFontSize(12);
        doc.text("INDICADORES CLAVE", 15, yPos);

        const metricsData = [
            ['Productividad', `${report.metrics.productivity.toFixed(2)} ped/h`, 'Coste/Km', `${report.metrics.costPerKm.toFixed(3)}€`],
            ['Km Totales', `${report.metrics.totalKm} km`, 'Beneficio/Rider', `${report.metrics.profitPerRider.toFixed(2)}€`],
            ['Drop Density', `${report.metrics.dropDensity.toFixed(2)}%`, 'Margen', `${report.metrics.profitMargin.toFixed(1)}%`]
        ];

        autoTable(doc, {
            startY: yPos + 5,
            head: [],
            body: metricsData,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', textColor: [100, 116, 139] },
                2: { fontStyle: 'bold', textColor: [100, 116, 139] }
            }
        });

        // --- TAXES ---
        yPos = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.text("LIQUIDACIÓN IVA ESTIMADA", 15, yPos);

        const taxData = [
            ['IVA Repercutido (21%)', `+${formatMoney(report.taxes.ivaRepercutido)}€`],
            ['IVA Soportado (Deducible)', `-${formatMoney(report.taxes.ivaSoportado)}€`],
            ['A PAGAR', `${formatMoney(report.taxes.ivaAPagar)}€`]
        ];

        autoTable(doc, {
            startY: yPos + 5,
            head: [['Concept', 'Importe']],
            body: taxData,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 10 },
            columnStyles: {
                1: { halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: function (data: any) {
                if (data.row.index === 2) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [241, 245, 249];
                }
            }
        });

        // --- BREAKDOWN ---
        yPos = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.text("DESGLOSE DE COSTES", 15, yPos);

        // Prepare breakdown data with VAT calculation
        const breakdownRows = report.breakdown.map(item => {
            const hasIva = [
                'Renting Motos', 'Royalty', 'Gasolina', 'Reparaciones',
                'Servicios Prof.', 'Gestoría', 'PRL', 'Serv. Financieros',
                'Otros Costes', 'App Flyder'
            ].includes(item.name);
            const ivaVal = hasIva ? item.value * 0.21 : 0;
            const total = item.value + ivaVal;

            return [
                item.name,
                `${formatMoney(item.value)}€`,
                `${formatMoney(ivaVal)}€`,
                `${formatMoney(total)}€`
            ];
        });

        autoTable(doc, {
            startY: yPos + 5,
            head: [['Concepto', 'Base', 'IVA (Est.)', 'Total']],
            body: breakdownRows,
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105] },
            styles: { fontSize: 9 },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Documento generado automáticamente por REPAART System.", 15, pageHeight - 10);

        doc.save(`REPAART_Informe_${month}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error: any) {
        console.error("Critical PDF Error:", error);
        alert(`Error generando el PDF: ${error.message}`);
    }
};
