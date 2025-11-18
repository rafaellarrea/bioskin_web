# Guía Completa: Grupos de WhatsApp con Cloud API - BIOSKIN

## 📚 Documentación Oficial de Meta

- [Getting Started with Groups](https://developers.facebook.com/docs/whatsapp/cloud-api/groups/getting-started)
- [Create Group Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/groups/reference#create-group)

---

## ✅ Capacidades Confirmadas de la API

Según la documentación oficial, WhatsApp Business Cloud API **SÍ permite**:

| Operación | Disponible | Endpoint |
|-----------|------------|----------|
| **Crear grupos** | ✅ SÍ | `POST /{phone-number-id}/groups` |
| **Agregar participantes** | ✅ SÍ | Al crear o después |
| **Enviar mensajes** | ✅ SÍ | `POST /{phone-number-id}/messages` |
| **Obtener info de grupo** | ✅ SÍ | `GET /{group-id}` |
| **Actualizar info** | ✅ SÍ | `PATCH /{group-id}` |
| **Eliminar grupos** | ✅ SÍ | `DELETE /{group-id}` |

---

## 🚀 Implementación: Creación Automática del Grupo

### **Paso 1: Script de Creación del Grupo**

El grupo se puede crear programáticamente usando la API:

```javascript
// scripts/create-staff-group.js

async function createStaffGroup() {
  const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  // Crear el grupo
  const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/groups`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject: 'BIOSKIN Staff - Notificaciones',
      participants: [
        '+593997061321', // Rafael Larrea
        '+593998653732'  // Daniela Creamer
      ]
    })
  });

  const data = await response.json();
  
  if (data.id) {
    console.log('✅ Grupo creado exitosamente');
    console.log('📋 Group ID:', data.id);
    console.log('👥 Participantes agregados:', data.participants?.length || 2);
    
    // Guardar el Group ID en variable de entorno
    console.log('\n📝 Agregar a Vercel Environment Variables:');
    console.log(`WHATSAPP_STAFF_GROUP_ID=${data.id}`);
    
    return data.id;
  } else {
    console.error('❌ Error creando grupo:', data);
    throw new Error(data.error?.message || 'Error desconocido');
  }
}
```

### **Paso 2: Verificación del Grupo**

```javascript
async function getGroupInfo(groupId) {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${groupId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  const data = await response.json();
  console.log('Información del grupo:', {
    id: data.id,
    subject: data.subject,
    participants: data.participants,
    creation_time: new Date(data.creation_time * 1000)
  });
}
```

### **Paso 3: Enviar Mensajes al Grupo**

```javascript
async function sendMessageToGroup(groupId, message) {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'group',  // ⚠️ IMPORTANTE: Especificar tipo
        to: groupId,
        type: 'text',
        text: {
          body: message
        }
      })
    }
  );
  
  return await response.json();
}
```

---

## 🔧 Configuración Completa del Sistema

### **Opción A: Creación Manual (Recomendado para Primera Vez)**

1. **Ejecutar script de creación:**
```bash
node scripts/create-staff-group.js
```

2. **Copiar el Group ID generado**

3. **Configurar en Vercel:**
```
Dashboard → Settings → Environment Variables
Name: WHATSAPP_STAFF_GROUP_ID
Value: [Group ID obtenido]
```

4. **Re-deploy**

### **Opción B: Creación Automática en Primera Ejecución**

El sistema puede crear el grupo automáticamente si no existe:

```javascript
// En api/whatsapp-chatbot.js (inicio)

async function ensureStaffGroupExists() {
  let groupId = process.env.WHATSAPP_STAFF_GROUP_ID;
  
  if (!groupId) {
    console.log('🔧 Group ID no encontrado, creando grupo...');
    groupId = await createStaffGroup();
    
    // ⚠️ IMPORTANTE: Guardar en variable de entorno
    console.log('⚠️ Configurar manualmente en Vercel:');
    console.log(`WHATSAPP_STAFF_GROUP_ID=${groupId}`);
  }
  
  return groupId;
}
```

---

## 📋 Estructura del Sistema de Notificaciones

### **1. Función Principal: `notifyStaffGroup()`**

```javascript
async function notifyStaffGroup(eventType, data, patientPhone) {
  const groupId = await ensureStaffGroupExists();
  
  const message = buildNotificationMessage(eventType, data, patientPhone);
  
  try {
    const result = await sendMessageToGroup(groupId, message);
    console.log('✅ Notificación enviada al grupo staff');
    return result;
  } catch (error) {
    console.error('❌ Error enviando al grupo:', error);
    // Fallback: enviar individualmente
    return await sendToStaffIndividually(message);
  }
}
```

### **2. Tipos de Mensajes**

#### **Citas Agendadas**
```javascript
const message = `🗓️ *NUEVA CITA AGENDADA*\n\n` +
  `👤 *Paciente:* ${data.name}\n` +
  `📱 *Teléfono:* ${patientPhone}\n` +
  `💆 *Tratamiento:* ${data.service}\n` +
  `📅 *Fecha:* ${dateFormatted}\n` +
  `⏰ *Hora:* ${data.hour}\n\n` +
  `💬 *Chat directo:* https://wa.me/${patientPhone}`;
