@echo off
echo ========================================
echo  BIOSKIN - Debug Blog Generator
echo ========================================
echo.

echo 1. Verificando Node.js...
where node
if %errorlevel% neq 0 (
    echo ERROR: Node.js no encontrado
    pause
    exit /b 1
)
echo OK: Node.js encontrado
echo.

echo 2. Directorio actual: %cd%
echo 3. Directorio del script: %~dp0
echo.

echo 4. Navegando al directorio correcto...
cd /d "%~dp0..\blog-generator-interface"
echo 5. Nuevo directorio: %cd%
echo.

echo 6. Contenido del directorio:
dir /b
echo.

echo 7. Buscando server.js...
if exist "server.js" (
    echo OK: server.js encontrado
) else (
    echo ERROR: server.js NO encontrado
    echo.
    echo Presione una tecla para salir...
    pause
    exit /b 1
)

echo.
echo 8. Verificando node_modules...
if exist "node_modules" (
    echo OK: node_modules existe
) else (
    echo Instalando dependencias...
    npm install
)

echo.
echo 9. Iniciando servidor...
echo Ejecutando: node server.js
echo.

node server.js

echo.
echo Servidor detenido.
pause