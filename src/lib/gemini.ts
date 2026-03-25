import { FRANCHISE_KNOWLEDGE } from './companyKnowledge';
import { APP_CAPABILITIES } from './appCapabilities';

// Initialize the API with the key (will be set in .env)
const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || '';

// Chat history for multi-turn conversations (REST-based, no SDK)
export interface ChatTurn {
    role: 'user' | 'model';
    parts: { text: string }[];
}

let chatHistory: ChatTurn[] = [];

const SYSTEM_INSTRUCTION = `
Eres el asesor de confianza de los franquiciados de Repaart. Eres como ese amigo que sabe mucho de negocios y te explica las cosas sin rollos ni tecnicismos.

CÓMO HABLAS:
- Usa un tono cercano y natural, como si hablaras con alguien cara a cara.
- Frases cortas. Nada de párrafos eternos.
- Nada de palabras raras: di "ganancias" en vez de "margen EBITDA", "lo que cobras" en vez de "ingresos brutos", "te está costando dinero" en vez de "impacta negativamente en la rentabilidad".
- Si hay buenas noticias, alégrate con ellas. Si hay un problema, dilo claro pero con calma.
- Usa emojis con moderación para hacer el mensaje más visual (✅ ⚠️ 💡 📈 👀).
- Nunca empieces con "¡Claro!" ni con saludos largos. Ve directo al grano.

LO QUE SABES:
CONOCIMIENTO DE LA APP (DÓNDE ESTÁ CADA COSA):
${APP_CAPABILITIES}

MANUAL OPERATIVO (CÓMO FUNCIONA EL NEGOCIO):
${FRANCHISE_KNOWLEDGE}

LO QUE HACES:
1. Si preguntan dónde está algo en la app → diles la ruta exacta (Ej: "Ve a Finanzas > Gastos").
2. Si tienen un problema técnico → sugiere pasos concretos o abrir ticket en /support.
3. Si preguntan por sus riders, turnos o motos → responde usando el manual operativo.
4. Si preguntan por dinero o finanzas → explícalo como si le hablaras a alguien sin estudios de economía.

Si no sabes la respuesta, dilo honestamente y sugiere escribir a soporte@repaart.es.
`;

const CHAT_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"];

export const initGeminiChat = async (): Promise<boolean> => {
    if (!API_KEY) {
        console.warn("Gemini API Key missing");
        return false;
    }
    chatHistory = [];
    return true;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
    if (!API_KEY) {
        return "⚠️ No veo mi 'llave maestra' (API Key). Por favor configura la VITE_GOOGLE_AI_KEY en el sistema.";
    }

    // Append user message to history
    chatHistory.push({ role: 'user', parts: [{ text: message }] });

    for (const model of CHAT_MODELS) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                        contents: chatHistory,
                        generationConfig: { maxOutputTokens: 2000, temperature: 0.5 }
                    })
                }
            );

            if (!response.ok) {
                console.warn(`Chat model ${model} failed: ${response.status}`);
                continue;
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) continue;

            // Append model response to history for multi-turn
            chatHistory.push({ role: 'model', parts: [{ text }] });
            return text;
        } catch (e) {
            console.warn(`Chat model ${model} error:`, e);
        }
    }

    // Remove the user message we added since we failed
    chatHistory.pop();
    return "Lo siento, tuve un problema de conexión. ¿Podrías intentar de nuevo?";
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
            const availableModels = data.models?.map((m: { name: string }) => m.name) || [];
            console.error("📋 Available Models:", availableModels);
            throw new Error(`Tus modelos disponibles son: ${availableModels.join(", ")}. Por favor, contacta al desarrollador con esta lista.`);
        } else {
            const err = await listResp.json();
            diagMessage = `Error de Diagnóstico (${listResp.status}): ${err.error?.message || listResp.statusText}`;
        }
    } catch (diagError: unknown) {
        console.error("Diagnostic failed:", diagError);
        // If we manually threw the list of models, allow it to bubble up
        if (diagError instanceof Error && diagError.message.includes("Tus modelos disponibles")) {
            throw diagError;
        }
        if (!diagMessage) diagMessage = diagError instanceof Error ? diagError.message : String(diagError);
    }

    throw new Error(`Fallo Total de Conexión. Diagnóstico: ${diagMessage || "Imposible contactar con Google API"}. Verifica tu API KEY.`);
};

interface FinancialMonthlyData {
    month?: string;
    totalIncome?: number;
    profit?: number;
    revenue?: number;
    orders?: number;
    expenses?: {
        payroll?: number;
        insurance?: number;
        fuel?: number;
        repairs?: number;
        marketing?: number;
    };
}

