@echo off
cls
echo ============================================
echo   BIOSKIN BLOG GENERATOR - SISTEMA LIMPIO
echo ============================================
echo.

REM Cambiar al directorio del nuevo sistema
cd /d "%~dp0\.."

echo Directorio del sistema: %CD%
echo.

echo Verificando configuracion...
echo.

REM Verificar que existe el archivo .env en el proyecto principal
if exist "..\.env" (
    echo ✅ Archivo .env encontrado en proyecto principal
) else (
    echo ❌ Archivo .env NO encontrado en proyecto principal
    echo.
    echo Por favor, crea el archivo .env en la raiz del proyecto con:
    echo OPENAI_API_KEY=tu_api_key_aqui
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo.

echo ✅ Archivos del servidor:
dir server\server.js 2>nul && echo   - server.js ENCONTRADO || echo   - server.js NO ENCONTRADO
dir config\package.json 2>nul && echo   - package.json ENCONTRADO || echo   - package.json NO ENCONTRADO
echo.

echo Instalando dependencias si es necesario...
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install --prefix . express cors multer fs-extra simple-git openai dotenv
)

echo.
echo Iniciando servidor del sistema de blogs...
echo.
echo ============================================
echo   SERVIDOR SISTEMA BLOGS ORGANIZADO
echo ============================================
echo.
echo Una vez iniciado, abre tu navegador en:
echo http://localhost:3336
echo.
echo Para detener: Presiona Ctrl+C
echo ============================================
echo.

REM Cambiar el directorio de trabajo al proyecto principal para las variables de entorno
cd /d "%~dp0\..\.."
node blog-system\server\server.js

echo.
echo ============================================
echo Servidor detenido
echo ============================================
pause