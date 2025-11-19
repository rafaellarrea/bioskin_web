# Script para configurar variables de entorno de autenticación en Vercel
# Ejecutar: .\setup-admin-env.ps1

Write-Host "🔧 Configurando variables de entorno de autenticación..." -ForegroundColor Cyan

# Usuario admin
Write-Host "`n📝 Configurando ADMIN_USERNAME..." -ForegroundColor Yellow
$username = "admin"
Write-Output $username | vercel env add ADMIN_USERNAME production

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ADMIN_USERNAME configurado" -ForegroundColor Green
} else {
    Write-Host "❌ Error configurando ADMIN_USERNAME" -ForegroundColor Red
    exit 1
}

# Contraseña admin
Write-Host "`n📝 Configurando ADMIN_PASSWORD..." -ForegroundColor Yellow
$password = "b10sk1n"
Write-Output $password | vercel env add ADMIN_PASSWORD production

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ADMIN_PASSWORD configurado" -ForegroundColor Green
} else {
    Write-Host "❌ Error configurando ADMIN_PASSWORD" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Configuración completada!" -ForegroundColor Green
Write-Host "📋 Variables configuradas:" -ForegroundColor Cyan
Write-Host "   - ADMIN_USERNAME: admin" -ForegroundColor White
Write-Host "   - ADMIN_PASSWORD: b10sk1n" -ForegroundColor White
Write-Host "`n⚠️  IMPORTANTE: Ejecuta 'vercel --prod' para redesplegar" -ForegroundColor Yellow
