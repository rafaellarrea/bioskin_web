@echo off
echo Iniciando servidor Vercel en background...
start /b cmd /c "cd /d %~dp0 && vercel dev > server.log 2>&1"

echo Esperando a que el servidor inicie...
timeout /t 10 /nobreak > nul

echo Ejecutando test de flujo completo...
node test-complete-blog-flow.js

echo.
echo Deteniendo servidor...
taskkill /f /im node.exe > nul 2>&1

pause