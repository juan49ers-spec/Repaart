# REPAART — Contexto del Proyecto para Claude Code

## Resumen del Proyecto

REPAART es un SaaS de gestión de franquicias para logística de reparto. Permite a operadores de franquicia gestionar riders, turnos, tarifas, finanzas y facturación desde una única plataforma.

**Roles de usuario:**
- `admin` — Administrador de plataforma (acceso total)
- `franchise` — Franquiciado (gestiona su operación)
- `rider` — Repartidor (ve su agenda, perfil y soporte)

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Firebase (Firestore, Auth, Cloud Functions, Hosting) |
| Testing | Vitest + React Testing Library |
| Iconos | Lucide React |
| Formularios | React Hook Form + Zod |
| Notificaciones | react-hot-toast |

## Arquitectura de Carpetas

```
src/
  features/         # Módulos por dominio (admin, franchise, rider, billing...)
    [feature]/
      components/   # Componentes del módulo
      hooks/        # Hooks del módulo
      services/     # Llamadas a Firebase
  context/          # React Context global (AuthContext)
  hooks/            # Hooks compartidos entre módulos
  schemas/          # Validación Zod (users.ts, etc.)
  services/         # Servicios Firebase globales
  types/            # Tipos TypeScript globales
  lib/              # Firebase init, utilidades
docs/
  superpowers/
    specs/          # Specs de diseño (brainstorming skill)
    plans/          # Planes de implementación (writing-plans skill)
  SESSION_YYYY-MM-DD.md  # Log de sesión (uno por sesión)
  ISSUES_PENDING.md      # Bugs y mejoras pendientes
```

## Convenciones

- **Idioma docs/UI/comentarios:** Español
- **Idioma código (variables, funciones, tipos):** Inglés
- **Responsive:** mobile-first con breakpoints Tailwind (`sm:`, `md:`, `lg:`)
- **Tipos:** Sin `any` — usar tipos específicos o genéricos
- **Config dinámica:** Nunca hardcodear rates, UIDs o constantes de negocio; usar valores del perfil con fallback a defaults nombrados
- **Firebase:** Siempre usar `merge: true` en `setDoc` salvo sobreescritura intencional

## Estado Actual (actualizado: 2026-03-23)

| Check | Estado |
|-------|--------|
| Build | ✅ OK |
| TypeScript | ⚠️ 10 errores pre-existentes (WIP del usuario) |
| Tests | ✅ 77/77 archivos · 518/518 tests |
| Lint | ✅ 0 errores · 257 warnings (0 `any` en producción; resto en test files) |
| Bundle | ⚠️ 5 chunks >500KB (won't fix — lazy loading activo) |
| Sentry | ✅ Inicializado + ErrorBoundary conectado |
| E2E CI | ✅ Job `e2e-smoke` en ci-cd.yml (requiere secrets GitHub) |

## Comandos de Verificación

```bash
npm run build          # Build completo (TypeScript + Vite)
npx vitest run         # Suite completa — debe ser 516/516
npx tsc --noEmit       # Solo TypeScript — debe ser 0 errores
npm run lint           # ESLint — objetivo: 0 errores (warnings OK)
```

---

## Workflow con Skills

### Regla general (`using-superpowers`)
Antes de cualquier respuesta o acción, verificar si algún skill aplica. Si hay ≥1% de probabilidad — invocar el skill. Sin excepciones.

### Para features nuevas
```
brainstorming → writing-plans → [subagent-driven-development | executing-plans] → finishing-a-development-branch
```

### Para bugs / tests fallando
```
systematic-debugging → test-driven-development → verification-before-completion
```

### Para UI / responsive
```
baseline-ui + responsive-patterns
```

### Antes de cualquier merge a main
```
verification-before-completion → requesting-code-review → finishing-a-development-branch
```

### Regla de branches
- **Hotfixes simples:** directo en `main` (previa aprobación explícita del usuario)
- **Features y refactors:** siempre en worktree aislado (`using-git-worktrees`)
- Nunca empezar implementación en `main/master` sin consentimiento explícito

---

## Protocolo de Sesión

### Al inicio de sesión
1. Leer este CLAUDE.md (contexto del proyecto)
2. Leer `docs/ISSUES_PENDING.md` (qué hay pendiente)
3. Si es continuación: leer el último `docs/SESSION_*.md`
4. Ejecutar comandos de verificación para confirmar estado actual

### Al final de sesión
1. Actualizar `docs/ISSUES_PENDING.md` con nuevos issues encontrados/resueltos
2. Crear `docs/SESSION_YYYY-MM-DD.md` documentando qué se hizo
3. Actualizar la sección "Estado Actual" de este CLAUDE.md
4. Commit con mensaje descriptivo

---

## Documentos Clave

| Documento | Propósito |
|-----------|-----------|
| `docs/ISSUES_PENDING.md` | Bugs y mejoras conocidas — mantener siempre actualizado |
| `docs/ENCYCLOPEDIA_ROADMAP.md` | Roadmap de funcionalidades del módulo Academia |
| `docs/BILLING_MODULE.md` | Arquitectura del módulo de facturación |
| `docs/FIREBASE_SECURITY_AUDIT.md` | Reglas de seguridad de Firestore |
| `docs/superpowers/specs/` | Specs generadas por el skill `brainstorming` |
| `docs/superpowers/plans/` | Planes generados por el skill `writing-plans` |

---

## Patrones Conocidos del Proyecto

### AuthUser y franchiseId
```typescript
// franchiseId puede ser undefined — siempre usar cadena de prioridad:
const franchiseId = activeShift?.franchiseId || nextShift?.franchiseId || user.franchiseId;
if (!franchiseId) {
  toast.error('Operación no disponible: turno sin franquicia asignada.');
  return;
}
```

### Mocks en tests (Vitest)
```typescript
// Usar importOriginal para no romper iconos/módulos no mockeados:
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return { ...actual, IconoNecesario: ({ ...props }) => <svg data-testid="icono-icon" {...props} /> };
});
```

### Carga paralela de datos (Firebase)
```typescript
// Siempre usar Promise.all para cargas independientes:
const [data1, data2, profile] = await Promise.all([
  fetchData1(),
  fetchData2(),
  franchiseService.getProfile(franchiseId),
]);
```

### Tarifas configurables con fallback
```typescript
const DEFAULT_HOURLY_RATE = 8.5;
const DEFAULT_SS_RATE = 0.32;

const hourlyRate = profile?.riderHourlyRate ?? DEFAULT_HOURLY_RATE;
const ssRate = profile?.socialSecurityRate ?? DEFAULT_SS_RATE;
```
