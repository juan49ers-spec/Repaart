# Scripts de Testing y Verificación de Seguridad
## Repaart - Sistema de Auditoría

---

## 📋 ÍNDICE

1. [Tests de Seguridad](#tests-de-seguridad)
2. [Tests Funcionales](#tests-funcionales)
3. [Scripts de Verificación](#scripts-de-verificación)
4. [Tests de Carga](#tests-de-carga)
5. [Testing Manual](#testing-manual)

---

## 🛡️ TESTS DE SEGURIDAD

### 1. Test de Autenticación y Autorización

#### 1.1 Test: Login con Usuario Eliminado
**Objetivo:** Verificar que usuarios eliminados no pueden iniciar sesión

**Pasos:**
1. Crear usuario de prueba
2. Eliminar usuario desde admin panel
3. Intentar login con credenciales del usuario eliminado
4. Verificar que el login falla con mensaje apropiado

**Resultado Esperado:** Error "Tu cuenta está eliminada. Contacta con soporte."

**Script (Node.js):**
```javascript
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
  apiKey: "AIzaSyC0vTiufm9bWbzXzWwqy2sEuIZLNxYiVdg",
  authDomain: "repaartfinanzas.firebaseapp.com",
  projectId: "repaartfinanzas"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testDeletedUserLogin() {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'deleted_user@repaart.es',
      'password123'
    );
    console.error('❌ TEST FAILED: Usuario eliminado pudo hacer login');
  } catch (error) {
    if (error.code === 'auth/user-not-found' || 
        error.message.includes('eliminada')) {
      console.log('✅ TEST PASSED: Usuario eliminado no pudo hacer login');
    } else {
      console.error('❌ TEST FAILED: Error inesperado:', error.message);
    }
  }
}

testDeletedUserLogin();
```

---

#### 1.2 Test: Login con Usuario Bloqueado
**Objetivo:** Verificar que usuarios bloqueados no pueden iniciar sesión

**Pasos:**
1. Crear usuario de prueba
2. Cambiar status a 'banned' desde admin panel
3. Intentar login
4. Verificar que el login falla

**Resultado Esperado:** Error "Tu cuenta está bloqueada. Contacta con soporte."

---

#### 1.3 Test: Acceso Sin Autenticación
**Objetivo:** Verificar que rutas protegidas redirigen a login

**Pasos:**
1. Cerrar sesión (logout)
2. Intentar acceder directamente a ruta protegida (ej: /admin)
3. Verificar redirección a /login

**Resultado Esperado:** Redirección a /login

**Test (Playwright):**
```typescript
import { test, expect } from '@playwright/test';

test('Acceso sin autenticación redirige a login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/.*\/login/);
});
```

---

#### 1.4 Test: Elevación de Privilegios
**Objetivo:** Verificar que un rider no puede acceder a funciones de admin

**Pasos:**
1. Login como rider
2. Intentar acceder a /admin/users
3. Verificar que se muestra error 403 o redirección

**Resultado Esperado:** Error 403 o redirección a página no autorizada

**Test (Playwright):**
```typescript
test('Rider no puede acceder a panel de admin', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'rider@repaart.es');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/');
  await page.goto('/admin/users');

  await expect(page.locator('text=Acceso Denegado')).toBeVisible();
});
```

---

#### 1.5 Test: SQL Injection / NoSQL Injection
**Objetivo:** Verificar que la aplicación es resistente a inyecciones

**Pasos:**
1. Intentar inyección en campo de búsqueda
2. Intentar inyección en campos de formulario
3. Verificar que la aplicación maneja los caracteres especiales correctamente

**Resultado Esperado:** Los caracteres especiales son escapados correctamente

**Test (Playwright):**
```typescript
test('Resistencia a inyecciones NoSQL', async ({ page }) => {
  await page.goto('/admin/users');
  
  const maliciousInput = '{"$gt": ""}';
  await page.fill('input[placeholder="Buscar..."]', maliciousInput);
  
  await expect(page.locator('.error-message')).not.toBeVisible();
  await expect(page.locator('.user-list')).toBeVisible();
});
```

---

### 2. Tests de Firestore Rules

#### 2.1 Test: Admin Puede Leer Todos los Usuarios
**Objetivo:** Verificar que admin tiene acceso completo a users

**Script (Firebase Emulator):**
```javascript
const firebase = require('firebase-admin');
const firebaseApp = firebase.initializeApp();
const db = firebase.firestore();

async function testAdminReadUsers() {
  // Loguear como admin
  const adminToken = await firebase.auth().customClaims.setCustomUserClaims('admin_uid', { role: 'admin' });
  
  try {
    const snapshot = await db.collection('users').get();
    console.log(`✅ TEST PASSED: Admin leyó ${snapshot.docs.length} usuarios`);
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  }
}

testAdminReadUsers();
```

---

#### 2.2 Test: Franquicia Solo Puede Leer sus Usuarios
**Objetivo:** Verificar que franquicia solo puede leer sus riders

**Script:**
```javascript
async function testFranchiseReadUsers() {
  // Loguear como franquicia
  const franchiseToken = await firebase.auth().customClaims.setCustomUserClaims('franchise_uid', { role: 'franchise' });
  
  try {
    // Intentar leer usuarios de otra franquicia
    const snapshot = await db.collection('users')
      .where('franchiseId', '==', 'OTHER_FRANCHISE_ID')
      .get();
      
    if (snapshot.docs.length > 0) {
      console.error('❌ TEST FAILED: Franquicia leyó usuarios de otra franquicia');
    } else {
      console.log('✅ TEST PASSED: Franquicia no puede leer usuarios de otra franquicia');
    }
  } catch (error) {
    console.log('✅ TEST PASSED: Franquicia bloqueada por rules:', error.message);
  }
}
```

---

#### 2.3 Test: Rider No Puede Leer Registros Financieros
**Objetivo:** Verificar que riders no pueden acceder a financial_records

**Script:**
```javascript
async function testRiderReadFinancialRecords() {
  const riderToken = await firebase.auth().customClaims.setCustomUserClaims('rider_uid', { role: 'rider' });
  
  try {
    const snapshot = await db.collection('financial_records').get();
    console.error('❌ TEST FAILED: Rider pudo leer registros financieros');
  } catch (error) {
    console.log('✅ TEST PASSED: Rider bloqueado por rules:', error.message);
  }
}
```

---

#### 2.4 Test: Logs de Auditoría Son Inmutables
**Objetivo:** Verificar que audit_logs no pueden ser actualizados/eliminados

**Script:**
```javascript
async function testAuditLogsImmutability() {
  const adminToken = await firebase.auth().customClaims.setCustomUserClaims('admin_uid', { role: 'admin' });
  
  try {
    // Intentar actualizar un log
    await db.collection('audit_logs').doc('log_id').update({ action: 'modified' });
    console.error('❌ TEST FAILED: Admin pudo actualizar audit log');
  } catch (error) {
    console.log('✅ TEST PASSED: Audit log es inmutable:', error.message);
  }
  
  try {
    // Intentar eliminar un log
    await db.collection('audit_logs').doc('log_id').delete();
    console.error('❌ TEST FAILED: Admin pudo eliminar audit log');
  } catch (error) {
    console.log('✅ TEST PASSED: Audit log es inmutable:', error.message);
  }
}
```

---

### 3. Tests de Cloud Functions

#### 3.1 Test: createUserManaged por No-Admin
**Objetivo:** Verificar que no-admin no puede crear usuarios

**Script:**
```javascript
const functions = require('firebase-functions');
const { httpsCallable } = require('firebase/functions');

async function testCreateUserByNonAdmin() {
  const app = firebase.initializeApp(firebaseConfig);
  const createUser = httpsCallable(functions, 'createUserManaged');
  
  // Loguear como rider
  await firebase.auth().signInWithEmailAndPassword('rider@repaart.es', 'password');
  
  try {
    const result = await createUser({
      email: 'newuser@repaart.es',
      password: 'password123',
      role: 'rider'
    });
    console.error('❌ TEST FAILED: Rider pudo crear usuario');
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.log('✅ TEST PASSED: Rider bloqueado al crear usuario');
    } else {
      console.error('❌ TEST FAILED: Error inesperado:', error);
    }
  }
}
```

---

#### 3.2 Test: adminDeleteUser del Propio Usuario
**Objetivo:** Verificar que admin no puede eliminarse a sí mismo

**Script:**
```javascript
async function testSelfDeletion() {
  const deleteUser = httpsCallable(functions, 'adminDeleteUser');
  
  // Loguear como admin
  const user = await firebase.auth().signInWithEmailAndPassword('admin@repaart.es', 'password');
  
  try {
    const result = await deleteUser({ uid: user.uid });
    console.error('❌ TEST FAILED: Admin pudo eliminarse a sí mismo');
  } catch (error) {
    if (error.code === 'failed-precondition' || error.message.includes('misma cuenta')) {
      console.log('✅ TEST PASSED: Admin no puede eliminarse a sí mismo');
    } else {
      console.error('❌ TEST FAILED: Error inesperado:', error);
    }
  }
}
```

---

#### 3.3 Test: onUserWrite Actualiza Custom Claims
**Objetivo:** Verificar que el trigger actualiza claims cuando cambia el documento

**Script:**
```javascript
async function testOnUserWriteClaims() {
  const db = firebase.firestore();
  
  // Crear usuario
  const userDoc = await db.collection('users').add({
    email: 'test@repaart.es',
    role: 'rider',
    status: 'active'
  });
  
  // Esperar trigger (2 segundos)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Obtener token del usuario
  const user = await firebase.auth().getUser(userDoc.id);
  const claims = await user.customClaims;
  
  if (claims.role === 'rider') {
    console.log('✅ TEST PASSED: Custom claims actualizados por trigger');
  } else {
    console.error('❌ TEST FAILED: Custom claims no actualizados:', claims);
  }
}
```

---

#### 3.4 Test: onIncidentCreated Envía Notificación
**Objetivo:** Verificar que el trigger envía notificación al crear incidente

**Script:**
```javascript
async function testIncidentNotification() {
  const db = firebase.firestore();
  
  // Crear incidente
  await db.collection('incidents').add({
    riderId: 'rider_uid',
    description: 'Test incident',
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  
  // Esperar trigger (2 segundos)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Verificar notificación
  const notifications = await db.collection('notifications')
    .where('type', '==', 'incident')
    .get();
    
  if (notifications.docs.length > 0) {
    console.log('✅ TEST PASSED: Notificación enviada al crear incidente');
  } else {
    console.error('❌ TEST FAILED: No se envió notificación');
  }
}
```

---

## 🧪 TESTS FUNCIONALES

### 1. Admin Panel Tests

#### 1.1 Test: Crear Usuario Rider
**Pasos:**
1. Login como admin
2. Ir a /admin/users
3. Hacer clic en "Crear Usuario"
4. Completar formulario con datos de rider
5. Hacer clic en "Crear"
6. Verificar que el usuario aparece en la lista

**Resultado Esperado:** Usuario creado y visible en la lista

**Test (Playwright):**
```typescript
test('Crear usuario rider', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@repaart.es');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('/');
  await page.goto('/admin/users');
  
  await page.click('text=Crear Usuario');
  await page.fill('input[name="email"]', 'newrider@repaart.es');
  await page.fill('input[name="displayName"]', 'Test Rider');
  await page.selectOption('select[name="role"]', 'rider');
  await page.fill('input[name="password"]', 'password123');
  await page.click('text=Crear');
  
  await expect(page.locator('text=newrider@repaart.es')).toBeVisible();
});
```

---

#### 1.2 Test: Eliminar Usuario
**Pasos:**
1. Login como admin
2. Ir a /admin/users
3. Buscar usuario a eliminar
4. Hacer clic en el icono de eliminación
5. Confirmar eliminación
6. Verificar que el usuario ya no aparece en la lista

**Resultado Esperado:** Usuario eliminado y no aparece en la lista

---

#### 1.3 Test: Crear Franquicia
**Pasos:**
1. Login como admin
2. Ir a /admin/franchises
3. Hacer clic en "Crear Franquicia"
4. Completar formulario
5. Hacer clic en "Crear"
6. Verificar que la franquicia aparece en la lista

**Resultado Esperado:** Franquicia creada y visible en la lista

---

#### 1.4 Test: Subir Recurso
**Pasos:**
1. Login como admin
2. Ir a /admin/resources
3. Hacer clic en "Subir Recurso"
4. Seleccionar archivo
5. Completar formulario
6. Hacer clic en "Subir"
7. Verificar que el recurso aparece en la lista

**Resultado Esperado:** Recurso subido y visible en la lista

---

#### 1.5 Test: Crear Anuncio
**Pasos:**
1. Login como admin
2. Ir a /admin/announcements
3. Hacer clic en "Crear Anuncio"
4. Completar formulario
5. Hacer clic en "Publicar"
6. Verificar que el anuncio aparece en la lista

**Resultado Esperado:** Anuncio creado y visible en la lista

---

### 2. Franchise Panel Tests

#### 2.1 Test: Registrar Ingreso
**Pasos:**
1. Login como franquicia
2. Ir a /franchise/finance
3. Hacer clic en "Registrar Ingreso"
4. Completar formulario
5. Hacer clic en "Registrar"
6. Verificar que el ingreso aparece en la lista

**Resultado Esperado:** Ingreso registrado y visible en la lista

---

#### 2.2 Test: Registrar Gasto
**Pasos:**
1. Login como franquicia
2. Ir a /franchise/finance
3. Hacer clic en "Registrar Gasto"
4. Completar formulario
5. Hacer clic en "Registrar"
6. Verificar que el gasto aparece en la lista

**Resultado Esperado:** Gasto registrado y visible en la lista

---

#### 2.3 Test: Cierre Mensual
**Pasos:**
1. Login como franquicia
2. Ir a /franchise/finance
3. Hacer clic en "Cerrar Mes"
4. Confirmar cierre
5. Verificar que el mes aparece como cerrado

**Resultado Esperado:** Mes cerrado y marcado como tal

---

#### 2.4 Test: Subir Documento
**Pasos:**
1. Login como franquicia
2. Ir a /franchise/resources
3. Hacer clic en "Subir Documento"
4. Seleccionar archivo
5. Completar formulario
6. Hacer clic en "Subir"
7. Verificar que el documento aparece en la lista

**Resultado Esperado:** Documento subido y visible en la lista

---

### 3. Scheduler Tests

#### 3.1 Test: Crear Turno
**Pasos:**
1. Login como franquicia
2. Ir a /scheduler
3. Hacer clic en "Crear Turno"
4. Completar formulario (fecha, hora inicio, hora fin)
5. Hacer clic en "Crear"
6. Verificar que el turno aparece en el calendario

**Resultado Esperado:** Turno creado y visible en el calendario

---

#### 3.2 Test: Asignar Rider a Turno
**Pasos:**
1. Login como franquicia
2. Ir a /scheduler
3. Arrastrar un rider al turno
4. Soltar en el turno
5. Verificar que el rider aparece asignado al turno

**Resultado Esperado:** Rider asignado al turno

---

#### 3.3 Test: Editar Turno
**Pasos:**
1. Login como franquicia
2. Ir a /scheduler
3. Hacer clic en un turno existente
4. Modificar datos
5. Hacer clic en "Guardar"
6. Verificar que los cambios se reflejan

**Resultado Esperado:** Turno actualizado con los nuevos datos

---

#### 3.4 Test: Eliminar Turno
**Pasos:**
1. Login como franquicia
2. Ir a /scheduler
3. Hacer clic en un turno existente
4. Hacer clic en "Eliminar"
5. Confirmar eliminación
6. Verificar que el turno ya no aparece

**Resultado Esperado:** Turno eliminado

---

### 4. Rider Panel Tests

#### 4.1 Test: Ver Turnos Próximos
**Pasos:**
1. Login como rider
2. Ir a /rider/home
3. Verificar que aparecen los turnos próximos

**Resultado Esperado:** Turnos próximos visibles

---

#### 4.2 Test: Confirmar Turno
**Pasos:**
1. Login como rider
2. Ir a /rider/schedule
3. Hacer clic en "Confirmar" en un turno pendiente
4. Verificar que el turno cambia a "confirmado"

**Resultado Esperado:** Turno confirmado

---

#### 4.3 Test: Solicitar Cambio de Turno
**Pasos:**
1. Login como rider
2. Ir a /rider/schedule
3. Hacer clic en "Solicitar Cambio" en un turno
4. Completar formulario
5. Hacer clic en "Enviar"
6. Verificar que la solicitud se envía

**Resultado Esperado:** Solicitud de cambio enviada

---

### 5. Support Tests

#### 5.1 Test: Crear Ticket
**Pasos:**
1. Login como usuario
2. Ir a /support
3. Hacer clic en "Crear Ticket"
4. Completar formulario
5. Hacer clic en "Enviar"
6. Verificar que el ticket aparece en la lista

**Resultado Esperado:** Ticket creado y visible en la lista

---

#### 5.2 Test: Enviar Mensaje en Ticket
**Pasos:**
1. Login como usuario
2. Ir a /support
3. Abrir un ticket existente
4. Escribir mensaje
5. Hacer clic en "Enviar"
6. Verificar que el mensaje aparece en la conversación

**Resultado Esperado:** Mensaje enviado y visible

---

#### 5.3 Test: Asignar Ticket (Admin)
**Pasos:**
1. Login como admin
2. Ir a /admin/support
3. Abrir un ticket abierto
4. Hacer clic en "Asignar a mí"
5. Verificar que el ticket cambia a "in_progress"

**Resultado Esperado:** Ticket asignado y estado cambiado

---

#### 5.4 Test: Cerrar Ticket
**Pasos:**
1. Login como admin
2. Ir a /admin/support
3. Abrir un ticket en progreso
4. Hacer clic en "Cerrar Ticket"
5. Verificar que el ticket cambia a "closed"

**Resultado Esperado:** Ticket cerrado

---

### 6. Academy Tests

#### 6.1 Test: Acceder a Módulo
**Pasos:**
1. Login como rider
2. Ir a /academy
3. Hacer clic en un módulo
4. Verificar que las lecciones aparecen

**Resultado Esperado:** Lecciones del módulo visibles

---

#### 6.2 Test: Completar Lección
**Pasos:**
1. Login como rider
2. Ir a /academy
3. Abrir una lección
4. Hacer clic en "Completar"
5. Verificar que la lección se marca como completada

**Resultado Esperado:** Lección completada

---

#### 6.3 Test: Completar Quiz
**Pasos:**
1. Login como rider
2. Ir a /academy
3. Abrir un quiz
4. Responder preguntas
5. Hacer clic en "Enviar"
6. Verificar que el resultado aparece

**Resultado Esperado:** Quiz completado y resultado visible

---

## 🔍 SCRIPTS DE VERIFICACIÓN

### 1. Script de Verificación de Integridad de Datos

```javascript
/**
 * Script para verificar la integridad de los datos en Firestore
 * Ejecutar con: node verify-data-integrity.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verifyDataIntegrity() {
  console.log('🔍 Iniciando verificación de integridad de datos...\n');
  
  // Verificar usuarios sin documento en users
  console.log('1. Verificando usuarios en Auth sin documento en Firestore...');
  const authUsers = await admin.auth().listUsers();
  let usersWithoutDoc = 0;
  
  for (const user of authUsers.users) {
    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) {
      console.error(`❌ Usuario ${user.email} (${user.uid}) no tiene documento en Firestore`);
      usersWithoutDoc++;
    }
  }
  
  if (usersWithoutDoc === 0) {
    console.log('✅ Todos los usuarios de Auth tienen documento en Firestore');
  }
  
  // Verificar documentos users sin usuario en Auth
  console.log('\n2. Verificando documentos users sin usuario en Auth...');
  const usersSnapshot = await db.collection('users').get();
  let docsWithoutAuth = 0;
  
  for (const doc of usersSnapshot.docs) {
    try {
      await admin.auth().getUser(doc.id);
    } catch (error) {
      console.error(`❌ Documento ${doc.id} (${doc.data().email}) no tiene usuario en Auth`);
      docsWithoutAuth++;
    }
  }
  
  if (docsWithoutAuth === 0) {
    console.log('✅ Todos los documentos users tienen usuario en Auth');
  }
  
  // Verificar usuarios con status 'deleted' que aún pueden loguearse
  console.log('\n3. Verificando usuarios con status deleted...');
  let deletedUsers = 0;
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    if (userData.status === 'deleted') {
      console.error(`❌ Usuario ${doc.id} (${userData.email}) tiene status 'deleted'`);
      deletedUsers++;
    }
  }
  
  if (deletedUsers === 0) {
    console.log('✅ No hay usuarios con status deleted');
  }
  
  // Verificar custom claims inconsistentes
  console.log('\n4. Verificando custom claims inconsistentes...');
  let inconsistentClaims = 0;
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const user = await admin.auth().getUser(doc.id);
    const claims = user.customClaims || {};
    
    if (claims.role !== userData.role) {
      console.error(`❌ Usuario ${doc.id}: role en doc (${userData.role}) != role en claims (${claims.role})`);
      inconsistentClaims++;
    }
    
    if (claims.franchiseId !== userData.franchiseId) {
      console.error(`❌ Usuario ${doc.id}: franchiseId en doc (${userData.franchiseId}) != franchiseId en claims (${claims.franchiseId})`);
      inconsistentClaims++;
    }
  }
  
  if (inconsistentClaims === 0) {
    console.log('✅ Todos los custom claims son consistentes');
  }
  
  // Verificar turnos sin rider asignado pero con riderId
  console.log('\n5. Verificando turnos inconsistentes...');
  const shiftsSnapshot = await db.collection('work_shifts').get();
  let inconsistentShifts = 0;
  
  for (const doc of shiftsSnapshot.docs) {
    const shiftData = doc.data();
    if (shiftData.riderId) {
      const riderDoc = await db.collection('users').doc(shiftData.riderId).get();
      if (!riderDoc.exists) {
        console.error(`❌ Turno ${doc.id} tiene riderId ${shiftData.riderId} pero el rider no existe`);
        inconsistentShifts++;
      }
    }
  }
  
  if (inconsistentShifts === 0) {
    console.log('✅ Todos los turnos son consistentes');
  }
  
  console.log('\n🎉 Verificación completada');
  console.log(`📊 Resumen:`);
  console.log(`   - Usuarios sin documento: ${usersWithoutDoc}`);
  console.log(`   - Documentos sin usuario: ${docsWithoutAuth}`);
  console.log(`   - Usuarios con status deleted: ${deletedUsers}`);
  console.log(`   - Custom claims inconsistentes: ${inconsistentClaims}`);
  console.log(`   - Turnos inconsistentes: ${inconsistentShifts}`);
}

verifyDataIntegrity().catch(console.error);
```

---

### 2. Script de Verificación de Permisos

```javascript
/**
 * Script para verificar que los permisos están correctamente configurados
 * Ejecutar con: node verify-permissions.js
 */

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function verifyPermissions() {
  console.log('🔍 Iniciando verificación de permisos...\n');
  
  // Crear usuarios de prueba
  const adminUid = 'test-admin-' + Date.now();
  const franchiseUid = 'test-franchise-' + Date.now();
  const riderUid = 'test-rider-' + Date.now();
  
  console.log('1. Creando usuarios de prueba...');
  await admin.auth().createUser({
    uid: adminUid,
    email: 'test-admin@repaart.es',
    password: 'password123'
  });
  
  await admin.auth().createUser({
    uid: franchiseUid,
    email: 'test-franchise@repaart.es',
    password: 'password123'
  });
  
  await admin.auth().createUser({
    uid: riderUid,
    email: 'test-rider@repaart.es',
    password: 'password123'
  });
  
  await db.collection('users').doc(adminUid).set({
    email: 'test-admin@repaart.es',
    role: 'admin',
    status: 'active'
  });
  
  await db.collection('users').doc(franchiseUid).set({
    email: 'test-franchise@repaart.es',
    role: 'franchise',
    status: 'active',
    franchiseId: franchiseUid
  });
  
  await db.collection('users').doc(riderUid).set({
    email: 'test-rider@repaart.es',
    role: 'rider',
    status: 'active',
    franchiseId: franchiseUid
  });
  
  await admin.auth().setCustomUserClaims(adminUid, { role: 'admin' });
  await admin.auth().setCustomUserClaims(franchiseUid, { role: 'franchise' });
  await admin.auth().setCustomUserClaims(riderUid, { role: 'rider' });
  
  console.log('✅ Usuarios de prueba creados\n');
  
  // Verificar que admin puede leer todo
  console.log('2. Verificando permisos de admin...');
  try {
    await db.collection('users').get();
    console.log('✅ Admin puede leer users');
    
    await db.collection('financial_records').get();
    console.log('✅ Admin puede leer financial_records');
    
    await db.collection('tickets').get();
    console.log('✅ Admin puede leer tickets');
  } catch (error) {
    console.error('❌ Admin tiene permisos incorrectos:', error);
  }
  
  // Verificar que franchise solo puede leer sus datos
  console.log('\n3. Verificando permisos de franchise...');
  try {
    const franchiseUsers = await db.collection('users')
      .where('franchiseId', '==', franchiseUid)
      .get();
    console.log(`✅ Franchise puede leer sus usuarios (${franchiseUsers.docs.length})`);
    
    await db.collection('financial_records')
      .where('franchiseId', '==', franchiseUid)
      .get();
    console.log('✅ Franchise puede leer sus financial_records');
  } catch (error) {
    console.error('❌ Franchise tiene permisos incorrectos:', error);
  }
  
  // Verificar que rider solo puede leer sus datos
  console.log('\n4. Verificando permisos de rider...');
  try {
    await db.collection('users').doc(riderUid).get();
    console.log('✅ Rider puede leer su perfil');
    
    await db.collection('work_shifts')
      .where('riderId', '==', riderUid)
      .get();
    console.log('✅ Rider puede leer sus turnos');
  } catch (error) {
    console.error('❌ Rider tiene permisos incorrectos:', error);
  }
  
  // Verificar que rider NO puede leer datos financieros
  console.log('\n5. Verificando restricciones de rider...');
  try {
    await db.collection('financial_records').get();
    console.error('❌ Rider NO debería poder leer financial_records');
  } catch (error) {
    console.log('✅ Rider está bloqueado de financial_records');
  }
  
  // Limpiar usuarios de prueba
  console.log('\n6. Limpiando usuarios de prueba...');
  await admin.auth().deleteUser(adminUid);
  await admin.auth().deleteUser(franchiseUid);
  await admin.auth().deleteUser(riderUid);
  await db.collection('users').doc(adminUid).delete();
  await db.collection('users').doc(franchiseUid).delete();
  await db.collection('users').doc(riderUid).delete();
  
  console.log('✅ Usuarios de prueba eliminados');
  console.log('\n🎉 Verificación de permisos completada');
}

verifyPermissions().catch(console.error);
```

---

### 3. Script de Verificación de Cloud Functions

```javascript
/**
 * Script para verificar que las Cloud Functions están funcionando
 * Ejecutar con: node verify-functions.js
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

async function verifyFunctions() {
  console.log('🔍 Iniciando verificación de Cloud Functions...\n');
  
  // Crear usuario admin de prueba
  const adminUid = 'test-admin-' + Date.now();
  await admin.auth().createUser({
    uid: adminUid,
    email: 'test-admin@repaart.es',
    password: 'password123'
  });
  
  await admin.firestore().collection('users').doc(adminUid).set({
    email: 'test-admin@repaart.es',
    role: 'admin',
    status: 'active'
  });
  
  await admin.auth().setCustomUserClaims(adminUid, { role: 'admin' });
  
  console.log('✅ Admin de prueba creado\n');
  
  // Test 1: createUserManaged
  console.log('1. Testeando createUserManaged...');
  try {
    const createUser = functions.httpsCallable('createUserManaged');
    const result = await createUser({
      email: 'newrider@repaart.es',
      password: 'password123',
      role: 'rider'
    });
    console.log('✅ createUserManaged funcionó');
  } catch (error) {
    console.error('❌ createUserManaged falló:', error);
  }
  
  // Test 2: createFranchise
  console.log('\n2. Testeando createFranchise...');
  try {
    const createFranchise = functions.httpsCallable('createFranchise');
    const result = await createFranchise({
      email: 'newfranchise@repaart.es',
      password: 'password123',
      displayName: 'Test Franchise',
      name: 'Test Franchise S.L.',
      legalName: 'Test Franchise S.L.',
      cif: 'B12345678',
      address: { city: 'Madrid', zipCodes: ['28001'] },
      phone: '+34600000000'
    });
    console.log('✅ createFranchise funcionó');
  } catch (error) {
    console.error('❌ createFranchise falló:', error);
  }
  
  // Test 3: adminDeleteUser
  console.log('\n3. Testeando adminDeleteUser...');
  try {
    const deleteUser = functions.httpsCallable('adminDeleteUser');
    const result = await deleteUser({ uid: 'newrider-uid' });
    console.log('✅ adminDeleteUser funcionó');
  } catch (error) {
    console.error('❌ adminDeleteUser falló:', error);
  }
  
  // Test 4: Verificar triggers
  console.log('\n4. Testeando triggers...');
  
  // Test onUserWrite
  console.log('4.1 Testeando onUserWrite...');
  await admin.firestore().collection('users').doc(adminUid).update({ status: 'banned' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  const user = await admin.auth().getUser(adminUid);
  const claims = user.customClaims || {};
  if (claims.status === 'banned') {
    console.log('✅ onUserWrite actualizó custom claims');
  } else {
    console.error('❌ onUserWrite no actualizó custom claims');
  }
  
  // Test onIncidentCreated
  console.log('\n4.2 Testeando onIncidentCreated...');
  await admin.firestore().collection('incidents').add({
    riderId: adminUid,
    description: 'Test incident',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  await new Promise(resolve => setTimeout(resolve, 2000));
  const notifications = await admin.firestore().collection('notifications')
    .where('type', '==', 'incident')
    .get();
  if (notifications.docs.length > 0) {
    console.log('✅ onIncidentCreated envió notificación');
  } else {
    console.error('❌ onIncidentCreated no envió notificación');
  }
  
  // Limpiar
  console.log('\n5. Limpiando datos de prueba...');
  await admin.auth().deleteUser(adminUid);
  await admin.firestore().collection('users').doc(adminUid).delete();
  
  console.log('✅ Datos de prueba eliminados');
  console.log('\n🎉 Verificación de Cloud Functions completada');
}

verifyFunctions().catch(console.error);
```

---

## 📊 TESTS DE CARGA

### 1. Test de Carga de Turnos

```javascript
/**
 * Script para probar el rendimiento con muchos turnos
 * Ejecutar con: node load-test-shifts.js
 */

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function loadTestShifts() {
  console.log('🔍 Iniciando test de carga de turnos...\n');
  
  const franchiseId = 'test-franchise';
  const riderIds = [
    'rider1', 'rider2', 'rider3', 'rider4', 'rider5',
    'rider6', 'rider7', 'rider8', 'rider9', 'rider10'
  ];
  
  const shifts = [];
  const startDate = new Date('2026-01-01');
  
  // Crear 1000 turnos
  for (let i = 0; i < 1000; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor(i / 10)); // 10 turnos por día
    
    const startHour = 8 + (i % 4) * 3; // 8:00, 11:00, 14:00, 17:00
    const startAt = `${startHour.toString().padStart(2, '0')}:00`;
    const endAt = `${(startHour + 3).toString().padStart(2, '0')}:00`;
    
    shifts.push({
      franchiseId,
      riderId: riderIds[i % riderIds.length],
      date: date.toISOString().split('T')[0],
      startAt,
      endAt,
      status: i % 10 === 0 ? 'pending' : 'confirmed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  console.log(`Creando ${shifts.length} turnos...`);
  const startTime = Date.now();
  
  // Crear turnos en batches
  const batchSize = 500;
  for (let i = 0; i < shifts.length; i += batchSize) {
    const batch = db.batch();
    const batchShifts = shifts.slice(i, i + batchSize);
    
    batchShifts.forEach(shift => {
      const docRef = db.collection('work_shifts').doc();
      batch.set(docRef, shift);
    });
    
    await batch.commit();
    console.log(`Batch ${i / batchSize + 1}/${Math.ceil(shifts.length / batchSize)} completado`);
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\n✅ ${shifts.length} turnos creados en ${duration.toFixed(2)} segundos`);
  console.log(`   Velocidad: ${(shifts.length / duration).toFixed(2)} turnos/segundo`);
  
  // Test de lectura
  console.log('\nTesteando lectura de turnos...');
  const readStartTime = Date.now();
  
  const snapshot = await db.collection('work_shifts')
    .where('franchiseId', '==', franchiseId)
    .get();
  
  const readEndTime = Date.now();
  const readDuration = (readEndTime - readStartTime) / 1000;
  
  console.log(`✅ ${snapshot.docs.length} turnos leídos en ${readDuration.toFixed(2)} segundos`);
  console.log(`   Velocidad: ${(snapshot.docs.length / readDuration).toFixed(2)} turnos/segundo`);
  
  // Limpiar
  console.log('\nLimpiando turnos de prueba...');
  const deleteBatch = db.batch();
  snapshot.docs.forEach(doc => {
    deleteBatch.delete(doc.ref);
  });
  await deleteBatch.commit();
  
  console.log('✅ Turnos eliminados');
  console.log('\n🎉 Test de carga completado');
}

loadTestShifts().catch(console.error);
```

---

## 🧪 TESTING MANUAL

### Checklist de Testing Manual

#### Autenticación
- [ ] Login con credenciales correctas
- [ ] Login con email incorrecto
- [ ] Login con password incorrecto
- [ ] Logout
- [ ] Recuperación de contraseña
- [ ] Login con usuario eliminado
- [ ] Login con usuario bloqueado
- [ ] Persistencia de sesión (recargar página)

#### Admin Panel
- [ ] Dashboard carga correctamente
- [ ] Crear usuario rider
- [ ] Crear usuario franchise
- [ ] Crear usuario admin
- [ ] Editar usuario
- [ ] Eliminar usuario
- [ ] Bloquear usuario
- [ ] Desbloquear usuario
- [ ] Buscar usuario
- [ ] Filtrar por rol
- [ ] Filtrar por estado
- [ ] Crear franquicia
- [ ] Editar franquicia
- [ ] Subir recurso
- [ ] Eliminar recurso
- [ ] Crear anuncio
- [ ] Editar anuncio
- [ ] Eliminar anuncio
- [ ] Ver logs de auditoría
- [ ] Filtrar logs por acción
- [ ] Filtrar logs por usuario
- [ ] Filtrar logs por fecha

#### Franchise Panel
- [ ] Dashboard carga correctamente
- [ ] Registrar ingreso
- [ ] Registrar gasto
- [ ] Ver resúmenes financieros
- [ ] Cerrar mes
- [ ] Ver reportes
- [ ] Solicitar desbloqueo de mes
- [ ] Subir documento
- [ ] Ver documentos
- [ ] Eliminar documento

#### Operations Panel
- [ ] Dashboard carga correctamente
- [ ] Seleccionar franquicia
- [ ] Ver métricas de franquicia
- [ ] Crear vehículo
- [ ] Editar vehículo
- [ ] Eliminar vehículo
- [ ] Cambiar estado de vehículo

#### Scheduler
- [ ] Vista de calendario carga correctamente
- [ ] Crear turno
- [ ] Editar turno
- [ ] Eliminar turno
- [ ] Arrastrar turno
- [ ] Asignar rider a turno
- [ ] Confirmar turno (como rider)
- [ ] Solicitar cambio de turno
- [ ] Ver reporte de sheriff

#### Rider Panel
- [ ] Home carga correctamente
- [ ] Ver turnos próximos
- [ ] Ver horarios
- [ ] Confirmar turno
- [ ] Solicitar cambio de turno
- [ ] Ver perfil
- [ ] Editar perfil
- [ ] Ver notificaciones

#### Support
- [ ] Crear ticket
- [ ] Ver tickets
- [ ] Abrir ticket
- [ ] Enviar mensaje
- [ ] Asignar ticket (admin)
- [ ] Cerrar ticket
- [ ] Ver ticket cerrado

#### Academy
- [ ] Acceder a academy
- [ ] Ver módulos
- [ ] Ver lecciones
- [ ] Completar lección
- [ ] Completar quiz
- [ ] Ver enciclopedia

---

## 🚀 EJECUCIÓN DE TESTS

### Ejecutar Tests Automatizados

```bash
# Instalar dependencias
npm install firebase-admin firebase-functions

# Ejecutar test de integridad
node verify-data-integrity.js

# Ejecutar test de permisos
node verify-permissions.js

# Ejecutar test de funciones
node verify-functions.js

# Ejecutar test de carga
node load-test-shifts.js
```

### Ejecutar Tests con Playwright

```bash
# Instalar Playwright
npm install -D @playwright/test

# Ejecutar todos los tests
npx playwright test

# Ejecutar tests en modo headed
npx playwright test --headed

# Ejecutar tests específicos
npx playwright test admin.spec.ts

# Ver reporte
npx playwright show-report
```

---

## 📝 NOTAS

- Los tests deben ejecutarse en un entorno de desarrollo antes de ejecutarlos en producción
- Asegúrate de tener backups antes de ejecutar tests de eliminación
- Los tests de carga pueden afectar el rendimiento de la base de datos
- Los tests de seguridad deben ejecutarse regularmente (mensual o trimestral)
- Los tests funcionales deben ejecutarse después de cada despliegue

---

**Versión:** 1.0
**Fecha:** 28 de enero de 2026
**Autor:** Sistema de Auditoría Repaart
