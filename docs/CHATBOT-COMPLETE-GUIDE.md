# 🤖 Chatbot WhatsApp BIOSKIN - Guía Completa

## 📋 Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura](#arquitectura)
3. [Base de Datos](#base-de-datos)
4. [Webhooks](#webhooks)
5. [Sistema de Monitoreo](#sistema-de-monitoreo)
6. [Dataset AI](#dataset-ai)
7. [Guía de Uso](#guía-de-uso)

---

## 🎯 Resumen Ejecutivo

Sistema completo de chatbot con IA para atención al cliente en WhatsApp Business.

### Tecnologías
- **OpenAI GPT-4o-mini** (150 tokens, 3.5s timeout)
- **Neon PostgreSQL** (5 tablas, 10 índices, 2s timeout)
- **WhatsApp Business API** (5 webhooks)
- **Vercel Serverless** (8/12 funciones, 66% capacidad)

### Capacidades
✅ 16 tratamientos con precios exactos ($10-$250 USD)
✅ Agendamiento con Google Calendar
✅ Derivación automática médico/ingeniero
✅ 5 tipos de webhooks procesados
✅ Panel de monitoreo en tiempo real
✅ Fallback inteligente sin IA

---

## 🏗️ Arquitectura

```
WhatsApp User
    │
    ▼
api/whatsapp-chatbot.js (< 10s Vercel)
    │
    ├─► Neon DB (2s) ─► Fallback Storage
    ├─► OpenAI (3.5s) ─► Intent Detection
    └─► WhatsApp API (5s) ─► AbortController
```

### Timeouts por Capa
| Componente | Timeout | Fallback |
|------------|---------|----------|
| Neon DB | 2s | In-memory storage |
| OpenAI API | 3.5s | Respuestas predefinidas |
| WhatsApp API | 5s | Retry con AbortController |
| Vercel Function | 10s | N/A (límite hard) |

---

## 💾 Base de Datos - 5 Tablas

### 1️⃣ chat_conversations
```sql
- session_id (UNIQUE)
- phone_number
- total_messages
- is_active
- preferences (JSONB) ⭐ NUEVO
- created_at, last_message_at
```

### 2️⃣ chat_messages
```sql
- session_id (FK)
- role (user/assistant)
- content (TEXT)
- tokens_used
- message_id
- timestamp
```

### 3️⃣ chatbot_tracking ⭐ NUEVO
```sql
- session_id
- event_type (VARCHAR)
- event_data (JSONB)
- timestamp
```

### 4️⃣ chatbot_templates ⭐ NUEVO
```sql
- template_id (UNIQUE)
- category
- status
- template_data (JSONB)
- created_at, updated_at
```

### 5️⃣ chatbot_app_states ⭐ NUEVO
```sql
- state_type
- state (JSONB)
- timestamp
```

### Índices (10)
```sql
idx_session_messages (session_id, timestamp)
idx_active_sessions (is_active, last_message_at)
idx_tracking_session (session_id, timestamp) ⭐
idx_tracking_type (event_type, timestamp) ⭐
idx_app_states_timestamp (timestamp) ⭐
idx_conversation_preferences USING GIN (preferences) ⭐
```

---

## 🔔 Webhooks - 5 Tipos

### 1. message_echoes
📱 **Propósito:** Sincronización con Business Manager
```javascript
// Mensajes enviados desde panel web
is_echo === true → Tracking
```

### 2. tracking_events  
📊 **Propósito:** Análisis de interacciones
```javascript
// Clics, vistas, engagement
tracking_data.event_type → Save to DB
```

### 3. template_category_update
📋 **Propósito:** Gestión de plantillas marketing
```javascript
// Estado: approved/rejected
message_template_status_update → Upsert
```

### 4. smb_app_state_sync
🔄 **Propósito:** Estado online/offline
```javascript
// WhatsApp Business status
app_state.status → Save state
```

### 5. user_preferences
⚙️ **Propósito:** Preferencias de usuario
```javascript
// Notificaciones, idioma, marketing
preferences → Update conversation
```

---

## 📊 Sistema de Monitoreo

### API: `/api/chatbot-monitor`

#### Endpoints (6)
```bash
GET /                              # Estadísticas generales
GET ?action=webhooks               # Conteo por tipo
GET ?action=tracking&limit=50      # Eventos recientes
GET ?action=templates              # Estado plantillas
GET ?action=preferences            # Análisis usuarios
GET ?action=conversations&limit=20 # Lista conversaciones
```

### Panel: `/chatbot-monitor.html`

**Características:**
- 📊 4 tarjetas de métricas
- 🔄 Actualización en tiempo real
- 📈 Tablas interactivas
- 💬 Conversaciones activas
- ⚙️ Preferencias de usuarios

**Métricas Disponibles:**
- Total conversaciones
- Mensajes últimos 7 días
- Eventos de tracking
- Estado del sistema (Neon + OpenAI)

---

## 🎓 Dataset AI - 16 Tratamientos

### Catálogo Completo

| Tratamiento | Precio USD | Duración | Categoría |
|-------------|------------|----------|-----------|
| Consulta + escáner | $10 | 30 min | Evaluación |
| Limpieza facial | $25 | 90 min | Limpieza |
| Limpieza + crio | $30 | 90 min | Limpieza |
| Microneedling | $30 | 60 min | Regeneración |
| PRP | $30 | 45 min | Regeneración |
| Exosomas | $130 | 60 min | Regeneración |
| Bioestimuladores | $250 | 45 min | Regeneración |
| Láser CO2 | $150 | 90 min | Láser |
| IPL | $25 | 60 min | Láser |
| Hollywood peel | $35 | 90 min | Láser |
| Eliminación tatuaje | $15+ | 45-60 min | Láser |
| HIFU full face | $60 | 120 min | Avanzado |
| Relleno labios | $160 | 60 min | Avanzado |
| Despigmentante | $30 | 90 min | Avanzado |

### Protocolo de Atención

```
┌─────────────────────────────────┐
│ 1. SALUDO                       │
│ "Hola, soy el asistente BIOSKIN"│
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ 2. CONSULTA                     │
│ → Info básica (precio + tiempo) │
│ → ¿Más detalles?                │
│ → Procedimiento + requisitos    │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ 3. AGENDAMIENTO                 │
│ → Nombre, teléfono, correo      │
│ → Check Google Calendar         │
│ → Confirmar + Email + WhatsApp  │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ 4. DERIVACIÓN (si necesario)    │
│ → Médico: Dra. Creamer          │
│ → Técnico: Ing. Larrea          │
└─────────────────────────────────┘
```

### Ejemplos de Respuestas

**Saludo:**
> "Hola, gracias por contactar a BIOSKIN Salud & Estética. Soy el asistente virtual. ¿En qué puedo ayudarle hoy? 🌟"

**Consulta Tratamiento:**
> "Microneedling: Estimulación de colágeno para mejorar textura y cicatrices. Precio: $30 USD, duración 60 min. ¿Desea más detalles? 💉"

**Detalles:**
> "Procedimiento mínimamente invasivo que estimula colágeno. Requisitos: Evitar AINEs 48h antes, no exposición solar. ¿Qué día le acomoda? 📅"

---

## 🚀 Guía de Uso

### Acceder al Monitor

**Local:**
```
http://localhost:3000/chatbot-monitor.html
```

**Producción:**
```
https://saludbioskin.vercel.app/chatbot-monitor.html
```

### Consultar API

**PowerShell:**
```powershell
# Estadísticas generales
Invoke-RestMethod "https://saludbioskin.vercel.app/api/chatbot-monitor"

# Webhooks procesados
Invoke-RestMethod "https://saludbioskin.vercel.app/api/chatbot-monitor?action=webhooks"

# Conversaciones recientes
Invoke-RestMethod "https://saludbioskin.vercel.app/api/chatbot-monitor?action=conversations&limit=10"
```

**cURL:**
```bash
# Estadísticas
curl https://saludbioskin.vercel.app/api/chatbot-monitor

# Tracking events
curl "https://saludbioskin.vercel.app/api/chatbot-monitor?action=tracking&limit=50"
```

### Interpretar Respuestas

**Ejemplo JSON:**
```json
{
  "success": true,
  "timestamp": "2025-11-14T23:30:00Z",
  "data": {
    "conversations": {
      "total": 45,
      "active": 12,
      "last24h": 8,
      "avgMessages": "4.23"
    },
    "messages": {
      "last7days": 187
    },
    "tracking": {
      "last7days": 23
    }
  }
}
```

**Interpretación:**
- ✅ 45 conversaciones totales registradas
- ✅ 12 conversaciones activas ahora
- ✅ 8 nuevas conversaciones en últimas 24h
- ✅ Promedio 4.23 mensajes por conversación
- ✅ 187 mensajes en última semana
- ✅ 23 eventos de tracking capturados

---

## 📈 Métricas del Sistema

### Uso de Recursos

**Funciones Vercel: 8/12 (66%)**
```
✅ whatsapp-chatbot.js      (webhook principal)
✅ chatbot-stats.js          (estadísticas básicas)
✅ chatbot-monitor.js ⭐     (monitoreo avanzado)
✅ calendar.js               (Google Calendar)
✅ blogs.js                  (gestión contenido)
✅ analytics.js              (métricas sitio)
✅ sendEmail.js              (notificaciones)
✅ ai-blog/generate-production.js (contenido IA)
```

**Base de Datos Neon:**
- Tamaño: ~15 MB / 512 MB (3%)
- Queries promedio: 593ms
- Timeout configurado: 2s

**OpenAI:**
- Modelo: gpt-4o-mini
- Tokens: 150 max/response
- Response time: ~2s promedio
- Timeout: 3.5s

### Rendimiento

| Métrica | Valor | Estado |
|---------|-------|--------|
| Tiempo respuesta total | ~3.2s | ✅ OK |
| DB query time | ~593ms | ✅ OK |
| OpenAI response | ~2s | ✅ OK |
| WhatsApp send | ~1s | ✅ OK |
| Uptime | 99.9% | ✅ OK |

---

## 🔧 Mantenimiento

### Tareas Diarias
- [ ] Revisar panel de monitoreo
- [ ] Verificar conversaciones activas
- [ ] Confirmar estado Neon PostgreSQL

### Tareas Semanales
- [ ] Analizar webhooks procesados
- [ ] Revisar preferencias de usuarios
- [ ] Verificar plantillas actualizadas
- [ ] Limpiar conversaciones inactivas > 30 días

### Tareas Mensuales
- [ ] Backup de base de datos
- [ ] Análisis de métricas de uso
- [ ] Optimización de prompts IA
- [ ] Actualización de dataset

---

## 🐛 Troubleshooting

### Error: Timeout en Neon
```
⚠️ Neon timeout activando fallback
```
**Solución:** Sistema automáticamente usa in-memory storage

### Error: OpenAI no responde
```
❌ OpenAI timeout, usando respuestas predefinidas
```
**Solución:** Sistema detecta intención y responde con fallback

### Error: Webhook no procesa
```
⚠️ Webhook ignorado: tipo no soportado
```
**Solución:** Verificar tipo de webhook en dashboard Meta

---

## 📞 Contacto

**Equipo Técnico:**
- Ing. Rafael Larrea - Desarrollo y mantenimiento
- Dra. Daniela Creamer - Contenido médico

**Soporte:**
- WhatsApp: +593969890689
- Email: salud.bioskin@gmail.com

---

**Última actualización:** 14 de Noviembre de 2025  
**Versión:** 2.0 (Sistema Completo)  
**Estado:** ✅ Producción Activa
