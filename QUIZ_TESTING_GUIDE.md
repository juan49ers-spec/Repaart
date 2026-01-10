# 🧪 Guía de Prueba - Sistema de Quizzes Academia

## 🎯 Objetivo

Probar el flujo completo del sistema de quizzes desde la creación hasta la aprobación.

---

## 📋 Flujo de Prueba Completo

### **PARTE 1: Admin Crea el Quiz** (5-10 min)

#### **Paso 1.1: Acceder al Panel de Admin**

1. **Recarga la página** (`F5`)
2. Inicia sesión como **admin** (`hola@repaart.es` o `admin@repaart.com`)
3. Haz clic en el tab **"Academia"** (🎓) en la barra inferior
4. Deberías ver el panel de administración

#### **Paso 1.2:Crear/Seleccionar un Módulo**

- **Opción A** - Si no tienes módulos:
  1. Haz clic en **"Crear Módulo de Ejemplo"**
  2. Espera a que se cree (3 lecciones incluidas)
  
- **Opción B** - Si ya tienes módulos:
  1. Usa cualquier módulo existente

#### **Paso 1.3: Crear Lecciones (si no las tiene)**

1. En el módulo, haz clic en el icono **📄 (Gestionar Lecciones)** (morado/indigo)
2. Si no hay lecciones, crea al menos 2:
   - Haz clic en "+ Nueva Lección"
   - **Lección 1:**
     - Título: "Introducción"
     - Contenido: "# Bienvenido\n\nEste es el contenido de la lección..."
   - **Lección 2:**
     - Título: "Conceptos Clave"
     - Contenido: "# Conceptos\n\n- Concepto 1\n- Concepto 2"
3. Click "Volver" para regresar al panel

#### **Paso 1.4: Crear el Quiz** ⭐

1. En el mismo módulo, haz clic en el icono **📋 (Gestionar Quiz)** (morado)
2 Deberías ver el "Editor de Quiz"
3. **Crear Pregunta 1:**
   - Pregunta: "¿Cuál es la capital de España?"
   - Opción A: "Madrid" ← **Marca el círculo (respuesta correcta)**
   - Opción B: "Barcelona"
   - Opción C: "Sevilla"
   - Opción D: "Valencia"
   - Click "+ Agregar Pregunta"

4. **Crear Pregunta 2:**
   - Pregunta: "¿Cuánto es 2 + 2?"
   - Opción A: "3"
   - Opción B: "4" ← **Marca el círculo (respuesta correcta)**
   - Opción C: "5"
   - Opción D: "6"
   - Click "+ Agregar Pregunta"

5. **Crear Pregunta 3:**
   - Pregunta: "¿Cuál es el color del cielo?"
   - Opción A: "Rojo"
   - Opción B: "Verde"
   - Opción C: "Azul" ← **Marca el círculo (respuesta correcta)**
   - Opción D: "Amarillo"
   - Click "+ Agregar Pregunta"

6. **Guardar el Quiz:**
   - Haz clic en **"Guardar Quiz"** (botón verde arriba a la derecha)
   - Verás un mensaje: "✅ Quiz guardado con éxito"

7. **Verificar:**
   - Deberías ver las 3 preguntas listadas abajo
   - Cada una muestra la pregunta y las opciones
   - La respuesta correcta tiene un borde verde

8. Click "← Volver" para regresar al panel de admin

**✅ Admin completado - El quiz está listo**

---

### **PARTE 2: Estudiante Toma el Quiz** (5-10 min)

#### **Paso 2.1: Cambiar a Vista Estudiante**

1. En el panel de admin, haz clic en el botón **"👁️ Ver como Estudiante"**
2. Deberías ver el dashboard de estudiante con los módulos

#### **Paso 2.2: Abrir el Módulo**

1. Haz clic en el módulo que tiene el quiz
2. Deberías ver el visor de lecciones

#### **Paso 2.3: Completar las Lecciones**

1. **Lección 1:**
   - Lee el contenido
   - Haz clic en **"Marcar como completada"** (botón verde)
   - Automáticamente avanza a la siguiente

