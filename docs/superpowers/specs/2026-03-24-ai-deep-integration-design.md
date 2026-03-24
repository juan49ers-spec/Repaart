# Spec: IA Profunda — Contexto Inicial, Sugerencias Inline y Memoria

**Fecha:** 2026-03-24
**Estado:** Aprobado
**Roles afectados:** franchise, rider

---

## Resumen

Tres mejoras independientes que hacen la IA más presente y útil sin añadir complejidad visible al usuario:

1. **Opener contextual** — el asesor del franquiciado arranca con una observación directa sobre el dato más relevante del mes, pre-generada en segundo plano al cargar el dashboard.
2. **IA inline** — sugerencias IA en tres puntos del flujo de trabajo: cuadrante de turnos (prominente), registro de gastos (sutil), formulario de tickets (destacada).
3. **Memoria entre sesiones** — el historial de conversaciones se persiste en Firestore y se carga al abrir el chat, para que el asesor recuerde conversaciones anteriores.

---

## Punto 1: Opener Contextual del Asesor

### Objetivo

Cuando el franquiciado abre el chat del asesor, la primera respuesta ya está lista — generada en segundo plano mientras el dashboard cargaba. Es una observación directa sobre el dato financiero más relevante del mes.

### Flujo

```
Dashboard monta (useEffect background)
  → llama generateAdvisorOpener(financialData)
  → guarda resultado en useState<string | null>

Usuario pulsa "Abrir asesor"
  → FinanceAdvisorChat recibe prop initialMessage?: string
  → si existe: primer mensaje del asesor = initialMessage
  → si no: saludo genérico (fallback sin cambios)
```

### Nueva función: `generateAdvisorOpener`

**Ubicación:** `src/lib/gemini.ts`

**Firma:**
```typescript
export const generateAdvisorOpener = async (
  context: DashboardAlertContext['financial']
): Promise<string | null>
```

**Prompt:**
```
Eres el asesor financiero de un franquiciado de reparto.
Analiza estos datos y genera UNA SOLA observación directa y cercana.

DATOS: ${JSON.stringify(context)}

REGLAS:
- Elige el dato MÁS relevante (positivo o negativo).
- Máximo 2 frases. Tono cercano, sin tecnicismos.
- Termina con una pregunta abierta para invitar a continuar.
- Ejemplos: "Este mes tu margen está al 12%, por debajo de tu objetivo del 15%. ¿Quieres que lo analicemos?" / "¡Buen mes! Llevas 9.200€, un 8% más que el anterior. ¿Revisamos qué ha funcionado bien?"

Responde SOLO con el texto del mensaje, sin JSON ni formato.
```

**Modelos:** `gemini-2.0-flash` con fallback a `gemini-1.5-flash`.
**Fallo:** devuelve `null` — el chat abre con saludo genérico.

### Cambios en `FranchiseDashboard.tsx`

El estado `isAdvisorOpen` y la apertura del chat viven en `src/features/franchise/FranchiseDashboard.tsx` (el componente que renderiza `FinanceAdvisorChat`). Ahí se añade:

```typescript
const [advisorOpener, setAdvisorOpener] = useState<string | null>(null);

// En useEffect al montar, solo si hay datos financieros:
generateAdvisorOpener(financialData).then(setAdvisorOpener).catch(() => null);
```

### Cambio en `FinanceAdvisorChat`

Añadir prop `initialMessage?: string`. Si existe, se usa como primer mensaje del historial del modelo en lugar del saludo hardcodeado actual:

```typescript
const [messages, setMessages] = useState<Message[]>([
  {
    id: 'opener',
    type: 'assistant',
    content: initialMessage ?? '¡Hola! Soy REPAART AI. ¿En qué te ayudo?',
    timestamp: new Date(),
    suggestions: initialMessage ? [] : DEFAULT_SUGGESTIONS,
  }
]);
```

---

## Punto 2: IA Inline en el Flujo de Trabajo

### 2a — Cuadrante de Turnos (prominente)

