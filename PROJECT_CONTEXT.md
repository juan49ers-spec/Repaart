# Project Context: Repaart Finanzas

**Última Auditoría:** 2026-01-11
**Estado:** Producción (Estable)
**URL:** <https://repaartfinanzas.web.app>
**Versión:** 3.12.0 (Intelligent Fleet + Atomic Architecture)

## 👑 CONSTITUCIÓN V2: ROLES Y PERMISOS

Esta jerarquía es estricta e inmutable para garantizar la seguridad "Nivel Dios".

### 1. ADMIN ("Dueño de Marca" / Dios)

* **Alcance:** Global (Ve todas las franquicias).
* **Finanzas:** **SOLO LECTURA + APROBACIÓN**.
  * *Flow:* Borrador -> Enviado -> Aprobado/Rechazado.
* **Gestión:** ÚNICO creador de Franquicias.
* **Contenido:** EDITOR TOTAL (Academy/Resources).
* **Soporte:** Resuelve tickets.

### 2. FRANQUICIA ("Gerente Local")

* **Alcance:** Local (`where('franchiseId', '==', myId)`).
* **Finanzas:** **EDITOR**.
  * 🔒 **CANDADO FINANCIERO:** PROHIBIDO editar/borrar si `status === 'APPROVED'`.
* **Operativa:** EDITOR TOTAL (Vehículos y Riders).
* **Horarios:** PLANIFICADOR (Asigna turnos).
* **Contenido:** CONSUMIDOR (Read-only).
* **Soporte:** Emisor de tickets.

### 3. RIDER ("Trabajador Móvil")

* **Alcance:** Personal (Solo "Mis Datos").
* **UX:** Acceso forzado a **"Vista Simplificada"** (PWA Style).
* **Permisos:**
  * ✅ **Horarios:** SOLO LECTURA.
  * ⛔ **Finanzas/Flota/Dashboard:** ACCESO DENEGADO (Redirección automática).
* **Login:** Email/Pass simple.

---

## 2. Arquitectura de Software

Estructura híbrida basada en **Feature-Sliced Design** y **Atomic Design**.

### Directorios Clave (`src/`)

* **`features/`**: Módulos de negocio (Franchise, Admin, Operations, Academy, Auth, Fleet).
* **`ui/`**: Componentes visuales puros (Primitives, Inputs, Feedback).
* **`store/`**: Estado global con Zustand (`useAppStore`, `useVehicleStore`).
* **`services/`**: Capa API (Firebase Wrappers: `vehicleService`, `notificationService`).
* **`lib/`**: Lógica core (`finance.ts`, `audit.ts`).

---

## 3. Estado Actual del Sistema

### ✅ Módulos "Nivel Dios"

1. **Mantenimiento Predictivo:** `src/services/vehicleService.ts` detecta Km y alerta/bloquea vehículos automáticamente.
2. **Audit Logs:** `src/lib/audit.ts` traza eventos críticos y bloquea acciones si el log falla.
3. **Notificaciones:** `src/services/notificationService.ts` conectado a Firestore.

### 🚧 Deuda Técnica & Roadmap

* **PWA:** Plugin instalado pero comentado en `vite.config.js`. Requiere activación para Riders.
* **Frontend Legacy:** Retirar componentes viejos en favor de `ui/primitives`.

## 4. Guías de Desarrollo

* **Regla de Oro:** Si tocas Finanzas, corre tests (`npm test`).
* **Atomicidad:** Usa `ui/primitives` para botones, tarjetas e inputs.
* **Seguridad:** Verifica siempre `franchiseId` en las queries de Firestore.
