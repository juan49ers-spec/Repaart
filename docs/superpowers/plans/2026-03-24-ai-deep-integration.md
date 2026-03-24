# AI Deep Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 3 AI improvements — contextual opener pre-generated in background, inline AI hints in shift/expense/ticket workflows, and permanent Firestore conversation memory for both advisor types.

**Architecture:** New Gemini functions are added to `src/lib/gemini.ts` following the existing REST + silent-fail pattern. A new `advisorHistoryService` persists chat history to Firestore using `arrayUnion`. Inline AI is surfaced via two new focused components (`ShiftCoverageInsight`, `TicketSolutionSuggestion`) and a hint in `ExpensesStep`. Memory integration touches `FinanceAdvisorChat` and `RiderAdvisorView` without changing the public API of `sendMessageToGemini`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Firebase Firestore, Gemini REST API (`gemini-2.0-flash` → `gemini-1.5-flash` fallback), Vitest + React Testing Library.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/gemini.ts` | Modify | Add `generateAdvisorOpener`, `analyzeExpenseAmount`, `seedGeminiHistory` |
| `src/lib/__tests__/gemini.opener.test.ts` | Create | Tests for `generateAdvisorOpener` |
| `src/lib/__tests__/gemini.expense.test.ts` | Create | Tests for `analyzeExpenseAmount` |
| `src/services/advisorHistoryService.ts` | Create | Load/append chat history from Firestore |
| `src/services/__tests__/advisorHistoryService.test.ts` | Create | Tests for service |
| `src/features/franchise/FranchiseDashboard.tsx` | Modify | Pre-generate opener, pass as prop to FinanceAdvisorChat |
| `src/features/franchise/finance/FinanceAdvisorChat.tsx` | Modify | Accept `initialMessage` prop; load/save Firestore history |
| `src/features/rider/advisor/RiderAdvisorView.tsx` | Modify | Load/save Firestore history |
| `src/features/operations/components/ShiftCoverageInsight.tsx` | Create | IA card for weekly shift coverage |
| `src/features/operations/components/__tests__/ShiftCoverageInsight.test.tsx` | Create | Component tests |
| `src/features/scheduler/DeliveryScheduler.tsx` | Modify | Render `ShiftCoverageInsight` after cuadrante |
| `src/features/franchise/finance/components/ExpensesStep.tsx` | Modify | Accept `historicalAvg` prop, show inline hint on blur |
| `src/features/franchise/support/components/TicketSolutionSuggestion.tsx` | Create | IA card for ticket self-resolution |
| `src/features/franchise/support/components/__tests__/TicketSolutionSuggestion.test.tsx` | Create | Component tests |
| `src/features/franchise/support/NewTicketForm.tsx` | Modify | Replace inline suggestion with `<TicketSolutionSuggestion />` |

---

## Task 1: Gemini functions — `generateAdvisorOpener` + `analyzeExpenseAmount` + `seedGeminiHistory`

**Files:**
- Modify: `src/lib/gemini.ts`
- Create: `src/lib/__tests__/gemini.opener.test.ts`
- Create: `src/lib/__tests__/gemini.expense.test.ts`

**Context:** `gemini.ts` already exports `DashboardAlertContext` (with a `financial` sub-object) and uses the pattern `vi.stubEnv('VITE_GOOGLE_AI_KEY', 'test-key-123')` + `vi.stubGlobal('fetch', vi.fn())` in tests. See `src/lib/__tests__/gemini.dashboard.test.ts` for the exact test pattern to follow.

The module-level `chatHistory: ChatTurn[]` singleton needs a setter so that `FinanceAdvisorChat` can seed it from Firestore-loaded history without breaking the existing `sendMessageToGemini` function.

---

- [ ] **Step 1: Write failing tests for `generateAdvisorOpener`**

Create `src/lib/__tests__/gemini.opener.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_GOOGLE_AI_KEY', 'test-key-123');

import { generateAdvisorOpener } from '../gemini';
import type { DashboardAlertContext } from '../gemini';

const mockFinancial: DashboardAlertContext['financial'] = {
  revenue: 12000,
  expenses: 8000,
  profit: 4000,
  margin: 33,
  orders: 180,
  month: '2026-03',
};

describe('generateAdvisorOpener', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('returns a string when API responds with text', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Tu margen está al 33%. ¿Lo analizamos?' }] } }]
      })
    });
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBe('Tu margen está al 33%. ¿Lo analizamos?');
  });

  it('returns null when API key is missing', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_KEY', '');
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBeNull();
  });

  it('returns null on network error (silent fail)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('timeout'));
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBeNull();
  });

  it('falls back to second model if first fails', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Buen mes. ¿Revisamos?' }] } }]
        })
      });
    const result = await generateAdvisorOpener(mockFinancial);
    expect(result).toBe('Buen mes. ¿Revisamos?');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/gemini.opener.test.ts
```
Expected: FAIL — `generateAdvisorOpener is not a function`

- [ ] **Step 3: Write failing tests for `analyzeExpenseAmount`**

Create `src/lib/__tests__/gemini.expense.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_GOOGLE_AI_KEY', 'test-key-123');

import { analyzeExpenseAmount } from '../gemini';

