# Spec: IA Proactiva — Alertas en Dashboard + Asesor del Rider

**Fecha:** 2026-03-23
**Estado:** Aprobado
**Roles afectados:** franchise, rider

---

## Resumen

Dos features independientes que amplían el uso de Gemini en REPAART:

1. **Alerta proactiva en el dashboard del franquiciado** — un card que analiza automáticamente finanzas, turnos y riders cada vez que se abre el dashboard, y muestra la alerta más relevante del momento sin que el usuario tenga que preguntar nada.

2. **Tab "Asesor" en la app del rider** — un chat dedicado donde el rider puede resolver dudas operativas, consultar sus turnos y crear tickets de soporte directamente desde la conversación.

---

## Feature 1: Alerta Proactiva en Dashboard del Franquiciado

### Objetivo

Que el franquiciado reciba información accionable en el momento en que abre la app, sin tener que interactuar con el asesor. La IA analiza el contexto completo y presenta la alerta más importante del día.

### Flujo de datos

```
FranchiseDashboardView (mount)
  → recoge en paralelo: financialData + shiftsData + ridersData
  → llama: generateDashboardAlert(context)   ← nuevo en gemini.ts
  → renderiza: <DashboardAlertBanner />       ← nuevo componente
```

### Función Gemini: `generateDashboardAlert`

**Ubicación:** `src/lib/gemini.ts`

**Firma:**
```typescript
export const generateDashboardAlert = async (
  context: DashboardAlertContext
): Promise<DashboardAlert | null>
```

**Interfaces:**
```typescript
interface DashboardAlertContext {
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
    uncoveredSlots: number;   // huecos sin rider asignado
    nextWeekCoverage: number; // % de cobertura semana siguiente
  };
  riders: {
    active: number;
    inactive: number;
  };
}

interface DashboardAlert {
  type: 'positive' | 'warning' | 'critical' | 'info';
  title: string;   // max ~6 palabras, directo
  message: string; // 1-2 frases en lenguaje cercano
}
```

**Implementación (REST, mismo patrón que `generateJson`):**
```typescript
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
  return null; // silent fail
};
```

### Componente: `DashboardAlertBanner`

**Ubicación:** `src/features/franchise/dashboard/components/DashboardAlertBanner.tsx`

**Props:**
```typescript
interface DashboardAlertBannerProps {
  franchiseId: string;
  financialData: DashboardAlertContext['financial'] | null;
  shiftsData: DashboardAlertContext['shifts'] | null;
  ridersData: DashboardAlertContext['riders'] | null;
  onOpenAdvisor?: () => void;
}
```

**Comportamiento:**
- Se monta con `FranchiseDashboardView`
- Llama a `generateDashboardAlert` en `useEffect` al montar
- Mientras genera: muestra skeleton de 1 línea
- Si los datos de entrada son todos `null`: no renderiza nada
- Si `generateDashboardAlert` devuelve `null` (fallo): no renderiza nada (silent fail)
- El botón X descarta el banner (estado local `useState<boolean>`); reaparece al recargar

**Visual:**

- Card horizontal en la parte superior del dashboard, debajo del header, encima de los widgets
- Borde izquierdo de 4px de color según `type`
- Icono a la izquierda según `type`: `TrendingUp` / `AlertTriangle` / `AlertCircle` / `Lightbulb`
- Título en negrita + mensaje de texto
- Botón "Hablar con el asesor →" que dispara `onOpenAdvisor()`
- Botón X alineado a la derecha para descartar

**Paleta de colores por tipo:**
| type | fondo | borde | icono |
|------|-------|-------|-------|
| positive | green-50 | green-400 | green-600 |
| warning | amber-50 | amber-400 | amber-600 |
| critical | red-50 | red-400 | red-600 |
| info | blue-50 | blue-400 | blue-600 |

### Integración en `FranchiseDashboardView`

- Añadir `<DashboardAlertBanner />` justo debajo del header y encima de los widgets
- Los datos necesarios (financial, shifts, riders) ya se cargan en la vista — extraer y pasar como props
- Pasar `onOpenAdvisor` para conectar con el estado que abre `FinanceAdvisorChat`

