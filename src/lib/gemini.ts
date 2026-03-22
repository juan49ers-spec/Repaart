import { GoogleGenerativeAI, GenerativeModel, ChatSession } from "@google/generative-ai";
import { FRANCHISE_KNOWLEDGE } from './companyKnowledge';
import { APP_CAPABILITIES } from './appCapabilities';

// Initialize the API with the key (will be set in .env)
const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || '';

let chatSession: ChatSession | null = null;

const SYSTEM_INSTRUCTION = `
Eres REPAART AI, el asistente virtual experto de la franquicia Repaart.
Tu objetivo es ayudar a los franquiciados a resolver dudas operativas, financieras y DE USO DE LA PLATAFORMA.

CEREBRO 1: CONOCIMIENTO DE LA APP (DÓNDE ESTÁ TODO):
${APP_CAPABILITIES}

CEREBRO 2: MANUAL OPERATIVO (CÓMO FUNCIONA EL NEGOCIO):
${FRANCHISE_KNOWLEDGE}

TUS SUPERPODERES:
1. NAVEGADOR: Si preguntan "¿Dónde veo mis facturas?", diles EXACTAMENTE la ruta (Ej: "Ve a Finanzas > Gastos").
2. SOPORTE TÉCNICO: Si tienen un problema técnico con la app, sugiere limpiar caché o abrir ticket en /support.
3. OPERACIONES: Resuelve dudas sobre riders, motos y turnos usando el Manual Operativo.
4. FINANZAS: Explica conceptos financieros basándote en la sección 3 y 4 del manual.

TONO Y ESTILO:
- Profesional pero cercano ("Compañero").
- Ve al grano. No des discursos vacíos.
- Si es una duda de APP, usa CEREBRO 1.
- Si es una duda de NEGOCIO, usa CEREBRO 2.

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
            model: "gemini-1.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION
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
    content: string; // NEW: Full markdown content
    confidence: number;
} | null> => {
    const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || '';
    if (!API_KEY) {
        throw new Error("Falta la API Key de Gemini (VITE_GOOGLE_AI_KEY). Por favor, configúrala en el archivo .env.");
    }

    const prompt = `
    ${SYSTEM_INSTRUCTION}

    ACTUA COMO: Director de Operaciones de una Franquicia de Reparto (Repaart).
    TAREA: Analiza el siguiente "Texto Crudo" y transfórmalo en una Guía Operativa Profesional COMPLETA.
    
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
    7. "content": Texto COMPLETO de la guía en formato MARKDOWN.
       - Usa # para Títulos y ## para Subtítulos.
       - Usa **negritas** para conceptos clave.
       - Usa listas con - o 1. para pasos a seguir.
       - Estructura: Introducción, Pasos/Procedimiento, Consideraciones Finales.
       - Tono profesional, instructivo y claro.

    IMPORTANTE: 
    - EL RESULTADO DEBE SER UN JSON VÁLIDO.
    - NO uses Markdown (\`\`\`json) para envolver la respuesta. Devuelve SOLO el texto JSON plano.
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

/**
 * Analyzes a ticket draft and suggests immediate solutions from the Knowledge Base
 */
export const suggestSupportSolution = async (subject: string, description: string): Promise<{
    suggestion: string;
    confidence: number;
    isSolvable: boolean;
} | null> => {

    const prompt = `
    ACTUA COMO: Soporte Técnico Nivel 1 de "Repaart".
    TAREA: Analiza este borrador de ticket y sugiere una solución inmediata si existe en el manual básico.

    TICKET:
    Asunto: "${subject}"
    Descripción: "${description}"

    BASE DE CONOCIMIENTO (Resumida):
    - TPV/Datáfono no conecta -> Reiniciar pulsando botón rojo 10s. Comprobar Wifi "Repaart_Devices".
    - Moto no arranca -> Comprobar botón rojo de manillar (Run/Stop). Comprobar patilla lateral.
    - App Rider bloqueada -> Borrar caché en Ajustes > Aplicaciones > Repaart Rider.
    - Falta dinero en cierre -> Revisar tickets de datáfono no liquidados o propinas en efectivo mal anotadas.
    - Impresora térmica falla -> Comprobar papel y luz parpadeante. Abrir y cerrar tapa fuerte.

    REGLAS:
    - Si el problema parece coincidir CLARAMENTE con la base de conocimiento, dalo como "isSolvable": true.
    - La sugerencia debe ser CORTA (max 15 palabras) y DIRECTA.
    - Si no te suena de nada o es ambiguo, devuelve null o "isSolvable": false.

    SALIDA JSON:
    {
        "suggestion": "Texto de la solución...",
        "confidence": 0-100,
        "isSolvable": boolean
    }
    `;

    return await generateJson(prompt);
};

/**
 * Validates a weekly schedule for operational risks
 */
export const validateWeeklySchedule = async (shifts: any[]): Promise<{
    score: number;
    status: 'optimal' | 'warning' | 'critical';
    feedback: string;
    missingCoverage: string[];
} | null> => {

    // Condensed Shift Representation for Token Efficiency
    const scheduleSummary = shifts.map(s => {
        const start = new Date(s.startAt);
        const day = start.toLocaleDateString('es-ES', { weekday: 'short' });
        const hour = start.getHours();
        return `${day} ${hour}h-${new Date(s.endAt).getHours()}h (${s.riderName})`;
    }).join('\n');

    const prompt = `
    ACTUA COMO: "Sheriff de Operaciones" de Repaart.
    TAREA: Audita este cuadrante semanal y busca huecos peligrosos.

    CUADRANTE:
    ${scheduleSummary}

    REGLAS DE ORO (PRIME TIME):
    1. VIERNES NOCHE (20:00-23:00): Mínimo 2 riders.
    2. SÁBADO NOCHE (20:00-23:00): Mínimo 3 riders.
    3. DOMINGO NOCHE (20:00-23:00): Mínimo 2 riders.
    4. DIARIO (13:00-15:00): Mínimo 1 rider.

    SI EL CUADRANTE ESTÁ VACÍO, ES CRÍTICO.

    SALIDA JSON:
    {
        "score": 0-100,
        "status": "optimal" (>80), "warning" (50-80), "critical" (<50),
        "feedback": "Comentario corto con tono de Sheriff (duro pero justo).",
        "missingCoverage": ["Viernes Noche (Falta 1)", "Sábado Noche (Vacío)"]
    }
    `;

    return await generateJson(prompt);
};

/**
 * Generates NEW shifts to fix coverage gaps
 */
export const generateScheduleFix = async (currentShifts: any[], riders: any[], missingCoverage: string[]): Promise<{
    newShifts: {
        riderId: string;
        startDay: string; // "YYYY-MM-DD"
        startHour: number;
        duration: number;
        reason: string;
    }[];
    explanation: string;
} | null> => {

    const ridersList = riders.map(r => `${r.id} (${r.fullName})`).join(', ');
    const issues = missingCoverage.join('\n- ');

    // Simplify shifts to reduce tokens
    const scheduleSummary = currentShifts.map(s => {
        const start = new Date(s.startAt);
        const day = start.toLocaleDateString('es-ES', { weekday: 'short' });
        const date = s.startAt.split('T')[0];
        return `${date} (${day}) ${start.getHours()}h-${new Date(s.endAt).getHours()}h: ${s.riderName}`;
    }).join('\n');

    const prompt = `
    ACTUA COMO: Jefe de Operaciones de Repaart.
    TAREA: Genera NUEVOS turnos para solucionar estos problemas de cobertura.

    PROBLEMAS DETECTADOS:
    - ${issues}

    RIDERS DISPONIBLES:
    ${ridersList}

    CUADRANTE ACTUAL (Para evitar solapes):
    ${scheduleSummary}

    REGLAS:
    1. Crea turnos lógicos (min 3h, max 5h).
    2. Prioriza huecos de Viernes/Sábado Noche (20:00-23:00).
    3. NO solapes turnos para el mismo rider.
    4. Usa solo los riders de la lista.

    SALIDA JSON:
    {
        "newShifts": [
            {
                "riderId": "ID_DEL_RIDER",
                "startDay": "YYYY-MM-DD",
                "startHour": 20,
                "duration": 4,
                "reason": "Refuerzo Viernes Noche"
            }
        ],
        "explanation": "Breve explicación de los cambios."
    }
    `;

    return await generateJson(prompt);
};

/**
 * Generates a FULL schedule based on natural language prompt
 */
export const generateFullSchedule = async (
    userPrompt: string,
    riders: any[],
    weekStart: string, // YYYY-MM-DD
    weekEnd: string // YYYY-MM-DD
): Promise<{
    shifts: {
        riderId: string;
        startDay: string; // YYYY-MM-DD
        startHour: number;
        duration: number;
        reason: string;
    }[];
    explanation: string;
} | null> => {

    const ridersList = riders.map(r => `${r.id} (${r.fullName})`).join(', ');

    const prompt = `
    ACTUA COMO: Planificador Experto de Logística "Repaart".
    TAREA: Crea un cuadrante de turnos COMPLETO para la semana del ${weekStart} al ${weekEnd}.
    
    INSTRUCCIÓN DEL USUARIO:
    "${userPrompt}"

    RECURSOS (RIDERS):
    ${ridersList}

    REGLAS DE NEGOCIO:
    1. Turnos estándar: Almuerzos (13:00-16:00 aprox) y Cenas (20:00-24:00 aprox).
    2. Evita turnos de más de 5 horas seguidas sin descanso.
    3. Distribuye equitativamente si no se dice lo contrario.
    4. Cubre SIEMPRE los picos (Viernes/Sábado Noche) con más fuerza.

    SALIDA JSON:
    {
        "shifts": [
            { "riderId": "...", "startDay": "YYYY-MM-DD", "startHour": 13, "duration": 3, "reason": "Almuerzo Lunes" }
        ],
        "explanation": "He creado una planificación centrada en..."
    }
    `;

    return await generateJson(prompt);
};
