# Monitor de webhook en tiempo real
Write-Host "`nMONITOR DE WEBHOOK EN TIEMPO REAL" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

Write-Host "Estado inicial:" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "https://saludbioskin.vercel.app/api/chatbot-stats"
$stats = $response.Content | ConvertFrom-Json
Write-Host "  - Sesiones: $($stats.database.activity.totalSessions)" -ForegroundColor White
Write-Host "  - Mensajes: $($stats.database.activity.totalMessages)`n" -ForegroundColor White

Write-Host "Ahora en Meta:" -ForegroundColor Green
Write-Host "  1. Ve a Webhooks en tu app" -ForegroundColor Gray
Write-Host "  2. Click en Test junto a messages`n" -ForegroundColor Gray

Write-Host "Esperando webhooks... (Ctrl+C para salir)`n" -ForegroundColor Yellow

$previousMessages = $stats.database.activity.totalMessages
$count = 0

while ($true) {
    Start-Sleep -Seconds 2
    $count++
    
    try {
        $currentResponse = Invoke-WebRequest -Uri "https://saludbioskin.vercel.app/api/chatbot-stats"
        $currentStats = $currentResponse.Content | ConvertFrom-Json
        $currentMessages = $currentStats.database.activity.totalMessages
        
        if ($currentMessages -gt $previousMessages) {
            $timestamp = Get-Date -Format 'HH:mm:ss'
            Write-Host "`nWEBHOOK RECIBIDO! $timestamp" -ForegroundColor Green
            Write-Host "  Mensajes: $previousMessages -> $currentMessages" -ForegroundColor White
            Write-Host "  Sesiones: $($currentStats.database.activity.totalSessions)" -ForegroundColor White
            Write-Host "  El chatbot funciona!`n" -ForegroundColor Green
            $previousMessages = $currentMessages
        }
    } catch {
        Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
    }
}