describe('analyzeExpenseAmount', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('returns a result when amount is >20% above avg', async () => {
    const mockResult = { message: 'Este gasto en combustible es un 35% más alto.', level: 'high' as const };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockResult) }] } }]
      })
    });
    const result = await analyzeExpenseAmount('fuel', 270, 200);
    expect(result).toEqual(mockResult);
  });

  it('returns null when historicalAvg is 0', async () => {
    const result = await analyzeExpenseAmount('fuel', 270, 0);
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns null when amount is not above threshold', async () => {
    const result = await analyzeExpenseAmount('fuel', 210, 200);
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns null on API error (silent fail)', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('error'));
    const result = await analyzeExpenseAmount('fuel', 400, 200);
    expect(result).toBeNull();
  });

  it('returns null when API key is missing', async () => {
    vi.stubEnv('VITE_GOOGLE_AI_KEY', '');
    const result = await analyzeExpenseAmount('fuel', 400, 200);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/gemini.expense.test.ts
```
Expected: FAIL — `analyzeExpenseAmount is not a function`

- [ ] **Step 5: Add `generateAdvisorOpener`, `analyzeExpenseAmount`, and `seedGeminiHistory` to `src/lib/gemini.ts`**

Append at the end of `src/lib/gemini.ts`:

```typescript
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

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
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
): Promise<{ message: string; level: 'normal' | 'high' | 'very_high' } | null> => {
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
{"message": "Una frase informativa corta (ej: Este gasto en combustible es un 35% más alto que tu media.)", "level": "${level}"}`;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
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
      if (match) return JSON.parse(match[0]) as { message: string; level: 'normal' | 'high' | 'very_high' };
    } catch { continue; }
  }
  return null;
};
```

- [ ] **Step 6: Run both test files to verify they pass**

```bash
npx vitest run src/lib/__tests__/gemini.opener.test.ts src/lib/__tests__/gemini.expense.test.ts
```
Expected: all tests PASS

- [ ] **Step 7: Verify full test suite still passes**

```bash
npx vitest run
```
Expected: same pass count as before (all existing tests still pass)

- [ ] **Step 8: Commit**

```bash
git add src/lib/gemini.ts src/lib/__tests__/gemini.opener.test.ts src/lib/__tests__/gemini.expense.test.ts
git commit -m "feat(gemini): add generateAdvisorOpener, analyzeExpenseAmount, seedGeminiHistory"
```

---

## Task 2: `advisorHistoryService`

**Files:**
- Create: `src/services/advisorHistoryService.ts`
- Create: `src/services/__tests__/advisorHistoryService.test.ts`

**Context:** Services live in `src/services/`. Firebase `db` is imported from `src/lib/firebase`. The project convention is `merge: true` in `setDoc` and `arrayUnion` for appending to arrays. See `src/services/notificationService.ts` for a service that writes to Firestore.

Firestore paths:
- Franchise chat: `users/{userId}/advisorHistory` (document, field: `messages`)
- Rider chat: `users/{userId}/riderAdvisorHistory` (document, field: `messages`)

---

- [ ] **Step 1: Write failing tests**

Create `src/services/__tests__/advisorHistoryService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  arrayUnion: vi.fn((...args) => args),
}));

import { advisorHistoryService } from '../advisorHistoryService';
import { getDoc, setDoc, arrayUnion } from 'firebase/firestore';

describe('advisorHistoryService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('load', () => {
    it('returns messages array when document exists', async () => {
      const messages = [
        { role: 'user', text: 'hola', timestamp: '2026-03-24T10:00:00Z' },
        { role: 'model', text: 'hola!', timestamp: '2026-03-24T10:00:01Z' },
      ];
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ messages }),
      });

      const result = await advisorHistoryService.load('user123', 'franchise');
      expect(result).toEqual(messages);
    });

    it('returns empty array when document does not exist', async () => {
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await advisorHistoryService.load('user123', 'franchise');
      expect(result).toEqual([]);
    });

    it('returns empty array on error (silent fail)', async () => {
      (getDoc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Firestore offline'));
      const result = await advisorHistoryService.load('user123', 'franchise');
      expect(result).toEqual([]);
    });

    it('uses riderAdvisorHistory path for rider type', async () => {
      const { doc } = await import('firebase/firestore');
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ exists: () => false });

      await advisorHistoryService.load('user123', 'rider');
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123', 'riderAdvisorHistory');
    });

    it('uses advisorHistory path for franchise type', async () => {
      const { doc } = await import('firebase/firestore');
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ exists: () => false });

      await advisorHistoryService.load('user123', 'franchise');
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123', 'advisorHistory');
    });
  });

  describe('append', () => {
    it('calls setDoc with arrayUnion for each message', async () => {
      (setDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      const msgs = [{ role: 'user' as const, text: 'test', timestamp: '2026-03-24T10:00:00Z' }];

      await advisorHistoryService.append('user123', 'franchise', msgs);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        { messages: arrayUnion(...msgs) },
        { merge: true }
      );
    });

    it('fails silently on Firestore error', async () => {
      (setDoc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));
      await expect(
        advisorHistoryService.append('user123', 'franchise', [])
      ).resolves.toBeUndefined();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/services/__tests__/advisorHistoryService.test.ts
```
Expected: FAIL — `advisorHistoryService is not defined`

- [ ] **Step 3: Implement `advisorHistoryService`**

Create `src/services/advisorHistoryService.ts`:

```typescript
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';

export interface AdvisorMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string; // ISO
}

const getDocPath = (userId: string, type: 'franchise' | 'rider') =>
  type === 'rider'
    ? doc(db, 'users', userId, 'riderAdvisorHistory')
    : doc(db, 'users', userId, 'advisorHistory');

export const advisorHistoryService = {
  async load(userId: string, type: 'franchise' | 'rider'): Promise<AdvisorMessage[]> {
    try {
      const ref = getDocPath(userId, type);
      const snap = await getDoc(ref);
      if (!snap.exists()) return [];
      return (snap.data().messages as AdvisorMessage[]) ?? [];
    } catch {
      return [];
    }
  },

  async append(
    userId: string,
    type: 'franchise' | 'rider',
    messages: AdvisorMessage[]
  ): Promise<void> {
    try {
      const ref = getDocPath(userId, type);
      await setDoc(ref, { messages: arrayUnion(...messages) }, { merge: true });
    } catch {
      // silent fail — history is non-critical
    }
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/services/__tests__/advisorHistoryService.test.ts
```
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/advisorHistoryService.ts src/services/__tests__/advisorHistoryService.test.ts
git commit -m "feat(services): add advisorHistoryService for Firestore chat memory"
```

---

## Task 3: Opener contextual — FranchiseDashboard + FinanceAdvisorChat

**Files:**
- Modify: `src/features/franchise/FranchiseDashboard.tsx`
- Modify: `src/features/franchise/finance/FinanceAdvisorChat.tsx`

**Context:**
- `FranchiseDashboard.tsx` renders `<FinanceAdvisorChat>` and has access to `report`, `revenue`, `totalExpenses`, `orders`, and `displayedMonth`.
- `FinanceAdvisorChat` initializes messages in a `useEffect` at lines ~260-275 using `generateSmartGreeting`. Adding `initialMessage` will short-circuit this to use the AI-generated opener.
- When `initialMessage` is present, use it as the first message content and skip `generateSmartGreeting`. Default suggestions should be empty when `initialMessage` is present (the AI already ends with a question).
- `FinanceAdvisorChatProps` is defined at line 22 — add `initialMessage?: string` there.

---

- [ ] **Step 1: Add `initialMessage` prop to `FinanceAdvisorChat`**

**Do this first** so step 2 doesn't produce a TypeScript error.

In `src/features/franchise/finance/FinanceAdvisorChat.tsx`:

1. Add to `FinanceAdvisorChatProps` interface (after `onOpenSimulator?` line ~48):
```typescript
initialMessage?: string;
```

2. Destructure it in the component function signature (after `onOpenSimulator` line ~73):
```typescript
onOpenSimulator,
initialMessage,
```

3. In the messages initialization effect (lines ~260-275), change the condition to prefer `initialMessage`:
```typescript
useEffect(() => {
  if (messages.length === 0 && financialData) {
    const content = initialMessage ?? generateSmartGreeting(financialData, insights);
    setMessages([{
      id: 'welcome',
      type: 'assistant',
      content,
      timestamp: new Date(),
      suggestions: initialMessage ? [] : [
        '¿Cómo voy este mes?',
        '¿Qué debo mejorar?',
        '¿Llegaré a mi objetivo?',
      ],
    }]);
  }
}, [financialData, insights, messages.length, generateSmartGreeting, initialMessage]);
```

- [ ] **Step 2: Add `advisorOpener` state + background generation to `FranchiseDashboard.tsx`**

In `src/features/franchise/finance/FinanceAdvisorChat.tsx`:

1. Add to `FinanceAdvisorChatProps` interface (after `onOpenSimulator?` line ~48):
```typescript
initialMessage?: string;
```

2. Destructure it in the component function signature (after `onOpenSimulator` line ~73):
```typescript
onOpenSimulator,
initialMessage,
```

3. In the messages initialization effect (lines ~260-275), change the condition to prefer `initialMessage`:
```typescript
useEffect(() => {
  if (messages.length === 0 && financialData) {
    const content = initialMessage ?? generateSmartGreeting(financialData, insights);
    setMessages([{
      id: 'welcome',
      type: 'assistant',
      content,
      timestamp: new Date(),
      suggestions: initialMessage ? [] : [
        '¿Cómo voy este mes?',
        '¿Qué debo mejorar?',
        '¿Llegaré a mi objetivo?',
      ],
    }]);
  }
}, [financialData, insights, messages.length, generateSmartGreeting, initialMessage]);
```

- [ ] **Step 3: Build to verify no TypeScript errors**

```bash
npx tsc --noEmit
```
Expected: 0 new errors (existing 10 pre-existing warnings unchanged)

- [ ] **Step 4: Commit**

```bash
git add src/features/franchise/FranchiseDashboard.tsx src/features/franchise/finance/FinanceAdvisorChat.tsx
git commit -m "feat: add contextual opener pre-generated in background for finance advisor"
```

---

## Task 4: Firestore memory — FinanceAdvisorChat

**Files:**
- Modify: `src/features/franchise/finance/FinanceAdvisorChat.tsx`

**Context:**
- `sendMessageToGemini` uses a module-level `chatHistory` singleton (not stateless like `sendRiderMessage`).
- Task 1 added `seedGeminiHistory(turns: ChatTurn[])` to populate it externally.
- `FinanceAdvisorChat` must: (a) load history from Firestore on mount → seed module-level history; (b) after each AI reply, save the new user+model pair to Firestore.
- The component uses `useAuth()` — check how it's imported (it's not currently imported; you'll need to add it: `import { useAuth } from '../../../context/AuthContext'`).
- `AdvisorMessage` maps to `ChatTurn` as: `{ role, parts: [{ text: msg.text }] }`.
- Load the last 20 messages (`.slice(-20)`) for Gemini context budget.
- Save happens fire-and-forget after each exchange — never block the UI.

---

- [ ] **Step 1: Add imports**

In `FinanceAdvisorChat.tsx`, add these imports:
```typescript
import { useAuth } from '../../../context/AuthContext';
import { advisorHistoryService, AdvisorMessage } from '../../../services/advisorHistoryService';
import { seedGeminiHistory, ChatTurn } from '../../../lib/gemini';
```

(Note: `ChatTurn` may already be imported via `sendMessageToGemini`. Check and add only if missing.)

- [ ] **Step 2: Add Firestore load on mount**

In the component body, add `const { user } = useAuth();` near the top of the component.

Add a `useEffect` that loads history once when the component mounts (add near the other effects, around line ~252):
```typescript
useEffect(() => {
  if (!user?.uid) return;
  advisorHistoryService.load(user.uid, 'franchise')
    .then(history => {
      const turns: ChatTurn[] = history
        .slice(-20)
        .map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      seedGeminiHistory(turns);
    })
    .catch(() => {}); // silent fail
}, [user?.uid]);
```

- [ ] **Step 3: Save to Firestore after each exchange**

Find the `sendMessage` function (line 282). It looks like:
```typescript
const sendMessage = useCallback(async (text: string) => {
  // ...
  const response = await generateAIResponse(text, financialData, trendData || [], messages);
  const assistantMessage: Message = { ..., content: response.content, ... };
  setMessages(prev => [...prev, assistantMessage]);
  // ADD THE PERSISTENCE HERE ↓
}, [...]);
```

Add the following fire-and-forget block right after `setMessages(prev => [...prev, assistantMessage])` (line ~308), **inside the `try` block**:

```typescript
// Fire-and-forget — never await, never block UI
if (user?.uid) {
  const now = new Date().toISOString();
  const toSave: AdvisorMessage[] = [
    { role: 'user', text, timestamp: now },
    { role: 'model', text: response.content, timestamp: now },
  ];
  advisorHistoryService.append(user.uid, 'franchise', toSave).catch(() => {});
}
```

Variable names are exact: `text` (function parameter = user message), `response.content` (AI reply string from `generateAIResponse`).

- [ ] **Step 4: Build**

```bash
npx tsc --noEmit
```
Expected: 0 new errors

- [ ] **Step 5: Commit**

```bash
git add src/features/franchise/finance/FinanceAdvisorChat.tsx
git commit -m "feat: add Firestore session memory to FinanceAdvisorChat"
```

---

## Task 5: Firestore memory — RiderAdvisorView

**Files:**
- Modify: `src/features/rider/advisor/RiderAdvisorView.tsx`

**Context:**
- `RiderAdvisorView` already has `chatHistory: ChatTurn[]` as local state (unlike FinanceAdvisorChat which uses the singleton).
- On mount: load from Firestore → `setChatHistory(loaded.slice(-20).map(m => ({role, parts:[{text:m.text}]})))`.
- On send: after receiving the AI reply and calling `setChatHistory(updatedHistory)`, also call `advisorHistoryService.append` fire-and-forget.
- The user is available from `useAuth()` which is already imported.

---

- [ ] **Step 1: Add imports**

In `RiderAdvisorView.tsx`, add:
```typescript
import { advisorHistoryService, AdvisorMessage } from '../../../services/advisorHistoryService';
```

- [ ] **Step 2: Add Firestore load on mount**

Add a `useEffect` after the existing `useEffect` for scrolling (around line ~37):
```typescript
useEffect(() => {
  if (!user?.uid) return;
  advisorHistoryService.load(user.uid, 'rider')
    .then(history => {
      const turns: ChatTurn[] = history
        .slice(-20)
        .map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      setChatHistory(turns);
    })
    .catch(() => {}); // silent fail
}, [user?.uid]);
```

- [ ] **Step 3: Save to Firestore after each exchange**

Find `handleSend` (line 63). It looks like:
```typescript
const handleSend = async (text: string) => {
  // ...
  const { text: reply, suggestTicket: ticket, updatedHistory } = await sendRiderMessage(...);
  setChatHistory(updatedHistory);
  setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
  // ADD PERSISTENCE HERE ↓
  setSuggestTicket(ticket);
  setLoading(false);
};
```

Add the following after `setChatHistory(updatedHistory)` (before `setSuggestTicket`):

```typescript
if (user?.uid) {
  const now = new Date().toISOString();
  const toSave: AdvisorMessage[] = [
    { role: 'user', text, timestamp: now },
    { role: 'model', text: reply, timestamp: now },
  ];
  advisorHistoryService.append(user.uid, 'rider', toSave).catch(() => {});
}
```

Variable names are exact: `text` (function parameter = user input), `reply` (destructured from `sendRiderMessage` return as `text: reply`).

- [ ] **Step 4: Build**

```bash
npx tsc --noEmit
```
Expected: 0 new errors

- [ ] **Step 5: Run full tests**

```bash
npx vitest run
```
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/features/rider/advisor/RiderAdvisorView.tsx
git commit -m "feat: add Firestore session memory to RiderAdvisorView"
```

---

## Task 6: `ShiftCoverageInsight` component + DeliveryScheduler integration

**Files:**
- Create: `src/features/operations/components/ShiftCoverageInsight.tsx`
- Create: `src/features/operations/components/__tests__/ShiftCoverageInsight.test.tsx`
- Modify: `src/features/scheduler/DeliveryScheduler.tsx`

**Context:**
- `validateWeeklySchedule(shifts)` already exists in `src/lib/gemini.ts`. Returns `{ score, status: 'optimal'|'warning'|'critical', feedback, missingCoverage: string[] } | null`.
- `DeliveryScheduler` has `mergedShifts: Shift[]` (from `src/schemas/scheduler`). The `Shift` type has `startAt: string` and `endAt: string`.
- `ShiftCoverageInsight` props: `shifts: { startAt: string; endAt: string; riderName?: string }[]`.
- Show skeleton while loading; show nothing on empty shifts or AI failure; render below the cuadrante grid.
- In `DeliveryScheduler.tsx`, pass `mergedShifts` directly (they satisfy the props shape). Render `<ShiftCoverageInsight>` after the main scheduler grid, near the bottom of the JSX return.
- The `src/features/operations/components/` directory already exists (it has `KpiCard.tsx` and `OperationsTabs.tsx`).

---

- [ ] **Step 1: Write failing tests**

Create `src/features/operations/components/__tests__/ShiftCoverageInsight.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../../../lib/gemini', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/gemini')>();
  return {
    ...actual,
    validateWeeklySchedule: vi.fn(),
  };
});

import { ShiftCoverageInsight } from '../ShiftCoverageInsight';
import { validateWeeklySchedule } from '../../../../lib/gemini';

const mockShifts = [
  { startAt: '2026-03-24T20:00:00Z', endAt: '2026-03-24T23:00:00Z', riderName: 'Carlos' },
];

describe('ShiftCoverageInsight', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders nothing when shifts array is empty', () => {
    const { container } = render(<ShiftCoverageInsight shifts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows skeleton while loading', () => {
    (validateWeeklySchedule as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<ShiftCoverageInsight shifts={mockShifts} />);
    expect(screen.getByTestId('coverage-skeleton')).toBeInTheDocument();
  });

  it('renders optimal card with green style', async () => {
    (validateWeeklySchedule as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      score: 90,
      status: 'optimal',
      feedback: '¡Cuadrante perfecto!',
      missingCoverage: [],
    });
    render(<ShiftCoverageInsight shifts={mockShifts} />);
    await waitFor(() => {
      expect(screen.getByText('¡Cuadrante perfecto!')).toBeInTheDocument();
    });
  });

  it('renders warning card with missing coverage list', async () => {
    (validateWeeklySchedule as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      score: 60,
      status: 'warning',
      feedback: 'Hay algunos huecos.',
      missingCoverage: ['Viernes Noche (Falta 1)'],
    });
    render(<ShiftCoverageInsight shifts={mockShifts} />);
    await waitFor(() => {
      expect(screen.getByText('Viernes Noche (Falta 1)')).toBeInTheDocument();
    });
  });

  it('renders nothing when AI fails (silent fail)', async () => {
    (validateWeeklySchedule as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const { container } = render(<ShiftCoverageInsight shifts={mockShifts} />);
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/features/operations/components/__tests__/ShiftCoverageInsight.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement `ShiftCoverageInsight`**

Create `src/features/operations/components/ShiftCoverageInsight.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { validateWeeklySchedule } from '../../../lib/gemini';

interface ShiftCoverageInsightProps {
  shifts: { startAt: string; endAt: string; riderName?: string }[];
}

type CoverageResult = {
  score: number;
  status: 'optimal' | 'warning' | 'critical';
  feedback: string;
  missingCoverage: string[];
};

const STATUS_STYLES = {
  optimal: {
    border: 'border-l-green-400',
    bg: 'bg-green-50',
    icon: <CheckCircle className="w-4 h-4 text-green-600" />,
    badge: 'text-green-700',
  },
  warning: {
    border: 'border-l-amber-400',
    bg: 'bg-amber-50',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    badge: 'text-amber-700',
  },
  critical: {
    border: 'border-l-red-400',
    bg: 'bg-red-50',
    icon: <AlertCircle className="w-4 h-4 text-red-600" />,
    badge: 'text-red-700',
  },
};

export const ShiftCoverageInsight: React.FC<ShiftCoverageInsightProps> = ({ shifts }) => {
  const [result, setResult] = useState<CoverageResult | null | 'loading'>(
    shifts.length > 0 ? 'loading' : null
  );

  useEffect(() => {
    if (shifts.length === 0) { setResult(null); return; }
    setResult('loading');
    validateWeeklySchedule(shifts)
      .then(r => setResult(r))
      .catch(() => setResult(null));
  }, [shifts]);

  if (!result) return null;

  if (result === 'loading') {
    return (
      <div data-testid="coverage-skeleton" className="mt-4 mx-4 h-16 rounded-xl bg-slate-100 animate-pulse" />
    );
  }

  const styles = STATUS_STYLES[result.status];

  return (
    <div className={`mt-4 mx-4 rounded-xl border border-slate-200 border-l-4 ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-slate-400" />
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.badge}`}>{result.feedback}</p>
          {result.missingCoverage.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {result.missingCoverage.map((item, i) => (
                <li key={i} className="text-xs text-slate-600">• {item}</li>
              ))}
            </ul>
          )}
        </div>
        <span className={`text-xs font-bold shrink-0 ${styles.badge}`}>{result.score}/100</span>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/features/operations/components/__tests__/ShiftCoverageInsight.test.tsx
```
Expected: all tests PASS

- [ ] **Step 5: Add `ShiftCoverageInsight` to `DeliveryScheduler.tsx`**

In `src/features/scheduler/DeliveryScheduler.tsx`:

1. Add import (with other imports at the top):
```typescript
import { ShiftCoverageInsight } from '../operations/components/ShiftCoverageInsight';
```

2. Find the main JSX return block. `DeliveryScheduler` renders a full-page scheduler grid. Add the component as the last element inside the main wrapper div (before the closing tag of the outermost `<div>`):

```tsx
<ShiftCoverageInsight
  shifts={mergedShifts.map(s => ({
    startAt: s.startAt,
    endAt: s.endAt,
    riderName: (s as { riderName?: string }).riderName,
  }))}
/>
```

- [ ] **Step 6: Build + full tests**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: 0 new TS errors, all tests pass

- [ ] **Step 7: Commit**

```bash
git add src/features/operations/components/ShiftCoverageInsight.tsx src/features/operations/components/__tests__/ShiftCoverageInsight.test.tsx src/features/scheduler/DeliveryScheduler.tsx
git commit -m "feat: add ShiftCoverageInsight IA card for weekly schedule coverage"
```

---

## Task 7: `TicketSolutionSuggestion` component + `NewTicketForm` refactor

**Files:**
- Create: `src/features/franchise/support/components/TicketSolutionSuggestion.tsx`
- Create: `src/features/franchise/support/components/__tests__/TicketSolutionSuggestion.test.tsx`
- Modify: `src/features/franchise/support/NewTicketForm.tsx`

**Context:**
- `suggestSupportSolution(subject, description)` already exists in `src/lib/gemini.ts`. Returns `{ suggestion, confidence, isSolvable } | null`.
- `NewTicketForm.tsx` currently has inline logic: `suggestion` state (lines ~45), a `useEffect` debounce (lines ~47-73), and the rendered card (lines ~189-215). The new component extracts all of this.
- `TicketSolutionSuggestion` triggers when `description.length >= 20` (debounced 1s). If `isSolvable === false` or AI fails: renders nothing.
- The "Marcar como resuelto" button calls `onResolved()` (closes the form).
- `src/features/franchise/support/components/` directory does NOT yet exist — it must be created (just creating the file creates it).

---

- [ ] **Step 1: Write failing tests**

Create `src/features/franchise/support/components/__tests__/TicketSolutionSuggestion.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

vi.mock('../../../../../lib/gemini', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../lib/gemini')>();
  return {
    ...actual,
    suggestSupportSolution: vi.fn(),
  };
});

import { TicketSolutionSuggestion } from '../TicketSolutionSuggestion';
import { suggestSupportSolution } from '../../../../../lib/gemini';

vi.useFakeTimers();

describe('TicketSolutionSuggestion', () => {
  const onResolved = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('renders nothing when description is shorter than 20 chars', () => {
    const { container } = render(
      <TicketSolutionSuggestion subject="test" description="short" onResolved={onResolved} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(suggestSupportSolution).not.toHaveBeenCalled();
  });

  it('shows suggestion card when isSolvable is true', async () => {
    (suggestSupportSolution as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      suggestion: 'Reinicia el datáfono 10 segundos.',
      confidence: 85,
      isSolvable: true,
    });

    render(
      <TicketSolutionSuggestion
        subject="Datáfono no conecta"
        description="El datáfono no se conecta a la red y no funciona"
        onResolved={onResolved}
      />
    );

    await act(async () => { vi.advanceTimersByTime(1100); });
    await waitFor(() => {
      expect(screen.getByText('Reinicia el datáfono 10 segundos.')).toBeInTheDocument();
    });
  });

  it('renders nothing when isSolvable is false', async () => {
    (suggestSupportSolution as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      suggestion: '',
      confidence: 10,
      isSolvable: false,
    });

    const { container } = render(
      <TicketSolutionSuggestion
        subject="Consulta general"
        description="Tengo una pregunta sobre la facturación mensual"
        onResolved={onResolved}
      />
    );

    await act(async () => { vi.advanceTimersByTime(1100); });
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('renders nothing when API returns null', async () => {
    (suggestSupportSolution as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const { container } = render(
      <TicketSolutionSuggestion
        subject="Test"
        description="Esta descripcion tiene mas de veinte caracteres"
        onResolved={onResolved}
      />
    );
    await act(async () => { vi.advanceTimersByTime(1100); });
    await waitFor(() => { expect(container).toBeEmptyDOMElement(); });
  });

  it('calls onResolved when "Marcar como resuelto" is clicked', async () => {
    (suggestSupportSolution as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      suggestion: 'Reinicia la app.',
      confidence: 80,
      isSolvable: true,
    });

    render(
      <TicketSolutionSuggestion
        subject="App"
        description="La aplicacion del rider no carga los turnos correctamente"
        onResolved={onResolved}
      />
    );

    await act(async () => { vi.advanceTimersByTime(1100); });
    await waitFor(() => { screen.getByText('Reinicia la app.'); });

    screen.getByRole('button', { name: /resuelto/i }).click();
    expect(onResolved).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/features/franchise/support/components/__tests__/TicketSolutionSuggestion.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implement `TicketSolutionSuggestion`**

Create `src/features/franchise/support/components/TicketSolutionSuggestion.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import { suggestSupportSolution } from '../../../../lib/gemini';

interface TicketSolutionSuggestionProps {
  subject: string;
  description: string;
  onResolved: () => void;
}

export const TicketSolutionSuggestion: React.FC<TicketSolutionSuggestionProps> = ({
  subject,
  description,
  onResolved,
}) => {
  const [suggestion, setSuggestion] = useState<{ text: string; confidence: number } | null>(null);

  useEffect(() => {
    if (description.length < 20) { setSuggestion(null); return; }

    const timer = setTimeout(async () => {
      const result = await suggestSupportSolution(subject || 'Consulta General', description);
      if (result?.isSolvable) {
        setSuggestion({ text: result.suggestion, confidence: result.confidence });
      } else {
        setSuggestion(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [subject, description]);

  if (!suggestion) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex gap-3 shadow-sm">
      <div className="p-2 bg-white rounded-lg shadow-sm shrink-0 h-fit">
        <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="text-xs font-bold text-emerald-800 mb-1">
            💡 Posible solución
          </h4>
          <span className="text-[10px] text-emerald-600 font-semibold">{suggestion.confidence}% confianza</span>
        </div>
        <p className="text-xs text-emerald-700">{suggestion.text}</p>
        <button
          type="button"
          onClick={onResolved}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Marcar como resuelto
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/features/franchise/support/components/__tests__/TicketSolutionSuggestion.test.tsx
```
Expected: all tests PASS

- [ ] **Step 5: Refactor `NewTicketForm.tsx` to use `TicketSolutionSuggestion`**

In `src/features/franchise/support/NewTicketForm.tsx`:

1. Add import:
```typescript
import { TicketSolutionSuggestion } from './components/TicketSolutionSuggestion';
```

2. Remove the inline AI state and effect:
   - Remove `const [suggestion, setSuggestion] = useState<...>` (line ~45)
   - Remove the entire `useEffect` block for AI auto-resolution (lines ~47-73)
   - Remove the `suggestSupportSolution` import (line ~7)

3. Replace the inline suggestion banner in JSX (lines ~189-215, the `{suggestion && (...)}` block) with:
```tsx
<TicketSolutionSuggestion
  subject={formData.subject}
  description={formData.description}
  onResolved={() => { if (onClose) onClose(); }}
/>
```

Keep the wrapping `div.lg:col-span-12` if it was part of the grid layout.

- [ ] **Step 6: Build + full tests**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: 0 new errors, all tests pass

- [ ] **Step 7: Commit**

```bash
git add src/features/franchise/support/components/TicketSolutionSuggestion.tsx src/features/franchise/support/components/__tests__/TicketSolutionSuggestion.test.tsx src/features/franchise/support/NewTicketForm.tsx
git commit -m "feat: extract TicketSolutionSuggestion component, refactor NewTicketForm"
```

---

## Task 8: `analyzeExpenseAmount` integration in `ExpensesStep`

**Files:**
- Modify: `src/features/franchise/finance/components/ExpensesStep.tsx`
- Modify: `src/features/franchise/FinancialControlCenter.tsx` (pass `historicalAvg` prop)

**Context:**
- `ExpensesStep` currently accepts: `expenses`, `setExpenses`, `totalHours`, `setTotalHours`, `totalExpenses`, and others (see lines ~35-45).
- Add an optional prop `historicalAvg?: Record<string, number>` mapping category keys to their 3-month averages.
- `FinancialControlCenter.tsx` renders `<ExpensesStep>` (around line ~178) — pass `historicalAvg={{}}` for now (no historical data available yet; the feature will show nothing but is wired).
- Trigger `analyzeExpenseAmount` on the `onBlur` of `ProfessionalInput` fields — or since `ProfessionalInput` may not support `onBlur`, use a wrapper approach with a local state for the hint.
- The simplest approach: add a `useEffect` that watches `expenses` and computes hints whenever a value changes AND exceeds the threshold. Store the hint per-category: `Record<string, string>` (category → hint message) and display below each field.
- `level: 'very_high'` → amber text (`text-amber-600`); `level: 'high'` → gray text (`text-slate-500`).
- Categories to cover: `fuel`, `repairs`, `payroll`, `marketing`, `insurance` — the most commonly volatile ones.

---

- [ ] **Step 1: Add `historicalAvg` prop to `ExpensesStep`**

In `ExpensesStep.tsx`, add to `ExpensesStepProps` interface (after `totalExpenses` line ~40):
```typescript
historicalAvg?: Record<string, number>;
```

Add to the function destructuring:
```typescript
historicalAvg = {},
```

- [ ] **Step 2: Import `analyzeExpenseAmount`**

```typescript
import { analyzeExpenseAmount } from '../../../../lib/gemini';
```

- [ ] **Step 3: Add hint state and effect**

In the component body, add:
```typescript
const [expenseHints, setExpenseHints] = useState<Record<string, { message: string; level: string }>>({});
```

Add a debounced effect that analyzes all tracked categories:
```typescript
useEffect(() => {
  const categoriesToCheck: Array<{ key: string; value: number | undefined }> = [
    { key: 'fuel', value: expenses.fuel },
    { key: 'repairs', value: expenses.repairs },
    { key: 'payroll', value: expenses.payroll },
    { key: 'marketing', value: expenses.marketing },
    { key: 'insurance', value: expenses.insurance },
  ];

  const timer = setTimeout(async () => {
    const updates: Record<string, { message: string; level: string }> = {};
    await Promise.all(
      categoriesToCheck.map(async ({ key, value }) => {
        const avg = historicalAvg[key] ?? 0;
        if (!value || avg === 0 || value <= avg * 1.2) return;
        const result = await analyzeExpenseAmount(key, value, avg);
        if (result) updates[key] = result;
      })
    );
    setExpenseHints(updates);
  }, 800);

  return () => clearTimeout(timer);
}, [expenses.fuel, expenses.repairs, expenses.payroll, expenses.marketing, expenses.insurance, historicalAvg]);
```

- [ ] **Step 4: Render hints below relevant fields**

For each of the 5 categories, find its `ProfessionalInput` in `ExpensesStep.tsx` and add the hint immediately after it:

**`fuel` — line ~187** (`label="Gasto Gasolina"`):
```tsx
{expenseHints.fuel && (
  <p className={`text-xs mt-1 ${expenseHints.fuel.level === 'very_high' ? 'text-amber-600' : 'text-slate-500'}`}>
    ℹ️ {expenseHints.fuel.message}
  </p>
)}
```

**`payroll` — line ~168** (`label="Salarios Netos"`):
```tsx
{expenseHints.payroll && (
  <p className={`text-xs mt-1 ${expenseHints.payroll.level === 'very_high' ? 'text-amber-600' : 'text-slate-500'}`}>
    ℹ️ {expenseHints.payroll.message}
  </p>
)}
```

**`insurance` — line ~209** (`label="Seguros RC/Flota"`):
```tsx
{expenseHints.insurance && (
  <p className={`text-xs mt-1 ${expenseHints.insurance.level === 'very_high' ? 'text-amber-600' : 'text-slate-500'}`}>
    ℹ️ {expenseHints.insurance.message}
  </p>
)}
```

**`repairs` — line ~210** (`label="Mantenimiento"`):
```tsx
{expenseHints.repairs && (
  <p className={`text-xs mt-1 ${expenseHints.repairs.level === 'very_high' ? 'text-amber-600' : 'text-slate-500'}`}>
    ℹ️ {expenseHints.repairs.message}
  </p>
)}
```

**`marketing` — line ~211** (`label="Marketing"`):
```tsx
{expenseHints.marketing && (
  <p className={`text-xs mt-1 ${expenseHints.marketing.level === 'very_high' ? 'text-amber-600' : 'text-slate-500'}`}>
    ℹ️ {expenseHints.marketing.message}
  </p>
)}
```

- [ ] **Step 5: Pass `historicalAvg={}` from `FinancialControlCenter`**

In `FinancialControlCenter.tsx`, find the `<ExpensesStep` render (line ~178) and add:
```tsx
historicalAvg={{}}
```

This wires the integration without breaking anything. Real data can be injected later when historical per-category data is available from the service layer.

- [ ] **Step 6: Build + full tests**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: 0 new TypeScript errors, all tests pass

- [ ] **Step 7: Final verification**

```bash
npm run build
```
Expected: build succeeds

- [ ] **Step 8: Commit**

```bash
git add src/features/franchise/finance/components/ExpensesStep.tsx src/features/franchise/FinancialControlCenter.tsx
git commit -m "feat: add analyzeExpenseAmount inline hint in ExpensesStep"
```

---

## Final check

After all 8 tasks are complete:

- [ ] Run full test suite: `npx vitest run` — all tests pass
- [ ] Run build: `npm run build` — no errors
- [ ] Run TypeScript: `npx tsc --noEmit` — 0 new errors

Then use **superpowers:finishing-a-development-branch** to complete the feature branch.
