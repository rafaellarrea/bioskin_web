Write-Host "========================================"
Write-Host "  BIOSKIN - Generador de Blogs con IA"
Write-Host "========================================"
Write-Host ""

# Verificar Node.js
try {
    $null = Get-Command node -ErrorAction Stop
    Write-Host "OK: Node.js disponible" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js no esta instalado" -ForegroundColor Red
    Write-Host "Descarga desde: https://nodejs.org/"
    Read-Host "Presione Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "Limpiando procesos existentes..."

# Detener procesos existentes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Cambiando al directorio del generador..."

# Cambiar al directorio del blog generator
$targetPath = "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\blog-generator-interface"
Set-Location $targetPath

if (-not (Test-Path "server.js")) {
    Write-Host "ERROR: No se encontro server.js" -ForegroundColor Red
    Write-Host "Directorio actual: $(Get-Location)"
    Read-Host "Presione Enter para salir"
    exit 1
}

Write-Host "OK: Archivo server.js encontrado" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..."
    npm install
}

Write-Host ""
Write-Host "Iniciando servidor..." -ForegroundColor Yellow
Write-Host "Interfaz: http://localhost:3335" -ForegroundColor Cyan
Write-Host "Para detener: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Iniciar el servidor
node server.js

Write-Host ""
Write-Host "Servidor detenido"
Read-Host "Presione Enter para continuar"