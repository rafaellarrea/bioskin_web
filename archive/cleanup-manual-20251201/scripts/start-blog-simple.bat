@echo off
cls
echo ========================================
echo   BIOSKIN - Generador de Blogs con IA
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Descarga desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo OK: Node.js disponible
echo.

echo Limpiando procesos existentes...
taskkill /IM node.exe /F >nul 2>&1

echo Cambiando al directorio del generador...
cd /d "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-interface"

if not exist "server.js" (
    echo ERROR: No se encontro server.js en el directorio
    echo Directorio actual: %cd%
    echo.
    pause
    exit /b 1
)

echo OK: Archivo server.js encontrado
echo.

if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
)

echo OK: Dependencias listas
echo.
echo Iniciando servidor en puerto 3335...
echo.
echo Interfaz: http://localhost:3335
echo Para detener: Ctrl+C
echo.
echo ========================================
echo.

node server.js

echo.
echo Servidor detenido
pause