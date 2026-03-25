export interface AIDefenceResult {
  isSafe: boolean;
  sanitizedText: string;
  threats: string[];
}

/**
 * Patrones de seguridad ligeros inspirados en @claude-flow/aidefence
 */
const JAILBREAK_PATTERNS = [
  /ignora(r| las)? instrucciones/i,
  /ignore( all)? previous instructions/i,
  /bypass/i,
  /actua como/i,
  /eres ahora/i,
  /modo (desarrollador|diablo|dan)/i,
  /developer mode/i
];

const PII_REDACTORS = [
  {
    // Patrón simple de email
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replace: '[EMAIL-REDACTED]'
  },
  {
    // Patrón simple para tarjetas de crédito (16 dígitos) o IBANs básicos
    // Simplificado para evitar falsos positivos con series numéricas comunes
    regex: /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,
    replace: '[CC-REDACTED]'
  },
  {
    // DNI / NIE básico (español)
    regex: /\b[XYZ]?\d{5,8}[A-Z]\b/gi,
    replace: '[ID-REDACTED]'
  }
];

export function sanitizePrompt(text: string): AIDefenceResult {
  const result: AIDefenceResult = {
    isSafe: true,
    sanitizedText: text,
    threats: []
  };

  if (!text) return result;

  // 1. Detección de amenazas (Injection)
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(text)) {
      result.isSafe = false;
      result.threats.push('Jailbreak/Prompt-Injection-Attempt');
      break; // Fast fail if we find one
    }
  }

  // 2. Extracción de PII (Redaction)
  let cleanedText = text;
  for (const redactor of PII_REDACTORS) {
    if (redactor.regex.test(cleanedText)) {
      // Registrar que hemos quitado PII pero sin declararlo unsafe
      if (!result.threats.includes('PII-Detected')) {
         result.threats.push('PII-Detected');
      }
      cleanedText = cleanedText.replace(redactor.regex, redactor.replace);
    }
  }

  result.sanitizedText = cleanedText;
  
  return result;
}

/**
 * Escanea la estructura completa de mensajes de Gemini
 * (Gemini usa parts: [ { text: "..." } ])
 */
export function deepSanitizeGeminiBody(requestBody: any): { body: any; isSafe: boolean; threats: string[] } {
  const clonedBody = JSON.parse(JSON.stringify(requestBody));
  const threatsFound: string[] = [];
  let safe = true;

  if (clonedBody.contents && Array.isArray(clonedBody.contents)) {
    for (const content of clonedBody.contents) {
      if (content.parts && Array.isArray(content.parts)) {
        for (const part of content.parts) {
          if (part.text && typeof part.text === 'string') {
             const scan = sanitizePrompt(part.text);
             part.text = scan.sanitizedText;
             
             if (!scan.isSafe) safe = false;
             if (scan.threats.length > 0) {
               scan.threats.forEach(t => {
                 if (!threatsFound.includes(t)) threatsFound.push(t);
               });
             }
          }
        }
      }
    }
  }

  // Si también hay system_instruction
  if (clonedBody.systemInstruction?.parts) {
     for (const part of clonedBody.systemInstruction.parts) {
        if (part.text && typeof part.text === 'string') {
           const scan = sanitizePrompt(part.text);
           part.text = scan.sanitizedText;
           if (!scan.isSafe) safe = false;
           if (scan.threats.length > 0) {
              scan.threats.forEach(t => {
                if (!threatsFound.includes(t)) threatsFound.push(t);
              });
           }
        }
     }
  }

  return {
    body: clonedBody,
    isSafe: safe,
    threats: threatsFound
  };
}
