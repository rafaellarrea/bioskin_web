@echo off
REM =================================================
REM  BIOSKIN - Prueba del Sistema de Blogs
REM =================================================

echo ========================================
echo   BIOSKIN - Prueba del Sistema de Blogs
echo ========================================
echo.

REM Ir al directorio del proyecto
cd /d "%~dp0.."

echo 🧪 Ejecutando pruebas del sistema de blogs...
echo.

REM Verificar que el servidor esté ejecutándose
echo 1️⃣ Verificando conexión con el servidor...
curl -s http://localhost:3000/api/blogs?action=health >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Servidor no está ejecutándose
    echo 💡 Ejecuta start-blog-server.bat primero
    pause
    exit /b 1
)
echo ✅ Servidor respondiendo

echo.
echo 2️⃣ Probando endpoint de blogs...
curl -s -X GET "http://localhost:3000/api/blogs?action=getJsonFiles"
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló la prueba del endpoint de blogs
    pause
    exit /b 1
)
echo ✅ Endpoint de blogs funcionando

echo.
echo 3️⃣ Verificando estructura de archivos...
if not exist "src\data\blogs\index.json" (
    echo ❌ ERROR: No se encontró index.json
    pause
    exit /b 1
)
echo ✅ Estructura de archivos correcta

echo.
echo 4️⃣ Probando API de generación (solo estructura)...
curl -s -X GET "http://localhost:3000/api/ai-blog/generate-production" >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  ADVERTENCIA: API de generación no responde
    echo   Verifica que OPENAI_API_KEY esté configurada
) else (
    echo ✅ API de generación disponible
)

echo.
echo 5️⃣ Abriendo página de prueba...
start "" "http://localhost:3000/test-blogs.html"

echo.
echo ========================================
echo     ✅ PRUEBAS COMPLETADAS
echo ========================================
echo.
echo 📊 Resultados:
echo    • Servidor: Funcionando
echo    • API Blogs: Funcionando  
echo    • Estructura: Correcta
echo    • Página de prueba: Abierta en navegador
echo.
echo 💡 Revisa la página de prueba para verificar
echo    que los blogs se cargan correctamente
echo.

pause