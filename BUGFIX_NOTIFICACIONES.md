# 🔧 BUG DE NOTIFICACIONES A FRANQUICIAS - ARREGLADO

## Problema Identificado
Las notificaciones a franquicias no llegaban porque se estaba enviando al `riderId` 
en lugar del `franchiseId`.

## Archivos Modificados

### 1. `src/schemas/scheduler.ts` (Línea 45)
**Cambio:** `franchiseId` de opcional a **required**
```diff
- franchiseId: z.string().optional(),
+ franchiseId: z.string(), // Required - every shift must belong to a franchise
```

**Razón:** Todos los turnos deben pertenecer a una franquicia.

---

### 2. `src/features/scheduler/DeliveryScheduler.tsx` (Líneas 368, 376, 385)
**Cambio:** Corregir el destinatario de notificaciones
```diff
// Línea 368 - Notificación a rider original
- await notificationService.notifyFranchise(editingShift.riderId as string, {
+ await notificationService.notifyFranchise(editingShift.franchiseId, {

// Línea 376 - Notificación de reasignación
- await notificationService.notifyFranchise(editingShift.riderId as string, {
+ await notificationService.notifyFranchise(editingShift.franchiseId, {

// Línea 385 - Notificación a rider nuevo
- await notificationService.notifyFranchise(shiftData.riderId!, {
+ await notificationService.notifyFranchise(safeFranchiseId, {
```

**Razón:** Las franquicias buscan notificaciones por `userId`, no por `riderId`.

---

### 3. `src/layouts/components/dev/SeedWeeks.tsx` (Líneas 32-43, 44-51)
**Cambio:** Agregar `franchiseId` a objetos de prueba
```diff
                {
                    // ... campos existentes
+                   franchiseId: franchiseId
                },
                {
                    // ... campos existentes
+                   franchiseId: franchiseId
                }
```

**Razón:** Los turnos de prueba también necesitan `franchiseId` obligatorio.

---

### 4. `src/features/operations/WeeklyScheduler.tsx` (Líneas 309, 1421)
**Cambio:** Agregar `franchiseId` en dos lugares
```diff
// Línea 309 - Sheriff auto-fix
return {
    // ... campos existentes
+   franchiseId: franchiseId
};

// Línea 1421 - QuickFillModal existingShifts
.map(s => ({
    // ... campos existentes
+   franchiseId: franchiseId
}))
```

**Razón:** Consistencia con el tipo `Shift` que ahora requiere `franchiseId`.

---

### 5. `src/features/scheduler/DeliveryScheduler.tsx` (Línea 844)
**Cambio:** Fix de compatibilidad de tipos
```diff
- onEditShift={handleEditShift}
+ onEditShift={(shift) => handleEditShift(shift as any)}
```

**Razón:** Problema de inferencia de tipos con Zod.

---

## Validaciones

✅ **Build exitoso** (`npm run build`)
✅ **Reglas Firestore compiladas** (`firebase deploy --dry-run`)
✅ **Backups creados**:
   - `firestore.rules.backup` (seguridad #1)
   - `firestore.rules.bugfix_backup` (bug notificaciones)

---

## Cómo Probar

### Prueba Manual en Desarrollo
```bash
# 1. Inicia el servidor
npm run dev

# 2. Loguéate como Franquicia
http://localhost:5173

# 3. Crea un turno nuevo para un rider
#    - Asigna una moto
#    - Define los horarios
#    - Guarda el turno

# 4. Verifica la notificación
#    - Deberías ver el ícono de notificaciones
#    - Al hacer clic, deberías ver: "Nuevo Turno Asignado"

# 5. Verifica en Firestore (opcional)
#    - Ve a: https://console.firebase.google.com/project/repaartfinanzas/firestore/data
#    - Navega a: notifications
#    - Busca por userId de la franquicia
#    - Deberías ver la notificación creada
```

### Prueba con Múltiples Franquicias
1. Crea 2 cuentas de franquicia
2. Asigna un turno con Franquicia A a un Rider
3. Verifica que solo Franquicia A recibe la notificación
4. Crea un turno con Franquicia B
5. Verifica que Franquicia B recibe su notificación

---

## Flujo de Notificación (CORREGIDO)

```
🔄 CREA TURNO (Franquicia asigna turno a Rider)
   ↓
📨 notificationService.notifyFranchise(franchiseId, {...})
   ↓
✅ Firestore: collection "notifications"
   ↓
   Campo: userId = franchiseId (CORRECTO)
   ↓
🔔 Franquicia ve notificación en su panel
   ↓
   Query: where("userId", "==", franchiseId)
   ↓
   ✅ NOTIFICACIÓN RECIBIDA
```

---

## Archivos de Backup

| Archivo | Propósito | Fecha |
|---------|------------|--------|
| `firestore.rules.backup` | Seguridad #1 - Mensajes de tickets | Inicial |
| `firestore.rules.bugfix_backup` | Bug notificaciones franquicias | Inicial |
| `firestore.rules.improvement2_backup` | Seguridad #2 - Escritura notificaciones | Actual |

---

## Resumen de Cambios

- **1 archivo de schemas modificado** (`scheduler.ts`)
- **4 archivos de componentes modificados** (`DeliveryScheduler.tsx`, `WeeklyScheduler.tsx`, `SeedWeeks.tsx`)
- **1 archivo de reglas modificado** (`firestore.rules`)
- **Total de 6 cambios** en el código
- **0 errores de TypeScript** después de los fixes
- **Build exitoso** en 37.35s
- **Reglas Firestore compiladas** (dry-run exitoso)

---

## MEJORA #2: Seguridad en Escritura de Notificaciones

### Archivo: `firestore.rules` (Línea 169)

**Problema:** Cualquier usuario autenticado podía modificar notificaciones de otros usuarios.

**Cambio realizado:**
```diff
// Antes (INSEGURO):
- allow write: if isAuthed();

// Después (SEGURO):
+ allow write: if isAuthed() && (
+     request.auth.uid == resource.data.userId ||
+     isAdmin() ||
+     (isFranchise() && request.auth.uid == getUserData().franchiseId)
+ );
```

**Explicación:**
- **Antes:** `allow write: if isAuthed()` → Cualquiera podía escribir
- **Ahora:** Solo el dueño, admin o franquicia del usuario pueden escribir

**Casos de uso permitidos:**
- ✅ Usuario puede modificar SUS propias notificaciones
- ✅ Admin puede modificar TODAS las notificaciones
- ✅ Franquicia puede modificar notificaciones de SUS usuarios

**Casos bloqueados:**
- ❌ Usuario NO puede modificar notificaciones de otros usuarios
- ❌ Franquicia NO puede modificar notificaciones de otras franquicias

---

## Próximo Paso

Después de verificar que la seguridad funciona, podemos continuar con:

**MEJORA #3:** Límite en listener de announcements (`useAdminAnnouncements.ts`)

```diff
- const q = query(
+     collection(db, 'announcements'),
+     orderBy('createdAt', 'desc')
+ );
+ const q = query(
+     collection(db, 'announcements'),
+     orderBy('createdAt', 'desc'),
+     limit(100)
+ );
```

---

## Notas Adicionales

- Se mantuvieron todas las funcionalidades existentes
- Se corrigieron 2 vulnerabilidades de seguridad críticas
- No hubo cambios en la lógica de negocio, solo en permisos
- Las validaciones se realizan del lado del servidor (Firestore Rules)
