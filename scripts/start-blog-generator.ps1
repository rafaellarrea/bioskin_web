# ========================================
#   BIOSKIN - Generador de Blogs con IA  
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BIOSKIN - Generador de Blogs con IA" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js disponible: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js no está instalado" -ForegroundColor Red
    Write-Host "Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host ""

# Obtener directorio del script y navegar al proyecto
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectDir = Split-Path -Parent $scriptDir
$blogGeneratorDir = Join-Path $projectDir "blog-generator-interface"

Write-Host "📁 Directorio del proyecto: $projectDir" -ForegroundColor Yellow
Write-Host "📁 Directorio del generador: $blogGeneratorDir" -ForegroundColor Yellow

# Verificar que existe el directorio
if (-not (Test-Path $blogGeneratorDir)) {
    Write-Host "❌ ERROR: No se encuentra el directorio blog-generator-interface" -ForegroundColor Red
    Write-Host "Ruta esperada: $blogGeneratorDir" -ForegroundColor Yellow
    Read-Host "Presiona Enter para continuar"
    exit 1
}

# Cambiar al directorio del generador
Set-Location $blogGeneratorDir
Write-Host "📂 Cambiando a: $(Get-Location)" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Verificando dependencias..." -ForegroundColor Yellow

# Verificar package.json
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERROR: No se encuentra package.json" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

# Instalar dependencias si no existen
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Falló la instalación de dependencias" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
        exit 1
    }
} else {
    Write-Host "✅ Dependencias ya instaladas" -ForegroundColor Green
}

# Verificar server.js
if (-not (Test-Path "server.js")) {
    Write-Host "❌ ERROR: No se encuentra server.js" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host ""
Write-Host "✅ Todo listo. Iniciando servidor..." -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Sistema de blogs iniciándose..." -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Interfaz: http://localhost:3335" -ForegroundColor Green
Write-Host "🤖 IA: Conectada con Vercel" -ForegroundColor Green
Write-Host "🔑 Credenciales: Usando configuración de Vercel" -ForegroundColor Green
Write-Host "📁 Guardado: Automático + Git push" -ForegroundColor Green
Write-Host ""
Write-Host "⏹️  Para detener: Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎬 Ejecutando: node server.js" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray

# Iniciar el servidor
try {
    node server.js
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: No se pudo iniciar el servidor" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "⚠️  El servidor se ha detenido" -ForegroundColor Yellow
    Read-Host "Presiona Enter para continuar"
}