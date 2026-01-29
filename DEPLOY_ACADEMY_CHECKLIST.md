# 🚀 Checklist para Deploy de Academy

## ✅ VERIFICACIONES AUTOMÁTICAS COMPLETADAS

### Build Status
- [x] TypeScript sin errores
- [x] Build completado exitosamente
- [x] Bundle sizes optimizados
- [x] Archivos CSS incluidos

### Archivos Generados
- [x] Academy.js (23KB)
- [x] Academy.css (6.2KB)
- [x] AcademyAdmin.js (46KB)
- [x] AcademyAdmin.css (11KB)
- [x] academy.js (5.8KB)

**Tamaño total Academy: ~92KB** ✅

---

## ⚠️ ACCIONES REQUERIDAS MANUALES

### 1. Configuración Firebase Console

#### A. Verificar Colecciones Firestore
- [ ] Ir a: https://console.firebase.google.com/project/repaartfinanzas/firestore/data
- [ ] Verificar que existan estas colecciones:
  - [ ] `academy_modules`
  - [ ] `academy_lessons`
  - [ ] `academy_progress`
- [ ] Si no existen, crearlas manualmente

#### B. Configurar Reglas de Firestore
- [ ] Ir a: https://console.firebase.google.com/project/repaartfinanzas/firestore/rules
- [ ] Copiar y pegar las siguientes reglas:

```javascript
rules_version = "2";
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para academy_modules
    match /academy_modules/{moduleId} {
      allow read: if true; // Todos pueden leer
      allow write: if request.auth != null && (
        request.auth.token.admin == true ||
        request.auth.token.franchise == true
      );
    }
    
    // Reglas para academy_lessons
    match /academy_lessons/{lessonId} {
      allow read: if true; // Todos pueden leer
      allow write: if request.auth != null && (
        request.auth.token.admin == true ||
        request.auth.token.franchise == true
      );
    }
    
    // Reglas para academy_progress
    match /academy_progress/{progressId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        request.auth.uid == resource.data.user_id || // Usuario puede editar su propio progreso
        request.auth.token.admin == true
      );
    }
  }
}
```

#### C. Configurar Storage Bucket
- [ ] Ir a: https://console.firebase.google.com/project/repaartfinanzas/storage
- [ ] Verificar que el bucket exista: `repaartfinanzas.firebasestorage.app`
- [ ] Crear directorio: `academy/videos/`

#### D. Configurar Reglas de Storage
- [ ] Ir a: https://console.firebase.google.com/project/repaartfinanzas/storage/rules
- [ ] Copiar y pegar las siguientes reglas:

```javascript
rules_version = "2";
service firebase.storage {
  match /b/{bucket}/o {
    match /academy/videos/{allPaths=**} {
      allow read: if true; // Todos pueden leer
      allow write: if request.auth != null; // Solo usuarios autenticados pueden escribir
    }
  }
}
```

#### E. Configurar CORS en Storage
- [ ] Usar `gsutil` para configurar CORS
- [ ] Crear archivo `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

- [ ] Ejecutar comando: `gsutil cors set cors.json gs://repaartfinanzas.firebasestorage.app`

---

### 2. Testing Pre-Deploy

#### A. Testing con usuario Admin
- [ ] Login como usuario con rol `admin`
- [ ] Navegar a `/admin/academy`
- [ ] Verificar que se muestre el panel de administración
- [ ] Crear un módulo de prueba
- [ ] Crear una lección de prueba
- [ ] Publicar el módulo
- [ ] Verificar que se muestre en la lista de módulos

#### B. Testing con usuario Franchise
- [ ] Login como usuario con rol `franchise`
- [ ] Navegar a `/academy`
- [ ] Verificar que se muestre la lista de módulos
- [ ] Seleccionar un módulo
- [ ] Verificar que se muestre el grid de lecciones
- [ ] Click en una lección
- [ ] Verificar que se muestre el detalle de lección
- [ ] Verificar video player funcional
- [ ] Verificar botón "Expandir" a pantalla completa
- [ ] Verificar contenido de texto separado
- [ ] Marcar lección como completada
- [ ] Verificar que se actualice el progreso

#### C. Testing de Videos
- [ ] Probar lección con video de YouTube
- [ ] Verificar que cargue el thumbnail
- [ ] Verificar que el video se reproduzca
- [ ] Probar botón de pantalla completa
- [ ] Verificar que el video sea responsive

