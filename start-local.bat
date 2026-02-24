@echo off
echo ============================================================
echo    REPAART - Testing Local con Firebase Emulators
echo ============================================================
echo.

echo [1/6] Verificando dependencias...
call npm install --prefix functions
if errorlevel 1 (
    echo ERROR: Fallo instalando dependencias de functions
    pause
    exit /b 1
)

echo.
echo [2/6] Compilando Cloud Functions...
cd functions
call npm run build
if errorlevel 1 (
    echo ERROR: Fallo compilando functions
    pause
    exit /b 1
)
cd ..

echo.
echo [3/6] Iniciando Firebase Emulators...
echo NOTA: Esto puede tomar unos segundos...
echo.
start "Firebase Emulators" cmd /k "firebase emulators:start"

echo Esperando a que emuladores inicien (15 segundos)...
timeout /t 15 /nobreak > nul

echo.
echo [4/6] Cargando datos de prueba...
node scripts/seed-billing-data.js
if errorlevel 1 (
    echo WARNING: Error cargando datos de prueba
)

echo.
echo [5/6] Iniciando aplicación React...
echo NOTA: La app se abrirá en http://localhost:5173
echo.
start "React Dev Server" cmd /k "npm run dev"

echo.
echo [6/6] ¡Listo!
echo.
echo ============================================================
echo    SERVICIOS INICIADOS
echo ============================================================
echo.
echo 🌐 App:          http://localhost:5173
echo 🔥 Firebase UI:  http://localhost:4000
echo 📦 Firestore:    localhost:8080
echo 🔐 Auth:         localhost:9099
echo ☁️ Functions:    localhost:5001
echo.
echo 📧 Email admin:      admin@test.com
echo 🔑 Password:         test123456
echo.
echo 📧 Email franchise:  franchise@test.com
echo 🔑 Password:         test123456
echo.
echo 💳 Ir a: http://localhost:5173/billing
echo.
echo ============================================================
echo Presiona cualquier tecla para cerrar esta ventana
echo (Los emuladores seguirán ejecutándose en otras ventanas)
echo ============================================================
pause > nul
