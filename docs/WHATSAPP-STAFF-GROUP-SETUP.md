# Configuración del Grupo de Staff en WhatsApp

## 📋 Descripción General

El sistema de notificaciones centraliza todas las comunicaciones importantes del bot hacia el equipo de BIOSKIN mediante un **grupo de WhatsApp** con los 3 números clave:

- 🤖 **+593988148890** - Bot BIOSKIN (Salomé)
- 👨‍💼 **+593997061321** - Ing. Rafael Larrea
- 👩‍⚕️ **+593998653732** - Dra. Daniela Creamer

## 🎯 Eventos Notificados al Grupo

El sistema envía notificaciones automáticas para:

### 1. **Nuevas Citas Agendadas** 🗓️
Cuando un paciente agenda una cita exitosamente:
```
🗓️ NUEVA CITA AGENDADA

👤 Paciente: [Nombre completo]
📱 Teléfono: [Número]
💆 Tratamiento: [Servicio solicitado]
📅 Fecha: [Día completo]
⏰ Hora: [Hora exacta]

💬 Chat directo: https://wa.me/[numero]
```

### 2. **Derivaciones a Doctora** 👨‍⚕️
Cuando el bot detecta necesidad de evaluación médica:
```
👨‍⚕️ DERIVACIÓN A DOCTORA

👤 Paciente: [Nombre]
📱 Teléfono: [Número]
🔍 Motivo: [Razón de derivación]
📝 Resumen conversación:
[Últimos 3 intercambios]

💬 Chat directo: https://wa.me/[numero]
```

### 3. **Consultas Importantes** ❓
Cuando el bot no puede resolver una consulta:
```
❓ CONSULTA IMPORTANTE

👤 Paciente: [Nombre]
📱 Teléfono: [Número]
💬 Consulta: [Pregunta del paciente]
🤖 Respuesta bot: [Respuesta proporcionada]

💬 Chat directo: https://wa.me/[numero]
```

## 🔧 Configuración Técnica

### Paso 1: Crear el Grupo de WhatsApp

1. **Abrir WhatsApp Business** en el número +593988148890 (Bot)
2. **Crear nuevo grupo** con nombre: "BIOSKIN Staff - Notificaciones"
3. **Agregar miembros:**
   - +593997061321 (Rafael)
   - +593998653732 (Daniela)
4. **Configurar grupo:**
   - ✅ Solo administradores pueden enviar mensajes
   - ✅ Bot debe ser administrador del grupo

### Paso 2: Obtener el Group ID

El **Group ID** es esencial para que el sistema envíe mensajes al grupo.

**Formato del Group ID:**
```
593988148890-[timestamp]@g.us
```

**Métodos para obtenerlo:**

#### Método 1: Mediante WhatsApp Web Console (Recomendado)
1. Abrir WhatsApp Web en Chrome
2. Ir al grupo "BIOSKIN Staff - Notificaciones"
3. Abrir DevTools (F12)
4. En la consola ejecutar:
```javascript
// Obtener el chat actual
const chat = Store.Chat.getModelsArray().find(c => c.name === 'BIOSKIN Staff - Notificaciones');
console.log('Group ID:', chat.id._serialized);
```

#### Método 2: Mediante API de WhatsApp Business
```bash
curl -X GET \
  'https://graph.facebook.com/v18.0/{phone-number-id}/chats' \
  -H 'Authorization: Bearer {access-token}'
```

Buscar en la respuesta el grupo con el nombre correspondiente.

### Paso 3: Configurar Variable de Entorno

**Local (.env):**
```env
WHATSAPP_STAFF_GROUP_ID=593988148890-1234567890@g.us
```

