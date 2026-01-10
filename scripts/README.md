# Scripts de Administración

## Encyclopedia Seeder

Script para cargar los datos completos de la Encyclopedia en Firestore.

### Requisitos Previos

1. **Service Account Key**
   - Ve a [Firebase Console](https://console.firebase.google.com/project/repaartfinanzas/settings/serviceaccounts/adminsdk)
   - Click en "Generate new private key"
   - Guarda el archivo como `serviceAccountKey.json` en la raíz del proyecto

### Uso

```bash
# Desde la raíz del proyecto
node scripts/seedEncyclopedia.js
```

### Qué hace el script:

1. ✅ Carga 12 categorías
2. ✅ Carga 150 módulos
3. ✅ Limpia quizzes antiguos
4. ✅ Carga 96 quizzes nuevos
5. ✅ Verifica que todo esté correcto

### Seguridad

Este script usa Firebase Admin SDK con permisos totales. **NO** compartas el archivo `serviceAccountKey.json`.
