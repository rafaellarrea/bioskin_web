@echo off
REM =================================================
REM  BIOSKIN - Generador de Blogs con IA (Puerto 3335)
REM =================================================

echo ========================================
echo   BIOSKIN - Generador de Blogs con IA
echo ========================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Ir al directorio del generador de blogs
cd /d "%~dp0..\blog-generator-interface"

REM Verificar si existe el directorio
if not exist "server.js" (
    echo ❌ ERROR: No se encontró el servidor de blogs
    echo Verifica que blog-generator-interface esté configurado
    pause
    exit /b 1
)

REM Instalar dependencias si es necesario
if not exist "node_modules" (
    echo 📦 Instalando dependencias del generador...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la instalación de dependencias
        pause
        exit /b 1
    )
)

echo 🔑 Variables de entorno: Usando configuración de Vercel

echo.
echo 🚀 Iniciando servidor de generación de blogs...
echo 📍 Interfaz disponible en: http://localhost:3335
echo 🤖 IA conectada con OpenAI
echo 🖼️  Subida de imágenes: ACTIVADA
echo 📁 Guardado automático: ACTIVADO  
echo 🚀 Deploy automático: GIT PUSH
echo.
echo ⏹️  Para detener el servidor, presiona Ctrl+C
echo.

REM Iniciar el servidor en puerto 3335
node server.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Falló al iniciar el servidor
    echo 💡 Verifica las dependencias y configuración
    pause
    exit /b 1
)

pause