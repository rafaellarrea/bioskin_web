# Diagnóstico del Bot de WhatsApp

## Estado Actual

### ✅ Configuración Verificada
- Variables de entorno en Vercel: **CORRECTAS**
  - `WHATSAPP_ACCESS_TOKEN` ✅
  - `WHATSAPP_PHONE_NUMBER_ID` ✅
  - `WHATSAPP_VERIFY_TOKEN` ✅
  - `WHATSAPP_APP_SECRET` ✅
  - `OPENAI_API_KEY` ✅
  - `POSTGRES_URL` (Neon DB) ✅

- Código del webhook: **FUNCIONAL**
  - Endpoint: `https://saludbioskin.vercel.app/api/whatsapp-chatbot`
  - Método GET para verificación ✅
  - Método POST para mensajes ✅

### 🔍 Pasos para Diagnosticar

#### 1. Verificar Estado del Webhook en Meta
1. Ir a https://developers.facebook.com/apps
2. Seleccionar tu app de WhatsApp Business
3. Ir a **WhatsApp > Configuración**
4. Verificar que el webhook esté subscrito a:
   - `messages` ✅
   - `message_status` (opcional)

#### 2. Probar el Endpoint de Webhook
Visita en el navegador:
```
https://saludbioskin.vercel.app/api/whatsapp-chatbot
```

Deberías ver una respuesta JSON con:
```json
{
  "status": "ok",
  "message": "WhatsApp Chatbot Webhook",
  "environment": {
    "hasVerifyToken": true,
    "hasAccessToken": true,
    "hasPhoneNumberId": true,
    "hasNeonDb": true,
    "hasOpenAI": true
  }
}
```

#### 3. Revisar Logs en Vercel
1. Ir a https://vercel.com/rafael-larreas-projects/bioskin
2. Click en **Deployments**
3. Seleccionar el último deployment
4. Click en **Functions**
5. Buscar `/api/whatsapp-chatbot`
6. Revisar los logs para ver si hay errores

#### 4. Enviar Mensaje de Prueba
1. Desde tu teléfono, envía un mensaje al número de WhatsApp Business
2. Inmediatamente revisa los logs en Vercel (punto 3)
3. Busca líneas que digan:
   - `🔵 Webhook POST recibido`
   - `📱 Procesando mensaje de WhatsApp`
   - `🤖 Respuesta generada`

#### 5. Problemas Comunes

**Si el bot NO responde:**

A. **Webhook no recibe mensajes**
   - Verificar que el webhook esté activado en Meta
   - Verificar que la URL del webhook sea correcta
   - Revisar que el `VERIFY_TOKEN` coincida

B. **Webhook recibe pero no responde**
   - Revisar logs en Vercel para ver errores
   - Verificar que `WHATSAPP_ACCESS_TOKEN` sea válido
   - Verificar que `WHATSAPP_PHONE_NUMBER_ID` sea correcto

C. **Errores de Base de Datos**
   - Verificar que `POSTGRES_URL` esté configurado
   - Puede estar usando fallback storage en memoria (temporal)

D. **Errores de OpenAI**
   - Verificar que `OPENAI_API_KEY` sea válido
   - El bot debería seguir funcionando con lógica básica sin OpenAI

### 🚀 Soluciones Rápidas

#### Re-verificar Webhook
Si sospechas que el webhook perdió la conexión:

1. Ir a Meta Developers > Tu App > WhatsApp > Configuración
2. Editar la configuración del webhook
3. Volver a poner la URL: `https://saludbioskin.vercel.app/api/whatsapp-chatbot`
4. Volver a poner el Verify Token (el mismo que está en `WHATSAPP_VERIFY_TOKEN`)
5. Guardar y verificar nuevamente

#### Verificar Token de Acceso
El token de WhatsApp puede haber expirado:

1. Ir a Meta Developers > Tu App > WhatsApp > API Setup
2. Copiar el **Token de acceso temporal** o generar un **Token permanente**
3. Actualizar en Vercel:
   ```bash
   vercel env rm WHATSAPP_ACCESS_TOKEN production
   vercel env add WHATSAPP_ACCESS_TOKEN production
   # Pegar el nuevo token
   ```
4. Hacer un nuevo deploy:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

### 📊 Panel de Administración

Ahora puedes monitorear el bot desde React:

1. **Login**: https://saludbioskin.vercel.app/#/admin/login
   - Usuario: `admin`
   - Contraseña: `b10sk1n`

2. **Dashboard**: https://saludbioskin.vercel.app/#/admin
   - Acceso a todas las herramientas

3. **Gestión de Chats**: https://saludbioskin.vercel.app/#/admin/chats
   - Ver conversaciones en tiempo real
   - Responder manualmente
   - Activar notificaciones browser

### 🔧 Archivos Clave

- **Webhook**: `/api/whatsapp-chatbot.js`
- **Configuración Bot**: `/lib/chatbot-ai-service.js`
- **Base de Datos**: `/lib/neon-chatbot-db-vercel.js`
- **Admin Panel**: `/src/pages/AdminChatManager.tsx`

### 📝 Próximos Pasos

1. ✅ Probar el endpoint del webhook
2. ✅ Verificar logs en Vercel
3. ✅ Enviar mensaje de prueba
4. ✅ Revisar configuración en Meta
5. ✅ Actualizar token si es necesario
