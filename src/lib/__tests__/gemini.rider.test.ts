// src/lib/__tests__/gemini.rider.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_GOOGLE_AI_KEY', 'test-key-123');

import { sendRiderMessage } from '../gemini';

const mockContext = {
  riderName: 'Carlos',
  upcomingShifts: [{ date: '2026-03-24', startHour: 20, duration: 4 }],
};

describe('sendRiderMessage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns text response and history is updated', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Hola! El lunes trabajas a las 20h.' }] } }]
      })
    });

    const result = await sendRiderMessage('¿Cuándo trabajo?', mockContext, []);
    expect(result.text).toBe('Hola! El lunes trabajas a las 20h.');
    expect(result.suggestTicket).toBe(false);
    expect(result.updatedHistory).toHaveLength(2);
  });

  it('detects TICKET:true flag and removes it from text', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Voy a revisar eso ahora mismo. TICKET:true' }] } }]
      })
    });

    const result = await sendRiderMessage('La app no me deja fichar', mockContext, []);
    expect(result.suggestTicket).toBe(true);
    expect(result.text).not.toContain('TICKET:true');
    expect(result.text).toBe('Voy a revisar eso ahora mismo.');
  });

  it('preserves existing history in updatedHistory', async () => {
    const existingHistory = [
      { role: 'user' as const, parts: [{ text: 'hola' }] },
      { role: 'model' as const, parts: [{ text: '¡Hola! ¿En qué te ayudo?' }] },
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Trabajas el viernes.' }] } }]
      })
    });

    const result = await sendRiderMessage('¿Y el viernes?', mockContext, existingHistory);
    expect(result.updatedHistory).toHaveLength(4);
  });

  it('returns connection error and unchanged history on network failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('timeout'));
    const result = await sendRiderMessage('Hola', mockContext, []);
    expect(result.text).toContain('conectarme');
    expect(result.suggestTicket).toBe(false);
    expect(result.updatedHistory).toHaveLength(0);
  });

  it('returns no-key message when API key is missing', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_KEY', '');
    const result = await sendRiderMessage('Hola', mockContext, []);
    expect(result.text).toContain('conexión');
  });
});
