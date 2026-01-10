# 📚 Cómo Ejecutar el Seed de Encyclopedia

## Paso 1: Configurar el Script

Abre el archivo `scripts/seedEncyclopedia.mjs` y reemplaza las credenciales de Firebase:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",           // ← Reemplazar
    authDomain: "TU_AUTH_DOMAIN",   // ← Reemplazar
    projectId: "TU_PROJECT_ID",     // ← Reemplazar
    // ... etc
};
```

**¿Dónde encontrar estas credenciales?**

- Están en `src/lib/firebase.js` (copia la configuración que ya tienes)

## Paso 2: Instalar Dependencias (si no las tienes)

```bash
npm install firebase
```

## Paso 3: Ejecutar el Seed

Desde la raíz del proyecto:

```bash
node scripts/seedEncyclopedia.mjs
```

## ¿Qué hace este script?

Crea en Firebase:

- ✅ **12 categorías** (Estrategia, Finanzas, Operativa, RRHH, etc.)
- ✅ **14 módulos** de ejemplo (tarjetas educativas)
- ✅ **7 preguntas** de examen

## Output Esperado

```
🌱 Iniciando seed de Encyclopedia...

📁 Creando categorías...
  ✅ Estrategia
  ✅ Finanzas
  ✅ Operativa
  ...

📚 Creando módulos...
  ✅ Modelo Superautónomos
  ✅ Packs Básico vs Premium
  ...

❓ Creando preguntas...
  ✅ ¿Volumen mínimo recomendado...
  ...

✨ ¡Seed completado exitosamente!

📊 Resumen:
   - 12 categorías
   - 14 módulos
   - 7 preguntas
```

## ⚠️ IMPORTANTE

- **Solo ejecuta esto UNA vez**
- Si ya tienes datos, esto los DUPLICARÁ
- Para limpiar: elimina las colecciones en Firebase Console primero

## Verificar en Firebase

1. Ve a Firebase Console → Firestore Database
2. Busca las colecciones:
   - `encyclopedia_categories`
   - `encyclopedia_modules`
   - `encyclopedia_quizzes`

¡Listo! Ahora la Encyclopedia tendrá datos para mostrar.
