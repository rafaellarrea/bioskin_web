# Script de configuración de variables de entorno en Vercel
# Uso: .\setup-vercel-env.ps1

Write-Host "🚀 Configuración de Variables de Entorno - BIOSKIN" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Vercel CLI está instalado
Write-Host "Verificando Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI no encontrado" -ForegroundColor Red
    Write-Host "Instalando Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI instalado" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI encontrado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Variables de WhatsApp a configurar:" -ForegroundColor Cyan
Write-Host ""
Write-Host "WHATSAPP_ACCESS_TOKEN:" -ForegroundColor White
Write-Host "EAA6LTPNfbn4BPZB389qTJtaogvgaf8owJGwRtnCyx5mKoVeGEjiZCfJoIZBGICwYKUszDEG9gm1HZBZBDeymrZBqiDVSxiZBZB9tcpwPSrzp1FSZBzugDl4D8yysD6BLRqMys1TIB8L4p35dhXr4GsvOxNXZANSkxLuxZAK9onESPJMHzdabLZCNZBxZBIb3N9675KkgZDZD" -ForegroundColor Gray
Write-Host ""
Write-Host "WHATSAPP_PHONE_NUMBER_ID:" -ForegroundColor White
Write-Host "832596109944880" -ForegroundColor Gray
Write-Host ""
Write-Host "WHATSAPP_BUSINESS_ACCOUNT_ID:" -ForegroundColor White
Write-Host "794475663630079" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "¿Deseas continuar con la configuración? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Configuración cancelada" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔐 Configurando variables en Vercel..." -ForegroundColor Yellow
Write-Host ""

# Función para configurar variable
function Set-VercelEnv {
    param (
        [string]$Name,
        [string]$Value,
        [string]$Environment = "production,preview,development"
    )
    
    Write-Host "Configurando $Name..." -ForegroundColor Yellow
    
    # Verificar si ya existe
    $existingVars = vercel env ls 2>&1
    if ($existingVars -match $Name) {
        Write-Host "⚠️  Variable $Name ya existe. ¿Deseas sobrescribirla? (S/N)" -ForegroundColor Yellow
        $overwrite = Read-Host
        
        if ($overwrite -eq "S" -or $overwrite -eq "s") {
            Write-Host "Eliminando variable existente..." -ForegroundColor Yellow
            vercel env rm $Name production -y 2>&1 | Out-Null
            vercel env rm $Name preview -y 2>&1 | Out-Null
            vercel env rm $Name development -y 2>&1 | Out-Null
        } else {
            Write-Host "⏭️  Saltando $Name" -ForegroundColor Gray
            return
        }
    }
    
    # Agregar nueva variable
    $env:VERCEL_ENV_VALUE = $Value
    echo $Value | vercel env add $Name production 2>&1 | Out-Null
    echo $Value | vercel env add $Name preview 2>&1 | Out-Null
    echo $Value | vercel env add $Name development 2>&1 | Out-Null
    
    Write-Host "✅ $Name configurado" -ForegroundColor Green
}

# Configurar variables de WhatsApp
Set-VercelEnv -Name "WHATSAPP_ACCESS_TOKEN" -Value "EAA6LTPNfbn4BPZB389qTJtaogvgaf8owJGwRtnCyx5mKoVeGEjiZCfJoIZBGICwYKUszDEG9gm1HZBZBDeymrZBqiDVSxiZBZB9tcpwPSrzp1FSZBzugDl4D8yysD6BLRqMys1TIB8L4p35dhXr4GsvOxNXZANSkxLuxZAK9onESPJMHzdabLZCNZBxZBIb3N9675KkgZDZD"
Set-VercelEnv -Name "WHATSAPP_PHONE_NUMBER_ID" -Value "832596109944880"
Set-VercelEnv -Name "WHATSAPP_BUSINESS_ACCOUNT_ID" -Value "794475663630079"

Write-Host ""
Write-Host "✅ Configuración completada" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Variables configuradas:" -ForegroundColor Cyan
vercel env ls

Write-Host ""
Write-Host "🔄 ¿Deseas hacer redeploy para aplicar los cambios? (S/N)" -ForegroundColor Yellow
$redeploy = Read-Host

if ($redeploy -eq "S" -or $redeploy -eq "s") {
    Write-Host ""
    Write-Host "🚀 Desplegando a producción..." -ForegroundColor Yellow
    vercel --prod
    Write-Host ""
    Write-Host "✅ Deploy completado" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Recuerda hacer redeploy manualmente:" -ForegroundColor Yellow
    Write-Host "vercel --prod" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ Configuración finalizada" -ForegroundColor Green
