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
    pause
    exit /b 1
)

echo OK: Node.js disponible
echo.

echo Limpiando procesos existentes...
taskkill /IM node.exe /F >nul 2>&1

echo Cambiando directorios...
C:
cd "C:\Users\Gamer\Documents"
cd "BIO SKIN"
cd "BIOTECH"
cd "WEBSITE"
cd "2.0"
cd "project-bolt-sb1-cpovnqbq (1)"
cd "project2.0"
cd "blog-generator-interface"

if not exist "server.js" (
    echo ERROR: No se encontro server.js
    echo Directorio: %cd%
    pause
    exit /b 1
)

echo OK: Encontrado server.js
echo.

if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
)

echo.
echo Iniciando servidor...
echo Interfaz: http://localhost:3335
echo Para detener: Ctrl+C
echo.

node server.js

pause