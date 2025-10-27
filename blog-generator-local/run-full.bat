@echo off
cls
echo ============================================
echo    BIOSKIN BLOG GENERATOR LOCAL v1.0
echo         SERVIDOR COMPLETO CON IA
echo ============================================
echo.

REM Cambiar al directorio correcto
cd /d "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-local"

echo Directorio actual: %CD%
echo.
echo Verificando API Key...
echo.

REM Verificar que existe el archivo .env
if exist ".env" (
    echo ✅ Archivo .env encontrado
) else (
    echo ❌ Archivo .env no encontrado
    echo Por favor, configura tu API key de OpenAI
    pause
    exit /b 1
)

echo.
echo Iniciando servidor completo con IA...
echo.
echo Una vez iniciado, abre tu navegador en:
echo http://localhost:3333
echo.
echo 🤖 IA: OpenAI GPT-4 integrado
echo 📝 Blog: Generación automática
echo 🖼️  Imágenes: Gestión completa  
echo 🚀 Deploy: Git automático
echo.
echo Presiona Ctrl+C para detener el servidor
echo ============================================
echo.

node server-full.js

echo.
echo ============================================
echo Servidor detenido
echo ============================================
pause