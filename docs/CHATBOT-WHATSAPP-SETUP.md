# 🤖 Chatbot de WhatsApp con OpenAI - Guía de Configuración

## 📋 Descripción General

Sistema de chatbot inteligente para WhatsApp integrado con OpenAI, usando Vercel como pasarela y Neon PostgreSQL para persistencia de datos.

## 🏗️ Arquitectura

```
WhatsApp Business API
        ↓
Vercel Serverless Function (/api/whatsapp-chatbot.js)
        ↓
Neon PostgreSQL (Historial de conversaciones)
        ↓
OpenAI GPT-4o-mini (Generación de respuestas)
        ↓
Respuesta a WhatsApp
```

## 📦 Componentes del Sistema

### **Servicios de Backend (lib/)**

1. **`neon-chatbot-db.js`** - Gestión de base de datos
   - Conexión con Neon PostgreSQL
   - CRUD de conversaciones y mensajes
   - Estadísticas de uso

2. **`chatbot-cleanup.js`** - Sistema de limpieza automática
   - Monitoreo de almacenamiento
   - Limpieza de sesiones antiguas
   - Recorte de conversaciones largas

3. **`chatbot-ai-service.js`** - Servicio de IA
   - Integración con OpenAI
   - Generación de respuestas contextuales
   - Detección de intenciones

### **API Endpoints (api/)**

1. **`/api/whatsapp-chatbot`** - Webhook principal
   - GET: Verificación de webhook
   - POST: Procesamiento de mensajes

2. **`/api/chatbot-stats`** - Monitoreo
   - GET: Estadísticas del sistema
   - POST: Mantenimiento manual

## ⚙️ Configuración

### **1. Variables de Entorno en Vercel**

Accede al dashboard de Vercel → Project Settings → Environment Variables:

```bash
# Base de Datos Neon
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/chatbot?sslmode=require

# OpenAI (ya configurada)
OPENAI_API_KEY=sk-proj-xxxxx

# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=tu_token_secreto_para_verificacion
WHATSAPP_ACCESS_TOKEN=EAAxxxxx (Token de acceso de Meta)
WHATSAPP_PHONE_NUMBER_ID=123456789 (ID del número de WhatsApp Business)
```

### **2. Crear Base de Datos en Neon**

