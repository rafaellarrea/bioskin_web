@echo off
REM Script para inicializar y probar el chatbot de WhatsApp
REM Ejecutar desde la raíz del proyecto

echo ========================================
echo  BIOSKIN - Chatbot WhatsApp Setup
echo ========================================
echo.

REM Verificar que Node.js esté instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] Verificando dependencias...
call npm list @neondatabase/serverless >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Instalando dependencias del chatbot...
    call npm install @neondatabase/serverless openai
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo en instalacion de dependencias
        pause
        exit /b 1
    )
)
echo [OK] Dependencias instaladas

echo.
echo [2/4] Verificando variables de entorno...
if not defined NEON_DATABASE_URL (
    echo [ADVERTENCIA] NEON_DATABASE_URL no configurado
    echo Por favor configura la variable en Vercel o .env
    echo.
    set /p continuar="Continuar de todas formas? (s/n): "
    if /i not "%continuar%"=="s" exit /b 0
)
echo [OK] Variables verificadas

echo.
echo [3/4] Inicializando base de datos...
node scripts/init-chatbot-db.js
if %errorlevel% neq 0 (
    echo [ERROR] Fallo en inicializacion de BD
    echo Verifica la conexion a Neon PostgreSQL
    pause
    exit /b 1
)

echo.
echo [4/4] Ejecutando prueba del chatbot...
echo.
node scripts/test-chatbot.js "Hola, necesito informacion sobre tratamientos"

echo.
echo ========================================
echo  Setup completado!
echo ========================================
echo.
echo Proximos pasos:
echo 1. Configurar webhook en Meta Business Manager
echo 2. Agregar variables WHATSAPP_* en Vercel
echo 3. Hacer deploy: git push
echo.
pause
