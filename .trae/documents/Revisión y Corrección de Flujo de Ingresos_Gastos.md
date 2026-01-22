## Diagnóstico (estado actual)
- **Cierre mensual (modal)**: los totales se calculan en cliente con `calculateStats()` y se guardan en Firestore con un mapping legacy ([FinancialControlCenter.tsx](file:///c:/Users/Usuario/.gemini/antigravity/playground/repaart/src/features/franchise/FinancialControlCenter.tsx)).
- **Widgets / dashboard**: el “cálculo oficial” de gastos y el breakdown viene del motor central `calculateExpenses()` ([finance.ts](file:///c:/Users/Usuario/.gemini/antigravity/playground/repaart/src/lib/finance.ts)).

## Hallazgos (lo que NO está “perfecto”)
- **Riesgo crítico**: una actualización parcial puede escribir `revenue=0`, `expenses=0`, `profit=0` por el saneado en [financeService.ts](file:///c:/Users/Usuario/.gemini/antigravity/playground/repaart/src/services/financeService.ts#L373-L405).
- **Renting inconsistente**: el motor central aplica fallback `motoCount * 154` si `rentingCost` es 0/undefined ([finance.ts](file:///c:/Users/Usuario/.gemini/antigravity/playground/repaart/src/lib/finance.ts#L323-L327)), pero el cierre calcula `count * pricePerUnit` (puede quedar 0). Esto puede descuadrar cierre vs widget.
- **Estados**: existe `status: 'open'` en unlock ([financeService.ts](file:///c:/Users/Usuario/.gemini/antigravity/playground/repaart/src/services/financeService.ts#L432-L444)) pero el tipo/UX del cierre no lo contempla.
- **Iconos/labels**: `ExpenseBreakdownWidget` asigna iconos por substrings y “Seguridad Social” no entra por “seguros” ([ExpenseBreakdownWidget.tsx](file:///c:/Users/Usuario/.gemini/antigravity/playground/repaart/src/features/franchise/dashboard/widgets/ExpenseBreakdownWidget.tsx#L7-L20)).
- **`Math.max` en totalExpenses**: el dashboard puede mostrar `totalExpenses` mayor que la suma del breakdown (por diseño) ([finance.ts](file:///c:/Users/Usuario/.gemini/antigravity/playground/repaart/src/lib/finance.ts#L361-L364)).

## Plan de corrección (sin cambios aún)
1. **Blindar guardados parciales**
   - Cambiar `financeService.updateFinancialData` para que NO sobreescriba `revenue/expenses/profit/totalIncome/totalExpenses` con 0 cuando esos campos no vengan en el payload.
   - Opción A (preferida): construir `sanitizedData` sin tocar esos campos si no están presentes.
   - Opción B: leer el doc actual y preservar valores.

2. **Unificar renting entre cierre y motor central**
   - Decidir una única fuente de verdad: 
     - o el cierre siempre guarda `rentingCost` coherente (count * priceUnit) y el motor deja de aplicar fallback si hay `motoCount`.
     - o el cierre muestra el mismo fallback que el motor para evitar sorpresa.

3. **Normalizar estados y bloqueo**
   - Añadir `'open'` al tipo del cierre y ajustar `isLocked` para que el comportamiento sea consistente con `isLocked/is_locked` del documento.
   - Revisar `approved` vs `locked` para que UI y backend no discrepen.

4. **Mejorar consistencia de breakdown y iconos**
   - Ajustar `ExpenseBreakdownWidget` para reconocer “seguridad social” / “social”.
   - (Opcional) normalizar labels del breakdown en `calculateExpenses()` si quieres 100% consistencia visual.

5. **Verificación**
   - Añadir tests (Vitest) para:
     - `updateFinancialData` parcial no pisa totales.
     - renting no cambia entre cierre y dashboard para casos típicos.
   - Checklist manual rápido: abrir cierre, cambiar 1 campo, guardar borrador, confirmar que el dashboard no se va a 0.

Si confirmas este plan, ejecuto las correcciones en código y lo verifico con tests + revisión visual.