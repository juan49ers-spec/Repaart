import { jsPDF } from 'jspdf';

export type ExportFormat = 'pdf' | 'docx' | 'txt';

export interface ExportOptions {
    format: ExportFormat;
    filename: string;
    includeWatermark?: boolean;
    watermarkText?: string;
}

export const useContractExport = () => {

    // Exportar a PDF (ya existe, mejorado con marca de agua)
    const exportToPDF = async (
        content: string,
        filename: string,
        options?: { watermark?: boolean; watermarkText?: string }
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            try {
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                // Configurar fuente
                doc.setFont('helvetica');
                doc.setFontSize(10);

                // Si hay marca de agua, agregarla primero
                if (options?.watermark) {
                    doc.saveGraphicsState();
                    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
                    doc.setTextColor(128, 128, 128);
                    doc.setFontSize(60);

                    const watermark = options.watermarkText || 'BORRADOR';
                    const textWidth = doc.getTextWidth(watermark);
                    const x = (pageWidth - textWidth) / 2;
                    const y = pageHeight / 2;

                    doc.text(watermark, x, y, { angle: 45 });
                    doc.restoreGraphicsState();
                    doc.setFontSize(10);
                    doc.setTextColor(0, 0, 0);
                }

                // Procesar contenido Markdown a texto plano
                const cleanContent = content
                    .replace(/#{1,6}\s/g, '') // Headers
                    .replace(/\*\*/g, '') // Bold
                    .replace(/\*/g, '') // Italic
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Links
                    .replace(/`{3}[\s\S]*?`{3}/g, '') // Code blocks
                    .replace(/`([^`]+)`/g, '$1') // Inline code
                    .replace(/\n{3,}/g, '\n\n'); // Exceso de saltos

                // Dividir texto en líneas que quepan en la página
                const splitText = doc.splitTextToSize(cleanContent, 180);

                // Agregar texto
                doc.text(splitText, 15, 20);

                // Guardar
                doc.save(`${filename}.pdf`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    // Exportar a DOCX (formato Word)
    const exportToDOCX = async (
        content: string,
        filename: string,
        options?: { watermark?: boolean; watermarkText?: string }
    ): Promise<void> => {
        try {
            // Crear contenido HTML que Word pueda abrir
            const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="utf-8">
    <title>${filename}</title>
    <style>
        body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
        h1 { font-size: 16pt; font-weight: bold; }
        h2 { font-size: 14pt; font-weight: bold; }
        h3 { font-size: 12pt; font-weight: bold; }
        ${options?.watermark ? `
        .watermark { 
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72pt;
            color: rgba(128,128,128,0.1);
            z-index: -1;
            pointer-events: none;
        }` : ''}
    </style>
</head>
<body>
    ${options?.watermark ? `<div class="watermark">${options.watermarkText || 'BORRADOR'}</div>` : ''}
    ${markdownToHTML(content)}
</body>
</html>`;

            // Crear blob y descargar
            const blob = new Blob(['\ufeff', htmlContent], {
                type: 'application/msword'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error exporting to DOCX:', error);
            throw error;
        }
    };

    // Exportar a TXT (texto plano)
    const exportToTXT = async (content: string, filename: string): Promise<void> => {
        try {
            // Limpiar markdown
            const plainText = content
                .replace(/#{1,6}\s/g, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
                .replace(/`{3}[\s\S]*?`{3}/g, '')
                .replace(/`([^`]+)`/g, '$1');

            const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting to TXT:', error);
            throw error;
        }
    };

    // Función principal de exportación
    const exportContract = async (
        content: string,
        options: ExportOptions
    ): Promise<void> => {
        const { format, filename, includeWatermark, watermarkText } = options;

        switch (format) {
            case 'pdf':
                await exportToPDF(content, filename, {
                    watermark: includeWatermark,
                    watermarkText
                });
                break;
            case 'docx':
                await exportToDOCX(content, filename, {
                    watermark: includeWatermark,
                    watermarkText
                });
                break;
            case 'txt':
                await exportToTXT(content, filename);
                break;
            default:
                throw new Error(`Formato no soportado: ${format}`);
        }
    };

    return {
        exportToPDF,
        exportToDOCX,
        exportToTXT,
        exportContract
    };
};

// Helper para convertir markdown simple a HTML
function markdownToHTML(markdown: string): string {
    return markdown
        // Headers
        .replace(/^######\s(.+)$/gm, '<h6>$1</h6>')
        .replace(/^#####\s(.+)$/gm, '<h5>$1</h5>')
        .replace(/^####\s(.+)$/gm, '<h4>$1</h4>')
        .replace(/^###\s(.+)$/gm, '<h3>$1</h3>')
        .replace(/^##\s(.+)$/gm, '<h2>$1</h2>')
        .replace(/^#\s(.+)$/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Listas
        .replace(/^-\s(.+)$/gm, '<li>$1</li>')
        // Saltos de línea
        .replace(/\n\n/g, '</p><p>')
        // Envolver en párrafos
        .replace(/^(.+)$/gm, '<p>$1</p>')
        // Limpiar párrafos vacíos
        .replace(/<p><\/p>/g, '');
}

export default useContractExport;
