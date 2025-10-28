@echo off
cls
echo ============================================
echo       LIMPIEZA DEL PROYECTO BIOSKIN
echo ============================================
echo.

cd /d "%~dp0\..\.."

echo Directorio del proyecto: %CD%
echo.

echo ⚠️  ATENCION: Este script eliminará archivos no utilizados.
echo.
echo Los siguientes archivos seran eliminados:
echo   - Archivos de prueba (test-*.js, test-*.html)
echo   - Archivos de debugging (debug-*.js, debug-*.html)  
echo   - Documentación duplicada
echo   - Servidores obsoletos en blog-generator-local
echo   - Archivos temporales
echo.

set /p confirmacion="¿Continuar con la limpieza? (S/N): "
if /i "%confirmacion%" neq "S" (
    echo Limpieza cancelada.
    pause
    exit /b 0
)

echo.
echo 🧹 Iniciando limpieza...
echo.

REM Eliminar archivos de prueba en raíz
echo ✅ Eliminando archivos de prueba en raíz...
if exist "test-*.js" del /q "test-*.js" 2>nul
if exist "test-*.html" del /q "test-*.html" 2>nul
if exist "debug-*.js" del /q "debug-*.js" 2>nul
if exist "debug-*.html" del /q "debug-*.html" 2>nul
if exist "run-blog-test.bat" del /q "run-blog-test.bat" 2>nul

REM Eliminar archivos específicos
for %%f in (
    "test-blog-flow.js"
    "test-direct-api.js" 
    "test-production-api.js"
    "test-openai.js"
    "test-blog-generation.js"
    "test-complete-blog-flow.js"
    "test-api-functions.js"
    "debug-blog-sources.js"
    "test-vercel-blogs.html"
) do (
    if exist "%%f" (
        echo   - Eliminando %%f
        del /q "%%f" 2>nul
    )
)

REM Eliminar archivos HTML de prueba en public
echo ✅ Eliminando archivos de prueba en public...
for %%f in (
    "public\test-api.html"
    "public\test-blogs.html" 
    "public\test-openai.html"
    "public\test-visual-blogs.html"
    "debug-blogs-simple.html"
    "debug-blogs-storage.html"
    "debug-mobile.html"
) do (
    if exist "%%f" (
        echo   - Eliminando %%f
        del /q "%%f" 2>nul
    )
)

REM Eliminar documentación duplicada
echo ✅ Eliminando documentación duplicada...
for %%f in (
    "CORRECCIÓN-BLOGS-SOLUCIONADO.md"
    "RESUMEN-BLOGS-SISTEMA.md"
    "SOLUCION-PERSISTENCIA-BLOGS.md"
    "SISTEMA-BLOGS-ORGANIZADO.md"
    "CORRECCIONES-APLICADAS.md"
) do (
    if exist "%%f" (
        echo   - Eliminando %%f
        del /q "%%f" 2>nul
    )
)

REM Limpiar archivos obsoletos en blog-generator-local
echo ✅ Limpiando blog-generator-local...
if exist "blog-generator-local" (
    for %%f in (
        "blog-generator-local\server.js"
        "blog-generator-local\server-simple.js"
        "blog-generator-local\server-full.js"
        "blog-generator-local\test-openai-direct.js"
        "blog-generator-local\test-server.js"
        "blog-generator-local\test-upload-endpoint.js"
        "blog-generator-local\run-full.bat"
        "blog-generator-local\run-test.bat"
        "blog-generator-local\run-production-fixed.bat"
        "blog-generator-local\start.bat"
    ) do (
        if exist "%%f" (
            echo   - Eliminando %%f
            del /q "%%f" 2>nul
        )
    )
    
    REM Eliminar carpetas no utilizadas
    if exist "blog-generator-local\saved-blogs" (
        echo   - Eliminando carpeta saved-blogs
        rmdir /s /q "blog-generator-local\saved-blogs" 2>nul
    )
    
    if exist "blog-generator-local\public\uploads" (
        echo   - Eliminando carpeta uploads
        rmdir /s /q "blog-generator-local\public\uploads" 2>nul
    )
)

REM Eliminar otros archivos temporales
echo ✅ Eliminando archivos temporales...
for %%f in (
    "server.log"
    "init-database.js"
    "*.zip"
) do (
    if exist "%%f" (
        echo   - Eliminando %%f
        del /q "%%f" 2>nul
    )
)

echo.
echo ============================================
echo             LIMPIEZA COMPLETADA
echo ============================================
echo.
echo ✅ Archivos eliminados exitosamente
echo ✅ Sistema de blogs organizado en: blog-system\
echo ✅ Proyecto limpio y optimizado
echo.
echo Para usar el sistema de blogs:
echo   cd blog-system
echo   scripts\install-dependencies.bat
echo   scripts\start-blog-server.bat
echo.
echo ============================================
pause