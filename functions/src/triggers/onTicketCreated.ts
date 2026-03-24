import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini
// Assumes GEMINI_API_KEY is available in the environment variables (e.g. via .env or Firebase secrets)
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Categorías críticas que el bot NUNCA debe responder directamente
const CRITICAL_CATEGORIES = ['payment', 'legal', 'ban', 'critical', 'billing'];

export const onTicketCreated = functions
  .region('europe-west1')
  .firestore
  .document('tickets/{ticketId}')
  .onCreate(async (snap: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const ticketData = snap.data();
    const ticketId = context.params.ticketId;

    if (!ticketData) {
      console.error('No se encontraron datos en el ticket.');
      return null;
    }

    const category = ticketData.category || 'general';
    const subject = ticketData.subject || '';
    const description = ticketData.description || '';
    const userId = ticketData.userId || ticketData.createdBy || ticketData.uid || 'Unknown';

    // 1. KILL SWITCH: Filtrar categorías pre-definidas como muy críticas
    if (CRITICAL_CATEGORIES.includes(category.toLowerCase())) {
        console.log(`Ticket ${ticketId} de categoría crítica "${category}". Agente ignorando.`);
        return null;
    }

    // 2. Comprobar API Key
    if (!apiKey) {
      console.warn('GEMINI_API_KEY no está configurada. El agente no puede responder.');
      return null;
    }

    try {
        const db = admin.firestore();
        
        // --- OBTENER PERFIL DE USUARIO PARA PERSONALIZACIÓN ---
        let userName = 'Usuario';
        let userRole = 'user';
        if (userId !== 'Unknown') {
            const userSnap = await db.collection('users').doc(userId).get();
            if (userSnap.exists) {
                const userData = userSnap.data();
                userName = userData?.displayName || userData?.name || 'Cliente';
                userRole = userData?.role || 'user';
            }
        }

        // 3. RAG: Obtener contexto de Academy
        const lessonsSnap = await db.collection('academy_lessons').where('status', '==', 'published').get();
        let contextKnowledge = '';
        
        lessonsSnap.docs.forEach((doc: FirebaseFirestore.DocumentData) => {
            const lesson = doc.data();
            contextKnowledge += `\n--- Lección: ${lesson.title || 'Sin Título'} ---\n${lesson.content || ''}\n`;
        });

        // 4. Preparar Prompt para Gemini 1.5 Flash
        const prompt = `
Eres Hermès, el agente automático de soporte de primer nivel de Repaart.
Estás hablando directamente con: ${userName} (Rol en la plataforma: ${userRole}).

REGLAS ESTRICTAS:
1. Responde de forma cordial, empática, concisa y sin rodeos. Emplea formato Markdown.
2. NUNCA inventes información. Basa tu respuesta ÚNICAMENTE en la Base de Conocimiento.
3. Si el usuario está muy enfadado ("angry"), si la duda no está en la BBDD, o si es algo grave, DEBES escalar el ticket (requiereEscalado: true).
4. El usuario ya ha creado el ticket, no le digas "pide soporte".
5. IMPORTANTE IDIOMA: Responde AL USUARIO (respuestaUsuario) EXACTAMENTE en el idioma que él haya usado. Sin embargo, tu "resumenParaAdmin" y "motivoInterno" DEBEN estar OBLIGATORIAMENTE SIEMPRE en Español, sin importar el idioma del usuario, para que el administrador logístico pueda entender el ticket.

=== BASE DE CONOCIMIENTO (REPAART ACADEMY) ===
${contextKnowledge ? contextKnowledge : '(No hay base de conocimiento disponible)'}
==============================================

=== TICKET DEL CLIENTE ===
Asunto: ${subject}
Descripción: ${description}
Categoría Asignada por Cliente: ${category}
==========================
`;

        // --- MEJORA ENTERPRISE: AUTO-TRIAGE, MULTI-LANGUAGE, ENTITY EXTRACTION Y FCR ---
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.1, 
                maxOutputTokens: 500, // Subimos a 500 para permitir las entidades y arrays
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        respuestaUsuario: {
                            type: SchemaType.STRING,
                            description: "El mensaje directo de ayuda que se le enviará en su idioma original en Markdown.",
                        },
                        requiereEscalado: {
                            type: SchemaType.BOOLEAN,
                            description: "True si el usuario está molesto, la duda no está en la BBDD, o es un problema grave.",
                        },
                        motivoInterno: {
                            type: SchemaType.STRING,
                            description: "Justificación de tu decisión. DEBE estar estrictamente en Español.",
                        },
                        categoriaCorregida: {
                            type: SchemaType.STRING,
                            description: "La categoría más precisa para el ticket (DEBE ser estrictamente una de estas palabras: operativa, finanzas, tecnico, accidente, general).",
                        },
                        sentimientoCliente: {
                            type: SchemaType.STRING,
                            description: "Nivel de enfado detectado en el mensaje (DEBE ser estrictamente una de estas palabras: calm, confused, frustrated, angry).",
                        },
                        resumenParaAdmin: {
                            type: SchemaType.STRING,
                            description: "Resumen súper corto (TL;DR de 15 palabras) del problema. DEBE estar estrictamente en Español, aunque el ticket esté en otro idioma.",
                        },
                        idiomaUsuario: {
                            type: SchemaType.STRING,
                            description: "Código ISO de dos letras del idioma original usado por el cliente en su ticket (ej: 'es', 'en', 'fr', 'pt', 'ar').",
                        },
                        entidadesDetectadas: {
                            type: SchemaType.ARRAY,
                            items: { type: SchemaType.STRING },
                            description: "Lista de IDs de pedido, matrículas de motos o ubicaciones clave mencionadas. Lista vacía `[]` si no menciona ninguna.",
                        },
                        probabilidadDeCierreFCR: {
                            type: SchemaType.NUMBER,
                            description: "Probabilidad del 0 al 100 de que tu respuesta solucione definitivamente el problema sin que el usuario tenga que responder (First Contact Resolution).",
                        }
                    },
                    required: [
                        "respuestaUsuario", "requiereEscalado", "motivoInterno", 
                        "categoriaCorregida", "sentimientoCliente", "resumenParaAdmin",
                        "idiomaUsuario", "entidadesDetectadas", "probabilidadDeCierreFCR"
                    ],
                },
            }
        });

        // 5. Llamada a Gemini
        const result = await model.generateContent(prompt);
        const jsonResponse = JSON.parse(result.response.text());

        const isAngry = jsonResponse.sentimientoCliente === 'angry';
        const finalUrgency = (jsonResponse.requiereEscalado || isAngry) ? 'high' : (ticketData.urgency || 'normal');

        // Formato enriquecido para el Triage Log Interno
        const logElements = [
            `🔒 **[HERMÈS TRIAGE EXTREME]**`,
            jsonResponse.requiereEscalado ? `> **Motivo Escalamiento:** ${jsonResponse.motivoInterno}` : `> **Resuelto:** ${jsonResponse.motivoInterno}`,
            `- **Categoría Ajustada:** ${jsonResponse.categoriaCorregida}`,
            `- **Sentimiento:** ${jsonResponse.sentimientoCliente.toUpperCase()}`,
            `- **Idioma Cliente:** ${jsonResponse.idiomaUsuario.toUpperCase()}`,
            `- **FCR Predicho:** ${jsonResponse.probabilidadDeCierreFCR}%`,
            `- **Entidades Extraídas:** ${jsonResponse.entidadesDetectadas.length > 0 ? jsonResponse.entidadesDetectadas.join(', ') : 'Ninguna'}`
        ].join('\\n');
        
        // El bot emite una nota interna de auditoría para los agentes SIEMPRE
        await db.collection(`tickets/${ticketId}/messages`).add({
            text: logElements,
            senderId: 'system',
            senderRole: 'admin', 
            senderName: 'Hermès System',
            isInternal: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            readBy: ['agent']
        });

        // 6. Análisis de resultados: ¿Se escala o se resuelve?
        if (jsonResponse.requiereEscalado) {
            // Y un mini mensaje para el cliente en su idioma
            await db.collection(`tickets/${ticketId}/messages`).add({
                text: `He derivado tu solicitud con prioridad a nuestros especialistas para que lo revisen en detalle. Te contestaremos pronto.`,
                senderId: 'agent',
                senderRole: 'agent',
                senderName: '✨ IA de Servicio',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                readBy: ['agent']
            });
        } else {
            // El bot pudo responderlo correctamente
            await db.collection(`tickets/${ticketId}/messages`).add({
                text: jsonResponse.respuestaUsuario,
                senderId: 'agent',
                senderRole: 'agent',
                senderName: '✨ IA de Servicio',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                readBy: ['agent']
            });
        }

        // 7. Actualizar el estado del Ticket enriquecido (Super Triage)
        await snap.ref.update({
            status: jsonResponse.requiereEscalado ? 'open' : 'pending_user',
            category: jsonResponse.categoriaCorregida, 
            urgency: finalUrgency,
            aiSummary: jsonResponse.resumenParaAdmin,
            sentiment: jsonResponse.sentimientoCliente,
            language: jsonResponse.idiomaUsuario,
            extractedEntities: jsonResponse.entidadesDetectadas || [],
            fcrProbability: jsonResponse.probabilidadDeCierreFCR || 0,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastResponseAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Ticket ${ticketId} procesado exitosamente por Hermès. FCR Prometido: ${jsonResponse.probabilidadDeCierreFCR}%`);
        return null;

    } catch (error) {
        console.error(`Error procesando ticket ${ticketId} con Gemini:`, error);
        return null;
    }
});
