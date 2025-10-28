@echo off
cls
echo ============================================
echo     INSTALACION SISTEMA BLOGS BIOSKIN
echo ============================================
echo.

REM Cambiar al directorio del sistema de blogs
cd /d "%~dp0\.."

echo Directorio actual: %CD%
echo.

echo Instalando dependencias del sistema de blogs...
echo.

REM Crear package.json si no existe
if not exist "package.json" (
    echo Creando package.json...
    echo {> package.json
    echo   "name": "bioskin-blog-system",>> package.json
    echo   "version": "2.0.0",>> package.json
    echo   "description": "Sistema de generación de blogs para BIOSKIN",>> package.json
    echo   "main": "server/server.js",>> package.json
    echo   "scripts": {>> package.json
    echo     "start": "node server/server.js",>> package.json
    echo     "dev": "node server/server.js">> package.json
    echo   },>> package.json
    echo   "dependencies": {}>> package.json
    echo }>> package.json
)

echo ✅ Instalando dependencias principales...
call npm install express cors multer fs-extra simple-git openai dotenv

echo.
echo ✅ Verificando instalación...
if exist "node_modules" (
    echo ✅ Dependencias instaladas correctamente
) else (
    echo ❌ Error en la instalación
    pause
    exit /b 1
)

echo.
echo ============================================
echo    INSTALACION COMPLETADA
echo ============================================
echo.
echo El sistema está listo para usar.
echo.
echo Para iniciar el servidor:
echo   scripts\start-blog-server.bat
echo.
echo O manualmente:
echo   node server\server.js
echo.
echo ============================================
pause