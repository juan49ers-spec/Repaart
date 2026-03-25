---
description: Flujo de Ejecución Pragmática (Diagnóstico, Atómica, Limpieza, Despliegue)
---
# Flujo de Ejecución Pragmática (Pragmatic Execution Flow)

Este workflow define el estándar de trabajo para máxima velocidad y cero fricción, alineado con la **PRIME DIRECTIVE v2.0: ARQUITECTURA PRAGMÁTICA DE SISTEMAS**.

## 1. Diagnóstico Basado en Datos (No adivinanzas)
- Usa scripts temporales (`.js` o `.ts`) o queries directas a la base de datos para reproducir el estado real del problema.
- Localiza el fallo examinando el flujo de datos exacto.
- **Evidencia antes de la acción:** No toques código hasta que el log confirme la hipótesis.

## 2. Modificación Atómica de la Lógica
- Aplica el cambio justo y necesario para resolver el problema (Single Responsibility).
- Mantén el flujo lineal (Early Returns) y respeta el performance.
- Elimina código redundante ("vudú code") explicando brevemente por qué era ineficiente antes de borrarlo.

## 3. Verificación Cruzada y Limpieza
- Comprueba que la corrección no rompe dependencias (ej. cruce de estados de facturas).
- Elimina todos los scripts temporales creados para el diagnóstico (`rm script.js`).
- Mantén el entorno limpio y listo para producción.

## 4. Documentación Inmutable (Smart Memory)
- Actualiza el archivo `walkthrough.md` o el documento de estado general del proyecto con el problema reportado, el diagnóstico y la solución implementada.
- Sé extremadamente conciso.

## 5. Commit y Despliegue Inmediato (Time-to-Market)
- Añade los archivos modificados al control de versiones de forma selectiva.
- Realiza el commit siguiendo el estándar: `fix: [descripción concisa del cambio]`.
- Haz push de la rama.
- Ejecuta el despliegue a producción de forma autónoma (ej. `npm run build && firebase deploy --only hosting`).

Al seguir este flujo, se garantiza un time-to-market del 100% y cero deuda técnica generada en la corrección o nueva funcionalidad.
