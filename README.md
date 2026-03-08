# 🚀 Plataforma SaaS Logística & Academia (Enterprise Edition)

> **Arquitectura:** React + Firebase (Firestore/Auth) + Tailwind CSS
> **Estado:** Producción (v1.0)
> **Estándar de Calidad:** Estricto (Ver 'Constitución del Proyecto' abajo)

Este repositorio aloja una plataforma SaaS isomórfica que combina gestión operativa (Logística/Reparto), control financiero y un LMS (Learning Management System) completo.

---

## 🏗️ Arquitectura de Software

El proyecto sigue el patrón **"Brain-Body Separation"** (Separación Cerebro-Cuerpo) para garantizar escalabilidad y mantenimiento.

### 1. Hook-First Design (El Cerebro)

La lógica de negocio **nunca** reside en los componentes visuales (`.jsx`).
Toda la lógica, llamadas a API y cálculos viven en Custom Hooks en `src/hooks/`.

* **Ejemplo:** `useAdminDashboardData.js` gestiona las finanzas, `AdminDashboard.jsx` solo las pinta.
* **Ejemplo:** `useAcademy.js` gestiona la integridad transaccional del LMS.

### 2. Integridad de Datos (Atomicidad)

Las operaciones críticas en Firestore utilizan **Transacciones (`runTransaction`)** y **Lotes (`writeBatch`)**.

* **Creación de Lecciones:** Incrementa el contador del módulo y crea el documento de lección atómicamente.
* **Borrado en Cascada:** Borrar un módulo elimina automáticamente todas sus lecciones y quizzes asociados.
* **Timestamps:** Se usa exclusivamente `serverTimestamp()` para consistencia temporal.

### 3. Capa de Inteligencia

El sistema cuenta con un motor de predicción en `src/hooks/useIntelligence.js` que analiza métricas en tiempo real y emite alertas (Cuellos de botella, Anomalías de usuarios) sin intervención humana.

---

## 📂 Estructura del Proyecto

```text
src/
├── components/
│   ├── admin/dashboard/  # Bento Grids, KPIs Financieros
│   ├── academy/          # Vistas del LMS (Inmunes a fallos de fecha)
│   ├── common/           # ErrorBoundaries, UI Kits
│   └── ...
├── hooks/
│   ├── useAcademy.js     # Lógica Transaccional LMS
│   ├── useIntelligence.js# Motor Predictivo
│   └── ...
├── utils/
│   ├── formatDate.js     # Sanitizador de Fechas (Timestamp/String/Null)
│   └── analyticsHelpers.js # Algoritmos puros
├── context/              # AuthContext (Estado global mínimo)
└── firestore.rules       # Reglas de seguridad RBAC
```

## 📜 La Constitución del Proyecto (AI Prompt)

🚨 **IMPORTANTE:** Si utilizas una IA (Cursor, ChatGPT, Claude) para modificar este código, **DEBES** pegar este prompt al inicio de la sesión para mantener la integridad.

> **PROMPT DE INGENIERÍA:** "Este proyecto se rige por leyes estrictas de arquitectura. No violes ninguna:
>
> * **Ley de los 200:** Ningún archivo excede 200 líneas. Fragmenta si es necesario.
> * **Hook-First:** Nunca escribas lógica en el JSX. Crea primero el hook en `src/hooks/`.
> * **Seguridad Paranoica:** Usa `runTransaction` para contadores y `writeBatch` para borrados.
> * **Tipado Seguro:** Usa siempre `formatDate` para renderizar fechas. Nunca uses `.toDate()` directo.
> * **Estética:** Mantén el diseño 'Bento Grid' y usa `font-mono` para datos financieros."

## 🛡️ Seguridad y Despliegue

### Reglas de Firestore (RBAC)

El archivo `firestore.rules` define un modelo de control de acceso basado en roles:

* **Admins:** Acceso total (`role == 'admin'`).
* **Usuarios:** Acceso de lectura a Academia, escritura solo en sus propios documentos.
* **Protección:** Bloqueo de escalada de privilegios (nadie puede editar su propio `role`).

### Índices

Si ves un error *The query requires an index*, abre la consola del navegador y haz clic en el enlace generado por Firebase para crear el índice compuesto automáticamente.

## 🛠️ Comandos Útiles

### Desplegar Reglas de Seguridad

```bash
firebase deploy --only firestore:rules
```

### Build para Producción

```bash
npm run build
# Verifica que no haya alertas de 'Cycle Dependency'
```

### Testing y Seguridad (Canónico)

```bash
# Unit tests
npm run test:unit

# Seguridad (Firestore rules + import hygiene)
npm run test:security

# Flujo CI local (preflight + unit + seguridad)
npm run test:ci

# Suite completa (unit + seguridad + e2e)
npm run test:all
```

> Nota: `npm run test:ci` ahora ejecuta un preflight y mostrará un error claro si falta Vitest; en ese caso corre `npm install` (o `npm ci`).
> Para detalle de la suite de seguridad, revisa `tests/security/README.md`.

```bash
# Verificar sincronización local vs remoto (commits)
npm run git:sync-check
```

### Documentación de API

La especificación completa de la API está disponible en `docs/api/`:

- **OpenAPI 3.1 Spec**: `docs/api/openapi.yaml`
- **API README**: `docs/api/README.md`
- **API Design Guide**: `docs/api/API_DESIGN_GUIDE.md`
- **SDK Generation**: `docs/api/SDK_GENERATION_GUIDE.md`
- **Postman Collection**: `docs/api/postman_collection.json`

Para generar SDKs desde la especificación OpenAPI, consulta la guía de generación de SDKs.