**Producción (Vercel):**
1. Ir a [Vercel Dashboard](https://vercel.com/rafaellarrrea/bioskin-web)
2. Settings → Environment Variables
3. Agregar nueva variable:
   - **Name:** `WHATSAPP_STAFF_GROUP_ID`
   - **Value:** `593988148890-1234567890@g.us` (usar el ID real obtenido)
   - **Scope:** Production, Preview, Development

4. **Re-deploy** para aplicar cambios

### Paso 4: Verificar Funcionamiento

Una vez configurado, el sistema:

1. ✅ Enviará notificaciones al **grupo** (si `WHATSAPP_STAFF_GROUP_ID` existe)
2. ⚠️ Usará **fallback a números individuales** si la variable no está configurada

**Test de verificación:**
- Agendar una cita de prueba desde el bot
- Verificar que el mensaje llegue al grupo
- Confirmar que el enlace directo al paciente funcione

## 📊 Arquitectura del Sistema

### Función Principal: `notifyStaffGroup()`

**Ubicación:** `api/whatsapp-chatbot.js`

**Parámetros:**
- `eventType`: Tipo de evento (`'appointment'`, `'referral'`, `'consultation'`)
- `data`: Objeto con datos del evento
- `patientPhone`: Número del paciente

**Funcionamiento:**
```javascript
// Si Group ID existe → enviar al grupo
if (STAFF_GROUP_ID) {
  await sendWhatsAppMessage(STAFF_GROUP_ID, message);
}
// Si no → enviar a números individuales (fallback)
else {
  for (const number of STAFF_NUMBERS_FALLBACK) {
    await sendWhatsAppMessage(number, message);
  }
}
```

### Integración en Flujos

#### 1. Agendamiento de Citas
**Archivo:** `lib/appointment-state-machine.js`
```javascript
// Después de crear cita exitosamente
await notifyStaffGroup('appointment', {
  name: this.data.name,
  phone: this.data.phone,
  service: this.data.service,
  date: this.data.date,
  hour: this.data.time
}, patientPhone);
```

#### 2. Derivaciones (Futuro)
**Archivo:** `lib/chatbot-ai-service.js`
```javascript
// Cuando se detecta necesidad de derivación
await notifyStaffGroup('referral', {
  name: patientName,
  reason: 'Evaluación médica personalizada',
  summary: conversationSummary
}, patientPhone);
```

## 🔐 Seguridad y Privacidad

- ✅ **Grupo cerrado**: Solo administradores envían mensajes
- ✅ **Datos mínimos**: Solo información necesaria para atención
- ✅ **Enlaces directos**: Facilitan comunicación sin exponer datos
- ✅ **Fallback automático**: Sistema robusto ante fallos de configuración

## 🚀 Roadmap de Mejoras

### Próximas Integraciones al Grupo:

1. ✅ **Citas agendadas** (Implementado)
2. 🔄 **Derivaciones a doctora** (En desarrollo)
3. ⏳ **Consultas complejas no resueltas**
4. ⏳ **Cancelaciones de citas**
5. ⏳ **Recordatorios de citas próximas**
6. ⏳ **Resumen diario de actividad del bot**

## 📝 Notas Importantes

- El **Group ID es único** y permanente para cada grupo
- Si se elimina y recrea el grupo, el **ID cambiará**
- El bot debe estar **agregado al grupo** para poder enviar mensajes
- WhatsApp Business API requiere que el bot sea **participante activo** del grupo
- Si el grupo se llena (límite 257 participantes), crear un grupo nuevo

## 🆘 Troubleshooting

### Problema: "Notificaciones no llegan al grupo"

**Soluciones:**
1. Verificar que `WHATSAPP_STAFF_GROUP_ID` esté configurado correctamente
2. Confirmar que el bot esté agregado al grupo
3. Verificar que el bot tenga permisos de administrador
4. Re-deploy en Vercel después de cambiar variables de entorno

### Problema: "Mensajes llegan duplicados (grupo + individuales)"

**Causa:** El sistema está usando fallback aunque el Group ID existe

**Solución:** Verificar que la variable no sea `'undefined'` (string) sino un valor válido

### Problema: "Error 'Chat not found'"

**Causa:** El Group ID es incorrecto o el bot no es miembro

**Solución:** 
1. Verificar el Group ID obtenido
2. Confirmar que el bot esté en el grupo
3. Intentar enviar mensaje de prueba manualmente

## 📞 Contacto de Soporte

Para dudas técnicas sobre la configuración:
- **Desarrollador:** Rafael Larrea
- **WhatsApp:** +593997061321
- **GitHub:** @rafaellarrea/bioskin_web

---

**Última actualización:** 18 de noviembre, 2025
**Versión:** 1.0.0
