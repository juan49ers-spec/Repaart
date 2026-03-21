# 🚨 POST-MORTEM: Error al Generar Factura (DUPLICATE_INVOICE)

## 📌 1. Descripción del Problema
**Síntoma:** El sistema arrojaba un "Error inesperado" en la interfaz al intentar generar una factura para un cliente si ya existía otra factura en el mismo mes calendario. En los logs internos de la consola, se registraba el error `[InvoiceEngine] Duplicate invoice detected`.

**Impacto:** Bloqueo total para emitir múltiples facturas al mismo cliente dentro del mismo mes, lo cual es de extrema gravedad operativa, ya que los clientes pueden adquirir servicios/productos adicionales en fechas diferentes dentro del periodo.

---

## 🔍 2. Causa Raíz (Análisis Técnico)

El problema se originó por dos malas prácticas acumuladas en la capa de servicios (`invoiceEngine.ts`) y la capa de manejo de errores (`errorMessages.ts`):

1. **Lógica de Negocio Excesivamente Estricta (Sobreingeniería):**
   - En `invoiceEngine.ts` existía una validación que consultaba Firestore para verificar si el cliente ya tenía una factura emitida en el mes en curso (comparando año y mes).
   - Si encontraba una, bloqueaba la creación lanzando un error customizado tipo `DUPLICATE_INVOICE`. 
   - **Por qué estaba mal:** Se asumió incorrectamente que un cliente soló puede recibir *una* sola factura mensual. En la vida real y facturación dinámica, es un caso habitual tener `n` facturas para el mismo cliente por diferentes conceptos en el mismo mes.

2. **Manejo de Errores Incompleto (Silent Fail):**
   - El código de error devuelto `DUPLICATE_INVOICE` **no estaba mapeado** en nuestro diccionario de traducción (`src/features/billing/utils/errorMessages.ts`). 
   - Esto provocó que el *fallback* genérico capturara el fallo, mostrando a los usuarios "Error inesperado" en lugar del motivo real, complicando la depuración y frustrando al usuario.

---

## 🛠️ 3. Solución Implementada

1. **Eliminación del Bloqueador (invoiceEngine.ts):**
   Se extrajo de raíz el bloque de la consulta duplicada (Líneas 146-183). Ahora el motor de facturación permite múltiples facturas, confiando en que el usuario o el sistema automatizado generador es quien orquesta cuándo facturar.

2. **Mapeo Preventivo del Error (errorMessages.ts):**
   Se agregó `DUPLICATE_INVOICE: 'Ya existe una factura idéntica para este periodo y conceptos.'` y se expandió el fallback. Aunque la regla estricta se quitó, si en el futuro se implementa una validación por "Factura literalmente idéntica (mismo hash o id)", el error ya será legible por el franquiciado.

---

## 🛡️ 4. Prevención y Reglas Futuras (Para la IA y Desarrolladores)

Para evitar que esto vuelva a pasar y no dar "sensación de código amateur", se deben aplicar estas reglas estrictas:

* **PREVENCIÓN DE RESTRICCIONES ARTIFICIALES:** NUNCA implementes limitadores de negocio (ej. "Sólo una factura por mes") a menos que estén explícitamente solicitados en los requerimientos. Las plataformas financieras deben ser pragmáticas y orientadas a la realidad operativa.
* **TRAZABILIDAD DE ERRORES (Fail Loud):** Cada error personalizado que se lanza desde la capa del motor/servicios **DEBE** obligatoriamente estar mapeado en el diccionario visual del frontend. No se permiten "Errores Inesperados" por falta de mapeo de diccionario.
* **PROGRAMACIÓN DEFENSIVA CORRECTA:** La programación defensiva se usa para prevenir inyección de datos nulos, fallos de red o inconsistencias estructurales, **no para bloquear flujos de negocio válidos** basándose en supuestos no verificados.
