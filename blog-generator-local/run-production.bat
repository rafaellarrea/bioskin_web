@echo off
cls
echo ============================================
echo   BIOSKIN BLOG GENERATOR - PRODUCCION
echo ============================================
echo.

REM Cambiar al directorio correcto
cd /d "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-local"

echo Directorio actual: %CD%
echo.

echo Verificando configuracion...
echo.

REM Verificar que existe el archivo .env
if exist ".env" (
    echo ✅ Archivo .env encontrado
) else (
    echo ❌ Archivo .env NO encontrado
    echo.
    echo Por favor, crea el archivo .env con tu API key de OpenAI
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo.

echo ✅ Archivos del servidor:
dir server-production.js 2>nul && echo   - server-production.js ENCONTRADO || echo   - server-production.js NO ENCONTRADO
dir package.json 2>nul && echo   - package.json ENCONTRADO || echo   - package.json NO ENCONTRADO
echo.

echo Iniciando servidor de produccion...
echo.
echo ============================================
echo   SERVIDOR CON SISTEMA COMPLETO DE IA
echo ============================================
echo.
echo Una vez iniciado, abre tu navegador en:
echo http://localhost:3333
echo.
echo Para detener: Presiona Ctrl+C
echo ============================================
echo.

node server-production.js

echo.
echo ============================================
echo Servidor detenido
echo ============================================
pause