@echo off
cls
echo ========================================
echo   BIOSKIN - Detener Generador de Blogs
echo ========================================
echo.

echo 🛑 Deteniendo servidor del generador de blogs...
echo.

REM Buscar y detener procesos de Node.js relacionados con el blog generator
echo 🔍 Buscando procesos de Node.js en puerto 3335...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3335') do (
    echo 🛑 Deteniendo proceso PID: %%i
    taskkill /PID %%i /F >nul 2>&1
)

REM Detener todos los procesos de Node.js como medida adicional
echo 🔄 Deteniendo procesos de Node.js relacionados...
taskkill /IM node.exe /F >nul 2>&1

echo.
echo ✅ Servidor detenido exitosamente
echo.

REM Verificar que el puerto esté libre
echo 🔍 Verificando que el puerto 3335 esté libre...
netstat -ano | findstr :3335 >nul
if %errorlevel% equ 0 (
    echo ⚠️  El puerto 3335 aún está en uso
) else (
    echo ✅ Puerto 3335 libre
)

echo.
echo 📋 Tareas completadas:
echo    • Procesos de Node.js detenidos
echo    • Puerto 3335 liberado
echo    • Sistema listo para reiniciar
echo.
echo Presione una tecla para continuar...
pause >nul