# 📊 Sistema de Analytics (Plan Hobby Vercel)

## 🚨 Contexto: Limitaciones Plan Hobby
Debido a la descontinuación de Vercel KV en el plan Hobby (Junio 2025), el proyecto utiliza una estrategia híbrida para mantener métricas sin costos adicionales.

## ✅ Estrategia Implementada: Híbrida

### 1. Vercel Analytics (Oficial)
- **Uso**: Métricas reales de visitantes, países, dispositivos.
- **Acceso**: Dashboard de Vercel.
- **Ventaja**: Precisión y cero mantenimiento.
- **Limitación**: No accesible vía API pública para mostrar en el frontend del admin.

### 2. LocalStorage (Frontend)
- **Uso**: Contadores visuales para demostración en el Admin Dashboard.
- **Persistencia**: Local en el navegador del administrador.
- **Ventaja**: Rápido y gratis.
- **Limitación**: No refleja datos globales reales, solo simulación o datos locales.

## 🛠️ Implementación Técnica

### `lib/hybrid-analytics.js`

```javascript
class HybridAnalytics {
  trackPageView() {
    // 1. Enviar a Vercel Analytics (si está activo)
    if (window.va) va.track('page_view');
    
    // 2. Actualizar contadores locales para UI
    this.updateLocalStats();
  }
  
  getStats() {
    // Retorna datos locales para el dashboard
    return JSON.parse(localStorage.getItem('bioskin_stats') || '{}');
  }
}
```

## 📋 Migración Futura (Si se requiere Upgrade)

Si el proyecto escala a un plan Pro o se integra una base de datos externa para analytics:

1.  **Opción A (Recomendada)**: Usar **Upstash Redis** (Marketplace).
    - Capa gratuita generosa.
    - Compatible con la lógica anterior de Vercel KV.
    
2.  **Opción B**: Usar tabla `analytics_events` en **Neon PostgreSQL**.
    - Ya tenemos conexión a Neon.
    - Requiere crear tabla y endpoint de ingestión.

## ⚠️ Notas Importantes
- No usar `fs` (FileSystem) para guardar contadores en Vercel (es read-only).
- No crear nuevas Serverless Functions solo para analytics (límite de 12 funciones).
