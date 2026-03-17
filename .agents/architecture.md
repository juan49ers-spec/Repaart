# Memoria Muscular Arquitectónica (Architecture State)

Este documento contiene las Reglas Inmutables y Pilares Tecnológicos del proyecto.
Todo agente (Antigravity u OpenCode) DEBE revisar y obedecer este archivo antes de modificar el código.

## 1. Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Vanilla CSS (sin Tailwind). Tokenización estricta vía variables CSS.
- **Base de Datos**: Firebase Firestore (NoSQL, denormalized, read-optimized)
- **Auth**: Firebase Authentication (email/password, custom claims para roles)
- **Storage**: Firebase Cloud Storage (documentos, facturas, avatares)
- **Functions**: Firebase Cloud Functions v2 (Node.js, TypeScript)
- **Hosting**: Firebase Hosting (https://repaartfinanzas.web.app)
- **Proyecto Firebase**: `repaartfinanzas`

## 2. Roles del Sistema
- `admin` — Acceso total. Gestión de franquicias, usuarios, auditoría.
- `franchise` — Gestión de su franquicia: riders, turnos, finanzas, flota.
- `rider` — Ver/confirmar turnos, perfil, academy.
- `user` — Acceso básico.

## 3. Estructura de Carpetas
```
src/
  features/           # Módulos por dominio (admin, franchise, rider, etc.)
  services/           # Lógica de negocio y acceso a Firebase
  context/            # React Contexts (Auth, Theme)
  components/         # Componentes reutilizables
  layouts/            # Layouts (Dashboard, Public)
  hooks/              # Custom hooks
  utils/              # Utilidades puras
functions/
  src/
    callables/        # Cloud Functions invocables desde frontend
    triggers/         # Triggers Firestore/Auth
```

## 4. Reglas Estructurales
1. **Inmutabilidad:** Los datos que fluyen entre módulos son inmutables.
2. **SoC:** La UI NUNCA llama a Firestore directamente. Todo pasa por `services/`.
3. **Manejo de Errores:** Try/catch en capas. Capturar e informar con contexto (no solo "Error").
4. **Early Returns:** Cero `else` si es posible. Validar fallos primero.
5. **Componentización:** Limitar a 200 líneas. Extraer si se usa >2 veces.
6. **TypeScript Estricto:** `strict: true`. Sin `any` salvo casos justificados.
7. **Nombres autodescriptivos:** Variables y funciones explícitas. Comentarios solo para "por qué".

## 5. Comandos de Auto-Curación
Comando estándar de validación del proyecto:
- **TypeScript**: `npx tsc --noEmit`
- **Build**: `npm run build`
- **Lint**: `npm run lint` (si disponible)

*(OpenCode DEBE auto-ejecutar estos tras generar código para verificar que compila).*

## 6. Convenciones de Firebase
- **Security Rules**: Siempre validar `isAuthed()` + rol antes de read/write.
- **Cloud Functions**: Verificar `request.auth.token.role === 'admin'` en callables protegidas.
- **Firestore**: Datos denormalizados. Evitar joins. Duplicar datos si mejora lecturas.
- **Colecciones principales**: `users`, `franchises`, `work_shifts`, `financial_records`, `tickets`, `notifications`, `fleet_assets`, `audit_logs`.
