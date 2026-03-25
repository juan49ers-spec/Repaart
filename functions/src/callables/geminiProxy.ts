import * as logger from 'firebase-functions/logger';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { deepSanitizeGeminiBody } from '../utils/aiDefence';

export const callGeminiProxy = onCall({
  enforceAppCheck: false,
  secrets: ["GOOGLE_AI_KEY"]
}, async (request) => {
  // Authentication check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to use the AI proxy');
  }

  const { model, requestBody } = request.data;
  // Fallback to process.env if defineSecret is not injected correctly during local emulators
  const apiKey = process.env.GOOGLE_AI_KEY;

  if (!apiKey) {
      logger.error('GOOGLE_AI_KEY secret is not configured.');
      throw new HttpsError('internal', 'AI Service not properly configured.');
  }

  if (!model || !requestBody) {
      throw new HttpsError('invalid-argument', 'Model and requestBody are required parameters.');
  }

  if (!model.startsWith('gemini-')) {
     throw new HttpsError('invalid-argument', 'Only gemini models are permitted.');
  }

  // 🛡️ AIDefence: Promt Injection & PII Scanner
  const scanResult = deepSanitizeGeminiBody(requestBody);
  if (!scanResult.isSafe) {
      logger.warn(`AIDefence Blocked Request - User: ${request.auth.uid}`, { threats: scanResult.threats });
      throw new HttpsError('failed-precondition', 'AIDefence: Petición rechazada por políticas de seguridad.');
  }
  if (scanResult.threats.length > 0) {
      logger.info(`AIDefence Sanitize - User: ${request.auth.uid}`, { threats: scanResult.threats });
  }

  const safeBody = scanResult.body;

  try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(safeBody)
      });

      if (!response.ok) {
          const errorResp = await response.text();
          logger.error(`Gemini API Error: Status ${response.status} - ${errorResp}`);
          if (response.status === 429) {
             throw new HttpsError('resource-exhausted', 'Gemini rate limit exceeded (429)');
          }
          throw new HttpsError('internal', `Gemini request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;

  } catch (error) {
       logger.error('Proxy Error calling Gemini', error);
       throw new HttpsError('internal', 'Failed to proxy request to Gemini');
  }
});