---

## Feature 2: Tab "Asesor" en la App del Rider

### Objetivo

El rider dispone de un chat dedicado donde puede resolver dudas operativas, consultar sus turnos y abrir tickets de soporte sin salir de la conversación.

### Arquitectura del historial de chat

Para evitar el problema del singleton global, `sendRiderMessage` recibe y devuelve el historial como parámetro. El componente `RiderAdvisorView` gestiona el historial en su propio estado (`useState<ChatTurn[]>`).

```typescript
// En gemini.ts — sin estado global para el rider
export const sendRiderMessage = async (
  message: string,
  context: RiderChatContext,
  history: ChatTurn[]
): Promise<{ text: string; suggestTicket: boolean; updatedHistory: ChatTurn[] }>
```

Esto garantiza aislamiento total: cada instancia del componente tiene su propio historial.

### Función Gemini: `sendRiderMessage`

**Ubicación:** `src/lib/gemini.ts`

**Tipos:**
```typescript
interface RiderChatContext {
  riderName: string;
  upcomingShifts: { date: string; startHour: number; duration: number }[];
}

// ChatTurn ya existe: { role: 'user' | 'model'; parts: { text: string }[] }
```

**Implementación:**
```typescript
const RIDER_SYSTEM_PROMPT = (context: RiderChatContext) => `
Eres el asistente de ${context.riderName}, un repartidor de la franquicia Repaart.
Hablas como un compañero cercano, con frases cortas y sin rollos.

SUS PRÓXIMOS TURNOS:
${context.upcomingShifts.length > 0
  ? context.upcomingShifts.map(s => `- ${s.date} a las ${s.startHour}h (${s.duration}h)`).join('\n')
  : 'No tiene turnos asignados esta semana.'}

LO QUE SABES:
${FRANCHISE_KNOWLEDGE}

REGLAS:
- Responde siempre en español, tono cercano.
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
  if (!key) return { text: '⚠️ No tengo conexión ahora mismo.', suggestTicket: false, updatedHistory: history };

  const updatedHistory: ChatTurn[] = [
    ...history,
    { role: 'user', parts: [{ text: message }] }
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
            system_instruction: { parts: [{ text: RIDER_SYSTEM_PROMPT(context) }] },
            contents: updatedHistory,
            generationConfig: { maxOutputTokens: 1000, temperature: 0.6 }
          })
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!raw) continue;

      const suggestTicket = raw.includes('TICKET:true');
      const text = raw.replace('TICKET:true', '').trim();

      const finalHistory: ChatTurn[] = [
        ...updatedHistory,
        { role: 'model', parts: [{ text }] }
      ];
      return { text, suggestTicket, updatedHistory: finalHistory };
    } catch { continue; }
  }

  return {
    text: 'Lo siento, no pude conectarme. ¿Lo intentamos de nuevo?',
    suggestTicket: false,
    updatedHistory: history
  };
};
```

### Vista: `RiderAdvisorView`

**Ubicación:** `src/features/rider/advisor/RiderAdvisorView.tsx`

#### Carga de datos

```typescript
// En useEffect al montar:
const [riderShifts, setRiderShifts] = useState<UpcomingShift[]>([]);

