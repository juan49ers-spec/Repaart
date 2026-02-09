# Auditoría Completa de Repaart
## Documentación de Funcionalidades y Seguridad

---

## 📋 ÍNDICE

1. [Visión General](#visión-general)
2. [Roles de Usuario](#roles-de-usuario)
3. [Módulos y Funcionalidades](#módulos-y-funcionalidades)
4. [Cloud Functions](#cloud-functions)
5. [Reglas de Seguridad](#reglas-de-seguridad)
6. [Testing Checklist](#testing-checklist)
7. [Métricas y Analytics](#métricas-y-analytics)
8. [Alertas y Notificaciones](#alertas-y-notificaciones)

---

## 🎯 VISIÓN GENERAL

**Proyecto:** Repaart - Plataforma de Gestión de Flotas de Reparto
**Tech Stack:** React + TypeScript + Firebase (Firestore, Storage, Auth, Functions)
**Proyecto Firebase:** repaartfinanzas
**Hosting:** https://repaartfinanzas.web.app

**Objetivos Principales:**
- Gestión de turnos de riders
- Control financiero de franquicias
- Gestión de flota de vehículos
- Sistema de tickets de soporte
- Academy para formación de riders
- Analytics y métricas en tiempo real

---

## 👥 ROLES DE USUARIO

### 1. **ADMIN** (Administrador Global)
- **Permisos:** Acceso completo a toda la plataforma
- **Funcionalidades:**
  - Crear/eliminar franquicias
  - Crear/eliminar usuarios (admin, franchise, rider, user)
  - Ver todos los datos de todas las franquicias
  - Gestión de recursos (documentos, banners, anuncios)
  - Auditoría completa del sistema
  - Inteligencia operativa
  - Configuración de tasas y precios

### 2. **FRANCHISE** (Franquicia)
- **Permisos:** Gestión de su propia franquicia
- **Funcionalidades:**
  - Ver y editar su información
  - Gestionar riders de su franquicia
  - Programar turnos de riders
  - Ver y gestionar finanzas
  - Subir documentos (facturas, contratos)
  - Ver notificaciones de su franquicia
  - Crear tickets de soporte
  - Gestionar flota de vehículos

### 3. **RIDER** (Rider/Conductor)
- **Permisos:** Gestión de su cuenta y turnos
- **Funcionalidades:**
  - Ver su perfil
  - Ver y confirmar turnos asignados
  - Solicitar cambios de turno
  - Reportar incidentes
  - Ver notificaciones
  - Acceder a Academy (cursos, enciclopedia)
  - Ver su historial de checks de vehículos

### 4. **USER** (Usuario Genérico)
- **Permisos:** Acceso básico
- **Funcionalidades:**
  - Ver su perfil
  - Acceder a recursos públicos

---

## 📦 MÓDULOS Y FUNCIONALIDADES

### 1. **AUTH** (Autenticación)
**Archivos:**
- `src/features/auth/Login.tsx`
- `src/features/auth/ProtectedRoute.tsx`
- `src/context/AuthContext.tsx`

**Funcionalidades:**
- Login con email y contraseña
- Logout
- Recuperación de contraseña
- Verificación de estado (active, banned, deleted)
- Autenticación persistente
- Refresh automático de tokens
- Cache de custom claims (5 minutos)

**Seguridad:**
- Verificación de custom claims en cada login
- Logout forzado si status = 'banned' o 'deleted'
- Cache en memoria de custom claims
- Invalidación de cache después de actualizaciones

**Testing:**
- [ ] Login con credenciales correctas
- [ ] Login con credenciales incorrectas
- [ ] Logout y re-login
- [ ] Recuperación de contraseña
- [ ] Acceso con usuario eliminado (debería fallar)
- [ ] Acceso con usuario bloqueado (debería fallar)

---

### 2. **ADMIN** (Panel de Administración)

#### 2.1 Dashboard
**Archivos:**
- `src/features/admin/dashboard/AdminDashboard.tsx`
- `src/features/admin/dashboard/OperationalMetrics.tsx`
- `src/features/admin/dashboard/TrendsSection.tsx`
- `src/features/admin/dashboard/IntelligenceGrid.tsx`
- `src/features/admin/dashboard/SidebarWidgets.tsx`

**Funcionalidades:**
- Vista de métricas operativas globales
- Tendencias de negocio
- Inteligencia de franquicias
- Widgets de alertas
- Comparativas entre franquicias

**Testing:**
- [ ] Carga correcta de métricas
- [ ] Visualización de tendencias
- [ ] Filtros por franquicia
- [ ] Comparativas de rendimiento

#### 2.2 Gestión de Usuarios
**Archivos:**
- `src/features/admin/users/UserManagementPanel.tsx`
- `src/features/admin/users/UserTable.tsx`
- `src/features/admin/users/CreateUserModal.tsx`
- `src/features/admin/users/RiderCard.tsx`

**Funcionalidades:**
- Listado de todos los usuarios
- Creación de usuarios (admin, franchise, rider, user)
- Edición de usuarios
- Eliminación de usuarios (mediante Cloud Function)
- Bloqueo/desbloqueo de usuarios
- Filtros por rol y estado
- Búsqueda de usuarios

**Seguridad:**
- Solo admin puede eliminar usuarios
- Admin no puede eliminarse a sí mismo
- Verificación de permisos antes de cada acción

**Testing:**
- [ ] Listado de usuarios
- [ ] Creación de cada tipo de usuario
- [ ] Edición de usuarios
- [ ] Eliminación de usuarios
- [ ] Bloqueo/desbloqueo
- [ ] Filtros y búsqueda

#### 2.3 Gestión de Franquicias
**Archivos:**
- `src/features/admin/AdminFranchiseView.tsx`
- `src/features/admin/CreateFranchiseModal.tsx`
- `src/features/admin/dashboard/FranchiseDirectory.tsx`
- `src/features/admin/dashboard/FranchiseCard.tsx`

**Funcionalidades:**
- Listado de todas las franquicias
- Creación de nuevas franquicias
- Vista detallada de cada franquicia
- Edición de datos de franquicia
- Configuración de tasas

**Testing:**
- [ ] Listado de franquicias
- [ ] Creación de franquicia
- [ ] Edición de datos
- [ ] Configuración de tasas

#### 2.4 Gestión de Recursos
**Archivos:**
- `src/features/admin/AdminResourcesPanel.tsx`
- `src/features/admin/resources/ResourceUploadModal.tsx`

**Funcionalidades:**
- Subir documentos a Storage
- Categorización de recursos
- Eliminación de recursos
- Preview de documentos

**Testing:**
- [ ] Subida de documentos
- [ ] Preview de archivos
- [ ] Eliminación de recursos

#### 2.5 Anuncios
**Archivos:**
- `src/features/admin/AnnouncementSystem.tsx`

**Funcionalidades:**
- Crear anuncios globales
- Tipos: news, alert, poll
- Prioridades: normal, high, critical
- Audiencia: all, specific
- Programación de anuncios

**Testing:**
- [ ] Creación de anuncio
- [ ] Visualización por usuarios
- [ ] Priorización de anuncios
- [ ] Filtrado por audiencia

#### 2.6 Auditoría
**Archivos:**
- `src/features/admin/AuditPanel.tsx`

**Funcionalidades:**
- Visualización de logs de auditoría
- Filtros por acción, usuario, fecha
- Exportación de logs

**Testing:**
- [ ] Visualización de logs
- [ ] Filtros de búsqueda
- [ ] Exportación de datos

#### 2.7 Banner Manager
**Archivos:**
- `src/features/admin/BannerManager.tsx`

**Funcionalidades:**
- Gestión de banners promocionales
- Programación de banners
- Priorización de banners

**Testing:**
- [ ] Creación de banner
- [ ] Programación
- [ ] Visualización en app

---

### 3. **FRANCHISE** (Panel de Franquicia)

#### 3.1 Dashboard
**Archivos:**
- `src/features/franchise/FranchiseDashboard.tsx`
- `src/features/franchise/dashboard/`

**Funcionalidades:**
- Vista de métricas de la franquicia
- Gráficos de ingresos
- Estado de riders
- Alertas de la franquicia

**Testing:**
- [ ] Carga de métricas
- [ ] Visualización de gráficos
- [ ] Estado de riders

#### 3.2 Gestión Financiera
**Archivos:**
- `src/features/franchise/FinancialControlCenter.tsx`
- `src/features/franchise/finance/`

**Funcionalidades:**
- Registro de ingresos y gastos
- Visualización de resúmenes financieros
- Cierre mensual
- Generación de informes
- Solicitud de desbloqueo de mes

**Testing:**
- [ ] Registro de ingresos
- [ ] Registro de gastos
- [ ] Cierre mensual
- [ ] Generación de informes
- [ ] Solicitud de desbloqueo

#### 3.3 Gestión de Recursos
**Archivos:**
- `src/features/franchise/ResourcesPanel.tsx`

**Funcionalidades:**
- Subir documentos (facturas, contratos)
- Visualización de documentos
- Solicitud de documentos

**Testing:**
- [ ] Subida de documentos
- [ ] Visualización
- [ ] Solicitud de documentos

#### 3.4 Configuración
**Archivos:**
- `src/features/franchise/FranchiseRateConfigurator.tsx`

**Funcionalidades:**
- Configuración de tarifas
- Personalización de precios

**Testing:**
- [ ] Configuración de tarifas
- [ ] Guardado de cambios

---

### 4. **OPERATIONS** (Operaciones)

#### 4.1 Dashboard de Operaciones
**Archivos:**
- `src/features/operations/OperationsDashboard.tsx`
- `src/features/operations/components/`
- `src/features/operations/intel/`

**Funcionalidades:**
- Vista operativa global
- Inteligencia de operaciones
- Gestión de flota
- Selector de franquicia (modo god view)

**Testing:**
- [ ] Vista operativa
- [ ] Selector de franquicia
- [ ] Inteligencia

#### 4.2 Gestión de Flota
**Archivos:**
- `src/features/operations/FleetManager.tsx`
- `src/features/operations/MotoManagement.tsx`

**Funcionalidades:**
- Listado de vehículos
- Creación de vehículos
- Edición de vehículos
- Eliminación de vehículos
- Estados: active, maintenance, out_of_service

**Testing:**
- [ ] Listado de vehículos
- [ ] Creación
- [ ] Edición
- [ ] Eliminación
- [ ] Cambio de estado

---

### 5. **SCHEDULER** (Programación de Turnos)

**Archivos:**
- `src/features/scheduler/DeliveryScheduler.tsx`
- `src/features/scheduler/DraggableShift.tsx`
- `src/features/scheduler/DroppableCell.tsx`
- `src/features/scheduler/SheriffReportModal.tsx`
- `src/features/scheduler/SchedulerGuideModal.tsx`

**Funcionalidades:**
- Vista de calendario semanal
- Arrastrar y soltar turnos
- Creación de turnos
- Edición de turnos
- Eliminación de turnos
- Asignación de riders
- Reportes de sheriff

**Testing:**
- [ ] Vista de calendario
- [ ] Drag & drop
- [ ] Creación de turno
- [ ] Edición de turno
- [ ] Eliminación de turno
- [ ] Asignación de rider

---

### 6. **RIDER** (Panel de Rider)

#### 6.1 Home
**Archivos:**
- `src/features/rider/home/`

**Funcionalidades:**
- Vista de turnos próximos
- Resumen de actividad
- Notificaciones importantes

**Testing:**
- [ ] Carga de turnos
- [ ] Resumen de actividad

#### 6.2 Schedule (Horarios)
**Archivos:**
- `src/features/rider/schedule/`

**Funcionalidades:**
- Vista de horarios asignados
- Confirmación de turnos
- Solicitud de cambios de turno

**Testing:**
- [ ] Visualización de horarios
- [ ] Confirmación de turno
- [ ] Solicitud de cambio

#### 6.3 Profile (Perfil)
**Archivos:**
- `src/features/rider/profile/`
- `src/features/user/UserProfile.tsx`

**Funcionalidades:**
- Visualización de perfil
- Edición de datos personales
- Historial de actividad

**Testing:**
- [ ] Visualización de perfil
- [ ] Edición de datos
- [ ] Historial de actividad

---

### 7. **ACADEMY** (Academia)

**Archivos:**
- `src/features/academy/Academy.tsx`
- `src/features/academy/admin/`

**Funcionalidades:**
- Módulos de formación
- Lecciones
- Quiz y evaluaciones
- Enciclopedia de conocimiento
- Seguimiento de progreso

**Testing:**
- [ ] Acceso a módulos
- [ ] Visualización de lecciones
- [ ] Completar quiz
- [ ] Acceso a enciclopedia

---

### 8. **SUPPORT** (Soporte)

**Archivos:**
- `src/features/support/`
- `src/features/admin/AdminSupportPanel.tsx`

**Funcionalidades:**
- Creación de tickets
- Mensajería en tiempo real
- Asignación de tickets
- Cierre de tickets
- Priorización: normal, high, critical

**Testing:**
- [ ] Creación de ticket
- [ ] Envío de mensajes
- [ ] Asignación
- [ ] Cierre de ticket

---

## ☁️ CLOUD FUNCTIONS

### Callable Functions (Llamadas desde frontend)

#### 1. **createUserManaged**
**Archivo:** `functions/src/callables/createUser.ts`
**Propósito:** Creación de usuarios desde admin panel
**Parámetros:**
- email: string
- password: string
- role: string (admin, franchise, rider, user)
- franchiseId?: string
- displayName?: string
- phoneNumber?: string
- status?: 'active' | 'pending' | 'banned'
- pack?: 'basic' | 'premium' | 'admin'

**Seguridad:**
- Solo usuarios admin pueden llamarla
- Verifica el rol del llamante
- Crea usuario en Auth y Firestore
- Actualiza custom claims

**Testing:**
- [ ] Crear usuario admin
- [ ] Crear usuario franchise
- [ ] Crear usuario rider
- [ ] Intento de creación por no-admin (debe fallar)

---

#### 2. **createFranchise**
**Archivo:** `functions/src/callables/createFranchise.ts`
**Propósito:** Creación de franquicias desde admin panel
**Parámetros:**
- email: string
- password: string
- displayName: string
- name: string
- legalName: string
- cif: string
- address: object
- phone: string
- zipCodes: string[]

**Seguridad:**
- Solo usuarios admin pueden llamarla
- Verifica el rol del llamante
- Crea usuario Auth + documento franchise

**Testing:**
- [ ] Crear franquicia
- [ ] Intento por no-admin (debe fallar)

---

#### 3. **adminDeleteUser**
**Archivo:** `functions/src/callables/adminDeleteUser.ts`
**Propósito:** Eliminación completa de usuarios
**Parámetros:**
- uid: string

**Seguridad:**
- Solo usuarios admin pueden llamarla
- Verifica el rol del llamante
- Elimina de Auth y Firestore
- No permite auto-eliminación

**Testing:**
- [ ] Eliminar usuario rider
- [ ] Eliminar usuario franchise
- [ ] Intento de auto-eliminación (debe fallar)
- [ ] Intento por no-admin (debe fallar)

---

### Triggers (Automáticos)

#### 4. **onUserWrite**
**Archivo:** `functions/src/triggers/onUserWrite.ts`
**Propósito:** Sincronización de custom claims
**Trigger:** onCreate, onUpdate de documento users
**Funcionalidad:**
- Actualiza custom claims en Auth cuando cambia el documento
- Sincroniza role, franchiseId, status

**Testing:**
- [ ] Cambio de rol → claims actualizados
- [ ] Cambio de franchiseId → claims actualizados
- [ ] Cambio de status → claims actualizados

---

#### 5. **onWeekWrite**
**Archivo:** `functions/src/triggers/onWeekWrite.ts`
**Propósito:** Cálculo de estadísticas semanales
**Trigger:** onCreate, onUpdate de documento weeks
**Funcionalidad:**
- Calcula métricas de turnos de la semana
- Actualiza resúmenes financieros

**Testing:**
- [ ] Creación de semana → stats calculadas
- [ ] Actualización de semana → stats recalculadas

---

#### 6. **onIncidentCreated**
**Archivo:** `functions/src/triggers/onIncident.ts`
**Propósito:** Notificación de incidentes
**Trigger:** onCreate de documento incidents
**Funcionalidad:**
- Envía notificación a admin/franchise
- Registra en logs de auditoría

**Testing:**
- [ ] Creación de incidente → notificación enviada

---

#### 7. **deleteUserSync**
**Archivo:** `functions/src/triggers/onUserDelete.ts`
**Propósito:** Limpieza al eliminar usuario de Auth
**Trigger:** onDelete de Auth user
**Funcionalidad:**
- Elimina documento users
- Archiva datos relacionados

**Testing:**
- [ ] Eliminación Auth → documento users eliminado

---

### Scheduled Functions (Tareas programadas)

#### 8. **archiveOldNotifications**
**Archivo:** `functions/src/callables/dataRetention.ts`
**Propósito:** Archivar notificaciones antiguas
**Schedule:** Cada día a las 2 AM
**Funcionalidad:**
- Archiva notificaciones mayores a 90 días
- Mantiene base de datos limpia

**Testing:**
- [ ] Ejecución de archive
- [ ] Notificaciones antiguas archivadas

---

#### 9. **archiveOldTickets**
**Archivo:** `functions/src/callables/dataRetention.ts`
**Propósito:** Archivar tickets cerrados
**Schedule:** Cada día a las 3 AM
**Funcionalidad:**
- Archiva tickets cerrados mayores a 180 días

**Testing:**
- [ ] Ejecución de archive
- [ ] Tickets antiguos archivados

---

#### 10. **archiveOldAuditLogs**
**Archivo:** `functions/src/callables/dataRetention.ts`
**Propósito:** Archivar logs de auditoría
**Schedule:** Cada día a las 4 AM
**Funcionalidad:**
- Archiva logs mayores a 365 días

**Testing:**
- [ ] Ejecución de archive
- [ ] Logs antiguos archivados

---

#### 11. **scheduledDataRetention**
**Archivo:** `functions/src/callables/dataRetention.ts`
**Propósito:** Retención de datos general
**Schedule:** Cada domingo a las 1 AM
**Funcionalidad:**
- Ejecuta todas las funciones de retención

**Testing:**
- [ ] Ejecución de retención general

---

## 🔐 REGLAS DE SEGURIDAD

### Helper Functions

```javascript
// Verificar si el usuario está autenticado
isAuthed()

// Obtener datos del usuario
getUserData()

// Verificar si es admin
isAdmin()

// Verificar si es franquicia
isFranchise()

// Validar datos entrantes
incomingData()
isNonEmptyString(fieldName)
isNumber(fieldName)
```

### Validators

```javascript
// Validador de registros financieros
isValidFinancialRecord()

// Validador de activos de flota
isValidFleetAsset()

// Validador de notificaciones
isValidNotification()

// Validador de anuncios
isValidAnnouncement()

// Validador de tickets
isValidTicket()

// Validador de turnos
isValidShift()
```

### Colecciones Protegidas

#### 1. **users**
```javascript
match /users/{userId} {
  allow read: if isAuthed() && (
    request.auth.uid == userId || 
    isAdmin() || 
    isFranchise()
  );
  allow create: if false; // Solo Admin SDK
  allow update: if isAuthed() && (
    isAdmin() || 
    request.auth.uid == userId ||
    (isFranchise() && resource.data.franchiseId == request.auth.uid)
  );
  allow list: if isAuthed() && (isAdmin() || isFranchise());
}
```

**Testing:**
- [ ] Admin puede leer todos los usuarios
- [ ] Franquicia puede leer usuarios de su franquicia
- [ ] Usuario puede leer su propio perfil
- [ ] No se puede crear usuario desde cliente
- [ ] Admin puede actualizar cualquier usuario
- [ ] Franquicia puede actualizar riders de su franquicia

---

#### 2. **work_shifts**
```javascript
match /work_shifts/{shiftId} {
  allow read: if isAuthed() && (
    isAdmin() || 
    isFranchise() || 
    resource.data.riderId == request.auth.uid
  );
  allow write: if isAuthed() && (
    isAdmin() || 
    isFranchise() ||
    (resource.data.riderId == request.auth.uid && isValidShift())
  );
}
```

**Testing:**
- [ ] Admin puede leer/escribir todos los turnos
- [ ] Franquicia puede leer/escribir turnos de su franquicia
- [ ] Rider puede leer/escribir sus propios turnos

---

#### 3. **financial_records**
```javascript
match /financial_records/{recordId} {
  allow read: if isAuthed() && (isAdmin() || isFranchise());
  allow create, update, delete: if isAuthed() && (
    isAdmin() || 
    isFranchise()
  ) && isValidFinancialRecord();
}
```

**Testing:**
- [ ] Admin puede acceder a todos los registros
- [ ] Franquicia puede acceder a sus registros
- [ ] Rider no puede acceder a registros financieros

---

#### 4. **tickets**
```javascript
match /tickets/{ticketId} {
  allow read: if isAuthed() && (
    resource.data.userId == request.auth.uid || 
    resource.data.uid == request.auth.uid || 
    resource.data.createdBy == request.auth.uid ||
    resource.data.franchiseId == request.auth.uid ||
    isAdmin()
  );
  allow write: if isAuthed() && (
    isAdmin() || 
    resource.data.userId == request.auth.uid
  );
  
  match /messages/{messageId} {
    allow read: if isAuthed() && (
      resource.data.senderId == request.auth.uid ||
      isAdmin() ||
      (isFranchise() && getUserData().franchiseId == resource.data.franchiseId)
    );
    allow create: if isAuthed() && (
      request.resource.data.senderId == request.auth.uid ||
      isAdmin()
    );
  }
  
  allow create: if isAuthed() && isValidTicket();
}
```

**Testing:**
- [ ] Admin puede leer todos los tickets
- [ ] Franquicia puede leer tickets de su franquicia
- [ ] Usuario puede leer sus propios tickets
- [ ] Solo dueño o admin puede actualizar ticket

---

#### 5. **notifications**
```javascript
match /notifications/{notificationId} {
  allow get: if isAuthed() && (
    resource.data.userId == request.auth.uid || 
    isAdmin() ||
    (isFranchise() && resource.data.userId == getUserData().franchiseId)
  );
  allow list: if isAuthed() && (
    request.query.filters.userId == request.auth.uid || 
    isAdmin() ||
    isFranchise()
  );
  allow create: if isAuthed() && isValidNotification();
  allow write: if isAuthed() && (
    request.auth.uid == resource.data.userId ||
    isAdmin() ||
    (isFranchise() && request.auth.uid == getUserData().franchiseId)
  );
}
```

**Testing:**
- [ ] Usuario puede leer sus notificaciones
- [ ] Franquicia puede leer notificaciones de su franquicia
- [ ] Admin puede leer todas las notificaciones

---

#### 6. **fleet_assets**
```javascript
match /fleet_assets/{assetId} {
  allow get: if isAuthed() && (
    isAdmin() || 
    resource.data.franchiseId.lower() == request.auth.uid.lower()
  );
  allow list: if isAuthed();
  allow create: if isAuthed() && (
    isAdmin() || 
    isFranchise()
  ) && isValidFleetAsset();
  allow update: if isAuthed() && (
    isAdmin() || 
    resource.data.franchiseId == request.auth.uid
  ) && isValidFleetAsset();
  allow delete: if isAuthed() && isAdmin();
}
```

**Testing:**
- [ ] Admin puede crear/eliminar cualquier vehículo
- [ ] Franquicia puede crear vehículos de su franquicia
- [ ] Solo admin puede eliminar vehículos

---

#### 7. **audit_logs**
```javascript
match /audit_logs/{logId} {
  allow create: if isAuthed();
  allow read: if isAuthed() && isAdmin();
  allow update, delete: if false;
}
```

**Testing:**
- [ ] Cualquier usuario puede crear logs
- [ ] Solo admin puede leer logs
- [ ] Nadie puede actualizar/eliminar logs

---

## ✅ TESTING CHECKLIST

### Tests de Seguridad Crítica

#### Auth & Autorización
- [ ] Login con usuario eliminado → debe fallar
- [ ] Login con usuario bloqueado → debe fallar
- [ ] Acceso a rutas protegidas sin login → redirección a login
- [ ] Intento de modificación de datos sin permisos → error 403

#### Cloud Functions
- [ ] createUserManaged por no-admin → error
- [ ] createFranchise por no-admin → error
- [ ] adminDeleteUser por no-admin → error
- [ ] adminDeleteUser del propio usuario → error
- [ ] onUserWrite actualiza custom claims
- [ ] onIncidentCreated envía notificación

#### Firestore Rules
- [ ] Admin puede leer/escribir todo
- [ ] Franquicia solo puede acceder a sus datos
- [ ] Rider solo puede acceder a sus datos
- [ ] No se puede crear usuario desde cliente
- [ ] Logs de auditoría son inmutables

### Tests Funcionales

#### Admin Panel
- [ ] Dashboard muestra métricas correctas
- [ ] Creación de usuarios funciona
- [ ] Eliminación de usuarios funciona
- [ ] Listado de usuarios filtra correctamente
- [ ] Creación de franquicias funciona
- [ ] Subida de recursos funciona
- [ ] Creación de anuncios funciona
- [ ] Auditoría muestra logs correctamente

#### Franchise Panel
- [ ] Dashboard muestra métricas de franquicia
- [ ] Registro de ingresos funciona
- [ ] Registro de gastos funciona
- [ ] Cierre mensual funciona
- [ ] Subida de documentos funciona

#### Operations Panel
- [ ] Vista operativa carga correctamente
- [ ] Selector de franquicia funciona
- [ ] Gestión de flota funciona

#### Scheduler
- [ ] Vista de calendario carga correctamente
- [ ] Drag & drop funciona
- [ ] Creación de turnos funciona
- [ ] Edición de turnos funciona
- [ ] Eliminación de turnos funciona

#### Rider Panel
- [ ] Home muestra turnos próximos
- [ ] Schedule muestra horarios
- [ ] Confirmación de turno funciona
- [ ] Solicitud de cambio funciona
- [ ] Profile carga correctamente

#### Support
- [ ] Creación de ticket funciona
- [ ] Envío de mensajes funciona
- [ ] Asignación de ticket funciona

#### Academy
- [ ] Acceso a módulos funciona
- [ ] Visualización de lecciones funciona
- [ ] Quiz funciona
- [ ] Acceso a enciclopedia funciona

---

## 📊 MÉTRICAS Y ANALYTICS

### Métricas de Negocio

#### Operativas
- Total de turnos programados
- Turnos confirmados
- Turnos pendientes
- Turnos cancelados
- Riders activos
- Vehículos activos

#### Financieras
- Ingresos totales
- Gastos totales
- Beneficio neto
- Margen de beneficio
- Ingresos por franquicia
- Gastos por franquicia

#### Soporte
- Tickets abiertos
- Tickets en progreso
- Tickets resueltos
- Tickets por prioridad
- Tiempo de respuesta promedio

#### Academy
- Módulos completados
- Lecciones completadas
- Quiz completados
- Usuarios con progreso

---

## 🔔 ALERTAS Y NOTIFICACIONES

### Tipos de Notificaciones

#### Sistema
- **info**: Información general
- **success**: Operación exitosa
- **warning**: Advertencia
- **error**: Error crítico
- **ALERT**: Alerta de seguridad

#### Financieras
- **FINANCE_CLOSING**: Cierre mensual
- **RATE_CHANGE**: Cambio de tarifas
- **MONTH_UNLOCKED**: Mes desbloqueado
- **UNLOCK_REJECTED**: Solicitud rechazada

#### Soporte
- **SUPPORT_TICKET**: Nuevo ticket
- **PREMIUM_SERVICE_REQUEST**: Solicitud premium

#### Turnos
- **shift_confirmed**: Turno confirmado
- **shift_change_request**: Solicitud de cambio
- **incident**: Incidente reportado
- **SCHEDULE_PUBLISHED**: Horario publicado

### Canales de Notificación

#### In-App
- Toast notifications
- Modal de alertas
- Panel de notificaciones

#### Email (futuro)
- Confirmaciones
- Alertas críticas
- Reportes diarios/semanales

---

## 🗄️ ESTRUCTURA DE DATOS

### Collections Principales

#### users
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'franchise' | 'rider' | 'user';
  status: 'active' | 'pending' | 'banned' | 'deleted';
  franchiseId?: string;
  pack?: 'basic' | 'premium' | 'admin';
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### work_shifts
```typescript
{
  id: string;
  franchiseId: string;
  riderId?: string;
  date: string; // YYYY-MM-DD
  startAt: string; // HH:mm
  endAt: string; // HH:mm
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### financial_records
```typescript
{
  id: string;
  franchiseId: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  date: string; // YYYY-MM-DD
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### tickets
```typescript
{
  id: string;
  uid: string;
  email: string;
  franchiseId?: string;
  subject: string;
  message: string;
  urgency: 'normal' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: TicketMessage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### notifications
```typescript
{
  id: string;
  userId: string;
  franchiseId?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Timestamp;
}
```

#### fleet_assets
```typescript
{
  id: string;
  plate: string;
  franchiseId: string;
  make: string;
  model: string;
  year: number;
  status: 'active' | 'maintenance' | 'out_of_service' | 'deleted';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🚨 PROCEDIMIENTOS DE RECUPERACIÓN

### Usuarios Eliminados por Error

1. **Recuperar desde Backup** (si existe)
2. **Recrear usuario** con adminDeleteUser (en modo inverso)
3. **Restaurar datos** desde backup de Firestore
4. **Actualizar custom claims** manualmente

### Datos Corruptos

1. **Identificar origen** del problema
2. **Detener escrituras** en la colección afectada
3. **Restaurar desde backup** más reciente
4. **Verificar integridad** de datos
5. **Reanudar operaciones** normales

### Cloud Functions Fallidas

1. **Revisar logs** en Firebase Console
2. **Identificar error** en código
3. **Desplegar fix** a producción
4. **Reintentar operaciones** fallidas manualmente

---

## 📝 LOGS DE AUDITORÍA

### Acciones Registradas

- **LOGIN_SUCCESS**: Usuario inició sesión
- **LOGOUT**: Usuario cerró sesión
- **CREATE_USER**: Usuario creado por admin
- **UPDATE_USER**: Usuario actualizado
- **DELETE_USER**: Usuario eliminado
- **CREATE_FRANCHISE**: Franquicia creada
- **UPDATE_FRANCHISE**: Franquicia actualizada
- **CREATE_SHIFT**: Turno creado
- **UPDATE_SHIFT**: Turno actualizado
- **DELETE_SHIFT**: Turno eliminado
- **CONFIRM_SHIFT**: Turno confirmado por rider
- **CREATE_TICKET**: Ticket de soporte creado
- **UPDATE_TICKET**: Ticket actualizado
- **SYSTEM_EVENT**: Evento del sistema

### Campos del Log

```typescript
{
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Timestamp;
  ip?: string;
  userAgent?: string;
}
```

---

## 🔧 CONFIGURACIÓN Y MANTENIMIENTO

### Firebase Console

- **Authentication**: Gestión de usuarios Auth
- **Firestore**: Visualización de datos
- **Storage**: Gestión de archivos
- **Functions**: Logs y métricas
- **Analytics**: Estadísticas de uso

### Mantenimiento Recurrente

- **Diario**: Revisar logs de Cloud Functions
- **Semanal**: Revisar métricas de negocio
- **Mensual**: Revisar costes de Firebase
- **Trimestral**: Auditoría de seguridad completa
- **Anual**: Revisión de roadmap y mejoras

---

## 📚 RECURSOS ADICIONALES

### Documentación

- Firebase Docs: https://firebase.google.com/docs
- React Docs: https://react.dev
- TypeScript Docs: https://www.typescriptlang.org/docs

### Herramientas

- Firebase Emulator Suite para desarrollo local
- React DevTools para debugging
- Chrome DevTools para análisis de rendimiento

### Scripts de Mantenimiento

```bash
# Deploy functions
firebase deploy --only functions

# Deploy hosting
firebase deploy --only hosting

# Deploy rules
firebase deploy --only firestore:rules

# Backup de datos
firebase firestore:export backup-$(date +%Y%m%d)

# Restore de datos
firebase firestore:import backup-20240128
```

---

## 🎯 PRÓXIMOS PASOS

1. **Implementar tests automatizados** con Jest + React Testing Library
2. **Crear scripts de backup** automáticos
3. **Implementar monitoring** de Cloud Functions
4. **Añadir analytics** detallados con Firebase Analytics
5. **Documentar API** con Swagger/OpenAPI
6. **Crear guías de usuario** para cada rol
7. **Implementar CI/CD** con GitHub Actions

---

**Versión:** 1.0
**Fecha:** 28 de enero de 2026
**Autor:** Sistema de Auditoría Repaart
