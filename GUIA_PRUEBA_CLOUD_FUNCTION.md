# 🚀 GUÍA PARA PROBAR Y DEPLOYAR CLOUD FUNCTION `createFranchise`

## 🔶 PASO 1: Deployar Cloud Functions

```bash
cd functions
npm run build 2>&1 | head -20
firebase deploy --only functions --project repaartfinanzas
```

**Si el comando falla:**
```bash
# Intenta con emulador primero
firebase functions:shell
```

---

## 🧪 PASO 2: Probar Localmente

### Opción A: Firebase Console
1. Abre: https://console.firebase.google.com/project/repaartfinanzas/functions
2. Busca la función: `createFranchise`
3. Haz clic en "Probar función"
4. Ejemplo de payload:
```json
{
  "data": {
    "name": "Franquicia Test",
    "slug": "franquicia-test",
    "settings": {
      "minOrderAmount": 50,
      "shippingCost": 5,
      "isActive": true
    },
    "location": {
      "address": "Calle Principal 123",
      "city": "Madrid",
      "zipCodes": ["28001", "28002"]
    }
  }
}
```

### Opción B: Desde el Frontend
1. Inicia sesión como **ADMIN** en la app
2. Intenta crear una franquicia nueva desde "Gestión de Franquicias"
3. Deberías ver el mensaje de éxito y la franquicia debería aparecer en Firestore

---

## ✅ Resultado Esperado

```json
{
  "result": {
    "success": true,
    "data": {
      "id": "7xKj3..."  // ID del documento creado
    }
  }
}
```

---

## ❌ Errores Posibles

### 1. "No autenticado"
**Causa:** No estás logueado
**Solución:** Inicia sesión antes de intentar crear franquicia

### 2. "Solo administradores pueden crear franquicias"
**Causa:** Tu usuario no tiene el rol de admin
**Solución:** 
1. Verifica en AuthContext que tengas `isAdmin = true`
2. Verifica en Firebase Console que el claim `admin` esté configurado en tu usuario
3. Ejecuta: `admin.auth().setCustomUserClaims(uid, { admin: true })`

### 3. "La franquicia ya existe"
**Causa:** El slug o email ya está en uso
**Solución:** Usa un slug diferente

### 4. "Faltan códigos postales"
**Causa:** El array `zipCodes` está vacío
**Solución:** Añade al menos un código postal antes de enviar

### 5. "Datos incompletos"
**Causa:** Faltan campos requeridos
**Solución:** Completa todos los campos del formulario antes de enviar

---

## 🔍 DEBUGGING

### 1. Ver Logs en Firebase Console
```bash
# Abre: https://console.firebase.google.com/project/repaartfinanzas/logs
# Filtra por: "createFranchise"
# Busca errores en los logs
```

### 2. Ver Documento en Firestore
```bash
# Abre: https://console.firebase.google.com/project/repaartfinanzas/firestore/data
# Navega a: franchises
# Busca la franquicia que acabas de crear
```

### 3. Probar con curl (Opcional)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "data": {
      "name": "Franquicia Test",
      "slug": "franquicia-test",
      "settings": {
        "minOrderAmount": 50,
        "shippingCost": 5,
        "isActive": true
      },
      "location": {
        "address": "Calle Principal 123",
        "city": "Madrid",
        "zipCodes": ["28001"]
      }
    }
  }' \
  "https://us-central1-repaartfinanzas.cloudfunctions.net/createFranchise"
```

---

## 🔧 CÓDIGO DE LA FUNCIÓN

**Archivo:** `functions/src/callables/createFranchise.ts`

**Verificaciones de seguridad:**
1. ✅ Usuario autenticado
2. ✅ Usuario tiene claim `admin: true`
3. ✅ Todos los campos requeridos presentes
4. ✅ Códigos postales validos
5. ✅ Usa Admin SDK (bypass reglas de cliente)

**Flujo:**
1. Verifica autenticación y admin claim
2. Valida todos los campos requeridos
3. Crea documento en `collection('franchises')` usando Admin SDK
4. Devuelve `{ success: true, data: { id: documentId } }`

---

## 📋 CHECKLIST DE PRUEBA

- [ ] Deployar las funciones con `firebase deploy --only functions`
- [ ] Probar desde Firebase Console con el payload de ejemplo
- [ ] Verificar que la franquicia se crea en Firestore
- [ ] Probar desde el frontend intentando crear una franquicia
- [ ] Verificar los logs si hay errores

---

## 🎯 LO QUE DEBERÍAS VER

### En Firebase Console → Firestore → franchises:
Un documento nuevo con:
```javascript
{
  "name": "Franquicia Test",
  "slug": "franquicia-test",
  "role": "franchise",
  "status": "active",
  "isActive": true,
  "settings": {
    "minOrderAmount": 50,
    "shippingCost": 5
  },
  "location": {
    "address": "Calle Principal 123",
    "city": "Madrid",
    "zipCodes": ["28001"]
  },
  "createdAt": "2026-01-28T...",
  "updatedAt": "2026-01-28T...",
  "creator": "TU_UID_DE_ADMIN"
}
```

### En Firebase Console → Functions → createFranchise:
Logs mostrando:
```
[createFranchise] Creating franchise: { name: '...', slug: '...', creator: '...' }
[createFranchise] Franchise created successfully: abc123...
```

---

## 📝 NOTAS ADICIONALES

1. **AuthContext:** Verifica que `isAdmin` sea `true` en tu consola
2. **Firestore Rules:** Las reglas de `franchises` están configuradas correctamente
3. **Admin SDK:** Esta función usa `admin.firestore()` que bypass las reglas del cliente
4. **Custom Claims:** Necesitas tener el claim `admin: true` en tu token de autenticación
5. **Testing:** Proba primero con la consola de Firebase antes de hacerlo desde el frontend

---

## 🆘 OBTENER TOKEN DE ADMIN

Si tu usuario no tiene el claim `admin`, ejecuta este comando:

```bash
# 1. Obten tu UID de AuthContext o Firebase Console
# 2. Ejecuta este comando:
firebase auth:import users YOUR_UID --project repaartfinanzas
```

O desde la consola de Firebase:
```javascript
// En Firestore Console → Ejecutar → Código arbitrario
admin.auth().setCustomUserClaims('TU_UID', { admin: true })
```

---

## ✨ LISTO PARA PROBAR

1. Deployar funciones: `firebase deploy --only functions --project repaartfinanzas`
2. Probar en Firebase Console con el payload de ejemplo
3. Verificar el documento creado en Firestore
4. Si funciona, probar desde el frontend
5. Verificar logs si hay errores

**¡Buena suerte! 🎉**