2. **Lección 2:**
   - Lee el contenido
   - Haz clic en **"Marcar como completada"**

3. **Verificar progreso:**
   - La barra de progreso arriba debe mostrar **100%**

#### **Paso 2.4: Tomar el Quiz** ⭐⭐⭐

**¡Momento crítico! El quiz debería aparecer automátic amente**

1. **Verás la primera pregunta del quiz:**
   - Título: "¿Cuál es la capital de España?"
   - 4 opciones con círculos
   - Barra de progreso "Pregunta 1 de 3"

2. **Responder Pregunta 1:**
   - Haz clic en "Madrid" (opción A)
   - El botón se pone azul cuando está seleccionado
   - Haz clic en **"Siguiente →"**

3. **Responder Pregunta 2:**
   - Haz clic en "4" (opción B)
   - Haz clic en **"Siguiente →"**

4. **Responder Pregunta 3:**
   - Haz clic en "Azul" (opción C)
   - El botón cambia a **"🏆 Finalizar Quiz"**
   - Haz clic en **"Finalizar Quiz"**

5. **Ver Resultados:**
   - 🎉 Verás una pantalla de resultados
   - **Puntuación: 100%** (3 de 3 correctas)
   - Pantalla verde con "¡Felicidades!"
   - Mensaje: "Has completado el módulo con éxito"

6. **Desglose de Respuestas:**
   - Pregunta 1: ✅ Madrid - Correcta
   - Pregunta 2: ✅ 4 - Correcta
   - Pregunta 3: ✅ Azul - Correcta

7. **Resultado:**
   - Mensaje: "✅ Progreso guardado - Siguiente módulo desbloqueado"
   - Automáticamente vuelve al dashboard después de 3 segundos

**✅ Estudiante completado - Quiz aprobado con éxito**

---

### **PARTE 3: Probar Escenario de Fallo** (Opcional)

#### **Repetir el quiz y fallar a propósito:**

1. Vuelve al mismo módulo (si puedes)
2. Si el quiz aparece de nuevo:
   - Responde **mal** al menos 1 pregunta
   - Ejemplo: En pregunta 1, selecciona "Barcelona" en vez de "Madrid"
   - Completa las otras correctamente

3. **Ver Resultados de Fallo:**
   - 😞 Pantalla roja "No Aprobado"
   - **Puntuación: 66%** (2 de 3 correctas)
   - Mensaje: "Necesitas al menos 80% para aprobar"

4. **Desglose:**
   - Pregunta 1: ❌ Barcelona - Incorrecta
     - Tu respuesta: Barcelona
     - Correcta: Madrid
   - Pregunta 2: ✅ 4 - Correcta
   - Pregunta 3: ✅ Azul - Correcta

5. **Opciones:**
   - Botón **"🔄 Reintentar"** para volver a intentar
   - Si haces clic, vuelves a la pregunta 1

**✅ Escenario de fallo verificado**

---

## 🐛 ¿Qué Verificar Durante la Prueba?

### **Checklist de Funcionalidad:**

#### **Admin Quiz Editor:**

- [ ] Botón "Gestionar Quiz" aparece en cada módulo
- [ ] Se abre el QuizEditor correctamente
- [ ] Puedes agregar preguntas
- [ ] Puedes marcar la respuesta correcta
- [ ] El botón "Guardar Quiz" funciona
- [ ] Las preguntas se muestran después de guardar
- [ ] El botón "Volver" regresa al panel

#### **Estudiante - Lecciones:**

- [ ] Las lecciones se muestran correctamente
- [ ] Botón "Marcar como completada" funciona
- [ ] La barra de progreso se actualiza
- [ ] Auto-avanza a la siguiente lección

#### **Estudiante - Quiz:**

- [ ] El quiz aparece automáticamente al completar todas las lecciones
- [ ] Se muestra la primera pregunta
- [ ] Barra de progreso funciona ("Pregunta X de Y")
- [ ] Puedes seleccionar opciones (círculo se marca)
- [ ] Botón "Siguiente" avanza a la siguiente pregunta
- [ ] La última pregunta muestra "Finalizar Quiz"

#### **Resultados:**

