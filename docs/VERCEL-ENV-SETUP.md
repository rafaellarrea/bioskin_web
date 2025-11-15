# Configuración de Variables de Entorno en Vercel

Este documento explica cómo configurar las variables de entorno necesarias para el proyecto BIOSKIN.

## 📋 Variables Actuales

### WhatsApp Business API
```bash
WHATSAPP_VERIFY_TOKEN=bioskin-webhook-verify-token-2024
WHATSAPP_ACCESS_TOKEN=EAA6LTPNfbn4BPZB389qTJtaogvgaf8owJGwRtnCyx5mKoVeGEjiZCfJoIZBGICwYKUszDEG9gm1HZBZBDeymrZBqiDVSxiZBZB9tcpwPSrzp1FSZBzugDl4D8yysD6BLRqMys1TIB8L4p35dhXr4GsvOxNXZANSkxLuxZAK9onESPJMHzdabLZCNZBxZBIb3N9675KkgZDZD
WHATSAPP_PHONE_NUMBER_ID=832596109944880
WHATSAPP_BUSINESS_ACCOUNT_ID=794475663630079
```

### OpenAI
```bash
OPENAI_API_KEY=sk-your-key-here
```

### Neon PostgreSQL
```bash
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...
POSTGRES_USER=username
POSTGRES_HOST=host.neon.tech
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=database_name
```

### Google Services
```bash
GOOGLE_CREDENTIALS_BASE64=base64-encoded-json
EMAIL_USER=salud.bioskin@gmail.com
EMAIL_PASS=app-password
```

### Vercel KV (Redis)
```bash
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=token
```

### Security
```bash
CRON_SECRET=your-cron-secret
```

## 🚀 Cómo Configurar en Vercel CLI

### 1. Instalar Vercel CLI (si no lo tienes)
```bash
npm install -g vercel
```

### 2. Login en Vercel
```bash
vercel login
```

### 3. Enlazar el proyecto
```bash
cd "C:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0"
vercel link
```

### 4. Configurar variables de entorno

**Opción A: Usando Vercel CLI (una por una)**
```bash
# WhatsApp
vercel env add WHATSAPP_ACCESS_TOKEN production
# Pegar: EAA6LTPNfbn4BPZB389qTJtaogvgaf8owJGwRtnCyx5mKoVeGEjiZCfJoIZBGICwYKUszDEG9gm1HZBZBDeymrZBqiDVSxiZBZB9tcpwPSrzp1FSZBzugDl4D8yysD6BLRqMys1TIB8L4p35dhXr4GsvOxNXZANSkxLuxZAK9onESPJMHzdabLZCNZBxZBIb3N9675KkgZDZD

vercel env add WHATSAPP_PHONE_NUMBER_ID production
# Pegar: 832596109944880

vercel env add WHATSAPP_BUSINESS_ACCOUNT_ID production
# Pegar: 794475663630079
```

**Opción B: Usando el Dashboard de Vercel**
1. Ir a https://vercel.com/rafaellarrea/bioskin-web
2. Settings → Environment Variables
3. Agregar cada variable:
   - Name: `WHATSAPP_ACCESS_TOKEN`
   - Value: `EAA6LTPNfbn4BP...` (el token completo)
   - Environment: Production, Preview, Development
4. Repetir para cada variable

### 5. Verificar variables configuradas
```bash
vercel env ls
```

### 6. Redeploy para aplicar cambios
```bash
vercel --prod
```

## 🔍 Verificar Variables en el Código

El código del proyecto usa estas variables:

### `api/whatsapp-chatbot.js`
```javascript
process.env.WHATSAPP_VERIFY_TOKEN      // Token de verificación
process.env.WHATSAPP_ACCESS_TOKEN      // Token de acceso
process.env.WHATSAPP_PHONE_NUMBER_ID   // ID del número
```

### `api/chatbot-manager.js`
```javascript
process.env.WHATSAPP_ACCESS_TOKEN      // Token de acceso
process.env.WHATSAPP_PHONE_NUMBER_ID   // ID del número
```

### `lib/chatbot-ai-service.js`
```javascript
process.env.OPENAI_API_KEY             // API Key de OpenAI
```

### `lib/neon-chatbot-db-vercel.js`
```javascript
process.env.POSTGRES_URL               // URL de conexión Neon
```

## ⚠️ IMPORTANTE: No Duplicar Variables

**Variables que YA ESTÁN configuradas en Vercel:**
- ✅ `WHATSAPP_VERIFY_TOKEN`
- ✅ `WHATSAPP_ACCESS_TOKEN` (verificar si existe)
- ✅ `WHATSAPP_PHONE_NUMBER_ID`
- ✅ `POSTGRES_URL`
- ✅ `OPENAI_API_KEY`

**Variables que DEBES AGREGAR si no existen:**
- ⚠️ `WHATSAPP_BUSINESS_ACCOUNT_ID` (si no está)

## 🧪 Testing Local

Para probar localmente, crea `.env.local`:
```bash
# Copiar de .env.example
cp .env.example .env.local

# Editar con tus valores reales
nano .env.local
```

**NUNCA** commitear `.env.local` al repositorio (ya está en `.gitignore`).

## 📊 Estado Actual

### Variables Configuradas ✅
- OpenAI API Key
- PostgreSQL (Neon)
- Google Credentials
- Email Configuration
- Vercel KV (Redis)
- WhatsApp Verify Token

### Variables por Confirmar ⚠️
- WHATSAPP_ACCESS_TOKEN (verificar si está actualizado)
- WHATSAPP_PHONE_NUMBER_ID (verificar si está actualizado)
- WHATSAPP_BUSINESS_ACCOUNT_ID (agregar si falta)

## 🔄 Actualizar Token de WhatsApp

Si el token expiró o cambió:

```bash
# Actualizar en Vercel
vercel env rm WHATSAPP_ACCESS_TOKEN production
vercel env add WHATSAPP_ACCESS_TOKEN production
# Pegar nuevo token

# Redeploy
vercel --prod
```

## 🐛 Troubleshooting

### Error: "Credenciales de WhatsApp no configuradas"
**Solución:** Verificar que las variables estén en Vercel:
```bash
vercel env ls | grep WHATSAPP
```

### Error: "Invalid access token"
**Solución:** Token expirado o incorrecto, generar nuevo token en Facebook Developers.

### Error: "Phone number not registered"
**Solución:** Verificar que el ID del número sea correcto en la configuración de WhatsApp Business.

## 📚 Referencias

- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- Neon PostgreSQL: https://neon.tech/docs
- OpenAI API: https://platform.openai.com/docs

---

**Última actualización:** 14 de noviembre 2025  
**Proyecto:** BIOSKIN Website 2.0  
**Autor:** Sistema de gestión BIOSKIN
