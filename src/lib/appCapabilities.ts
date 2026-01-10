
export const APP_CAPABILITIES = `
GUÍA DE NAVEGACIÓN Y FUNCIONALIDADES DE LA APP REPAART:

ROLES DE USUARIO:
1. ADMIN (HQ): Tiene acceso total a todas las secciones.
2. FRANQUICIA (Franchise): Acceso limitado a su propia operativa y finanzas.

ESTRUCTURA DE NAVEGACIÓN (ADMIN):

1. DASHBOARD PRINCIPAL (/admin/dashboard)
   - Resumen global de la red.
   - KPIs principales: Facturación Total, Beneficio Neto, Tickets Abiertos.
   - Mapa de Franquicias (Estado en tiempo real).
   - Alertas Meteorológicas.

2. GESTIÓN DE RED (/admin/network)
   - Lista de todas las franquicias.
   - Acciones:
     - "Nueva Franquicia": Crear una nueva unidad operativa.
     - "Ver Detalle": Acceder al perfil completo de una franquicia.
     - "Asumir Identidad" (Impersonate): Ver la app como si fueras esa franquicia.

3. FINANZAS (/admin/finance)
   - "Dashboard Financiero": Visión macro de ingresos/gastos.
   - "Cierres Mensuales": Validación de los reportes enviados por las franquicias.
   - "Facturación": Generación de facturas de Royalties.

4. ACADEMIA (/admin/academy)
   - Gestión de contenido formativo.
   - Módulos: Crear/Editar cursos y lecciones.
   - Analytics: Progreso de los franquiciados.
   - Quiz Editor: Crear evaluaciones.

5. SOPORTE (/admin/support)
   - Sistema de Tickets (Helpscout/Zendesk style).
   - "Bandeja de Entrada": Tickets pendientes.
   - "Base de Conocimiento": Edición de artículos de ayuda.

6. OPERACIONES (/admin/operations)
   - Supervisión de flota.
   - Incidencias operativas en tiempo real.

ESTRUCTURA DE NAVEGACIÓN (FRANQUICIA):

1. MI NEGOCIO (/franchise/dashboard)
   - Resumen de mi unidad.
   - KPIs locales: Mis pedidos, mi facturación, mis riders.

2. OPERACIONES (/franchise/operations)
   - "Scheduler" (Cuadrante): Gestión de turnos de riders.
   - "Riders": Lista de empleados, documentación, altas/bajas.
   - "Flota": Gestión de motos (Yamimoto), incidencias mecánicas.

3. FINANZAS (/franchise/finance)
   - "Mi P&L": Cuenta de resultados mensual.
   - "Gastos": Subida de tickets (Gasolina, Reparaciones).
   - "Cierre Mensual": Enviar datos a central (Bloqueo día 5 del mes).

4. ACADEMIA (/franchise/academy)
   - "Mis Cursos": Formación obligatoria y opcional.
   - "Certificaciones": Diplomas obtenidos.

5. SOPORTE (/franchise/support)
   - "Ayuda": Buscador de manuales.
   - "Nuevo Ticket": Contactar con central.

FUNCIONALIDADES CLAVE (CÓMO HACER X):

- **Crear un turno**: Ir a /franchise/operations -> Pestaña "Scheduler" -> Clic en hueco vacío o botón "+".
- **Subir una factura**: Ir a /franchise/finance -> Pestaña "Gastos" -> Botón "Subir Ticket".
- **Reportar accidente**: Ir a /franchise/support -> Botón rojo "Emergencia" o crear Ticket Urgente.
- **Ver rentabilidad**: Ir a /franchise/finance -> Ver gráfico de "Margen Neto".
- **Contactar con otra franquicia**: No permitido directamente, usar canales de comunidad en /community (si existe) o soporte.

INTEGRACIÓN CON IA:
- La IA puede leer datos financieros en /finance para auditorías.
- La IA puede sugerir turnos en /operations si faltan riders.
- La IA puede responder dudas operativas usando la "Base de Conocimiento".
`;
