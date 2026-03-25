import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockRunner = vi.fn();
vi.mock('firebase/functions', () => ({
  httpsCallable: () => mockRunner,
}));
vi.mock('../firebase', () => ({ functions: {} }));

import { sendRiderMessage } from '../gemini';

const mockContext = {
  riderName: 'Carlos',
  upcomingShifts: [{ date: '2026-03-24', startHour: 20, duration: 4 }],
};

describe('sendRiderMessage', () => {
  beforeEach(() => {
    mockRunner.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns text response and history is updated', async () => {
    mockRunner.mockResolvedValueOnce({
      data: {
        candidates: [{ content: { parts: [{ text: 'Hola! El lunes trabajas a las 20h.' }] } }]
      }
    });

    const result = await sendRiderMessage('¿Cuándo trabajo?', mockContext, []);
    expect(result.text).toBe('Hola! El lunes trabajas a las 20h.');
    expect(result.suggestTicket).toBe(false);
    expect(result.updatedHistory).toHaveLength(2);
  });

  it('detects TICKET:true flag and removes it from text', async () => {
    mockRunner.mockResolvedValueOnce({
      data: {
        candidates: [{ content: { parts: [{ text: 'Voy a revisar eso ahora mismo. TICKET:true' }] } }]
      }
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
    mockRunner.mockResolvedValueOnce({
      data: {
        candidates: [{ content: { parts: [{ text: 'Trabajas el viernes.' }] } }]
      }
    });

    const result = await sendRiderMessage('¿Y el viernes?', mockContext, existingHistory);
    expect(result.updatedHistory).toHaveLength(4);
  });

  it('returns connection error and unchanged history on proxy failure', async () => {
    mockRunner.mockRejectedValueOnce(new Error('timeout'));
    const result = await sendRiderMessage('Hola', mockContext, []);
    expect(result.text).toContain('conectarme');
    expect(result.suggestTicket).toBe(false);
    expect(result.updatedHistory).toHaveLength(0);
  });
});
