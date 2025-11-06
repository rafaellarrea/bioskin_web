@echo off
REM =================================================
REM  BIOSKIN - Servidor Vercel de Desarrollo
REM =================================================

echo ========================================
echo   BIOSKIN - Servidor Vercel APIs
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

REM Ir al directorio del proyecto principal
cd /d "%~dp0.."

REM Verificar si package.json existe
if not exist "package.json" (
    echo ❌ ERROR: No se encontró package.json
    echo Ejecuta este script desde la raíz del proyecto
    pause
    exit /b 1
)

REM Instalar dependencias si es necesario
if not exist "node_modules" (
    echo 📦 Instalando dependencias principales...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la instalación de dependencias
        pause
        exit /b 1
    )
)

REM Verificar Vercel CLI
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo 🌐 Instalando Vercel CLI...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la instalación de Vercel CLI
        pause
        exit /b 1
    )
)

echo.
echo 🚀 Iniciando servidor Vercel para APIs...
echo 📍 APIs disponibles en: http://localhost:3000/api/
echo 🤖 Endpoint de IA: http://localhost:3000/api/ai-blog/generate-production
echo 📝 Endpoint de blogs: http://localhost:3000/api/blogs
echo.
echo ⚠️  IMPORTANTE: Este servidor debe estar ejecutándose
echo   para que el generador de blogs (puerto 3335) funcione
echo.
echo ⏹️  Para detener el servidor, presiona Ctrl+C
echo.

REM Iniciar el servidor Vercel con variables de entorno
vercel dev --yes

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Falló al iniciar el servidor Vercel
    echo 💡 Verifica que Vercel CLI esté instalado: npm i -g vercel
    pause
    exit /b 1
)

pause