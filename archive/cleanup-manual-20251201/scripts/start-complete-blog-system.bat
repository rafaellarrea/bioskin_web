@echo off
REM =================================================
REM  BIOSKIN - Iniciador Completo del Sistema de Blogs
REM =================================================

echo ========================================
echo   BIOSKIN - Sistema Completo de Blogs
echo ========================================
echo.

echo 🔑 Variables de entorno: Usando configuración de Vercel
echo   Las credenciales están configuradas en Vercel (no se requiere .env local)
echo.

REM Ir al directorio del proyecto
cd /d "%~dp0.."

echo 📋 Iniciando sistema completo...
echo.
echo 🔄 Paso 1/3: Verificando dependencias...

REM Instalar dependencias principales si es necesario
if not exist "node_modules" (
    echo 📦 Instalando dependencias principales...
    npm install
)

REM Instalar dependencias del generador
if not exist "blog-generator-interface\node_modules" (
    echo 📦 Instalando dependencias del generador...
    cd blog-generator-interface
    npm install
    cd ..
)

echo ✅ Dependencias verificadas
echo.

echo 🔄 Paso 2/3: Iniciando servidor Vercel APIs (puerto 3000)...
echo.

REM Iniciar servidor Vercel en background
start "BIOSKIN Vercel APIs" cmd /k "cd /d %cd% && echo Iniciando APIs de Vercel... && vercel dev --yes"

REM Esperar un poco para que Vercel inicie
echo ⏳ Esperando que las APIs de Vercel se inicialicen...
timeout /t 10 /nobreak >nul

echo ✅ APIs de Vercel iniciadas
echo.

echo 🔄 Paso 3/3: Iniciando interfaz de generación (puerto 3335)...
echo.

REM Cambiar al directorio del generador e iniciar
cd blog-generator-interface

echo 🎯 ========================================
echo    BIOSKIN - GENERADOR DE BLOGS CON IA
echo ========================================
echo.
echo 🌐 Interfaz web: http://localhost:3335
echo 📡 APIs Vercel: http://localhost:3000/api/
echo 🤖 IA OpenAI: CONECTADA
echo 🖼️  Imágenes: AUTOMÁTICAS
echo 📁 Guardado: AUTOMÁTICO
echo 🚀 Deploy: GIT PUSH AUTOMÁTICO
echo.
echo 💡 INSTRUCCIONES:
echo   1. Abre http://localhost:3335 en tu navegador
echo   2. Selecciona categoría del blog
echo   3. Genera contenido con IA
echo   4. Sube imágenes (drag & drop)
echo   5. Revisa el contenido
echo   6. Guarda y despliega automáticamente
echo.
echo ⏹️  Para detener: Ctrl+C en ambas ventanas
echo.

REM Iniciar el servidor del generador
node server.js

pause