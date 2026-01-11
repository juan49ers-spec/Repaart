# Manual de Despliegue (Vercel)

Este proyecto está optimizado para **Vercel**. Sigue estos pasos para desplegar la versión de producción "Executive Glass".

## 1. Conectar Repositorio

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard).
2. Click en **"Add New..."** button > **"Project"**.
3. Importa el repositorio de GitHub vinculado a este proyecto.

## 2. Configuración del Build

Vercel debería detectar Vite automáticamente, pero verifica estos valores:

- **Framework Preset**: `Vite`
- **Root Directory**: `./` (o déjalo vacío)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 3. Variables de Entorno (CRÍTICO)

Debes configurar las siguientes variables en la sección **Settings > Environment Variables** de tu proyecto en Vercel.

| Variable | Descripción | Valor (Ejemplo) |
| :--- | :--- | :--- |
| `VITE_GOOGLE_AI_KEY` | API Key para IA (Gemini) | `AIzaSy...` |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS Service ID | `service_xyz` |
| `VITE_EMAILJS_TEMPLATE_NEW_TICKET` | Template ID (Nuevo Ticket) | `template_abc` |
| `VITE_EMAILJS_TEMPLATE_REPLY` | Template ID (Respuesta) | `template_123` |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS Public Key | `user_xyz` |

> ⚠️ **Nota:** Sin estas variables, las funciones de IA y Email fallarán en producción.

## 4. Desplegar

1. Click en **"Deploy"**.
2. Vercel ejecutará `npm install` y `npm run build`.
3. Si el build es exitoso (Exit Code 0), tu dashboard estará live.

## 5. Verificación Post-Deploy

- Entra a la URL proporcionada por Vercel.
- Verifica que el dashboard cargue sin errores de consola.
- Prueba el widget de "Inteligencia Artificial" para confirmar que `VITE_GOOGLE_AI_KEY` funciona.
