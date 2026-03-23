# AI Proactive Alerts + Rider Advisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a proactive AI alert banner to the franchise dashboard and a dedicated AI advisor tab for riders.

**Architecture:** Feature 1 adds `generateDashboardAlert()` to `gemini.ts` and a self-contained `DashboardAlertBanner` component that renders at the top of `FranchiseDashboardView`. Feature 2 adds `sendRiderMessage()` (stateless, history-as-parameter pattern) to `gemini.ts` and a `RiderAdvisorView` wired into a new 4th tab in `RiderLayout`. Both features fail silently if Gemini is unavailable.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vitest + React Testing Library, Google Gemini REST API (no SDK), Firebase Firestore, Lucide React icons.

---

## Part A: Feature 1 — Dashboard Alert Banner

---

### Task 1: Export `ChatTurn` + add `generateDashboardAlert` to `gemini.ts`

**Files:**
- Modify: `src/lib/gemini.ts`
- Create: `src/lib/__tests__/gemini.dashboard.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// src/lib/__tests__/gemini.dashboard.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock import.meta.env
vi.stubEnv('VITE_GOOGLE_AI_KEY', 'test-key-123');

// We import AFTER stubbing env
const { generateDashboardAlert } = await import('../gemini');

const mockContext = {
  financial: { revenue: 10000, expenses: 7000, profit: 3000, margin: 30, orders: 150, month: '2026-03' },
  shifts: { totalThisWeek: 20, uncoveredSlots: 2, nextWeekCoverage: 85 },
  riders: { active: 5, inactive: 1 },
};

describe('generateDashboardAlert', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a DashboardAlert when API responds with valid JSON', async () => {
    const mockAlert = { type: 'positive', title: '¡Buen margen este mes!', message: 'Tu margen está al 30%, muy por encima de lo normal.' };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockAlert) }] } }]
      })
    });

    const result = await generateDashboardAlert(mockContext);
    expect(result).toEqual(mockAlert);
  });

  it('returns null when API key is missing', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_KEY', '');
    const { generateDashboardAlert: fn } = await import('../gemini');
    const result = await fn(mockContext);
    expect(result).toBeNull();
  });

  it('returns null on network error (silent fail)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    const result = await generateDashboardAlert(mockContext);
    expect(result).toBeNull();
  });

  it('falls back to second model if first fails', async () => {
    const mockAlert = { type: 'warning', title: 'Turnos sin cubrir', message: 'Tienes 2 huecos esta semana.' };
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(mockAlert) }] } }]
        })
      });

    const result = await generateDashboardAlert(mockContext);
    expect(result).toEqual(mockAlert);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (function not defined)**

```bash
npx vitest run src/lib/__tests__/gemini.dashboard.test.ts
```

Expected: FAIL with "generateDashboardAlert is not a function" or similar.

- [ ] **Step 3: Export `ChatTurn` and add `generateDashboardAlert` + types to `gemini.ts`**

Add at line 6 (after the existing `ChatTurn` interface definition), change `interface ChatTurn` to `export interface ChatTurn`:

```typescript
// Change this (line ~8 in gemini.ts):
interface ChatTurn {
    role: 'user' | 'model';
    parts: { text: string }[];
}

// To:
export interface ChatTurn {
    role: 'user' | 'model';
    parts: { text: string }[];
}
```

Then add these types and function at the END of `gemini.ts`, before the final closing:

```typescript
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

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
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
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/lib/__tests__/gemini.dashboard.test.ts
```

Expected: 4/4 PASS.

- [ ] **Step 5: Run full test suite — confirm no regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/gemini.ts src/lib/__tests__/gemini.dashboard.test.ts
git commit -m "feat(gemini): add generateDashboardAlert + export ChatTurn"
```

---

### Task 2: Build `DashboardAlertBanner` component

**Files:**
- Create: `src/features/franchise/dashboard/components/DashboardAlertBanner.tsx`
- Create: `src/features/franchise/dashboard/components/__tests__/DashboardAlertBanner.test.tsx`

- [ ] **Step 1: Create test file**

