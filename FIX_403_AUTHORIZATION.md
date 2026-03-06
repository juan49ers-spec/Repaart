# 🔧 Guía para Resolver Error 403 Unauthorized en Facturación

## Problema
Error 403 al llamar a `getInvoices` y otras funciones de facturación. El problema es doble:
1. Las Cloud Functions tienen un bug en la autorización (comparan UID con franchiseId)
2. Los custom claims de Firebase Auth pueden no estar sincronizados

## Solución Paso a Paso

### 1️⃣ Desplegar Cloud Functions actualizadas
```bash
cd functions
firebase deploy --only functions
```

Esto actualizará las siguientes funciones con la autorización corregida:
- `createRestaurant`
- `getRestaurants`
- `updateRestaurant`
- `deleteRestaurant`
- `generateInvoice`
- `getInvoices` ⚠️ **La que está fallando**
- `getInvoicingModuleStatus`
- `repairCustomClaims` (nueva función para reparar claims)

### 2️⃣ Reparar Custom Claims del Usuario

**Opción A: Usar la consola del navegador**

1. Abre la aplicación y logueate con `prueba@repaart.es`
2. Abre la consola del navegador (F12)
3. Copia y pega el siguiente código:

```javascript
(async function repairClaims() {
    console.log('🔧 Reparando custom claims...');

    const auth = firebase.auth();
    const user = auth.currentUser;

    if (!user) {
        console.error('❌ No hay usuario logueado');
        return;
    }

    console.log('👤 Usuario:', user.email);
    console.log('🆔 UID:', user.uid);

    try {
        const functions = firebase.functions();
        const repairFn = functions.httpsCallable('repairCustomClaims');
        const result = await repairFn({});

        console.log('✅ Claims reparados:', result.data);
        console.log('⚠️ Haz logout y login nuevamente');

        if (confirm('¿Hacer logout ahora?')) {
            await auth.signOut();
            window.location.reload();
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
```

**Opción B: Usar el script de consola preparado**

Abre el archivo `scripts/repair-claims-console.js` y copia su contenido en la consola.

**Opción C: Usar Firebase CLI**

```bash
# Instalar Firebase CLI globalmente si no lo tienes
npm install -g firebase-tools

# Login
firebase login

# Obtener el UID del usuario (desde la consola del navegador)
# En tu caso: oVRUt28thDYs2UvSeMAitUdfynG3

# Actualizar el documento en Firestore para que el trigger se ejecute
firebase firestore:update users/oVRUt28thDYs2UvSeMAitUdfynG3 --role franchise --franchiseId F-0004
```

### 3️⃣ Verificar que los Custom Claims están correctos

Después de reparar, ejecuta en la consola:

```javascript
const user = firebase.auth().currentUser;
const tokenResult = await user.getIdTokenResult(true);
console.log('Custom Claims:', tokenResult.claims);
```

Deberías ver algo como:
```javascript
{
  role: "franchise",
  franchiseId: "F-0004",
  // ... otros claims
}
```

### 4️⃣ Probar la aplicación

1. Haz logout
2. Login nuevamente con `prueba@repaart.es`
3. Ve a la sección de Facturación
4. El error 403 debería haber desaparecido

---

## 🐛 ¿Por qué ocurrió este problema?

### Causa Raíz 1: Bug en Cloud Functions
Las funciones estaban comparando:
```typescript
// ❌ INCORRECTO
context.auth.uid === franchiseId
// oVRUt28thDYs2UvSeMAitUdfynG3 === F-0004 ❌
```

En lugar de:
```typescript
// ✅ CORRECTO
context.auth.token.franchiseId === franchiseId
// F-0004 === F-0004 ✅
```

### Causa Raíz 2: Custom Claims no sincronizados
Los custom claims (`role` y `franchiseId`) deben estar en el token de autenticación, no solo en Firestore.

---

## 📞 Si el problema persiste

1. Verifica que las funciones están desplegadas:
```bash
firebase functions:list
```

2. Revisa los logs de las funciones:
```bash
firebase functions:log
```

3. Verifica directamente en Firestore:
```bash
firebase firestore:get users/oVRUt28thDYs2UvSeMAitUdfynG3
```

El documento debe tener:
```json
{
  "role": "franchise",
  "franchiseId": "F-0004",
  "email": "prueba@repaart.es"
}
```

4. Forzar re-ejecución del trigger manualmente:
```bash
firebase firestore:update users/oVRUt28thDYs2UvSeMAitUdfynG3 --updatedAt $((date +%s))
```

---

## ✅ Checklist de verificación

- [ ] Cloud Functions desplegadas con el código corregido
- [ ] Custom claims reparados para el usuario
- [ ] Logout y login realizado
- [ ] Token verificado con `getIdTokenResult(true)`
- [ ] Error 403 resuelto
- [ ] Función `getInvoices` funciona correctamente
- [ ] Facturación accesible sin errores

---

## 🔗 Archivos modificados

1. `functions/src/callables/invoicing.ts` - Autorización corregida
2. `functions/src/callables/invoicingModule.ts` - Autorización corregida
3. `functions/src/callables/repairCustomClaims.ts` - Nueva función de reparación
4. `functions/src/index.ts` - Exportación de nueva función
5. `src/features/billing/components/DebtDashboardView.tsx` - Warnings de Antd corregidos
