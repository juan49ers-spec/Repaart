# Manual de Actualización (Firebase Hosting)

Sigue estos pasos para desplegar la nueva versión "Executive Glass" en tu proyecto existente (`repaartfinanzas.web.app`).

## 1. Construir el Proyecto (Build)

Genera la versión optimizada para producción:

```powershell
npm run build
```

> **Verificación:** Asegúrate de que se crea/actualiza la carpeta `dist` en la raíz.

## 2. Iniciar Sesión (Opcional)

Si no estás logueado en Firebase CLI:

```powershell
firebase login
```

## 3. Desplegar

Sube la carpeta `dist` a Firebase Hosting:

```powershell
firebase deploy --only hosting
```

## 4. Verificar

Visita `https://repaartfinanzas.web.app` y confirma:

1. Que el diseño sea el nuevo ("Executive Glass").
2. Que la navegación funcione (gracias a la regla de rewrites configurada en `firebase.json`).
3. (Prueba rápida) Recarga la página en cualquier ruta interna (ej: `/dashboard`) para asegurar que no da error 404.
