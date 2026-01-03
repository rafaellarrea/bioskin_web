# 🔐 Variables de Entorno (Environment Variables)

Este documento detalla todas las variables de entorno configuradas en Vercel para el proyecto BIOSKIN. Es crucial mantener esta documentación actualizada para evitar conflictos, duplicados o errores de configuración.

## 🗄️ Base de Datos (Neon PostgreSQL)

| Variable | Descripción | Uso Principal |
|----------|-------------|---------------|
| `INVENTORY_DB_URL` | Connection string para el módulo de Inventario. | **Inventario** (Tablas `inventory_*`) |
| `NEON_DATABASE_URL` | Connection string principal para Fichas Clínicas y Chatbot. | **Fichas Clínicas**, **Chatbot** |
| `POSTGRES_URL` | Fallback para `NEON_DATABASE_URL` e `INVENTORY_DB_URL`. | **Respaldo / Compatibilidad** |

> **Nota**: `INVENTORY_DB_URL` debe apuntar a la misma base de datos que `NEON_DATABASE_URL` si se desea compartir recursos, o a una diferente si se requiere aislamiento. Actualmente ambas apuntan al proyecto `bioskin-clinical-records`.

## 🤖 Inteligencia Artificial

| Variable | Descripción | Uso Principal |
|----------|-------------|---------------|
| `OPENAI_API_KEY` | API Key de OpenAI (GPT-4o-mini). | **Blogs IA**, **Chatbot WhatsApp** |
| `GOOGLE_GEMINI_API_KEY` | API Key de Google Gemini. | **Asistente Interno**, **Análisis Clínico** |
| `NEXT_PUBLIC_PALIGEMMA_API_URL` | URL de API para modelo de visión PaliGemma. | **Análisis de Imágenes** (Frontend) |

## 🔒 Seguridad y Autenticación

| Variable | Descripción | Uso Principal |
|----------|-------------|---------------|
| `CRON_SECRET` | Token secreto para proteger endpoints de Cron Jobs. | **Tareas Programadas** (Agenda, Recordatorios) |
| `ADMIN_SETUP_SECRET` | Token maestro para acceder a la configuración inicial de admin. | **Setup Admin** (`/admin-setup.html`) |
| `ADMIN_USERNAME` | Nombre de usuario para el dashboard administrativo. | **Login Admin** |
| `ADMIN_PASSWORD` | Contraseña para el dashboard administrativo. | **Login Admin** |

## 📅 Integraciones (Google & Email)

| Variable | Descripción | Uso Principal |
|----------|-------------|---------------|
| `GOOGLE_CREDENTIALS_BASE64` | JSON de Service Account codificado en Base64. | **Google Calendar**, **Gmail API** |
| `EMAIL_USER` | Dirección de correo remitente (Gmail). | **Notificaciones Email** |
| `EMAIL_PASS` | App Password de Gmail. | **Notificaciones Email** |
| `EMAIL_TO` | Correo destinatario por defecto para notificaciones internas. | **Alertas Admin** |
| `EMAIL_HOST` | Host SMTP (ej: `smtp.gmail.com`). | **Configuración SMTP** |
| `EMAIL_PORT` | Puerto SMTP (ej: `587`). | **Configuración SMTP** |

## 💬 WhatsApp Business API

| Variable | Descripción | Uso Principal |
|----------|-------------|---------------|
| `WHATSAPP_ACCESS_TOKEN` | Token de acceso permanente (System User). | **Envío Mensajes WhatsApp** |
| `WHATSAPP_APP_SECRET` | App Secret de Meta Developer Console. | **Validación Webhooks** |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de teléfono de WhatsApp. | **Identificador Remitente** |
| `WHATSAPP_VERIFY_TOKEN` | Token personalizado para verificar el Webhook. | **Setup Webhook** |

## 🛠️ Desarrollo y Otros

| Variable | Descripción | Uso Principal |
|----------|-------------|---------------|
| `NGROK_AUTHTOKEN` | Token de autenticación para Ngrok. | **Túneles Locales** (Dev) |
| `BIOSKIN_COLAB_TOKEN` | Token para integración con notebooks de Colab. | **Procesamiento Externo** |

---

## ⚠️ Reglas de Gestión

1.  **No Duplicar**: Antes de agregar una nueva variable, verifica si alguna existente cumple la función.
2.  **Nombres Claros**: Usa prefijos claros (`NEXT_PUBLIC_` para frontend, `ADMIN_` para administración, etc.).
3.  **Secretos**: Nunca commitear valores reales en `.env` o código. Usar Vercel Dashboard.
4.  **Documentación**: Actualizar este archivo al agregar o modificar variables.
