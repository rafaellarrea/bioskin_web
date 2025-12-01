@echo off
cls
echo ========================================
echo   BIOSKIN - Reiniciar Generador de Blogs  
echo ========================================
echo.

echo 🔄 Reiniciando servidor del generador de blogs...
echo.

REM Primero detener cualquier proceso existente
echo 🛑 Deteniendo procesos existentes...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3335') do (
    taskkill /PID %%i /F >nul 2>&1
)
taskkill /IM node.exe /F >nul 2>&1

echo ⏳ Esperando 2 segundos...
timeout /t 2 /nobreak >nul

REM Cambiar al directorio del blog generator
echo 📁 Cambiando al directorio del generador...
cd /d "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-interface"

REM Verificar que el archivo server.js existe
if not exist server.js (
    echo ❌ Error: No se encontró server.js en el directorio actual
    echo 📍 Directorio actual: %cd%
    echo.
    echo Presione una tecla para salir...
    pause >nul
    exit /b 1
)

echo 🚀 Iniciando servidor en puerto 3335...
echo.
echo 💡 Para detener el servidor:
echo    • Usa Ctrl+C en esta ventana
echo    • O ejecuta: stop-blog-generator.bat
echo.
echo ============================================
echo.

REM Iniciar el servidor
node server.js