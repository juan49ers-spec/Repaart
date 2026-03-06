# 🔧 GUÍA PASO A PASO - Resolver Error 403 en Facturación

## 📋 Resumen del problema
Tienes **2 errores** que causan el 403:
1. ✅ **Bug en Cloud Functions** - YA CORREGIDO en el código
2. ⚠️ **Custom claims no sincronizados** - Necesita reparación

---

## 🚀 SOLUCIÓN - Elige una opción

### ✅ Opción 1: Componente UI (RECOMENDADO - Más fácil)

#### Paso 1: Agregar el componente a App.tsx

Agrega temporalmente estas líneas en `src/App.tsx`:

```tsx
import RepairClaimsButton from './components/RepairClaimsButton';

// En el return, antes del cierre de </div> o </Router>:
<RepairClaimsButton />
```

#### Paso 2: Desplegar las funciones
```bash
cd functions
firebase deploy --only functions
```

#### Paso 3: Usar el botón
1. Abre la aplicación
2. Verás un botón flotante en la esquina inferior derecha
3. Haz clic en "Reparar Claims"
4. Confirma hacer logout cuando te lo pida
5. Login nuevamente

#### Paso 4: Verificar
- Ve a la sección de Facturación
- El error 403 debería haber desaparecido

#### Paso 5: Limpiar (opcional)
Cuando funcione, elimina el componente de App.tsx:
```tsx
// Elimina estas líneas:
// import RepairClaimsButton from './components/RepairClaimsButton';
// <RepairClaimsButton />
```

---

### 📋 Opción 2: Script de consola

#### Paso 1: Desplegar las funciones
```bash
cd functions
firebase deploy --only functions
```

#### Paso 2: Abrir la aplicación y la consola (F12)

#### Paso 3: Copiar y ejecutar este script

Abre el archivo `scripts/repair-claims-console-v2.js` y copia todo su contenido en la consola.

---

### ⌨️ Opción 3: Firebase CLI (Para usuarios avanzados)

#### Paso 1: Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

#### Paso 2: Login
```bash
firebase login --project repaartfinanzas
```

#### Paso 3: Ejecutar el script
```bash
# En Linux/Mac:
chmod +x scripts/repair-claims-cli.sh
./scripts/repair-claims-cli.sh

# En Windows (Git Bash o WSL):
bash scripts/repair-claims-cli.sh

# O manualmente:
firebase firestore:update users/oVRUt28thDYs2UvSeMAitUdfynG3 \
  --role franchise \
  --franchiseId F-0004 \
  --updatedAt $(date +%s)
```

#### Paso 4: Logout y login en la aplicación

---

## 🧪 Opción 4: Verificación manual

Para verificar que los custom claims están correctos después de la reparación:

```javascript
// En la consola del navegador:
const user = firebase.auth().currentUser;
const tokenResult = await user.getIdTokenResult(true);
console.log('Custom Claims:', tokenResult.claims);
```

Deberías ver:
```javascript
{
  role: "franchise",
  franchiseId: "F-0004",
  // ...
}
```

---

## ✅ Checklist de verificación

Después de seguir cualquiera de las opciones:

- [ ] Funciones desplegadas: `firebase deploy --only functions` ✅
- [ ] Custom claims reparados ✅
- [ ] Logout realizado ✅
- [ ] Login realizado ✅
- [ ] Token verificado con claims correctos ✅
- [ ] Sección de facturación accesible sin errores ✅

---

## 🐛 Si algo sale mal

### Error: "functions/not-found"
**Causa:** Las funciones no están desplegadas
**Solución:**
```bash
cd functions
firebase deploy --only functions
```

### Error: "unauthenticated"
**Causa:** No estás logueado
**Solución:** Haz login en la aplicación primero

### Error: "permission-denied"
**Causa:** El trigger no tiene permisos
**Solución:** Verifica que las reglas de Firestore permiten la actualización

---

## 📊 Estado actual de tu proyecto

### ✅ Ya corregido:
- [x] Bug en `getInvoices` (invoicing.ts)
- [x] Bug en `generateInvoice` (invoicing.ts)
- [x] Bug en `getRestaurants` (invoicing.ts)
- [x] Bug en otras funciones de facturación
- [x] Warnings de Antd en DebtDashboardView.tsx
- [x] Función `repairCustomClaims` creada
- [x] Componente UI creado

### ⏳ Pendiente:
- [ ] Desplegar las funciones
- [ ] Reparar custom claims del usuario
- [ ] Logout/login

---

## 🎯 Recomendación

**USA LA OPCIÓN 1 (Componente UI)** porque:
- ✅ Es la más visual y fácil
- ✅ No requiere conocimientos técnicos
- ✅ Puedes ver el progreso
- ✅ Muestra mensajes claros
- ✅ Fácil de eliminar después

Si tienes problemas, pasa a la Opción 2 o 3.
