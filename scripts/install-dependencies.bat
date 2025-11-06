@echo off
REM =================================================
REM  BIOSKIN - Instalador de Dependencias
REM =================================================

echo ========================================
echo   BIOSKIN - Instalador de Dependencias
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

REM Verificar si npm está disponible
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no está disponible
    pause
    exit /b 1
)

echo ✅ Node.js encontrado: 
node --version
echo ✅ npm encontrado:
npm --version
echo.

REM Ir al directorio del proyecto
cd /d "%~dp0.."

REM Verificar si package.json existe
if not exist "package.json" (
    echo ❌ ERROR: No se encontró package.json
    echo Ejecuta este script desde la raíz del proyecto
    pause
    exit /b 1
)

echo 📦 Instalando dependencias del proyecto principal...
npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló la instalación de dependencias principales
    pause
    exit /b 1
)

echo ✅ Dependencias principales instaladas
echo.

REM Instalar Vercel CLI globalmente si no está instalado
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo 🌐 Instalando Vercel CLI globalmente...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la instalación de Vercel CLI
        pause
        exit /b 1
    )
    echo ✅ Vercel CLI instalado
) else (
    echo ✅ Vercel CLI ya está instalado
)

echo.

REM Instalar curl si no está disponible (para Windows)
where curl >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  ADVERTENCIA: curl no está disponible
    echo    Necesario para generate-blog.bat
    echo    En Windows 10/11 viene incluido por defecto
) else (
    echo ✅ curl está disponible
)

echo.
echo ========================================
echo     ✅ INSTALACIÓN COMPLETADA
echo ========================================
echo.
echo 🚀 Scripts disponibles:
echo    • start-blog-server.bat  - Inicia el servidor de desarrollo
echo    • generate-blog.bat      - Genera nuevos blogs con IA
echo    • test-blog-system.bat   - Prueba el sistema de blogs
echo.
echo 💡 Siguiente paso: ejecutar start-blog-server.bat
echo.

pause