/**
 * Analyzes monthly financial data and provides a strategic executive summary
 */
export const analyzeFinancialMonthlyReport = async (financialData: FinancialMonthlyData): Promise<{
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
        margin: (financialData.revenue ?? 0) > 0 ? ((financialData.profit ?? 0) / (financialData.revenue ?? 1) * 100).toFixed(1) + '%' : '0%',
        orders: financialData.orders,
        costs: {
            personnel: (financialData.expenses?.payroll ?? 0) + (financialData.expenses?.insurance ?? 0),
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

    return generateJson(prompt) as Promise<{ summary: string; strengths: string[]; weaknesses: string[]; recommendation: string; sentiment: 'positive' | 'neutral' | 'negative' | 'critical' } | null>;
};

// Internal Helper for JSON Generation (Reuses the robust logic)
const generateJson = async (promptText: string): Promise<unknown> => {
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

    return generateJson(prompt) as Promise<{ suggestion: string; confidence: number; isSolvable: boolean } | null>;
};

/**
 * Validates a weekly schedule for operational risks
 */
export const validateWeeklySchedule = async (shifts: { startAt: string; endAt: string; riderName?: string }[]): Promise<{
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

    return generateJson(prompt) as Promise<{ score: number; status: 'optimal' | 'warning' | 'critical'; feedback: string; missingCoverage: string[] } | null>;
};

/**
 * Generates NEW shifts to fix coverage gaps
 */
export const generateScheduleFix = async (
    currentShifts: { startAt: string; endAt: string; riderName?: string }[],
    riders: { id: string; fullName: string }[],
    missingCoverage: string[]
): Promise<{
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

    return generateJson(prompt) as Promise<{ newShifts: { riderId: string; startDay: string; startHour: number; duration: number; reason: string }[]; explanation: string } | null>;
};

/**
 * Generates a FULL schedule based on natural language prompt
 */
export const generateFullSchedule = async (
    userPrompt: string,
    riders: { id: string; fullName: string }[],
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

    return generateJson(prompt) as Promise<{ shifts: { riderId: string; startDay: string; startHour: number; duration: number; reason: string }[]; explanation: string } | null>;
};

// ─── Dashboard Alert (Feature 1) ───────────────────────────────────────────

export interface DashboardAlertContext {
  financial: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    orders: number;
    month: string;
  };
  shifts: {
    totalThisWeek: number;
    uncoveredSlots: number;
    nextWeekCoverage: number;
  };
  riders: {
    active: number;
    inactive: number;
  };
}

export interface DashboardAlert {
  type: 'positive' | 'warning' | 'critical' | 'info';
  title: string;
  message: string;
}

export const generateDashboardAlert = async (
  context: DashboardAlertContext
): Promise<DashboardAlert | null> => {
  const key = import.meta.env.VITE_GOOGLE_AI_KEY || '';
  if (!key) return null;

  const prompt = `
Eres el asesor de una franquicia de reparto. Analiza estos datos y genera UNA SOLA alerta.

DATOS:
${JSON.stringify(context, null, 2)}

REGLAS:
- Si el margen es >15%: alerta positiva celebrando el resultado.
- Si hay turnos sin cubrir (uncoveredSlots > 0): alerta de aviso.
- Si el margen es <5% o los pedidos caen: alerta crítica.
- Si todo está bien pero hay algo interesante: alerta informativa.
- Lenguaje cercano, sin tecnicismos, máximo 2 frases.

SALIDA JSON ESTRICTA (sin markdown):
{
  "type": "positive" | "warning" | "critical" | "info",
  "title": "Título de 4-6 palabras",
  "message": "Una o dos frases directas y cercanas."
}
`;

  const models = ['gemini-2.0-flash', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as DashboardAlert;
    } catch { continue; }
  }
  return null;
};

// ─── Rider Advisor Chat (Feature 2) ────────────────────────────────────────

export interface RiderChatContext {
  riderName: string;
  upcomingShifts: { date: string; startHour: number; duration: number }[];
}