```typescript
// src/features/franchise/dashboard/components/__tests__/DashboardAlertBanner.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DashboardAlertBanner } from '../DashboardAlertBanner';

// Mock the gemini module
vi.mock('../../../../../lib/gemini', () => ({
  generateDashboardAlert: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    TrendingUp: (props: Record<string, unknown>) => <svg data-testid="icon-trending-up" {...props} />,
    AlertTriangle: (props: Record<string, unknown>) => <svg data-testid="icon-alert-triangle" {...props} />,
    AlertCircle: (props: Record<string, unknown>) => <svg data-testid="icon-alert-circle" {...props} />,
    Lightbulb: (props: Record<string, unknown>) => <svg data-testid="icon-lightbulb" {...props} />,
    X: (props: Record<string, unknown>) => <svg data-testid="icon-x" {...props} />,
    Bot: (props: Record<string, unknown>) => <svg data-testid="icon-bot" {...props} />,
  };
});

import { generateDashboardAlert } from '../../../../../lib/gemini';

const baseProps = {
  franchiseId: 'franchise-1',
  financialData: { revenue: 10000, expenses: 7000, profit: 3000, margin: 30, orders: 150, month: '2026-03' },
  shiftsData: { totalThisWeek: 20, uncoveredSlots: 0, nextWeekCoverage: 90 },
  ridersData: { active: 5, inactive: 1 },
  onOpenAdvisor: vi.fn(),
};

describe('DashboardAlertBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton while loading', () => {
    (generateDashboardAlert as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {})); // never resolves
    render(<DashboardAlertBanner {...baseProps} />);
    expect(screen.getByTestId('alert-skeleton')).toBeInTheDocument();
  });

  it('renders alert title and message after load', async () => {
    (generateDashboardAlert as ReturnType<typeof vi.fn>).mockResolvedValue({
      type: 'positive',
      title: '¡Buen margen este mes!',
      message: 'Estás al 30%, muy por encima de la media.',
    });
    render(<DashboardAlertBanner {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByText('¡Buen margen este mes!')).toBeInTheDocument();
      expect(screen.getByText('Estás al 30%, muy por encima de la media.')).toBeInTheDocument();
    });
  });

  it('renders nothing when generateDashboardAlert returns null', async () => {
    (generateDashboardAlert as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { container } = render(<DashboardAlertBanner {...baseProps} />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders nothing when financialData is null', async () => {
    const { container } = render(<DashboardAlertBanner {...baseProps} financialData={null} />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('calls onOpenAdvisor when advisor button is clicked', async () => {
    (generateDashboardAlert as ReturnType<typeof vi.fn>).mockResolvedValue({
      type: 'info',
      title: 'Todo en orden',
      message: 'Esta semana va bien.',
    });
    render(<DashboardAlertBanner {...baseProps} />);
    await waitFor(() => screen.getByText('Todo en orden'));
    fireEvent.click(screen.getByRole('button', { name: /asesor/i }));
    expect(baseProps.onOpenAdvisor).toHaveBeenCalled();
  });

  it('dismisses banner when X is clicked', async () => {
    (generateDashboardAlert as ReturnType<typeof vi.fn>).mockResolvedValue({
      type: 'warning',
      title: 'Hay huecos esta semana',
      message: 'Tienes 2 turnos sin cubrir.',
    });
    const { container } = render(<DashboardAlertBanner {...baseProps} />);
    await waitFor(() => screen.getByText('Hay huecos esta semana'));
    fireEvent.click(screen.getByTitle('Descartar'));
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/features/franchise/dashboard/components/__tests__/DashboardAlertBanner.test.tsx
```

Expected: FAIL — component file doesn't exist.

- [ ] **Step 3: Create `DashboardAlertBanner.tsx`**

