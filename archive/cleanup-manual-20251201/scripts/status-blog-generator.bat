@echo off
cls
echo ========================================
echo   BIOSKIN - Estado del Generador
echo ========================================
echo.

echo 🔍 Verificando estado del servidor...
echo.

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js: No instalado
) else (
    echo ✅ Node.js: Disponible
)

REM Verificar puerto 3335
echo 🌐 Puerto 3335:
netstat -ano | findstr :3335 >nul
if %errorlevel% equ 0 (
    echo    ✅ ACTIVO - Servidor corriendo
    echo.
    echo 📋 Información del proceso:
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3335') do (
        echo    🔸 PID: %%i
    )
) else (
    echo    ❌ INACTIVO - Servidor detenido
)

echo.

REM Verificar archivos necesarios
echo 📁 Archivos del sistema:
if exist "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-interface\server.js" (
    echo    ✅ server.js encontrado
) else (
    echo    ❌ server.js no encontrado
)

if exist "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-interface\node_modules" (
    echo    ✅ node_modules presente
) else (
    echo    ⚠️  node_modules no encontrado
)

echo.
echo 🎮 Comandos disponibles:
echo    • start-blog-generator.bat   - Iniciar servidor
echo    • stop-blog-generator.bat    - Detener servidor  
echo    • restart-blog-generator.bat - Reiniciar servidor
echo    • status-blog-generator.bat  - Ver este estado
echo.

if exist "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-interface\server.js" (
    if not exist "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-interface\node_modules" (
        echo 💡 Sugerencia: Ejecuta start-blog-generator.bat para instalar dependencias
    )
)

echo Presione una tecla para continuar...
pause >nul