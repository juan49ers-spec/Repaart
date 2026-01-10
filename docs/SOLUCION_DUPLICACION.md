# 🚨 GUÍA DE SOLUCIÓN - Duplicación de Módulos

## PROBLEMA DETECTADO

- ✅ Hay 306 módulos en Firestore (debería haber 150)
- ✅ Los módulos duplicados pueden no tener contenido completo
- ✅ Causa: Auto-repair ejecutándose múltiples veces

---

## SOLUCIÓN INMEDIATA (5-10 minutos)

### Opción A: Limpieza Manual desde Firebase Console (RECOMENDADA)

1. **Accede a Firebase Console**:
   - URL: <https://console.firebase.google.com/project/repaartfinanzas/firestore>

2. **Navega a Firestore Database**:
   - Click en "Firestore Database" en el menú lateral

3. **Accede a la colección**:
   - Busca `encyclopedia_modules`

4. **Identifica y elimina duplicados**:
   - Los módulos duplicados suelen tener `createdAt` más reciente
   - **MANTÉN el más antiguo de cada título**
   - Elimina los más recientes (duplicados)

5. **Verificación**:
   - Al final deberías tener exactamente 150 documentos

---

### Opción B: Script Automático (Requiere Node.js configurado)

```bash
# Desde la raíz del proyecto
node scripts/cleanupDuplicates.js
```

**⚠️ ADVERTENCIA**: Este script eliminará permanentemente los duplicados.

---

## PREVENIR DUPLICACIÓN FUTURA

### Paso 1: Limpiar cache de localStorage

En tu navegador (como franquiciado):

1. Abre DevTools (F12)
2. Ve a "Application" o "Almacenamiento"
3. Busca "Local Storage" → tu dominio
4. **ELIMINA** la key: `encyclopedia_autorepair_check`
5. Recarga la p

**Paso 2: Deshabilitar temporalmente auto-repair** (OPCIONAL)

El sistema ya tiene cache de 24h, pero si quieres mayor control:

Edita `src/hooks/useEncyclopedia.js` línea 124:

```javascript
// Cambiar esta condición:
if (!shouldSkipCheck && loadedModules.length < ENCYCLOPEDIA_SEED_DATA.modules.length) {

// Por esta (deshabilita completamente):
if (false) {  // AUTO-REPAIR DISABLED
```

---

## VERIFICAR QUE EL CONTENIDO SE MUESTRA CORRECTAMENTE

### Problema: "No aparece contenido al abrir módulo"

**Causa probable**: Módulos duplicados sin campos `content` o `action`

**Solución**:

1. Primero elimina los duplicados (arriba)
2. Luego verifica que todos los módulos tengan:
   - ✅ `title` (requerido)
   - ✅ `content` (requerido)
   - ✅ `action` (requerido)
   - ✅ `categoryId` (requerido)

**Script de verificación**:

```bash
node scripts/validateEncyclopedia.js
```

Esto te dirá si hay módulos con datos faltantes.

---

## PASOS RECOMENDADOS (EN ORDEN)

1. ✅ **AHORA**: Limpia duplicados desde Firebase Console (Opción A)
2. ✅ **AHORA**: Limpia localStorage en tu navegador
3. ✅ **AHORA**: Recarga la app y verifica que hay 150 módulos
4. ✅ **AHORA**: Verifica que los módulos muestran contenido al abrirlos
5. ⏳ **DESPUÉS**: Si sigue sin funcionar, ejecuta `validateEncyclopedia.js`

---

## ¿NECESITAS AYUDA?

Si prefieres, puedo:

1. 🔧 Crear un script que se conecte como admin y limpie automáticamente
2. 📊 Generar un reporte detallado de qué módulos están duplicados
3. 🛠️ Modificar el código para que NO vuelva a duplicar nunca más

**Dime qué prefieres y lo hago inmediatamente.**
