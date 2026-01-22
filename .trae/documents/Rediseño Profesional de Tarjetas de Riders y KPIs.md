Vamos a transformar el diseño de la vista de Riders para que sea más profesional, compacto y visualmente coherente.

### 1. Rediseño de Tarjetas de Riders (El cambio principal)
Haremos las tarjetas más compactas y elegantes ("Card Profile Professional"):
- **Estructura**: Reduciremos la altura excesiva eliminando espacios muertos.
- **Estilo Visual**:
    - **Bordes y Sombras**: Pasaremos a un borde sutil (`border-slate-200`) con una sombra suave (`shadow-sm`) que se eleva al pasar el ratón (`hover:shadow-md`).
    - **Encabezado**: El estado (Active/Inactive) será un "badge" pastilla más discreto y moderno en la esquina superior.
    - **Avatar**: Ajustaremos el tamaño y añadiremos un anillo de borde para darle profundidad.
    - **Tipografía**: Jerarquía más clara. Nombre en color oscuro fuerte (`slate-800`), email en gris secundario (`slate-500`) y más pequeño.
- **Métricas (Eficiencia/Contrato)**:
    - Eliminaremos las cajas grises "toscas".
    - Usaremos un diseño de **estadísticas en línea** o cajas con fondo muy sutil y bordes finos, integradas mejor en el flujo de la tarjeta.
- **Acciones (Footer)**:
    - Barra de acciones inferior con iconos limpios (Teléfono, Email, Perfil) separados por bordes sutiles o espaciado, en lugar de botones flotantes.

### 2. Mejora del Panel de KPIs (Header)
- Unificaremos el estilo de las tarjetas superiores ("Flota Total", "Capacidad") con el nuevo diseño de las tarjetas de riders.
- La tarjeta de "Rider del Mes" mantendrá su degradado pero ajustaremos la tipografía para que se vea más "premium" y menos "banner publicitario".

### 3. Ajustes de Grid y Layout
- Revisaremos el `grid-gap` para que las tarjetas respiren mejor sin estar separadas en exceso.
- Aseguraremos que en pantallas grandes (XL/2XL) aprovechemos el ancho para mostrar más columnas si es necesario.

**Archivo a modificar:** `src/features/fleet/RidersView.tsx`
