import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Note: In a real app, this should be handled through a secure backend or cloud function to protect the API key.
// For this playground, we use the client-side approach if the key is available in env.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

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

    const reviewContract = async (currentContract: string) => {
        setLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const fullPrompt = `
                Actúa como un auditor legal. Revisa este contrato logístico:
                
                ${currentContract}
                
                Indica si falta alguna cláusula crítica según la normativa española (Ley Rider, RGPD, riesgos laborales).
                Responde con un máximo de 3 puntos clave de mejora de forma muy concisa.
            `;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
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
