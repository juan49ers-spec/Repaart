# Importación Profesional de Franquicias Flyder → Repaart

## Resumen del Proceso

Para sincronizar correctamente, necesitamos:
1. **Crear las franquicias** en Repaart basadas en los datos de Flyder
2. **Crear los mapeos** automáticos entre Flyder ID y Repaart ID
3. **Sincronizar los pedidos** históricos

## PASO 1: Crear Franquicias desde Flyder

### Opción A: Usando el Script de Importación (Recomendado)

He creado un Cloud Function que hará todo automáticamente:

```bash
# Desplegar la función
cd functions && npm run build && firebase deploy --only functions:importFlyderFranchises
```

### Opción B: Manual desde el Admin Panel

Si prefieres control manual:

1. Ve a **Admin → Usuarios → Crear Franquicia**
2. Completa los datos basándote en la lista de Flyder:

## Lista de Franquicias Flyder para Crear:

| ID Flyder | Nombre | Ciudad | Email Sugerido | Teléfono |
|-----------|---------|---------|----------------|----------|
| 6 | Repaart Cáceres | Cáceres | caceres@repaart.com | - |
| 9 | Repaart Plasencia | Plasencia | plasencia@repaart.com | - |
| 13 | Repaart Jaén | Jaén | jaen@repaart.com | - |
| 14 | Repaart Sevilla | Sevilla | sevilla@repaart.com | - |
| 15 | Repaart Torremolinos | Torremolinos | torremolinos@repaart.com | - |
| 19 | Repaart Martos | Martos | martos@repaart.com | - |
| 21 | Repaart Huelin | Málaga (Huelin) | huelin@repaart.com | - |
| 22 | Repaart Toledo | Toledo | toledo@repaart.com | - |
| 7 | Reepart Navalmoral | Navalmoral | navalmoral@repaart.com | - |

## PASO 2: Estructura de Datos

### Datos necesarios para cada franquicia:

```typescript
{
  // Información básica
  name: "Repaart Sevilla",           // Nombre visible
  displayName: "Repaart Sevilla",    // Nombre en UI
  email: "sevilla@repaart.com",      // Email de contacto
  
  // Role y estado
  role: "franchise",                 // SIEMPRE "franchise"
  status: "active",                  // "active" o "inactive"
  
  // Ubicación (de Flyder)
  address: "Dirección completa",
  city: "Sevilla",
  province: "Sevilla",
  postalCode: "41004",
  
  // Mapeo con Flyder (crítico)
  flyderBusinessId: 14,              // ID del negocio en Flyder
  
  // Metadatos
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## PASO 3: Proceso Completo Automatizado

### 3.1 Crear Cloud Function de Importación

```typescript
// functions/src/callables/importFlyderFranchises.ts
// (Ya creada, solo necesitas desplegarla)
```

### 3.2 Ejecutar Importación

Ve a la consola del navegador en `http://localhost:5173/admin/flyder` y ejecuta:

```javascript
// Importar todas las franquicias de Flyder
const importFn = httpsCallable(functions, 'importFlyderFranchises');
const result = await importFn({});
console.log('Importadas:', result.data.franchises);
```

### 3.3 Verificar Mapeos

Las franquicias se crearán con el campo `flyderBusinessId` ya configurado.

## PASO 4: Sincronización de Pedidos

Una vez creadas las franquicias:

1. Ve a **Admin → Flyder → Sincronización**
2. Click en **"Iniciar Sincronización"**
3. El sistema automáticamente:
   - Usará el campo `flyderBusinessId` de cada franquicia
   - Mapeará los pedidos de Flyder a la franquicia correcta
   - Importará todo el historial

## PASO 5: Verificación

### Checklist:

- [ ] Todas las franquicias aparecen en Admin → Usuarios
- [ ] Cada franquicia tiene `role: "franchise"`
- [ ] Cada franquicia tiene `flyderBusinessId` configurado
- [ ] Los mapeos aparecen en la pestaña "Sincronización"
- [ ] Los pedidos aparecen en "Historial de Pedidos"

## Solución de Problemas

### Si una franquicia no aparece:
```javascript
// Verificar en consola
const q = query(collection(db, 'users'), where('flyderBusinessId', '==', 14));
const snap = await getDocs(q);
console.log('Franquicia encontrada:', snap.docs.map(d => d.data()));
```

### Si los pedidos no se sincronizan:
1. Verificar que existe el mapeo en `franchise_mappings`
2. Verificar que `flyderBusinessId` está en el documento de la franquicia
3. Revisar logs de la Cloud Function

## Comandos Útiles

```bash
# Ver logs de la funciónirebase functions:log --only importFlyderFranchises

# Ver todas las franquicias
firebase firestore:documents:get users --project repaartfinanzas

# Exportar datos (backup)
firebase firestore:export gs://repaartfinanzas-backup/franchises
```

## Próximos Pasos

1. **Decide**: ¿Quieres que cree la Cloud Function ahora?
2. **Ejecuta**: Importación automática o manual
3. **Verifica**: Que todo esté correcto
4. **Sincroniza**: Pedidos históricos

¿Quieres que proceda a crear la Cloud Function de importación automática?
