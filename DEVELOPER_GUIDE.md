# 🛠️ Synthetic Sagan Developer Tools

Este proyecto incluye una suite completa de herramientas de desarrollo ("DevTools") para facilitar el debugging, diagnóstico y monitoreo de la aplicación en tiempo real.

## 🚀 Acceso Rápido

- **Teclado:** `Ctrl + Shift + U` (Toggle)
- **UI:** Botón flotante "DevTools" en el Sidebar o Header (si visible)

---

## 🧰 Herramientas Disponibles

### 1. 🩺 Health Check AI

Diagnóstico automático del estado del sistema. Se ejecuta al abrir el panel.

- **Rojo (🔴):** Fallo crítico (Firebase desconectado, Auth fallido).
- **Amarillo (🟡):** Advertencia (Datos incompletos, latencia alta).
- **Verde (🟢):** Sistema saludable.

### 2. 📜 Smart History

Registro persistente de tus acciones de debugging.

- Muestra las últimas 10 acciones ejecutadas.
- Persiste entre recargas (localStorage).
- Permite ver cuándo ejecutaste qué script.

### 3. ⭐ Buscador y Favoritos

Encuentra rápidamente la herramienta que necesitas.

- **Buscador:** Filtra herramientas por nombre o descripción.
- **Favoritos:** Haz clic en la estrella (⭐) para anclar tus herramientas más usadas al principio de la lista.

### 4. 🖥️ Console Live

Monitor de logs en tiempo real dentro de la app (sin abrir F12).

- Captura `console.log`, `warn`, `error`, `info`.
- **Filtros:** Por nivel de severidad.
- **Exportar:** Descarga un JSON con todos los logs capturados.
- **Timestamps:** Precisión de milisegundos.

### 5. 🌐 Network Monitor (Firestore)

Monitor especializado para tráfico de Firebase Firestore.

- Detecta operaciones: `getDocs`, `setDoc`, `updateDoc`, etc.
- **Slow Queries:** Marca automáticamente queries que tardan >1s (🐌).
- **Stats:** Conteo de errores y tiempo promedio de respuesta.

### 6. ⚡ Performance Dashboard

Monitor de rendimiento del frontend.

- **Memoria:** Uso del JS Heap en tiempo real.
- **Carga:** Métricas de navegación (TTFB, DOM Load, Window Load).
- **Recursos Lentos:** Top 20 de assets (imágenes, scripts) más pesados o lentos.

---

## 🔧 Scripts de Utilidad

El panel incluye botones para ejecutar scripts complejos de mantenimiento:

- **Verificar Integridad:** Busca inconsistencias en la base de datos de franquicias.
- **Auditoría Financiera:** Valida cálculos de KPIs y busca discrepancias.
- **Limpieza de Datos:** Elimina registros huérfanos o corruptos.
- **Exportar Estado:** Genera un snapshot completo del estado de la aplicación para reportar bugs.

## 👨‍💻 Para Desarrolladores

El código fuente de estas herramientas se encuentra en:

- `src/components/dev/*`: Componentes UI (Panel, Viewers).
- `src/scripts/*`: Lógica de negocio (Interceptors, Monitores).

> **Nota:** Estas herramientas están diseñadas para ser "zero-overhead" cuando están cerradas. Los interceptores de red y consola solo se activan cuando abres sus respectivos paneles.
