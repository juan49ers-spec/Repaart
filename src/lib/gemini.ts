import { GoogleGenerativeAI, GenerativeModel, ChatSession } from "@google/generative-ai";
import { FRANCHISE_KNOWLEDGE } from './companyKnowledge';

// Initialize the API with the key (will be set in .env)
const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || '';

let chatSession: ChatSession | null = null;

const SYSTEM_INSTRUCTION = `
Eres REPAART AI, el asistente virtual experto de la franquicia Repaart.
Tu objetivo es ayudar a los franquiciados a resolver dudas operativas, financieras y de soporte.

UTILIZA ESTA BASE DE CONOCIMIENTO (TU CEREBRO):
${FRANCHISE_KNOWLEDGE}

Tus conocimientos clave adicionales son:
1. MANUALES: Sabes que los manuales están en la sección "Soporte" > "Recursos".
2. TICKETS: Si hay un problema grave, sugiere abrir un ticket en "Soporte".
3. FINANZAS: Las dudas de pagos se ven en el "Dashboard Financiero" mensual.
4. TONO: Adáptate al tono definido en tu base de conocimiento.
5. CONTEXTO: Respondes preguntas sobre Repaart (logística, delivery, costes). Si te preguntan algo fuera de tema, reconduce amablemente.

Si no sabes una respuesta específica, sugiere contactar a soporte@repaart.es o abrir un ticket.
`;

export const initGeminiChat = async (): Promise<boolean> => {
    if (!API_KEY) {
        console.warn("Gemini API Key missing");
        return false;
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model: GenerativeModel = genAI.getGenerativeModel({
            model: "gemini-pro"
        });

        chatSession = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 2000, // Increased for Pro
                temperature: 0.5, // Reduced for more consistent formatting
            },
        });

        if (import.meta.env.DEV) {
            console.log("Gemini Chat Session Initialized ✅ (Pro Model)");
        }
        return true;
    } catch (error) {
        console.error("Error initializing Gemini:", error);
        return false;
    }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
    if (!chatSession) {
        // Try to init if not ready
        const success = await initGeminiChat();
        // If still failed (e.g. no key), return mock fallback
        if (!success) {
            return "⚠️ No veo mi 'llave maestra' (API Key). Por favor configura la VITE_GOOGLE_AI_KEY en el sistema.";
        }
    }

    try {
        if (!chatSession) throw new Error("Chat session not initialized");
        const result = await chatSession.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Lo siento, tuve un problema de conexión. ¿Podrías intentar de nuevo?";
    }
};

/**
 * Generates a structured Guide from raw text using Gemini
 */
/**
 * Generates a structured Guide from raw text using Gemini (REST API Fallback)
 * bypasses SDK issues by using direct HTTP fetch
 */