**Dónde:** Componente del cuadrante semanal (scheduler/operations). La función `validateWeeklySchedule` ya existe en `gemini.ts` y devuelve `{ score, status, feedback, missingCoverage }`.

**Comportamiento:**
- Al cargar el cuadrante semanal con turnos, se llama `validateWeeklySchedule` en background.
- Resultado mostrado en un card debajo del cuadrante: icono IA + feedback del "Sheriff de Operaciones" + lista de huecos detectados.
- Si `status === 'optimal'`: card verde con mensaje positivo.
- Si `status === 'warning'` o `'critical'`: card ámbar/rojo con los huecos en una lista.
- **Componente nuevo:** `ShiftCoverageInsight` en el módulo de operaciones.

**Props:**
```typescript
interface ShiftCoverageInsightProps {
  shifts: { startAt: string; endAt: string; riderName?: string }[];
}
```

**Carga:** skeleton mientras genera; si falla, no renderiza nada.

---

### 2b — Registro de Gastos (sutil)

**Dónde:** Formulario de registro/edición de gastos en el módulo de finanzas. La función `generateJson` interna de `gemini.ts` se puede reutilizar, pero se necesita una función pública nueva.

**Nueva función:** `analyzeExpenseAmount`

```typescript
export const analyzeExpenseAmount = async (
  category: string,     // 'fuel' | 'repairs' | 'payroll' | 'marketing' | ...
  amount: number,
  historicalAvg: number // media de los últimos 3 meses para esa categoría
): Promise<{ message: string; level: 'normal' | 'high' | 'very_high' } | null>
```

**Fuente de `historicalAvg`:**
La vista de registro de gastos (`ExpensesStep.tsx` dentro del flujo de entrada mensual) tiene acceso al historial de meses anteriores cargado desde Firestore. El componente padre calcula la media de los últimos 3 meses para cada categoría y la pasa al campo. Si no hay historial disponible (primer mes), `historicalAvg` es `0` y no se llama la función.

**Comportamiento:**
- Se dispara al hacer `onBlur` en el campo de importe, solo si `historicalAvg > 0` y `amount > historicalAvg * 1.2` (20% por encima de la media).
- Muestra una línea sutil debajo del campo: `ℹ️ "Este gasto en combustible es un 35% más alto que tu media de los últimos 3 meses."`
- Nivel `very_high` (>50% sobre media): texto en ámbar.
- Nivel `high` (20-50% sobre media): texto en gris informativo.
- Si `amount <= historicalAvg * 1.2` o `historicalAvg === 0`: no muestra nada.
- **No bloquea el formulario.** Es informativo.

---

### 2c — Formulario de Tickets de Soporte (destacada)

**Dónde:** `src/features/franchise/support/NewTicketForm.tsx`. Esta vista ya integra `suggestSupportSolution` de forma inline (estado `suggestion`, renderizado dentro del formulario). El componente `TicketSolutionSuggestion` **reemplaza** ese código inline extrayéndolo a un componente reutilizable — se elimina el estado `suggestion` del formulario y se sustituye por `<TicketSolutionSuggestion />`.

**Comportamiento:**
- Al hacer `onBlur` en el campo de descripción (mínimo 20 caracteres escritos), se llama `suggestSupportSolution(subject, description)`.
- Si `isSolvable === true`: aparece un card destacado *"💡 Posible solución"* con el texto de la sugerencia y botón "Marcar como resuelto" (cierra el formulario sin crear ticket).
- Si `isSolvable === false` o falla: no muestra nada, el formulario sigue normal.
- **Componente nuevo:** `TicketSolutionSuggestion` en el módulo de soporte.

**Props:**
```typescript
interface TicketSolutionSuggestionProps {
  subject: string;
  description: string;
  onResolved: () => void; // cierra el formulario
}
```

---

## Punto 3: Memoria entre Sesiones

### Estructura en Firestore

Ambas rutas usan exactamente la misma estructura de `AdvisorMessage`. Son documentos separados para que los historiales del franquiciado y del rider estén aislados.

```
users/{userId}/advisorHistory  (documento — franquiciado)
  messages: AdvisorMessage[]   (array, crece indefinidamente)

users/{userId}/riderAdvisorHistory  (documento — rider)
  messages: AdvisorMessage[]

interface AdvisorMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string; // ISO
}
```

