# REPAART - Notification System Audit Report

## 📋 Resumen Ejecutivo

**Fecha:** 10 de Febrero 2026  
**Auditor:** Claude (AI Assistant)  
**Estado:** 🔍 AUDITORÍA COMPLETADA - PENDIENTE DE IMPLEMENTACIÓN

---

## 🎯 Hallazgos Principales

### Problemas Críticos (Prioridad 1)

#### 1. **Notificaciones Duplicadas en Tickets**
**Ubicación:** `src/features/franchise/support/NewTicketForm.tsx` (líneas 98-131)

**Problema:** El método `handleSubmit` envía **2 notificaciones idénticas** al crear un ticket:
- Primera notificación: usa `user?.franchiseId || user?.uid`
- Segunda notificación (líneas 117-131): usa solo `user?.uid`

**Impacto:** Los admins reciben notificaciones duplicadas para cada ticket creado.

**Solución Propuesta:** Eliminar el bloque de código duplicado (líneas 117-131).

---

#### 2. **Notificación de Rechazo de Desbloqueo Faltante**
**Ubicación:** `src/features/franchise/finance/MonthlyHistoryTable.tsx` (líneas 63-68)

**Problema:** Cuando un admin rechaza una solicitud de desbloqueo mensual, **no se envía notificación** a la franquicia.

```typescript
// Código actual
} else {
    await financeService.rejectUnlock(franchiseId, month);
    // Notify rejection?  <-- Comentario indica que esto fue olvidado
    alert("Solicitud rechazada...");
}
```

**Impacto:** Las franquicias no saben cuando su solicitud fue rechazada.

**Solución Propuesta:** Agregar notificación:
```typescript
await notificationService.notifyFranchise(targetUid, {
    title: `Solicitud Rechazada: ${month}`,
    message: `Tu solicitud de desbloqueo para ${month} ha sido rechazada.`,
    type: 'UNLOCK_REJECTED',
    priority: 'high'
});
```

---

### Problemas Mayores (Prioridad 2)

#### 3. **Tipo de Notificación Incorrecto**
**Ubicación:** `src/services/resourceRequestService.ts` (línea 49)

**Problema:** Usa tipo `'ALERT'` genérico en lugar de `'DOCUMENT_REQUEST'` que ya existe en el tipo.

**Solución Propuesta:** Cambiar `'ALERT'` por `'DOCUMENT_REQUEST'`.

---

#### 4. **Riders No Reciben Notificaciones por FranchiseId**
**Ubicación:** `src/features/rider/profile/components/RiderNotifications.tsx` (línea 65)

**Problema:** La consulta solo usa `user.uid`, no verifica `franchiseId`:
```typescript
where('userId', '==', user.uid)  // Missing franchiseId check
```

**Comparación:** Otros componentes usan:
```typescript
const targetIds = [user.uid];
if (user.franchiseId) targetIds.push(user.franchiseId);
where("userId", "in", targetIds)
```

**Impacto:** Los riders pueden perder notificaciones enviadas a su franchiseId.

**Solución Propuesta:** Actualizar la consulta para incluir franchiseId.

---

#### 5. **Tab de Notificaciones Sin Tiempo Real**
**Ubicación:** `src/features/user/components/NotificationsTab.tsx` (líneas 35-55)

**Problema:** Usa `getDocs()` (consulta única) en lugar de `onSnapshot()` (tiempo real).

**Impacto:** Los usuarios deben refrescar la página para ver nuevas notificaciones.

**Solución Propuesta:** Reemplazar con `onSnapshot()`.

---

### Problemas Menores (Prioridad 3)

#### 6. **Notificación de Reasignación de Turno Dirigida Incorrectamente**
**Ubicación:** `src/features/scheduler/DeliveryScheduler.tsx` (líneas 471-493)

**Problema:** Se envía a `editingShift.franchiseId` (ID de franquicia) en lugar del riderId del rider original.

**Comentario en código dice:** "Notify Original Rider"  
**Código hace:** Envia a franchiseId

**Impacto:** El rider nunca recibe la notificación.

---

#### 7. **Definiciones Duplicadas de NotificationType**
**Ubicación:** 
- `src/lib/notifications.ts` (línea 4): Tipos genéricos UI
- `src/services/notificationService.ts` (línea 4): Tipos de negocio

**Problema:** Dos definiciones diferentes del mismo tipo causan confusión.

**Solución Propuesta:** Consolidar en una sola definición.

---

## 📊 Análisis de Flujos de Notificación

### Flujos Funcionando Correctamente ✅

| Evento | Admin Notif | User Notif | Estado |
|--------|-------------|------------|---------|
| Ticket creado | ✅ | ❌ | ⚠️ Duplicado |
| Respuesta a ticket | ❌ | ✅ | ✅ OK |
| Cambio de tarifa | ✅ | ❌ | ✅ OK (solo admin) |
| Cierre financiero | ✅ | ❌ | ✅ OK (solo admin) |
| Solicitud de desbloqueo | ✅ | ❌ | ✅ OK |
| Desbloqueo aprobado | ❌ | ✅ | ✅ OK |
| Turno publicado | ✅ | ❌ | ✅ OK |
| Solicitud de cambio de turno | ✅ | ❌ | ✅ OK |
| Mantenimiento requerido | ❌ | ✅ | ✅ OK |
| Documento solicitado | ⚠️ | ❌ | ⚠️ Tipo incorrecto |
| Documento entregado | ❌ | ✅ | ✅ OK |
| Solicitud premium | ✅ | ❌ | ✅ OK |