- [ ] Pantalla verde si aprobó (≥80%)
- [ ] Pantalla roja si reprobó (<80%)
- [ ] Puntuación correcta se muestra
- [ ] Desglose pregunta por pregunta aparece
- [ ] Respuestas correctas/incorrectas marcadas
- [ ] Se muestra tu respuesta vs la correcta
- [ ] Botón "Reintentar" aparece si reprobó
- [ ] Vuelve al dashboard si aprobó

#### **Firestore:**

- [ ] Quiz se guarda en `academy_quizzes`
- [ ] Resultado se guarda en `quiz_results`
- [ ] Progreso se actualiza en `academy_progress`

---

## ❗ Problemas Comunes y Soluciones

### **Problema 1: No veo el botón "Gestionar Quiz"**

**Solución:**

- Recarga la página (`F5`)
- Verifica que eres admin
- Verifica que el icono 📋 (ClipboardCheck) aparece junto a 📄 y ✏️

### **Problema 2: El quiz no aparece después de completar lecciones**

**Solución:**

- Verifica que creaste el quiz desde el admin
- Verifica en Firestore que existe en `academy_quizzes` con el `moduleId` correcto
- Abre la consola del navegador (F12) y busca errores

### **Problema 3: Error al guardar el quiz**

**Solución:**

- Verifica que todas las preguntas tienen 4 opciones completas
- Verifica que marcaste una respuesta correcta
- Revisa los permisos de Firestore
- Mira la consola del navegador para errores específicos

### **Problema 4: La puntuación no es correcta**

**Solución:**

- Verifica que selected la respuesta correcta al crear el quiz
- Verifica el `correctAnswer` index (0=A, 1=B, 2=C, 3=D)
- Revisa la consola del navegador

### **Problema 5: No vuelve al dashboard después de aprobar**

**Solución:**

- Espera 3 segundos (hay un timeout)
- Si no funciona, haz clic en "← Volver" manualmente

---

## 📊 Datos Esperados en Firestore

### **Colección: academy_quizzes**

```javascript
{
  moduleId: "abc123",
  title: "Evaluación: Nombre del Módulo",
  passingScore: 80,
  questions: [
    {
      question: "¿Cuál es la capital de España?",
      options: ["Madrid", "Barcelona", "Sevilla", "Valencia"],
      correctAnswer: 0
    },
    // ... más preguntas
  ],
  createdAt: "2025-12-18T19:00:00.000Z"
}
```

### **Colección: quiz_results**

```javascript
{
  userId: "user_123",
  moduleId: "abc123",
  score: 100,
  answers: {
    0: 0,  // Pregunta 0, respondió opción 0
    1: 1,  // Pregunta 1, respondió opción 1
    2: 2   // Pregunta 2, respondió opción 2
  },
  completedAt: "2025-12-18T19:05:00.000Z"
}
```

### **Collection: academy_progress (Actualizado)**

```javascript
{
  userId: "user_123",
  moduleId: "abc123",
  score: 100,
  completed: true,        // true porque score >= 80
  quizCompleted: true,
  completedAt: "2025-12-18T19:05:00.000Z",
  completedLessons: 2,
  // ... otros campos
}
```

---

## ✅ Resultado Esperado Final

Al completar esta prueba exitosamente:

1. ✅ Admin puede crear quizzes visualmente
2. ✅ Estudiante ve el quiz después de completar lecciones
3. ✅ Sistema calcula puntuación correctamente
4. ✅ Feedback inmediato con respuestas correctas
5. ✅ Progreso se guarda en Firestore
6. ✅ Siguiente módulo se desbloquea al aprobar
7. ✅ Opción de reintentar si no aprueba

---

## 🎥 Grabación de Video (Opcional)

Si quieres documentar el flujo completo, graba la pantalla mientras pruebas:

1. Windows: `Win + G` (Xbox Game Bar)
2. Grabar el flujo completo de 5-10 minutos
3. Útil para:
   - Documentación interna
   - Capacitación de usuarios
   - Debugging futuro

---

**¡Listo para probar! Recarga la página y comienza con el Paso 1.1** 🚀
