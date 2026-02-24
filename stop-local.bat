@echo off
echo ============================================================
echo    REPAART - Parar Emuladores
echo ============================================================
echo.

echo Cerrando emuladores...
taskkill /FI "WINDOWTITLE eq Firebase Emulators*" /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq React Dev Server*" /F > nul 2>&1

echo.
echo ✅ Emuladores detenidos
echo.
pause
