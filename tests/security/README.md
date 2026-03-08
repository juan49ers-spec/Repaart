# Security Regression Suite

Esta carpeta contiene pruebas de regresión de seguridad y arquitectura que corren con `node:test`.

## Comando principal

```bash
npm run test:security
```

También puedes ejecutar suites específicas:

```bash
npm run test:rules
npm run test:imports
node --test tests/security/workflow-consistency.node.test.mjs
node --test tests/security/routing-architecture.node.test.mjs
node --test tests/security/finance-service-shim.node.test.mjs
```

## Cobertura actual

- `firestore.rules.node.test.mjs`
  - Valida invariantes críticas de reglas para `tickets` y `notifications`.
  - Protege contra aperturas accidentales (`allow read,write` amplios).

- `imports.node.test.mjs`
  - Evita que vuelvan imports activos al path deprecado `services/financeService`.

- `finance-service-shim.node.test.mjs`
  - Garantiza que el shim deprecado mantiene contrato de compatibilidad (re-export a `./finance`).

- `workflow-consistency.node.test.mjs`
  - Verifica consistencia entre scripts de `package.json` y workflows de CI/deploy.

- `routing-architecture.node.test.mjs`
  - Verifica que `App.tsx` siga usando los renderers de rutas extraídos y evita regresión a árbol monolítico.

## Cuándo ampliar esta suite

Amplía estos tests cuando cambies:

1. Reglas de Firestore (`firestore.rules`).
2. Scripts de testing/seguridad en `package.json`.
3. Workflows de CI/deploy.
4. Arquitectura de rutas en `App.tsx` y `src/routes/*`.
5. Contrato de compatibilidad del shim `src/services/financeService.ts`.
