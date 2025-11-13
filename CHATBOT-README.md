# 🤖 BIOSKIN WhatsApp Chatbot - Quick Start

## 📌 Resumen

Sistema de chatbot inteligente integrado con WhatsApp Business API, OpenAI GPT-4o-mini y Neon PostgreSQL.

## 🚀 Setup Rápido

### 1. Configurar Variables en Vercel

```bash
NEON_DATABASE_URL=postgresql://...
WHATSAPP_VERIFY_TOKEN=tu_token_secreto
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789
OPENAI_API_KEY=sk-proj-... (ya configurada en el entorno vercel)
```

### 2. Configurar Webhook en Meta

- URL: `https://tu-proyecto.vercel.app/api/whatsapp-chatbot`
- Verify Token: El mismo de `WHATSAPP_VERIFY_TOKEN`
- Eventos: Suscribirse a `messages`

### 3. Verificar Funcionamiento

```bash
# Estadísticas del sistema
GET https://tu-proyecto.vercel.app/api/chatbot-stats

# Respuesta esperada:
{
  "status": "healthy",
  "storage": { "percentUsed": "3.8%" },
  "database": { "activity": { "totalMessages": 320 } }
}
```

## 📂 Archivos Clave

```
lib/
├── neon-chatbot-db.js         # Gestión BD
├── chatbot-cleanup.js         # Limpieza automática
└── chatbot-ai-service.js      # Servicio OpenAI

api/
├── whatsapp-chatbot.js        # Webhook principal
└── chatbot-stats.js           # Monitoreo
```

## 🎨 Personalizar

Edita `lib/chatbot-ai-service.js`:

```javascript
this.systemPrompt = `Tu personalidad y capacidades aquí...`;
```

## 📚 Documentación Completa

Ver: `docs/CHATBOT-WHATSAPP-SETUP.md`

## 🔧 Mantenimiento

- **Automático**: Limpia al 80% de uso (320 MB)
- **Manual**: `POST /api/chatbot-stats` con `{ "action": "maintenance" }`

## 💰 Costos

- Neon PostgreSQL: **Gratis** (512 MB)
- OpenAI: ~$0.05 por 100 conversaciones
- WhatsApp Business API: Gratis hasta 1,000 conversaciones/mes