export const generateGuideContent = async (rawText: string): Promise<{
    title: string;
    description: string;
    category: 'operativa' | 'tecnico' | 'accidente' | 'rrhh';
    theme: string;
    icon: string;
    isCritical: boolean;
    confidence: number;
} | null> => {
    const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || '';
    if (!API_KEY) {
        throw new Error("Falta la API Key de Gemini (VITE_GOOGLE_AI_KEY).");
    }

    const prompt = `
    ${SYSTEM_INSTRUCTION}

    ACTUA COMO: Director de Operaciones de una Franquicia de Reparto (Repaart).
    TAREA: Analiza el siguiente "Texto Crudo" y transfórmalo en una Guía Operativa Profesional.
    
    TEXTO CRUDO:
    "${rawText}"

    REGLAS DE SALIDA (JSON ESTRICTO):
    1. "title": Título profesional, corto y directo (Ej: "Protocolo de...", "Normativa de...").
    2. "description": Resumen ejecutivo de máximo 2 frases. Tono corporativo y claro. Sintetiza la información clave.
    3. "category": Elige UNA de estas: "operativa", "tecnico", "accidente", "rrhh".
    4. "theme": Elige UNO basado en la urgencia/tipo:
       - "rose" (Crítico/Peligro)
       - "amber" (Advertencia/Mantenimiento)
       - "emerald" (Positivo/Formación)
       - "indigo" (Protocolo Estándar)
       - "blue" (Informativo)
    5. "icon": Elige el nombre del icono de Lucide que mejor encaje (SOLO ESTOS: ShieldAlert, Wrench, Users, PlayCircle, BookOpen, FileText, Zap, Heart, Star, Award, Info, AlertTriangle, CheckCircle, HelpCircle, Lightbulb, Target).
    6. "isCritical": true si es un tema de seguridad, accidentes o normativa legal imperativa. false si es informativo.

    IMPORTANTE: 
    - EL RESULTADO DEBE SER UN JSON VÁLIDO.
    - NO uses Markdown (\`\`\`json). Devuelve SOLO el texto JSON plano.
    - ESCAPA todas las comillas dobles (") dentro de los valores de texto con backslash (\\").
    - ESCAPA todos los saltos de línea dentro de los valores de texto con \\n.

    Responde SOLO con el JSON válido.
    `;

    // List of models to try via REST (Based on authenticated user availability)
    const models = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];

    for (const model of models) {
        try {
            console.log(`🤖 REST Attempt: ${model}...`);
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                }
            );

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("Empty response");

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("No JSON found");

                console.log(`✅ Success with ${model}`);
                return JSON.parse(jsonMatch[0]);
            } else {
                console.warn(`❌ ${model} failed: ${response.status}`);
            }
        } catch (e) {
            console.warn(`❌ ${model} error:`, e);
        }
    }

    // DIAGNOSTIC MODE: If all failed, list available models
    let diagMessage = "";
    try {
        console.log("🔍 Diagnosing available models...");
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);

        if (listResp.ok) {
            const data = await listResp.json();
            const availableModels = data.models?.map((m: any) => m.name) || [];
            console.error("📋 Available Models:", availableModels);
            throw new Error(`Tus modelos disponibles son: ${availableModels.join(", ")}. Por favor, contacta al desarrollador con esta lista.`);
        } else {
            const err = await listResp.json();
            diagMessage = `Error de Diagnóstico (${listResp.status}): ${err.error?.message || listResp.statusText}`;
        }
    } catch (diagError: any) {
        console.error("Diagnostic failed:", diagError);
        // If we manually threw the list of models, allow it to bubble up
        if (diagError.message.includes("Tus modelos disponibles")) {
            throw diagError;
        }
        if (!diagMessage) diagMessage = diagError.message;
    }

    throw new Error(`Fallo Total de Conexión. Diagnóstico: ${diagMessage || "Imposible contactar con Google API"}. Verifica tu API KEY.`);
};

/**
 * Analyzes monthly financial data and provides a strategic executive summary
 */
export const analyzeFinancialMonthlyReport = async (financialData: any): Promise<{
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    sentiment: 'positive' | 'neutral' | 'negative' | 'critical';
} | null> => {

    // 1. Prepare Data for AI (Sanitize)
    const contextData = {
        month: financialData.month,
        revenue: financialData.totalIncome,
        profit: financialData.profit,
        margin: financialData.revenue > 0 ? (financialData.profit / financialData.revenue * 100).toFixed(1) + '%' : '0%',
        orders: financialData.orders,
        costs: {
            personnel: financialData.expenses?.payroll + financialData.expenses?.insurance,
            fuel: financialData.expenses?.fuel,
            repairs: financialData.expenses?.repairs,
            marketing: financialData.expenses?.marketing
        }
    };

    const prompt = `
    ACTUA COMO: Auditor Financiero Senior de "Repaart" (Franquicia de Logística).
    
    TAREA: Analiza este cierre mensual y genera un reporte ejecutivo MUY BREVE y DIRECTO.
    
    DATOS DEL MES:
    ${JSON.stringify(contextData, null, 2)}

    REGLAS DE ANÁLISIS:
    1. Si el margen es >15%, felicita (buen trabajo).
    2. Si el gasto en combustible es alto (vs pedidos), alerta de posible fraude o ineficiencia.
    3. Si hay muchas reparaciones, sugiere renovar flota.
    4. Sé duro pero constructivo. Habla de dinero, no de sensaciones.

    SALIDA JSON OBLIGATORIA (Sin Markdown):
    {
        "summary": "1 frase resumen del estado general del mes.",
        "strengths": ["Punto fuerte 1", "Punto fuerte 2"],
        "weaknesses": ["Punto débil 1", "Punto débil 2"],
        "recommendation": "Tu mejor consejo accionable para el mes que viene.",
        "sentiment": "positive" | "neutral" | "negative" | "critical"
    }
    `;

    return await generateJson(prompt);
};

// Internal Helper for JSON Generation (Reuses the robust logic)
const generateJson = async (promptText: string): Promise<any> => {
    const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || '';
    if (!API_KEY) return null;

    // Use best available model from diagnosis knowledge
    const modelName = "gemini-2.5-flash";

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
            }
        );

        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) return null;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    } catch (e) {
        console.error("AI Analysis Failed", e);
        return null; // Silent fail in UI is better than crash for this feature
    }
};
