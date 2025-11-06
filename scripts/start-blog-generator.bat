@echo off
REM =================================================
REM  BIOSKIN - Generador de Blogs (Simplificado)
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
    pause
    exit /b 1
)

echo ✅ Node.js disponible
echo.

REM Ir al directorio del proyecto
cd /d "%~dp0.."

echo 🔄 Verificando dependencias...

REM Instalar dependencias principales
if not exist "node_modules" (
    echo 📦 Instalando dependencias principales...
    npm install
)

REM Instalar dependencias del generador
cd blog-generator-interface
if not exist "node_modules" (
    echo 📦 Instalando dependencias del generador...
    npm install
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
echo ⏹️  Para detener: Ctrl+C
echo.

echo 📋 Directorio actual: %cd%
echo 📂 Cambiando a blog-generator-interface...

REM Iniciar el servidor directamente
echo 🎬 Ejecutando: node server.js
echo ----------------------------------------
node server.js

echo.
echo ⚠️  El servidor se ha detenido
pause