@echo off
REM =================================================
REM  BIOSKIN - Configurador de Variables de Entorno
REM =================================================

echo ========================================
echo   BIOSKIN - Configurador de Entorno
echo ========================================
echo.

REM Ir al directorio del proyecto
cd /d "%~dp0.."

echo 🔧 Configurando variables de entorno para desarrollo...
echo.

REM Verificar si .env existe
if exist ".env" (
    echo ✅ Archivo .env encontrado
    echo.
    echo 📄 Contenido actual:
    type ".env"
    echo.
    set /p overwrite="¿Sobrescribir configuración? (y/N): "
    if /i not "%overwrite%"=="y" (
        echo ⏹️  Configuración cancelada
        pause
        exit /b 0
    )
)

echo.
echo 🔑 Configuración de API Keys:
echo.

REM Solicitar OpenAI API Key
set /p openai_key="Ingresa tu OpenAI API Key (sk-...): "
if "%openai_key%"=="" (
    echo ❌ OpenAI API Key es requerida
    pause
    exit /b 1
)

REM Solicitar configuración de email (opcional)
echo.
echo 📧 Configuración de Email (opcional - para notificaciones):
set /p gmail_user="Gmail usuario (opcional): "
set /p gmail_pass="Gmail contraseña de app (opcional): "

REM Crear archivo .env
echo # BIOSKIN - Variables de Entorno > .env
echo # Generado el %date% %time% >> .env
echo. >> .env
echo # OpenAI Configuration >> .env
echo OPENAI_API_KEY=%openai_key% >> .env
echo. >> .env

if not "%gmail_user%"=="" (
    echo # Email Configuration >> .env
    echo GMAIL_USER=%gmail_user% >> .env
    echo GMAIL_PASS=%gmail_pass% >> .env
    echo. >> .env
)

echo # Google Calendar (base64 encoded JSON) >> .env
echo GOOGLE_CREDENTIALS_BASE64= >> .env
echo. >> .env
echo # Development >> .env
echo NODE_ENV=development >> .env

echo ✅ Archivo .env creado exitosamente
echo.

REM Configurar variables para la sesión actual
set OPENAI_API_KEY=%openai_key%
if not "%gmail_user%"=="" (
    set GMAIL_USER=%gmail_user%
    set GMAIL_PASS=%gmail_pass%
)

echo 🌍 Variables de entorno configuradas para esta sesión
echo.

REM Verificar configuración
echo 🧪 Verificando configuración...
if "%OPENAI_API_KEY%"=="" (
    echo ❌ ERROR: OPENAI_API_KEY no se configuró correctamente
    pause
    exit /b 1
)

echo ✅ OPENAI_API_KEY configurada
if not "%GMAIL_USER%"=="" echo ✅ Configuración de email lista

echo.
echo ========================================
echo     ✅ CONFIGURACIÓN COMPLETADA
echo ========================================
echo.
echo 💡 Variables configuradas:
echo    • OPENAI_API_KEY: ✅ Configurada
if not "%gmail_user%"=="" echo    • Email: ✅ Configurado
echo.
echo 🚀 Ya puedes usar:
echo    • generate-blog.bat
echo    • start-blog-server.bat
echo.

pause