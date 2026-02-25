import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export type ComplianceSeverity = 'info' | 'warning' | 'critical';

export interface ComplianceIssue {
    id: string;
    severity: ComplianceSeverity;
    title: string;
    description: string;
    lineNumber?: number;
    lineText?: string;
    regulation: string;
    suggestion: string;
}

export interface ComplianceReport {
    score: number;
    issues: ComplianceIssue[];
    summary: string;
    passed: string[];
}

export const useContractAI = () => {
    const [loading, setLoading] = useState(false);

    const suggestClause = async (prompt: string, currentContract: string) => {
        setLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const fullPrompt = `
                Actúa como un experto legal en logística y la "Ley Rider" en España.
                Tengo el siguiente contrato en Markdown:
                
                ---
                ${currentContract}
                ---
                
                El usuario quiere realizar el siguiente cambio o adición: "${prompt}"
                
                Genera ÚNICAMENTE el texto en Markdown de la nueva cláusula o el cambio solicitado, 
                manteniendo el estilo legal y formal del contrato original. 
                Si es una nueva cláusula, numérala adecuadamente.
                No incluyas explicaciones, solo el contenido del contrato.
            `;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("AI Error:", error);
            throw new Error("No se pudo generar la cláusula con IA.");
        } finally {
            setLoading(false);
        }
    };

    const reviewContract = async (currentContract: string): Promise<ComplianceReport> => {
        setLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const fullPrompt = `
                Actúa como un experto legal especializado en la "Ley Rider" española (Ley 12/2021) y normativa laboral de riders.
                
                Analiza este contrato de prestación de servicios logísticos y genera un informe de cumplimiento JSON estricto:
                
                CONTRATO A ANALIZAR:
                ${currentContract}
                
                REGLAS DE CUMPLIMIENTO A VERIFICAR (Ley Rider y normativa española):
                1. Presunción de laboralidad: ¿El contrato tiene cláusulas que indican relación laboral encubierta?
                2. Exclusividad: ¿Hay cláusulas de exclusividad prohibidas por la Ley Rider?
                3. Control algorítmico: ¿Se menciona el algoritmo de asignación de pedidos y sus derechos?
                4. Representación sindical: ¿Se informa sobre derechos de representación?
                5. Formación: ¿Hay cláusulas de formación obligatoria?
                6. Seguridad social: ¿Se menciona correctamente la cotización?
                7. RGPD: ¿Hay cláusulas de protección de datos adecuadas?
                8. Riesgos laborales: ¿Se menciona la prevención de riesgos?
                9. Limitación de responsabilidad abusiva
                10. Plazos de pago excesivos
                
                DEBES RESPONDER ÚNICAMENTE CON UN JSON VÁLIDO con esta estructura exacta:
                {
                    "score": número entre 0-100,
                    "issues": [
                        {
                            "id": "string único",
                            "severity": "critical" | "warning" | "info",
                            "title": "Título breve del problema",
                            "description": "Descripción detallada",
                            "lineNumber": número de línea aproximado o null,
                            "lineText": "texto de la línea problemática o null",
                            "regulation": "Nombre de la norma (ej: 'Ley Rider Art. 3')",
                            "suggestion": "Sugerencia de cómo corregirlo"
                        }
                    ],
                    "summary": "Resumen ejecutivo de 2-3 líneas",
                    "passed": ["lista de aspectos que cumplen correctamente"]
                }
                
                Usa severidad:
                - "critical": Falta cláusula obligatoria por Ley Rider o cláusula abusiva clara (ej: exclusividad ilegal)
                - "warning": Posible problema o mejora recomendada
                - "info": Sugerencia de mejora o información adicional
                
                Sé estricto pero justo. Un contrato de riders debe cumplir la Ley Rider española.
                Si no hay "issues" críticos, el score debe ser alto (80-100).
                Si hay issues críticos, el score debe ser bajo (<60).
            `;

            const result = await model.generateContent(fullPrompt);
            const responseText = await result.response.text();
            
            // Intentar extraer JSON de la respuesta
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    score: parsed.score || 0,
                    issues: parsed.issues || [],
                    summary: parsed.summary || "Análisis completado",
                    passed: parsed.passed || []
                };
            }
            
            // Fallback si no hay JSON válido
            return {
                score: 50,
                issues: [{
                    id: 'parse-error',
                    severity: 'warning',
                    title: 'Error de análisis',
                    description: 'No se pudo parsear la respuesta del análisis',
                    regulation: 'N/A',
                    suggestion: 'Intente nuevamente'
                }],
                summary: "Error al analizar el contrato",
                passed: []
            };
        } catch (error) {
            console.error("AI Error:", error);
            throw new Error("No se pudo realizar la auditoría IA.");
        } finally {
            setLoading(false);
        }
    };

    return {
        suggestClause,
        reviewContract,
        loading
    };
};

export default useContractAI;