```typescript
// src/features/franchise/dashboard/components/DashboardAlertBanner.tsx
import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, AlertCircle, Lightbulb, X, Bot } from 'lucide-react';
import { generateDashboardAlert, DashboardAlert, DashboardAlertContext } from '../../../../lib/gemini';

interface DashboardAlertBannerProps {
  franchiseId: string;
  financialData: DashboardAlertContext['financial'] | null;
  shiftsData: DashboardAlertContext['shifts'] | null;
  ridersData: DashboardAlertContext['riders'] | null;
  onOpenAdvisor?: () => void;
}

const TYPE_CONFIG = {
  positive: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    icon: TrendingUp,
    iconColor: 'text-green-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    icon: Lightbulb,
    iconColor: 'text-blue-600',
  },
} as const;

export const DashboardAlertBanner: React.FC<DashboardAlertBannerProps> = ({
  financialData,
  shiftsData,
  ridersData,
  onOpenAdvisor,
}) => {
  const [alert, setAlert] = useState<DashboardAlert | null | 'loading'>('loading');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!financialData) {
      setAlert(null);
      return;
    }

    const context: DashboardAlertContext = {
      financial: financialData,
      shifts: shiftsData ?? { totalThisWeek: 0, uncoveredSlots: 0, nextWeekCoverage: 100 },
      riders: ridersData ?? { active: 0, inactive: 0 },
    };

    generateDashboardAlert(context).then(setAlert);
  }, [financialData, shiftsData, ridersData]);

  if (dismissed || alert === null) return null;

  if (alert === 'loading') {
    return (
      <div data-testid="alert-skeleton" className="mx-4 mb-4 h-16 rounded-xl bg-slate-100 animate-pulse" />
    );
  }

  const { bg, border, icon: Icon, iconColor } = TYPE_CONFIG[alert.type];

  return (
    <div className={`mx-4 mb-4 flex items-start gap-3 rounded-xl border-l-4 p-4 ${bg} ${border}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">{alert.title}</p>
        <p className="text-slate-600 text-sm mt-0.5">{alert.message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onOpenAdvisor && (
          <button
            onClick={onOpenAdvisor}
            className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Bot className="h-3.5 w-3.5" />
            Hablar con el asesor
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          title="Descartar"
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default DashboardAlertBanner;
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/features/franchise/dashboard/components/__tests__/DashboardAlertBanner.test.tsx
```

Expected: 6/6 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/franchise/dashboard/components/DashboardAlertBanner.tsx src/features/franchise/dashboard/components/__tests__/DashboardAlertBanner.test.tsx
git commit -m "feat(dashboard): add DashboardAlertBanner component"
```

---

### Task 3: Integrate `DashboardAlertBanner` into `FranchiseDashboardView`

**Files:**
- Modify: `src/features/franchise/FranchiseDashboardView.tsx`

- [ ] **Step 1: Read the current top of the file to find exact import block and JSX return**

Read lines 1-120 of `src/features/franchise/FranchiseDashboardView.tsx` to confirm current import list and where the JSX return begins.

- [ ] **Step 2: Add import**

In `src/features/franchise/FranchiseDashboardView.tsx`, add the import after the existing component imports (e.g., after `DynamicBanner`):

```typescript
import { DashboardAlertBanner } from './dashboard/components/DashboardAlertBanner';
```

- [ ] **Step 3: Compute shiftsData stub**

The banner needs `shiftsData`. FranchiseDashboardView doesn't currently load shift counts. Use a stub with zeroed values — the AI will still work with just financial context. Add this derived constant inside the component body (after destructuring props):

```typescript
// Derived context for alert banner (shifts loaded separately in banner if needed)
const alertFinancialData = report ? {
  revenue,
  expenses: totalExpenses,
  profit: revenue - totalExpenses,
  margin: revenue > 0 ? ((revenue - totalExpenses) / revenue) * 100 : 0,
  orders: orders ?? 0,
  month: effectiveMonth,
} : null;
```

- [ ] **Step 4: Add banner to JSX**

Find the first `<div` in the JSX return of `FranchiseDashboardView` (the outermost container). Add `<DashboardAlertBanner />` as the first child inside, before `<DynamicBanner>` or whichever is first. Example:

```tsx
// Add right after the opening container div, before other content:
<DashboardAlertBanner
  franchiseId={franchiseId ?? ''}
  financialData={alertFinancialData}
  shiftsData={null}
  ridersData={null}
  onOpenAdvisor={() => setIsAdvisorOpen(true)}
/>
```

- [ ] **Step 5: Run build to confirm no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: 0 new errors (there may be pre-existing ones per CLAUDE.md).

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/franchise/FranchiseDashboardView.tsx
git commit -m "feat(dashboard): integrate DashboardAlertBanner into FranchiseDashboardView"
```

---

## Part B: Feature 2 — Rider Advisor Tab

---

### Task 4: Add `sendRiderMessage` to `gemini.ts`

**Files:**
- Modify: `src/lib/gemini.ts`
- Create: `src/lib/__tests__/gemini.rider.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// src/lib/__tests__/gemini.rider.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_GOOGLE_AI_KEY', 'test-key-123');

import { sendRiderMessage } from '../gemini';

const mockContext = {
  riderName: 'Carlos',
  upcomingShifts: [
    { date: '2026-03-24', startHour: 20, duration: 4 },
  ],
};

describe('sendRiderMessage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns text response and empty history is updated', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Hola! El lunes trabajas a las 20h.' }] } }]
      })
    });

    const result = await sendRiderMessage('¿Cuándo trabajo?', mockContext, []);
    expect(result.text).toBe('Hola! El lunes trabajas a las 20h.');
    expect(result.suggestTicket).toBe(false);
    expect(result.updatedHistory).toHaveLength(2); // user + model
  });

  it('detects TICKET:true flag in response', async () => {
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
    expect(result.updatedHistory).toHaveLength(4); // 2 existing + user + model
  });

  it('returns connection error message on network failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('timeout'));
    const result = await sendRiderMessage('Hola', mockContext, []);
    expect(result.text).toContain('conectarme');
    expect(result.suggestTicket).toBe(false);
    expect(result.updatedHistory).toHaveLength(0); // history unchanged on failure
  });

  it('returns no-key message when API key is missing', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_KEY', '');
    const result = await sendRiderMessage('Hola', mockContext, []);
    expect(result.text).toContain('conexión');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/lib/__tests__/gemini.rider.test.ts
```

Expected: FAIL — `sendRiderMessage` not exported.

- [ ] **Step 3: Add `sendRiderMessage` to `gemini.ts`**

Append at the END of `src/lib/gemini.ts`:

```typescript
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

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
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
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/lib/__tests__/gemini.rider.test.ts
```

Expected: 5/5 PASS.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/gemini.ts src/lib/__tests__/gemini.rider.test.ts
git commit -m "feat(gemini): add sendRiderMessage for rider advisor chat"
```

---

### Task 5: Build `RiderAdvisorView` component

**Files:**
- Create: `src/features/rider/advisor/RiderAdvisorView.tsx`
- Create: `src/features/rider/advisor/__tests__/RiderAdvisorView.test.tsx`

- [ ] **Step 1: Create test file**

```typescript
// src/features/rider/advisor/__tests__/RiderAdvisorView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../../../../lib/gemini', () => ({
  sendRiderMessage: vi.fn(),
}));

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'rider-1', displayName: 'Carlos López', franchiseId: 'f-1' },
  }),
}));

vi.mock('../../../../store/useRiderStore', () => ({
  useRiderStore: () => ({
    myShifts: [
      { id: 's1', startAt: '2026-03-24T20:00:00', endAt: '2026-03-25T00:00:00' },
    ],
  }),
}));

vi.mock('../../../../features/support/SupportService', () => ({
  supportService: { createTicket: vi.fn().mockResolvedValue('ticket-1') },
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Send: (props: Record<string, unknown>) => <svg data-testid="icon-send" {...props} />,
    Bot: (props: Record<string, unknown>) => <svg data-testid="icon-bot" {...props} />,
    Ticket: (props: Record<string, unknown>) => <svg data-testid="icon-ticket" {...props} />,
  };
});

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { RiderAdvisorView } from '../RiderAdvisorView';
import { sendRiderMessage } from '../../../../lib/gemini';
import { supportService } from '../../../../features/support/SupportService';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('RiderAdvisorView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders greeting with rider name', () => {
    render(<RiderAdvisorView />, { wrapper });
    expect(screen.getByText(/Carlos/)).toBeInTheDocument();
  });

  it('shows quick suggestion chips before first message', () => {
    render(<RiderAdvisorView />, { wrapper });
    expect(screen.getByText('¿Cuándo trabajo esta semana?')).toBeInTheDocument();
    expect(screen.getByText('¿Qué hago si tengo un accidente?')).toBeInTheDocument();
    expect(screen.getByText('Tengo un problema con la app')).toBeInTheDocument();
  });

  it('hides suggestion chips after first message is sent', async () => {
    (sendRiderMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      text: 'El lunes a las 20h.',
      suggestTicket: false,
      updatedHistory: [
        { role: 'user', parts: [{ text: '¿Cuándo trabajo esta semana?' }] },
        { role: 'model', parts: [{ text: 'El lunes a las 20h.' }] },
      ],
    });

    render(<RiderAdvisorView />, { wrapper });
    fireEvent.click(screen.getByText('¿Cuándo trabajo esta semana?'));

    await waitFor(() => {
      expect(screen.queryByText('¿Qué hago si tengo un accidente?')).not.toBeInTheDocument();
    });
  });

  it('shows AI response after sending message', async () => {
    (sendRiderMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      text: 'El lunes a las 20h.',
      suggestTicket: false,
      updatedHistory: [],
    });

    render(<RiderAdvisorView />, { wrapper });
    const input = screen.getByPlaceholderText(/pregunta/i);
    fireEvent.change(input, { target: { value: '¿Cuándo trabajo?' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('El lunes a las 20h.')).toBeInTheDocument();
    });
  });

  it('shows create ticket button when suggestTicket is true', async () => {
    (sendRiderMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      text: 'Parece un problema técnico.',
      suggestTicket: true,
      updatedHistory: [],
    });

    render(<RiderAdvisorView />, { wrapper });
    const input = screen.getByPlaceholderText(/pregunta/i);
    fireEvent.change(input, { target: { value: 'La app no abre' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ticket/i })).toBeInTheDocument();
    });
  });

  it('calls supportService.createTicket when ticket button is clicked', async () => {
    (sendRiderMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      text: 'Parece un problema técnico.',
      suggestTicket: true,
      updatedHistory: [{ role: 'user', parts: [{ text: 'La app no abre' }] }],
    });

    render(<RiderAdvisorView />, { wrapper });
    const input = screen.getByPlaceholderText(/pregunta/i);
    fireEvent.change(input, { target: { value: 'La app no abre' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => screen.getByRole('button', { name: /ticket/i }));
    fireEvent.click(screen.getByRole('button', { name: /ticket/i }));

    await waitFor(() => {
      expect(supportService.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'rider-1',
          category: 'technical',
        })
      );
    });
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/features/rider/advisor/__tests__/RiderAdvisorView.test.tsx
```

Expected: FAIL — component doesn't exist.

- [ ] **Step 3: Create `RiderAdvisorView.tsx`**

```typescript
// src/features/rider/advisor/RiderAdvisorView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useRiderStore } from '../../../store/useRiderStore';
import { sendRiderMessage, ChatTurn, RiderChatContext } from '../../../lib/gemini';
import { supportService } from '../../support/SupportService';

interface DisplayMessage {
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_SUGGESTIONS = [
  '¿Cuándo trabajo esta semana?',
  '¿Qué hago si tengo un accidente?',
  'Tengo un problema con la app',
];

export const RiderAdvisorView: React.FC = () => {
  const { user } = useAuth();
  const { myShifts } = useRiderStore();
  const riderName = user?.displayName?.split(' ')[0] ?? 'Rider';

  const [messages, setMessages] = useState<DisplayMessage[]>([
    { role: 'assistant', text: `¡Hola, ${riderName}! 👋 Pregúntame lo que necesites.` },
  ]);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestTicket, setSuggestTicket] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build rider context from existing store data
  const getRiderContext = (): RiderChatContext => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const upcomingShifts = myShifts
      .filter(s => new Date(s.startAt) >= now && new Date(s.startAt) <= weekEnd)
      .slice(0, 5)
      .map(s => {
        const start = new Date(s.startAt);
        return {
          date: start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }),
          startHour: start.getHours(),
          duration: Math.round((new Date(s.endAt).getTime() - start.getTime()) / 3600000),
        };
      });

    return { riderName, upcomingShifts };
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    setHasStarted(true);
    setInput('');
    setSuggestTicket(false);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    const { text: reply, suggestTicket: ticket, updatedHistory } = await sendRiderMessage(
      text,
      getRiderContext(),
      chatHistory
    );

    setChatHistory(updatedHistory);
    setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    setSuggestTicket(ticket);
    setLoading(false);
  };

  const handleCreateTicket = async () => {
    if (!user) return;
    const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
    const subject = `[Chat Rider] ${lastUserMsg?.parts[0]?.text?.slice(0, 60) ?? 'Problema técnico'}`;
    const body = chatHistory
      .map(m => `${m.role === 'user' ? riderName : 'Asesor'}: ${m.parts[0]?.text}`)
      .join('\n');

    try {
      await supportService.createTicket({
        userId: user.uid,
        franchiseId: user.franchiseId ?? '',
        franchiseName: '',
        subject,
        message: body,
        priority: 'normal',
        category: 'technical',
      });
      setSuggestTicket(false);
      toast.success('Ticket creado. Te responderemos pronto.');
    } catch {
      toast.error('No se pudo crear el ticket. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-700 to-orange-900 rounded-2xl p-4 mb-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-base">Hola, {riderName} 👋</h2>
            <p className="text-orange-200 text-xs">Pregúntame lo que necesites</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-orange-500 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 75}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ticket suggestion */}
        {suggestTicket && (
          <div className="flex justify-start">
            <button
              onClick={handleCreateTicket}
              className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-orange-100 transition-colors"
            >
              <Ticket className="w-4 h-4" />
              Crear ticket de soporte
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions (shown before first message) */}
      {!hasStarted && (
        <div className="flex flex-col gap-2 mb-3">
          {QUICK_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-left rounded-xl border border-orange-200 text-orange-700 bg-orange-50 px-4 py-2.5 text-sm hover:bg-orange-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(input); }}
        className="flex gap-2 mt-auto"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Pregúntame lo que quieras..."
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default RiderAdvisorView;
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/features/rider/advisor/__tests__/RiderAdvisorView.test.tsx
```

Expected: 6/6 PASS.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/rider/advisor/RiderAdvisorView.tsx src/features/rider/advisor/__tests__/RiderAdvisorView.test.tsx
git commit -m "feat(rider): add RiderAdvisorView component with chat + ticket creation"
```

---

### Task 6: Add route + "Asesor" tab to rider navigation

**Files:**
- Modify: `src/layouts/RiderLayout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `Bot` import + 4th tab to `RiderLayout.tsx`**

In `src/layouts/RiderLayout.tsx`:

Change import line 3 from:
```typescript
import { Calendar, User, LayoutDashboard } from 'lucide-react';
```
To:
```typescript
import { Calendar, User, LayoutDashboard, Bot } from 'lucide-react';
```

Add the "Asesor" tab button after the Profile tab button (after line ~91), inside the `flex justify-around` div:

```tsx
{/* Asesor Tab */}
<button
    onClick={() => navigate('/rider/advisor')}
    className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ${isActive('/rider/advisor')
        ? 'bg-orange-500/10 text-orange-400 scale-110'
        : 'text-slate-500 hover:text-slate-300'
        }`}
    title="Asesor"