#### D. Testing Responsive
- [ ] Probar en móvil (375px - 414px)
- [ ] Probar en tablet (768px - 1024px)
- [ ] Probar en desktop (>1024px)
- [ ] Verificar que el grid de tarjetas sea responsive
- [ ] Verificar que el sidebar solo aparezca en desktop
- [ ] Verificar que el video sea responsive

#### E. Testing Modo Oscuro
- [ ] Activar modo oscuro en el sistema
- [ ] Verificar que la UI se adapte correctamente
- [ ] Verificar colores y contraste
- [ ] Verificar que el video se vea bien

---

### 3. Deploy a Producción

#### A. Deploy
- [ ] Verificar que todas las pruebas pasaron
- [ ] Ejecutar: `npm run build`
- [ ] Deploy: `npm run deploy` o subir `dist/` al hosting

#### B. Verificación Post-Deploy
- [ ] Acceder a la URL de producción
- [ ] Probar login como admin
- [ ] Probar login como franchise
- [ ] Verificar que las rutas funcionen
- [ ] Verificar que los videos carguen
- [ ] Verificar que el sistema de progreso funcione

#### C. Monitoreo
- [ ] Configurar error tracking
- [ ] Configurar analytics
- [ ] Verificar logs de errores
- [ ] Monitorear performance

---

## 📊 MÉTRICAS DE DEPLOY

### Bundle Sizes
- Academy.js: 23KB ✅
- Academy.css: 6.2KB ✅
- AcademyAdmin.js: 46KB ✅
- AcademyAdmin.css: 11KB ✅
- Total Academy: ~92KB ✅

### Performance Targets
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] TTI < 3.9s

---

## 🔗 ENLACES ÚTILES

### Firebase Console
- **Dashboard**: https://console.firebase.google.com/project/repaartfinanzas/overview
- **Firestore**: https://console.firebase.google.com/project/repaartfinanzas/firestore
- **Firestore Rules**: https://console.firebase.google.com/project/repaartfinanzas/firestore/rules
- **Storage**: https://console.firebase.google.com/project/repaartfinanzas/storage
- **Storage Rules**: https://console.firebase.google.com/project/repaartfinanzas/storage/rules
- **Authentication**: https://console.firebase.google.com/project/repaartfinanzas/authentication

### Documentación
- **Firestore Security Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **Storage Security Rules**: https://firebase.google.com/docs/storage/security
- **CORS Configuration**: https://firebase.google.com/docs/storage/web/download-files#cors_configuration

---

## 📝 NOTAS

### Reglas de Seguridad
- **Academy Modules**: Solo admin y franchise pueden escribir, todos pueden leer
- **Academy Lessons**: Solo admin y franchise pueden escribir, todos pueden leer
- **Academy Progress**: Usuario puede editar su propio progreso, admin puede editar todos
- **Storage Videos**: Solo usuarios autenticados pueden escribir, todos pueden leer

### Funcionalidades Implementadas
- ✅ Vista de tarjetas de lecciones (grid responsive)
- ✅ Vista de detalle de lección
- ✅ Video player expandible a pantalla completa
- ✅ Contenido separado con headers claros
- ✅ Sidebar con lista de lecciones (desktop)
- ✅ Sistema de progreso por módulo
- ✅ Marcar lecciones como completadas
- ✅ Animaciones fluidas con Framer Motion
- ✅ Protección de contenido contra copia
- ✅ Modo oscuro completo
- ✅ Diseño 100% responsive
- ✅ Panel de administración completo
- ✅ Integración con Firebase Firestore
- ✅ Integración con Firebase Storage
- ✅ Hooks personalizados para estado
- ✅ Servicios API optimizados

---

## 🎉 ESTADO FINAL

✅ **CÓDIGO**: Compilado y listo
✅ **BUILD**: Completado exitosamente
✅ **TAMAÑO**: Optimizado (~92KB total)
⚠️ **FIREBASE**: Requiere configuración manual
⚠️ **TESTING**: Requiere pruebas manuales

**RECOMENDACIÓN**: Seguir el checklist en orden para un deploy exitoso.

---

## 📞 SOPORTE

Si encuentras algún problema:
1. Revisa los logs en Firebase Console
2. Verifica las reglas de seguridad
3. Verifica los permisos de los usuarios
4. Revisa la configuración de CORS

---

**Última actualización**: 29/01/2026
**Versión**: 1.0
**Estado**: Ready for Deploy 🚀
