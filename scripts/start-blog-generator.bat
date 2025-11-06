@echo off
cls
REM =================================================
REM  BIOSKIN - Generador de Blogs con IA
REM =================================================

echo ========================================
echo   BIOSKIN - Generador de Blogs con IA
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo Descarga desde: https://nodejs.org/
    echo.
    echo Presione una tecla para salir...
    pause >nul
    exit /b 1
)

echo ✅ Node.js disponible
echo.

REM Detener procesos existentes primero
echo 🧹 Limpiando procesos existentes...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3335 2^>nul') do (
    taskkill /PID %%i /F >nul 2>&1
)

echo � Cambiando al directorio del generador...
cd /d "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-interface"

REM Verificar que existe el archivo server.js
if not exist "server.js" (
    echo ❌ ERROR: No se encontró server.js
    echo 📍 Directorio esperado: %cd%
    echo.
    echo Presione una tecla para salir...
    pause >nul
    exit /b 1
)

echo ✅ Archivo server.js encontrado
echo.

echo 🔄 Verificando dependencias...
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
)

echo ✅ Dependencias listas
echo.

echo 🚀 Iniciando sistema de blogs...
echo.
echo 🌐 Interfaz: http://localhost:3335
echo 🤖 IA: Conectada con Vercel
echo 🔑 Credenciales: Usando configuración de Vercel
echo 📁 Guardado: Automático + Git push
echo.
echo 💡 Para detener: 
echo    • Usa Ctrl+C en esta ventana
echo    • O ejecuta: stop-blog-generator.bat
echo.
echo ========================================
echo.

REM Iniciar el servidor
node server.js

echo.
echo ⚠️  El servidor se ha detenido
echo Presione una tecla para continuar...
pause >nul