```

#### **Derivaciones**
```javascript
const message = `👨‍⚕️ *DERIVACIÓN A DOCTORA*\n\n` +
  `👤 *Paciente:* ${data.name}\n` +
  `📱 *Teléfono:* ${patientPhone}\n` +
  `🔍 *Motivo:* ${data.reason}\n` +
  `📝 *Resumen:* ${data.summary}\n\n` +
  `💬 *Chat directo:* https://wa.me/${patientPhone}`;
```

---

## 🎯 Ventajas de la Creación Automática

| Ventaja | Descripción |
|---------|-------------|
| **Sin intervención manual** | El grupo se crea al primer deploy |
| **Consistencia** | Mismo nombre y configuración siempre |
| **Escalabilidad** | Fácil replicar en múltiples entornos |
| **Recuperación** | Si el grupo se elimina, se recrea automáticamente |
| **Testing** | Grupos de prueba se crean fácilmente |

---

## 🛡️ Consideraciones de Seguridad

### **Permisos Requeridos**

En [Meta Business Settings](https://business.facebook.com/settings), verificar:
- ✅ `whatsapp_business_management`
- ✅ `whatsapp_business_messaging`
- ✅ `business_management` (para crear grupos)

### **Límites de la API**

- **Máximo 256 participantes** por grupo
- **Rate limits**: 80 mensajes por segundo (Standard)
- **Creación de grupos**: Sin límite específico documentado

---

## 🧪 Testing del Sistema

### **Script de Prueba Completo**

```bash
# 1. Crear el grupo (primera vez)
node scripts/create-staff-group.js

# 2. Verificar grupo creado
node scripts/verify-staff-group.js

# 3. Enviar mensaje de prueba
node scripts/test-staff-notifications.js appointment

# 4. Ver información del grupo
node scripts/get-group-info.js
```

### **Checklist de Verificación**

- [ ] Variables de entorno configuradas
- [ ] Grupo creado exitosamente
- [ ] Group ID guardado en Vercel
- [ ] Rafael (+593997061321) está en el grupo
- [ ] Daniela (+593998653732) está en el grupo
- [ ] Bot puede enviar mensajes al grupo
- [ ] Mensajes llegan correctamente
- [ ] Fallback funciona si el grupo falla

---

## 📊 Flujo Completo del Sistema

```
┌─────────────────────────────────────────┐
│   Usuario agenda cita / consulta        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Webhook recibe evento                 │
│   (api/whatsapp-chatbot.js)             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   notifyStaffGroup(eventType, data)     │
│                                          │
│   1. Verificar si existe Group ID       │
│   2. Si no existe → Crear grupo         │
│   3. Construir mensaje según tipo       │
│   4. Enviar al grupo                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   WhatsApp Cloud API                    │
│   POST /messages (recipient_type: group)│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Grupo "BIOSKIN Staff - Notificaciones"│
│   - Bot (administrador)                 │
│   - Rafael                              │
│   - Daniela                             │
└─────────────────────────────────────────┘
```

---

## 🔄 Mantenimiento del Grupo

### **Agregar Nuevos Participantes**

```javascript
async function addParticipantToGroup(groupId, phoneNumber) {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${groupId}/participants`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        participants: [phoneNumber]
      })
    }
  );
  return await response.json();
}
```

### **Actualizar Nombre del Grupo**

```javascript
async function updateGroupSubject(groupId, newSubject) {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${groupId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: newSubject
      })
    }
  );
  return await response.json();
}
```

### **Eliminar Grupo (si es necesario)**

```javascript
async function deleteGroup(groupId) {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${groupId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  return await response.json();
}
```

---

## 🚨 Troubleshooting

### **Error: "Insufficient permissions"**

**Solución:**
1. Ir a [Meta Business Settings](https://business.facebook.com/settings)
2. Verificar permisos de la app
3. Solicitar `business_management` si falta

### **Error: "Group not found"**

**Solución:**
1. Verificar que el Group ID es correcto
2. Ejecutar script de verificación
3. Recrear grupo si fue eliminado

### **Error: "Participant phone number is invalid"**

**Solución:**
1. Verificar formato: `+593997061321` (con `+` y código de país)
2. Verificar que los números tienen WhatsApp activo
3. Verificar que los números no tienen restricciones

---

## 📝 Próximos Pasos

1. ✅ Ejecutar `scripts/create-staff-group.js`
2. ✅ Guardar Group ID en Vercel
3. ✅ Probar con `scripts/test-staff-notifications.js`
4. ✅ Verificar recepción de mensajes
5. ✅ Integrar con flujo de agendamiento existente

---

**Última actualización:** 18 de noviembre, 2025  
**Versión:** 2.0.0 (Corregido con API real)
