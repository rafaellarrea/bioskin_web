@echo off
cls
echo ============================================
echo    BIOSKIN BLOG GENERATOR LOCAL v1.0
echo ============================================
echo.

REM Cambiar al directorio correcto
cd /d "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-local"

echo Directorio actual: %CD%
echo.
echo Archivos disponibles:
dir *.js /b
echo.

echo Iniciando servidor de prueba...
echo.
echo Una vez iniciado, abre tu navegador en:
echo http://localhost:3333
echo.
echo Presiona Ctrl+C para detener el servidor
echo ============================================
echo.

node test-server.js

echo.
echo ============================================
echo Servidor detenido
echo ============================================
pause