@echo off
REM =================================================
REM  BIOSKIN - Generador de Blogs con IA
REM =================================================

echo ========================================
echo   BIOSKIN - Generador de Blogs con IA
echo ========================================
echo.

REM Ir al directorio del proyecto
cd /d "%~dp0.."

REM Verificar variables de entorno
if "%OPENAI_API_KEY%"=="" (
    echo ❌ ERROR: OPENAI_API_KEY no está configurada
    echo.
    echo 💡 Para configurar:
    echo    1. Crea un archivo .env en la raíz del proyecto
    echo    2. Agrega: OPENAI_API_KEY=tu_clave_aqui
    echo    3. O exporta la variable: set OPENAI_API_KEY=tu_clave
    echo.
    pause
    exit /b 1
)

echo 🔑 API Key configurada correctamente
echo.

REM Mostrar opciones de categorías
echo 📝 Categorías disponibles:
echo    1. medico-estetico
echo    2. tecnologia-estetica  
echo    3. cuidado-piel
echo    4. tratamientos-faciales
echo    5. tratamientos-corporales
echo.

REM Solicitar categoría
set /p categoria="Ingresa la categoría del blog: "

if "%categoria%"=="" (
    echo ❌ Debe especificar una categoría
    pause
    exit /b 1
)

echo.
echo 🤖 Generando blog para categoría: %categoria%
echo ⏳ Este proceso puede tomar 30-60 segundos...
echo.

REM Crear el payload JSON
echo {"category": "%categoria%"} > temp_request.json

REM Hacer la solicitud a la API de generación
curl -X POST http://localhost:3000/api/ai-blog/generate-production ^
    -H "Content-Type: application/json" ^
    -d @temp_request.json

REM Verificar si curl funcionó
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Falló la conexión con la API
    echo 💡 Verifica que el servidor esté ejecutándose (start-blog-server.bat)
    del temp_request.json 2>nul
    pause
    exit /b 1
)

REM Limpiar archivo temporal
del temp_request.json 2>nul

echo.
echo ✅ Blog generado exitosamente!
echo 📁 Revisa src/data/blogs/ para ver el nuevo contenido
echo 🌐 Los blogs se sincronizarán automáticamente en el frontend
echo.

pause