# Script para simular un mensaje entrante de WhatsApp al chatbot
# Esto prueba que el webhook funciona correctamente

$webhookUrl = "https://saludbioskin.vercel.app/api/whatsapp-chatbot"

$messageBody = @{
    entry = @(
        @{
            changes = @(
                @{
                    value = @{
                        messages = @(
                            @{
                                from = "593999999999"
                                id = "test_message_$(Get-Date -Format 'yyyyMMddHHmmss')"
                                timestamp = [int](Get-Date -UFormat %s)
                                type = "text"
                                text = @{
                                    body = "Hola, quiero información sobre tratamientos faciales"
                                }
                            }
                        )
                    }
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "`n🧪 Enviando mensaje de prueba al webhook..." -ForegroundColor Cyan
Write-Host "URL: $webhookUrl`n" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Method POST -Uri $webhookUrl -ContentType "application/json" -Body $messageBody
    
    Write-Host "✅ Webhook respondió con código: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Respuesta: $($response.Content)`n" -ForegroundColor White
    
    Write-Host "⏳ Esperando 3 segundos para que se procese..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "`n📊 Verificando estadísticas..." -ForegroundColor Cyan
    $stats = Invoke-WebRequest -Uri "https://saludbioskin.vercel.app/api/chatbot-stats"
    $statsJson = $stats.Content | ConvertFrom-Json
    
    Write-Host "`n📈 Resultados:" -ForegroundColor Green
    Write-Host "  - Total Sesiones: $($statsJson.database.activity.totalSessions)" -ForegroundColor White
    Write-Host "  - Total Mensajes: $($statsJson.database.activity.totalMessages)" -ForegroundColor White
    Write-Host "  - Tokens usados: $($statsJson.database.activity.avgTokens)`n" -ForegroundColor White
    
    if ($statsJson.database.activity.totalMessages -gt 0) {
        Write-Host "🎉 ¡ÉXITO! El chatbot procesó el mensaje correctamente." -ForegroundColor Green
        Write-Host "✅ El sistema está funcionando." -ForegroundColor Green
    } else {
        Write-Host "⚠️ El webhook respondió pero no hay mensajes registrados." -ForegroundColor Yellow
        Write-Host "Revisa los logs de Vercel para más detalles." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
