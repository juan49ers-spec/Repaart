# Sincronización de Pedidos desde Flyder API

## Pasos para configurar:

### 1. Configurar credenciales de Flyder

Edita tu archivo `.env` y agrega el token de Flyder:

```env
VITE_FLYDER_API_HOST=api.flyder.app
VITE_FLYDER_DATABASE=flyder_prod
VITE_FLYDER_USER=repaart_dashboard
VITE_FLYDER_PASSWORD=tu_token_real_aqui
```

**¿Cómo obtener el token?**
- Contacta al equipo de Flyder
- O revisa la documentación de la API de Flyder

### 2. Limpiar pedidos de prueba

```bash
node scripts/clean_test_orders.mjs
```

Esto eliminará todos los pedidos de prueba que creamos (rider1, rider2, rider3, etc.).

### 3. Sincronizar pedidos desde Flyder

```bash
node scripts/sync_flyder_orders.mjs
```

Este script:
- ✅ Se autentica con la API de Flyder
- ✅ Obtiene los pedidos de hoy
- ✅ Los guarda en Firestore
- ✅ Actualiza los pedidos si ya existen

### 4. Ver los pedidos en la app

1. Recarga la página: http://localhost:5173
2. Ve a **Flyder → Historial de Pedidos**
3. Verás los pedidos reales sincronizados

---

## Scripts disponibles:

| Script | Descripción |
|--------|-------------|
| `clean_test_orders.mjs` | Elimina pedidos de prueba de Firestore |
| `sync_flyder_orders.mjs` | Sincroniza pedidos desde Flyder API |

---

## Solución de problemas:

**Error: "La contraseña de Flyder no está configurada"**
- Agrega `VITE_FLYDER_PASSWORD` en tu archivo `.env`

**Error: "Autenticación fallida"**
- Verifica que el token sea correcto
- Verifica que el usuario y database sean correctos

**No aparecen pedidos**
- Verifica que hay pedidos en la fecha de sincronización
- Revisa la consola para ver mensajes de error
- Verifica las reglas de Firestore

---

## Sincronización automática (futura):

Para sincronizar automáticamente cada X minutos, configura el servicio `flyderSyncService` en tu aplicación.