useEffect(() => {
  if (!user?.uid) return;
  // Cargar perfil ya disponible desde AuthContext
  // Cargar turnos próximos (semana actual) desde shiftService
  shiftService.getUpcomingShifts(user.uid, weekStart, weekEnd)
    .then(setRiderShifts)
    .catch(() => setRiderShifts([])); // fallback silencioso
}, [user?.uid]);
```

Si los datos no están disponibles, `upcomingShifts` es array vacío — la IA responde sin datos de turno.

#### Estado del componente

```typescript
const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
const [messages, setMessages] = useState<DisplayMessage[]>([
  { role: 'assistant', text: `¡Hola ${riderName}! 👋 ¿En qué te puedo ayudar?` }
]);
const [suggestTicket, setSuggestTicket] = useState(false);
const [loading, setLoading] = useState(false);
```

#### Flujo de envío

```typescript
const handleSend = async (text: string) => {
  setLoading(true);
  const { text: reply, suggestTicket: ticket, updatedHistory } = await sendRiderMessage(
    text,
    { riderName, upcomingShifts: riderShifts },
    chatHistory
  );
  setChatHistory(updatedHistory);
  setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
  setSuggestTicket(ticket);
  setLoading(false);
};
```

#### Flujo de creación de ticket

```typescript
const handleCreateTicket = async () => {
  // Extraer los últimos 2 mensajes del rider para el subject/body
  const lastUserMessage = [...chatHistory].reverse().find(m => m.role === 'user');
  const subject = `[Chat Rider] ${lastUserMessage?.parts[0]?.text?.slice(0, 60) ?? 'Problema técnico'}`;
  const body = chatHistory
    .map(m => `${m.role === 'user' ? riderName : 'Asesor'}: ${m.parts[0]?.text}`)
    .join('\n');

  await supportService.createTicket({
    userId: user.uid,
    franchiseId: user.franchiseId,
    subject,
    message: body,
    category: 'technical',
    source: 'rider-advisor-chat'
  });

  setSuggestTicket(false);
  toast.success('Ticket creado. Te responderemos pronto.');
};
```

#### Layout visual

- **Header:** "Hola, [nombre] 👋" + subtítulo "Pregúntame lo que necesites"
- **Sugerencias rápidas** (visibles solo antes del primer mensaje):
  - "¿Cuándo trabajo esta semana?"
  - "¿Qué hago si tengo un accidente?"
  - "Tengo un problema con la app"
- **Área de chat:** burbujas igual que el asesor del franquiciado
- **Botón "Crear ticket":** aparece debajo del último mensaje cuando `suggestTicket === true`
- **Input + botón enviar** en la parte inferior

**Colores del rol rider (orange):**

- Mensajes del rider: `bg-orange-500 text-white`
- Header: `from-orange-700 to-orange-900`
- Botón enviar: `bg-orange-500 hover:bg-orange-600`
- Sugerencias: `border-orange-200 text-orange-700 hover:bg-orange-50`

*(Tailwind incluye `orange` en su paleta por defecto)*

### Nuevo tab en navegación del rider

Añadir entrada en la barra de navegación del rider:

- **Ruta:** `/rider/advisor`
- **Icono:** `Bot` (lucide-react)
- **Label:** "Asesor"
- **Posición:** último tab

---

## Archivos a crear / modificar

### Nuevos
| Archivo | Descripción |
|---------|-------------|
| `src/features/franchise/dashboard/components/DashboardAlertBanner.tsx` | Componente del banner de alerta |
| `src/features/rider/advisor/RiderAdvisorView.tsx` | Vista del tab asesor del rider |

### Modificados
| Archivo | Cambio |
|---------|--------|
| `src/lib/gemini.ts` | Añadir `generateDashboardAlert()` y `sendRiderMessage()` |
| `src/features/franchise/FranchiseDashboardView.tsx` | Integrar `<DashboardAlertBanner />` |
| Navegación del rider | Añadir tab "Asesor" con ruta `/rider/advisor` |
| Router principal | Registrar ruta `/rider/advisor` → `RiderAdvisorView` |

---

## Criterios de éxito

- [ ] El banner aparece en menos de 3 segundos tras abrir el dashboard
- [ ] El banner no bloquea el dashboard si la IA falla (silent fail)
- [ ] El rider puede preguntar por sus turnos y recibe respuesta con sus datos reales
- [ ] Si el rider describe un problema técnico, aparece el botón "Crear ticket"
- [ ] El ticket creado desde el chat llega pre-rellenado al sistema de soporte
- [ ] El historial del chat rider está aislado del historial del asesor del franquiciado
- [ ] Ambas features funcionan en mobile (diseño responsive)

---

## Fuera de scope (por ahora)

- Datos de ganancias en el asistente del rider
- Persistencia del historial de chat entre sesiones
- Notificaciones push de alertas
- Cacheo de la alerta del dashboard (se regenera en cada carga)
