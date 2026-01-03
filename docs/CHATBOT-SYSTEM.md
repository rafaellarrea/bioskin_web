# 🤖 Chatbot WhatsApp BIOSKIN - Sistema Completo

## 📋 Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura](#arquitectura)
3. [Base de Datos](#base-de-datos)
4. [Webhooks](#webhooks)
5. [Configuración de Grupos (Staff)](#configuración-de-grupos-staff)
6. [Sistema de Monitoreo](#sistema-de-monitoreo)
7. [Dataset AI](#dataset-ai)

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
| OpenAI | 3.5s | Rule-based response |
| WhatsApp API | 5s | Retry queue |

---

## 🗄️ Base de Datos (Neon PostgreSQL)

### Schema Principal
```sql
-- Conversaciones activas
CREATE TABLE chat_conversations (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE,
    session_id VARCHAR(50),
    mode VARCHAR(20) DEFAULT 'bot', -- 'bot', 'human', 'off'
    context JSONB,
    last_message_at TIMESTAMP
);

-- Historial de mensajes
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES chat_conversations(id),
    role VARCHAR(10) CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🎣 Webhooks

El sistema procesa los siguientes eventos de WhatsApp:

1.  **messages**: Mensajes de texto entrantes (Usuario -> Bot).
2.  **message_status**: Confirmaciones de entrega/lectura.
3.  **group_lifecycle_update**: Creación/actualización de grupos (usado para setup de Staff).

**Endpoint:** `POST /api/whatsapp-chatbot`
**Verificación:** `GET /api/whatsapp-chatbot` (Token: `WHATSAPP_VERIFY_TOKEN`)

---

## 🔧 Configuración de Grupos (Staff)

El sistema utiliza un grupo de WhatsApp para notificar al staff sobre nuevas citas y derivaciones.

### Miembros del Staff
- 🤖 **Bot BIOSKIN** (+593988148890)
- 👨‍💼 **Ing. Rafael Larrea** (+593997061321)
- 👩‍⚕️ **Dra. Daniela Creamer** (+593998653732)

### Proceso de Creación (Método Correcto)

Debido a restricciones de la API de WhatsApp, no se puede agregar participantes directamente. Se debe usar un enlace de invitación.

1.  **Crear Grupo (API)**:
    Enviar `POST /{phone-number-id}/groups` con:
    ```json
    {
      "messaging_product": "whatsapp",
      "subject": "BIOSKIN Staff - Notificaciones",
      "description": "Notificaciones automáticas del bot"
    }
    ```

2.  **Obtener Invite Link**:
    El webhook `group_lifecycle_update` devolverá el `invite_link` tras la creación.

3.  **Unirse**:
    Enviar el enlace a Rafael y Daniela para que se unan manualmente.

4.  **Configurar ID**:
    Una vez creado, obtener el ID del grupo (formato `120363...@g.us`) y configurarlo en Vercel:
    `WHATSAPP_STAFF_GROUP_ID=120363XXXXXXXXX@g.us`

---

## 📊 Sistema de Monitoreo

### Dashboard
Acceso: `/chatbot-monitor.html`
Métricas:
- Estado de servicios (OpenAI, DB, WhatsApp)
- Tiempos de respuesta
- Tasa de error

### Logs
- **Neon DB**: Tabla `chat_logs` para auditoría.
- **Vercel Logs**: `console.log` estructurados para debugging.

---

## 🧠 Dataset AI

El bot utiliza un prompt de sistema (`lib/chatbot-ai-service.js`) enriquecido con:
- Lista de precios actualizada.
- Horarios de atención.
- Reglas de negocio (abono del 50%, cancelaciones).
- Personalidad: "Salomé", asistente amable y profesional.
