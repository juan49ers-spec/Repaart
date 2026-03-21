# Cuidado: Firestore "Rules are not filters"

## El Problema: Error de Permisos Inesperado

Cuando un usuario intenta realizar una query de múltiples documentos usando `getDocs()` o al escuchar colecciones con `onSnapshot()`, Firestore evalúa las Reglas de Seguridad **antes** de procesar los documentos, basándose únicamente en los potenciales resultados de la query.

Si la regla de seguridad especifica, por ejemplo:
```javascript
allow read: if isFranchise() && resource.data.franchiseId == request.auth.uid;
```

Pero la query **no incluye ese filtro explícito**:
```typescript
// ESTO FALLARÁ CON "Missing or insufficient permissions"
const q = query(collection(db, 'payment_receipts'), where('invoiceId', '==', '123'));
```

Firestore rechazará la operación íntegramente. ¿Por qué? Porque **las reglas no son filtros**. Firestore no va a "descargar todos los recibos y filtrar los tuyos". Exige que la query garantice que *sólo* leerá documentos a los que tienes acceso.

## La Solución: Consultas Explícitas

Para que la query funcione, debe incluir la misma restricción que las reglas de seguridad:

```typescript
// ESTO SÍ FUNCIONA
const q = query(
  collection(db, 'payment_receipts'), 
  where('invoiceId', '==', '123'),
  where('franchiseId', '==', user.uid) // <- Mismo filtro de la regla
);
```

### Excepción Crítica en Borrados (Delete)
Incluso si la query funciona, ten cuidado con las operaciones en lote. Si tu código asume que puede hacer un barrido `getDocs()` para luego hacer un borrado en cascada (e.g. `deleteDoc()`), verifica **si las reglas de Firestore permiten el delete en sí mismo**.

Ejemplo:
Las colecciones `payment_receipts` y `tax_vault` son inmutables para el cliente (`allow delete: if false;`). Intentar ejecutar `deleteDoc` sobre ellas arrojará error de permisos, incluso si lo haces de buena fe o con registros vacíos.

### Regla de Oro
1. Las reglas de `allow read` (particularmente `allow list`) deben verse reflejadas **exactamente** como cláusulas `where` en cualquier consulta `query()` en el frontend.
2. Si una colección es `allow delete: if false`, no intentes ejecutar `deleteDoc()` en el frontend, esto romperá las operaciones (fail-fast). Si es necesario limpiar registros en ese caso (como borrar operaciones inválidas), debes omitir ese paso si no es necesario (ej. para borradores) o usar una Cloud Function protegida y controlada desde el servidor.