### Flujos con Problemas ❌

| Evento | Problema | Prioridad |
|--------|----------|-----------|
| Desbloqueo rechazado | No hay notificación | **CRÍTICA** |
| Ticket creado | Notificación duplicada | **CRÍTICA** |
| Reasignación de turno | Enviada a franchiseId en lugar de riderId | **ALTA** |

---

## 🔧 Recomendaciones de Implementación

### Fase 1: Correcciones Críticas (1-2 horas)

1. **Eliminar notificación duplicada**
   - Archivo: `NewTicketForm.tsx`
   - Líneas: Eliminar 117-131
   - Riesgo: Bajo

2. **Agregar notificación de rechazo**
   - Archivo: `MonthlyHistoryTable.tsx`
   - Añadir: Bloque de notificación en el else
   - Riesgo: Bajo

### Fase 2: Correcciones Mayores (2-3 horas)

3. **Corregir tipo DOCUMENT_REQUEST**
   - Archivo: `resourceRequestService.ts`
   - Cambiar: `'ALERT'` → `'DOCUMENT_REQUEST'`
   - Riesgo: Bajo

4. **Agregar franchiseId a consulta de riders**
   - Archivo: `RiderNotifications.tsx`
   - Actualizar: Query para usar array de IDs
   - Riesgo: Medio (probar con riders existentes)

5. **Convertir NotificationsTab a tiempo real**
   - Archivo: `NotificationsTab.tsx`
   - Reemplazar: `getDocs()` → `onSnapshot()`
   - Riesgo: Medio (manejo de unsubscription)

### Fase 3: Mejoras (1-2 horas)

6. **Corregir notificación de reasignación**
   - Archivo: `DeliveryScheduler.tsx`
   - Buscar: Resolver riderId desde shift
   - Riesgo: Medio (lógica de scheduling)

7. **Consolidar tipos de notificación**
   - Archivos: `lib/notifications.ts` y `services/notificationService.ts`
   - Acción: Unificar definiciones
   - Riesgo: Bajo

---

## 📁 Archivos Requeridos para Modificación

### Prioridad 1
- [ ] `src/features/franchise/support/NewTicketForm.tsx`
- [ ] `src/features/franchise/finance/MonthlyHistoryTable.tsx`

### Prioridad 2
- [ ] `src/services/resourceRequestService.ts`
- [ ] `src/features/rider/profile/components/RiderNotifications.tsx`
- [ ] `src/features/user/components/NotificationsTab.tsx`

### Prioridad 3
- [ ] `src/features/scheduler/DeliveryScheduler.tsx`
- [ ] `src/lib/notifications.ts`

---

## 🧪 Plan de Pruebas

### Tests Unitarios
1. Verificar que NewTicketForm envía solo 1 notificación
2. Verificar que MonthlyHistoryTable envía notificación de rechazo
3. Verificar que RiderNotifications incluye franchiseId
4. Verificar que NotificationsTab usa onSnapshot

### Tests de Integración
1. Crear ticket y verificar 1 notificación en admin_notifications
2. Rechazar desbloqueo y verificar notificación en notifications
3. Reasignar turno y verificar notificación al rider correcto

### Tests Manuales
1. Rider recibe notificación enviada a franchiseId
2. Tab de notificaciones se actualiza en tiempo real
3. Admin no recibe duplicados al crear ticket

---

## 📈 Métricas Esperadas Post-Implementación

### Mejoras en UX
- **Reducción de notificaciones duplicadas:** 100%
- **Notificaciones de rechazo entregadas:** 100%
- **Riders que reciben notificaciones:** +100% (los que usaban franchiseId)
- **Tiempo de actualización de notificaciones:** Tiempo real

### Mejoras Técnicas
- **Código duplicado eliminado:** 1 instancia
- **Consultas optimizadas:** 2 mejoras
- **Tipos consolidados:** 2 definiciones → 1

---

## 🚀 Plan de Despliegue

### Pre-Deploy
1. [ ] Ejecutar tests unitarios
2. [ ] Ejecutar tests de integración
3. [ ] Revisar código en PR
4. [ ] Verificar en staging

### Deploy
1. [ ] Deploy a producción
2. [ ] Verificar logs de errores
3. [ ] Monitorear métricas de notificaciones

### Post-Deploy
1. [ ] Verificar flujos críticos manualmente
2. [ ] Confirmar con usuarios que reciben notificaciones
3. [ ] Documentar cambios para soporte

---

## 📝 Notas Adicionales

### Consideraciones de Seguridad
- Todas las notificaciones deben respetar el `franchiseId` para aislamiento de datos
- Verificar que riders no vean notificaciones de otras franquicias

### Consideraciones de Performance
- Las consultas con `onSnapshot` deben cancelarse al desmontar componentes
- Agregar índices en Firestore si es necesario para las nuevas consultas

### Consideraciones de UX
- Las notificaciones de rechazo deben ser claras y explicar el motivo
- Agregar feedback visual cuando se envían notificaciones

---

**Auditoría completada:** 10 de Febrero de 2026  
**Próxima revisión:** Después de implementar correcciones  
**Estado:** 📝 Listo para implementación