1. Accede a [console.neon.tech](https://console.neon.tech)
2. Crea un nuevo proyecto: **"bioskin-chatbot"**
3. Copia la connection string
4. La base de datos se inicializará automáticamente en el primer mensaje

**Plan Gratuito de Neon:**
- 512 MB de almacenamiento
- 5 GB de transferencia mensual
- Más que suficiente para el chatbot con limpieza automática

### **3. Configurar WhatsApp Business API**

#### **Opción A: Meta Business Manager (Producción)**

1. Accede a [developers.facebook.com](https://developers.facebook.com)
2. Crea una aplicación de WhatsApp Business
3. Configura el webhook:
   - URL: `https://tu-proyecto.vercel.app/api/whatsapp-chatbot`
   - Verify Token: El mismo que configuraste en `WHATSAPP_VERIFY_TOKEN`
   - Suscríbete a: `messages`

4. Obtén credenciales:
   - Access Token (desde la consola de Meta)
   - Phone Number ID (desde WhatsApp → Números)

#### **Opción B: Testing Local con Vercel Dev**

```powershell
# Instalar Vercel CLI
npm install -g vercel

# Configurar variables locales
vercel env pull

# Ejecutar en desarrollo
vercel dev
```

### **4. Instalar Dependencias**

```powershell
# Instalar paquetes necesarios
npm install @neondatabase/serverless openai

# Verificar instalación
npm list @neondatabase/serverless openai
```

## 🚀 Deploy a Producción

```powershell
# Desde la raíz del proyecto
git add .
git commit -m "Agregar chatbot de WhatsApp con OpenAI"
git push

# O deploy directo con Vercel CLI
vercel --prod
```

## 📊 Monitoreo y Mantenimiento

### **Verificar Estado del Chatbot**

```bash
# Obtener estadísticas
GET https://tu-proyecto.vercel.app/api/chatbot-stats

# Respuesta esperada:
{
  "status": "healthy",
  "storage": {
    "current": "15.23 MB",
    "limit": "400 MB",
    "percentUsed": "3.8%",
    "needsCleanup": false
  },
  "database": {
    "activity": {
      "totalSessions": 45,
      "totalMessages": 320,
      "avgTokens": "245.67",
      "activeSessions24h": 12
    }
  }
}
```

### **Ejecutar Limpieza Manual**

```bash
# Forzar mantenimiento
POST https://tu-proyecto.vercel.app/api/chatbot-stats
Content-Type: application/json

{
  "action": "maintenance",
  "force": true
}
```

### **Limpieza Automática**

El sistema ejecuta limpieza automática cuando:
- El almacenamiento supera el 80% (320 MB)
- Se ejecuta limpieza ligera en 10% de los requests
- Elimina conversaciones >30 días
- Recorta sesiones a máximo 50 mensajes

## 🎨 Personalizar el Chatbot

### **Modificar Personalidad/Instrucciones**

Edita `lib/chatbot-ai-service.js`:

```javascript
this.systemPrompt = `Tu nuevo prompt aquí...

INFORMACIÓN DE LA CLÍNICA:
- [Agrega información específica]

TU PERSONALIDAD:
- [Define el tono y estilo]

CAPACIDADES:
- [Lista funcionalidades]
`;
```

### **Agregar Documentos para Contexto**

Próximos pasos para mejorar respuestas:

1. **Crear carpeta de conocimiento:**
```
lib/chatbot-knowledge/
├── tratamientos.json
├── precios.json
├── faqs.json
└── protocolos.json
```

2. **Integrar en el prompt:**
```javascript
const knowledge = loadKnowledgeBase();
this.systemPrompt = `${basePrompt}\n\nINFORMACIÓN ACTUALIZADA:\n${knowledge}`;
```

## 🧪 Testing

### **Probar Webhook Localmente**

```powershell
# Iniciar servidor local
vercel dev

# En otra terminal, simular webhook
curl -X POST http://localhost:3000/api/whatsapp-chatbot `
  -H "Content-Type: application/json" `
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5491234567890",
            "id": "test_msg_1",
            "type": "text",
            "text": { "body": "Hola" }
          }]
        }
      }]
    }]
  }'
```

### **Verificar Base de Datos**

```javascript
// Crear script test-chatbot-db.js
import { getDatabaseStats } from './lib/neon-chatbot-db.js';

const stats = await getDatabaseStats();
console.log('Stats:', stats);
```

## 📈 Límites y Escalabilidad

### **Plan Gratuito de Neon (512 MB)**

Con limpieza automática:
- ~50,000 mensajes aprox. (asumiendo 10 KB por mensaje)
- ~1,000 sesiones activas
- Historial de 30 días

### **Optimización de Tokens (OpenAI)**

Configuración actual:
- Modelo: `gpt-4o-mini` (económico)
- Max tokens: 500 por respuesta
- Contexto: Últimos 20 mensajes

**Costos estimados:**
- $0.15 por 1M tokens de entrada
- ~$0.05 por 100 conversaciones (promedio)

## 🔒 Seguridad

1. **Tokens sensibles:** Nunca expongas tokens en el frontend
2. **Validación:** El webhook valida el token de verificación
3. **Rate limiting:** Considera agregar límites por usuario
4. **Logs:** Los logs no incluyen contenido sensible

## 🐛 Troubleshooting

### **Error: "NEON_DATABASE_URL not configured"**

Verifica que la variable esté en Vercel:
```bash
vercel env ls
```

### **Error: "WhatsApp API error: 401"**

Token de WhatsApp expirado o inválido. Regenera en Meta Business.

### **Chatbot no responde**

1. Verifica logs en Vercel Dashboard
2. Chequea que el webhook esté suscrito a `messages`
3. Confirma que la URL del webhook sea correcta

### **Base de datos llena**

Ejecuta mantenimiento manual:
```bash
POST /api/chatbot-stats
{ "action": "maintenance", "force": true }
```

## 📞 Soporte

Para problemas o dudas:
1. Revisa logs en Vercel Dashboard
2. Verifica estadísticas en `/api/chatbot-stats`
3. Consulta documentación de WhatsApp Business API

---

**Última actualización:** Noviembre 2025
