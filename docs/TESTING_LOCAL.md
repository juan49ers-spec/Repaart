# 🧪 Testing Local - Billing & Treasury Module

## 📋 Prerrequisitos

- Node.js 18+ instalado
- Firebase CLI instalado: `npm install -g firebase-tools`
- Java 8+ instalado (para emuladores)

---

## 🚀 PASO 1: Iniciar Testing Local

### Opción A: Automático (Recomendado)

```bash
# En Windows
start-local.bat

# En Mac/Linux
chmod +x start-local.sh
./start-local.sh
```

### Opción B: Manual

```bash
# 1. Instalar dependencias de functions
cd functions
npm install
npm run build
cd ..

# 2. Iniciar emuladores (Terminal 1)
firebase emulators:start

# 3. Cargar datos de prueba (Terminal 2 - esperar 15 segundos)
node scripts/seed-billing-data.js

# 4. Iniciar app React (Terminal 3)
npm run dev
```

---

## 🌐 URLs de Acceso

| Servicio | URL |
|----------|-----|
| **App React** | http://localhost:5173 |
| **Billing Module** | http://localhost:5173/billing |
| **Firebase UI** | http://localhost:4000 |
| **Firestore** | localhost:8080 |
| **Auth** | localhost:9099 |
| **Functions** | localhost:5001 |
| **Storage** | localhost:9199 |

---

## 🔐 Credenciales de Prueba

### Admin
- **Email**: `admin@test.com`
- **Password**: `test123456`
- **Permisos**: Acceso total

### Franchise
- **Email**: `franchise@test.com`
- **Password**: `test123456`
- **Permisos**: Solo su franquicia

---

## 📊 Datos de Prueba Creados

### Usuarios
- 1 admin (admin@test.com)
- 1 franchise (franchise@test.com)

### Customer
- 1 restaurante (Restaurante Test SL)

### Facturas
1. **DRAFT** - `invoice_draft_123`
   - Estado: Borrador
   - Total: €302.50
   - Se puede editar/eliminar

2. **ISSUED** - `invoice_issued_123`
   - Estado: Emitida
   - Total: €453.75
   - Pendiente de pago
   - Vence en 30 días

3. **PARTIAL** - `invoice_partial_123`
   - Estado: Emitida + Pago parcial
   - Total: €605.00
   - Pagado: €300.00
   - Pendiente: €305.00

4. **OVERDUE** - `invoice_overdue_123`
   - Estado: Vencida (45 días)
   - Total: €242.00
   - Pendiente: €242.00

---

## 🧪 Tests a Realizar

### 1. Login y Acceso
```
1. Ir a http://localhost:5173
2. Login con admin@test.com / test123456
3. Navegar a /billing
```

### 2. Dashboard de Facturación
```
1. Ver estadísticas en tarjetas
2. Ver facturas por estado
3. Ver deudas pendientes
```

### 3. Crear Factura
```
1. Click en "Nueva Factura"
2. Seleccionar cliente
3. Agregar líneas
4. Guardar como DRAFT
5. Verificar que aparece en lista
```

### 4. Emitir Factura
```
1. Ir a facturas DRAFT
2. Click en "Emitir"
3. Verificar cambio de estado a ISSUED
4. Verificar que ya no se puede editar
```

### 5. Registrar Pago
```
1. Seleccionar factura ISSUED
2. Click en "Registrar Pago"
3. Ingresar monto (ej: €100)
4. Verificar actualización de totalPaid
5. Verificar cambio de estado si completa
```

### 6. Dashboard de Deudas
```
1. Ir a tab "Deudas"
2. Ver distribución por antigüedad
3. Ver facturas vencidas
4. Filtrar por período
```

### 7. Tax Vault
```
1. Ir a tab "Impuestos"
2. Ver resumen de IVA
3. Ver períodos abiertos/cerrados
4. Simular cierre mensual
```

### 8. Firebase UI
```
1. Ir a http://localhost:4000
2. Ver Firestore → invoices
3. Ver Auth → users
4. Verificar datos creados
```

---

## 🛠️ Comandos Útiles

### Ver logs de emuladores
```bash
firebase emulators:start --debug
```

### Exportar datos de emuladores
```bash
firebase emulators:export ./emulator-data
```

### Importar datos a emuladores
```bash
firebase emulators:start --import=./emulator-data
```

### Limpiar datos
```bash
# Eliminar todos los datos de emuladores
rm -rf .emulator-data
```

### Ver funciones disponibles
```bash
firebase functions:list
```

---

## 🐛 Problemas Comunes

### 1. Puerto en uso
```
Error: Port 8080 is already in use
```
**Solución**: Cerrar otros servicios en ese puerto o cambiar puerto en firebase.json

### 2. Java no encontrado
```
Error: Java is required to run the emulator
```
**Solución**: Instalar Java 8+ y configurar JAVA_HOME

### 3. No se pueden crear usuarios
```
Error: auth/user-not-found
```
**Solución**: Ejecutar `node scripts/seed-billing-data.js`

### 4. Permission denied
```
Error: Missing or insufficient permissions
```
**Solución**: Verificar custom claims con script de seed

### 5. Funciones no cargan
```
Error: Cannot find module
```
**Solución**: `cd functions && npm run build`

---

## 📱 Probar en Móvil

### 1. Configurar network
```bash
# Ver IP local
ipconfig  # Windows
ifconfig  # Mac/Linux

# En .env.local
VITE_API_URL=http://TU_IP_LOCAL:5173
```

### 2. Acceder desde móvil
```
http://TU_IP_LOCAL:5173
```

---

## 🎥 Grabar Tests

### Con Cypress
```bash
npm run test:e2e
```

### Manual
1. Usar Chrome DevTools → Recorder
2. Grabar flujo de facturación
3. Exportar como Puppeteer script

---

## ✅ Checklist de Testing

- [ ] Login con admin
- [ ] Login con franchise
- [ ] Ver dashboard
- [ ] Crear factura DRAFT
- [ ] Editar factura DRAFT
- [ ] Emitir factura
- [ ] Verificar inmutabilidad post-emisión
- [ ] Registrar pago parcial
- [ ] Registrar pago total
- [ ] Ver dashboard de deudas
- [ ] Filtrar facturas
- [ ] Ver Tax Vault
- [ ] Cerrar mes fiscal
- [ ] Verificar Firebase UI

---

## 🔄 Detener Testing

### Opción A: Automático
```bash
# En Windows
stop-local.bat
```

### Opción B: Manual
```bash
# Ctrl+C en cada terminal
# O cerrar ventanas
```

---

## 📚 Siguiente Paso

Una vez probado todo localmente:

1. ✅ Verificar que funciona correctamente
2. 🚀 Deploy a staging/producción
3. 📊 Monitorear en producción

```bash
firebase deploy
```

---

## 💡 Tips

- Los datos de emuladores se pierden al reiniciar
- Usa `firebase emulators:export` para guardar datos
- Revisa los logs en tiempo real en Firebase UI
- Prueba edge cases (facturas negativas, pagos excesivos, etc.)

---

**¿Problemas?** Revisa los logs en http://localhost:4000
