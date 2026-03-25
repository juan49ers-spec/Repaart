---
tipo: reasoning_bank
version: 1.0.0
proyecto: repaart-finanzas
ultima_actualizacion: "2026-03-25"
---

# 🧠 ReasoningBank: Meta-Contexto Repaart

Este documento consolida las "Trayectorias Exitosas" (arquitectura, convenciones y decisiones operativas) del proyecto. Cualquier iteración, sub-agente o intervención **DEBE** adherirse a estas reglas sin excepción (como parte del protocolo `Agentic-Jujutsu`).

## 1. 🛡️ Arquitectura y Prime Directive v2.0
 - **Domain vs. UI**: La UI NUNCA toca directamente Firestore o la API (*Agnóstica*). Ocurre a través de Custom Hooks tipados.
 - **No "Wrapper Hell"**: Sí envolvemos la infra crítica (Firebase Auth, Cloud Functions, LocalStorage), pero NO envolvemos código inofensivo estándar de manipulación de strings o matemáticas.
 - **Atomicidad y Fallback**: Todo código creado o alterado DEBE ser compilable inmediatamente. Prohibido código a medias (`TODO: fill this`). Si la lógica no está lista, usa un Mock funcional.
 - **Flujo Lineal (Early Returns)**: Captura las excepciones de red o dependencias primero. El "Happy Path" debe estar al final, minimizando anidaciones asincrónicas de `if/else`.
 - **Magic Values Zero**: Absolutamente todos los colores, paddings genéricos o radios deben salir del tema base, no inyectados en literales dentro de las capas.

## 2. 🗄️ Tratamiento de Firebase y Bases de Datos
 - **Seguridad Perimetral (AIDefence en Cloud Functions)**: Repaart está expuesto a inyección a través de peticiones. Todos los inputs de prompts van hacia la Nube, *nunca* proceses variables crudas del cliente directamente sin usar la Cloud Function `callGeminiProxy()`.
 - **Custom Claims de Authorización**: El Role Based Access Control (RBAC) se gestiona inyectando roles a los tokens (`admin`, `franchise`, `rider`) sincronizados asincrónicamente con la colección `users` (Ver `onUserWrite`).
 - **Offile Persistence (Firestore)**: Se espera que los turnos y la manipulación de base de datos persistan sin conexión (`enableIndexedDbPersistence`). Las escrituras confían en callbacks promesas.

## 3. 🧩 Componentes y UI/UX Resiliente
 - **Manejo de Estados de Borde Activos**: Componentes complejos deben exponer un UI State que asuma: 
    1. Carga (Spinner/Skeleton)
    2. Missing Data
    3. Falla de Nube (Mensaje claro + Recuperación). 
    Nunca permitas vistas rotas `null` silenciamente.
 - **Extracción Justificada (Regla 100)**: Extrae a un componente *únicamente* si tienes repetición (Dry > 2 veces) o si un bloque rebasa las 100 líneas en legibilidad (*Atomización Prematura bloqueada*).

## 4. 🖨️ Testing y Auditoría
 - Si el agente introduce manipulación de dinero o fechas críticas en el cierre del Wizard (`FranchiseDashboard`), este agente DEBE proveer o sugerir evidencia de Playwright/Test que el componente no rompe bajo presión de tipos inválidos (`undefined`, `NaN`).
 - Toda recolección de métricas financieras del proyecto está agregada en la directiva pre-build (*preAggregateBillingStats* / *syncInvoiceToTaxVault*). No implementes cálculos costosos que Firestore no pueda indexar (`SUM()` nativos) en frontend, delega métricas o sumatorios globales a la Cloud Function de agregación de la franquicia.
 
## 🚫 5. Antipatrones Bloqueados:
 1. Redux/Mobx. Repaart usa Custom Hooks de Inversión de Control.
 2. Re-escribir de cero un módulo sin mirar las dependencias de otros.
 3. Comentarios describiendo "qué" hace una línea de Array.map. Los comentarios solo describen por qué una decisión extraña fue adoptada.