>
    <Bot size={22} strokeWidth={isActive('/rider/advisor') ? 2.5 : 2} />
</button>
```

- [ ] **Step 2: Add route to `App.tsx`**

Find where rider routes are defined in `src/App.tsx` (around lines 337-352 per exploration). Add inside the rider routes section:

```tsx
import { lazy } from 'react'; // already imported

// Add lazy import near other rider view imports:
const RiderAdvisorView = lazy(() => import('./features/rider/advisor/RiderAdvisorView'));

// Add inside rider routes:
<Route path="advisor" element={<RiderAdvisorView />} />
```

Read the current rider routes section of App.tsx first to find the exact location and follow the existing pattern.

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 new errors.

- [ ] **Step 4: Run full build**

```bash
npm run build
```

Expected: `✓ built` with no new errors.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/RiderLayout.tsx src/App.tsx
git commit -m "feat(rider): add Asesor tab and /rider/advisor route"
```

---

## Final Verification

- [ ] **Run complete verification**

```bash
npm run build && npx vitest run && npx tsc --noEmit && npm run lint
```

Expected:
- Build: `✓ built`
- Tests: all pass
- TypeScript: 0 new errors
- Lint: 0 errors

- [ ] **Final commit with session notes**

```bash
git add -A
git commit -m "feat: AI proactive dashboard alerts + rider advisor tab (Feature 1 & 2)"
```