### Servicio: `advisorHistoryService`

**Ubicación:** `src/services/advisorHistoryService.ts`

```typescript
export const advisorHistoryService = {
  async load(userId: string, type: 'franchise' | 'rider'): Promise<AdvisorMessage[]>
  async append(userId: string, type: 'franchise' | 'rider', messages: AdvisorMessage[]): Promise<void>
}
```

- `load`: lee el documento, devuelve `messages` o `[]` si no existe.
- `append`: usa `setDoc` con `merge: true` — añade al array con `arrayUnion`.
- Límite de carga para contexto Gemini: últimos 20 mensajes (slice al cargar).
- Fallo silencioso en ambas operaciones: si Firestore no responde, el chat abre sin historial.

### Integración en `FinanceAdvisorChat`

Al montar el componente:
```typescript
useEffect(() => {
  advisorHistoryService.load(user.uid, 'franchise')
    .then(history => setChatHistory(history.slice(-20)))
    .catch(() => {}); // silencioso
}, [user.uid]);
```

Al enviar/recibir mensajes:
```typescript
// Después de recibir respuesta:
advisorHistoryService.append(user.uid, 'franchise', [
  { role: 'user', text: userMessage, timestamp: new Date().toISOString() },
  { role: 'model', text: aiReply, timestamp: new Date().toISOString() },
]);
```

Los mensajes guardados en Firestore se convierten en `ChatTurn[]` al pasarlos a `sendMessageToGemini`, mapeando `text` → `parts[0].text`.

### Integración en `RiderAdvisorView`

Mismo patrón con `type: 'rider'`. El `chatHistory` de tipo `ChatTurn[]` se inicializa desde Firestore en lugar de `[]`.

---

## Archivos a crear / modificar

### Nuevos
| Archivo | Descripción |
|---------|-------------|
| `src/services/advisorHistoryService.ts` | Carga y guarda historial en Firestore |
| `src/features/operations/components/ShiftCoverageInsight.tsx` | Card IA para cobertura de turnos |
| `src/features/support/components/TicketSolutionSuggestion.tsx` | Card IA para solución de tickets |

### Modificados
| Archivo | Cambio |
|---------|--------|
| `src/lib/gemini.ts` | Añadir `generateAdvisorOpener()` y `analyzeExpenseAmount()` |
| `src/features/franchise/FranchiseDashboard.tsx` | Añadir pre-generación del opener en background |
| `src/features/franchise/finance/FinanceAdvisorChat.tsx` | Prop `initialMessage`, carga historial Firestore |
| `src/features/franchise/finance/components/ExpensesStep.tsx` | Integrar `analyzeExpenseAmount` en onBlur de cada campo de gasto |
| `src/features/franchise/support/NewTicketForm.tsx` | Reemplazar lógica inline de sugerencia con `<TicketSolutionSuggestion />` |
| `src/features/rider/advisor/RiderAdvisorView.tsx` | Carga y guarda historial Firestore |

---

## Criterios de éxito

- [ ] El asesor abre con un mensaje contextual sin que el usuario espere (pre-generado)
- [ ] Si la pre-generación falla, el chat abre con el saludo genérico (sin errores visibles)
- [ ] `ShiftCoverageInsight` aparece al cargar el cuadrante y no bloquea la UI si falla
- [ ] `analyzeExpenseAmount` solo aparece cuando el gasto supera el 20% de la media
- [ ] `TicketSolutionSuggestion` aparece al escribir la descripción del ticket (≥20 chars)
- [ ] El historial persiste entre sesiones en Firestore
- [ ] Si Firestore falla, el chat abre sin historial (fallback silencioso)
- [ ] El rider tiene su propio historial separado del franquiciado

---

## Fuera de scope (por ahora)

- Límite de tamaño del array en Firestore (se puede añadir más adelante con una Cloud Function)
- Historial del admin
- Notificaciones push basadas en el historial
- UI para ver/borrar el historial de conversaciones