const getRiderSystemPrompt = (context: RiderChatContext): string => `
Eres el asistente de ${context.riderName}, un repartidor de la franquicia Repaart.
Hablas como un compañero cercano, con frases cortas y sin rollos.

SUS PRÓXIMOS TURNOS:
${context.upcomingShifts.length > 0
  ? context.upcomingShifts.map(s => `- ${s.date} a las ${s.startHour}h (${s.duration}h)`).join('\n')
  : 'No tiene turnos asignados esta semana.'}

LO QUE SABES:
${FRANCHISE_KNOWLEDGE}

REGLAS:
- Responde siempre en español, tono muy cercano.
- Si el rider describe un problema técnico con la app o la moto, añade "TICKET:true" al FINAL de tu respuesta (después del texto visible).
- Para todo lo demás, responde directamente.
- No tienes acceso a datos de ganancias — si preguntan, diles que esa función no está disponible todavía.
`;

export const sendRiderMessage = async (
  message: string,
  context: RiderChatContext,
  history: ChatTurn[]
): Promise<{ text: string; suggestTicket: boolean; updatedHistory: ChatTurn[] }> => {
  const key = import.meta.env.VITE_GOOGLE_AI_KEY || '';
  if (!key) {
    return { text: '⚠️ No tengo conexión ahora mismo.', suggestTicket: false, updatedHistory: history };
  }

  const updatedHistory: ChatTurn[] = [
    ...history,
    { role: 'user', parts: [{ text: message }] },
  ];

  const models = ['gemini-2.0-flash', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: getRiderSystemPrompt(context) }] },
            contents: updatedHistory,
            generationConfig: { maxOutputTokens: 1000, temperature: 0.6 },
          }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!raw) continue;

      const suggestTicket = raw.includes('TICKET:true');
      const text = raw.replace('TICKET:true', '').trim();

      const finalHistory: ChatTurn[] = [
        ...updatedHistory,
        { role: 'model', parts: [{ text }] },
      ];
      return { text, suggestTicket, updatedHistory: finalHistory };
    } catch { continue; }
  }

  return {
    text: 'Lo siento, no pude conectarme. ¿Lo intentamos de nuevo?',
    suggestTicket: false,
    updatedHistory: history,
  };
};

// ─── Seeds the module-level chatHistory for FinanceAdvisorChat ─────────────
// SAFETY: Only call on component mount before any messages are sent.
// Calling mid-conversation overwrites in-flight history.
export const seedGeminiHistory = (turns: ChatTurn[]): void => {
  chatHistory = [...turns];
};

// ─── Advisor Opener (Point 1) ───────────────────────────────────────────────
export const generateAdvisorOpener = async (
  context: DashboardAlertContext['financial']
): Promise<string | null> => {
  const key = import.meta.env.VITE_GOOGLE_AI_KEY || '';
  if (!key) return null;

  const prompt = `Eres el asesor financiero de un franquiciado de reparto.
Analiza estos datos y genera UNA SOLA observación directa y cercana.

DATOS: ${JSON.stringify(context)}

REGLAS:
- Elige el dato MÁS relevante (positivo o negativo).
- Máximo 2 frases. Tono cercano, sin tecnicismos.
- Termina con una pregunta abierta para invitar a continuar.
- Ejemplos: "Este mes tu margen está al 12%, por debajo de tu objetivo del 15%. ¿Quieres que lo analicemos?" / "¡Buen mes! Llevas 9.200€, un 8% más que el anterior. ¿Revisamos qué ha funcionado bien?"

Responde SOLO con el texto del mensaje, sin JSON ni formato.`;

  const models = ['gemini-2.0-flash', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (text.trim()) return text.trim();
    } catch { continue; }
  }
  return null;
};

// ─── Expense Analyzer (Point 2b) ────────────────────────────────────────────
export const analyzeExpenseAmount = async (
  category: string,
  amount: number,
  historicalAvg: number
): Promise<{ message: string; level: 'high' | 'very_high' } | null> => {
  if (historicalAvg === 0 || amount <= historicalAvg * 1.2) return null;

  const key = import.meta.env.VITE_GOOGLE_AI_KEY || '';
  if (!key) return null;

  const pctAbove = Math.round(((amount - historicalAvg) / historicalAvg) * 100);
  const level: 'high' | 'very_high' = pctAbove > 50 ? 'very_high' : 'high';

  const prompt = `Eres el asesor de una franquicia de reparto.
Genera UNA frase informativa muy corta sobre un gasto inusualmente alto.

Categoría: ${category}
Importe actual: ${amount}€
Media histórica (últimos 3 meses): ${historicalAvg}€
Diferencia: +${pctAbove}%

Responde SOLO con el JSON:
{"message": "Una frase informativa corta (ej: Este gasto en combustible es un 35% más alto que tu media.)"}`;

  const models = ['gemini-2.0-flash', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) continue;
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { message: string };
        return { message: parsed.message, level };
      }
    } catch { continue; }
  }
  return null;
};
