# Sistema de Máquina de Estados - Chatbot WhatsApp

## 🎯 Objetivo

Implementar un flujo de agendamiento **estructurado, secuencial y sin redundancias** que garantice:

1. ✅ **Un solo dato a la vez**: El bot pregunta UNA sola cosa y espera respuesta
2. ✅ **Validación estricta**: No avanza al siguiente paso sin dato válido
3. ✅ **Sin repeticiones**: Cada dato se solicita UNA sola vez
4. ✅ **Flujo claro**: El usuario siempre sabe en qué paso está

## 📊 Estados de la Máquina

```
IDLE (Estado inicial - sin agendamiento activo)
  ↓ Usuario dice "quiero agendar"
  ↓ Bot ofrece: 1) Link directo 2) Guía paso a paso
  ↓ Usuario elige opción 2
  
AWAITING_DATE (Esperando fecha)
  ↓ Usuario indica: "mañana" / "viernes" / "19/11"
  ↓ Sistema valida fecha (no domingo, no pasada)
  ↓ Muestra horarios disponibles del día
  
AWAITING_TIME (Esperando hora)
  ↓ Usuario indica: "3pm" / "15:00" / "tres de la tarde"
  ↓ Sistema verifica disponibilidad en Google Calendar
  ↓ Si ocupado → sugiere alternativas (permanece en este estado)
  ↓ Si disponible → avanza
  
AWAITING_NAME (Esperando nombre completo)
  ↓ Usuario indica: "María González"
  ↓ Sistema valida (mínimo 2 palabras con letras)
  
AWAITING_SERVICE (Esperando tratamiento)
  ↓ Usuario indica: "Limpieza facial" / "HIFU" / "Consulta"
  ↓ Sistema busca en catálogo o acepta texto libre
  
CONFIRMING (Esperando confirmación)
  ↓ Bot muestra resumen completo
  ↓ Usuario responde: "sí" o "no"
  ↓ Si "sí" → crea cita en Calendar → COMPLETE
  ↓ Si "no" → reinicia (vuelve a IDLE)
  
COMPLETE (Cita creada exitosamente)
  ↓ Bot muestra confirmación
  ↓ Sistema resetea la máquina
  ↓ Vuelve a IDLE
```

## 🔧 Implementación Técnica

### Archivo: `lib/appointment-state-machine.js`

**Clase principal**: `AppointmentStateMachine`

**Métodos clave**:
- `start(phone)` - Inicia el flujo de agendamiento
- `processMessage(userMessage)` - Procesa mensaje según estado actual
- `reset()` - Reinicia la máquina de estados
- `isActive()` - Verifica si hay proceso activo
- `serialize()` / `deserialize()` - Persistencia del estado

**Funciones auxiliares**:
- `getStateMachine(sessionId, phone)` - Obtiene/crea máquina para sesión
- `saveStateMachine(sessionId, machine)` - Guarda estado
- `deleteStateMachine(sessionId)` - Elimina máquina

### Integración en `api/whatsapp-chatbot.js`

```javascript
// Obtener máquina de estados
const stateMachine = getStateMachine(sessionId, from);

// CASO 1: Usuario quiere iniciar agendamiento
if (intent === 'appointment' && stateMachine.state === APPOINTMENT_STATES.IDLE) {
  if (wantsGuidance) {
    const result = stateMachine.start(from);
    directResponse = result.message;
  } else {
    // Ofrecer opciones
    directResponse = `1️⃣ Link directo\n2️⃣ Guía paso a paso`;
  }
}

// CASO 2: Ya hay flujo activo
else if (stateMachine.isActive()) {
  const result = await stateMachine.processMessage(userMessage);
  directResponse = result.message;
  
  if (result.completed) {
    stateMachine.reset();
  }
}
```

## 🚫 Separación de Responsabilidades

### IA (chatbot-ai-service.js)
**SOLO responde**:
- ✅ Saludos generales
- ✅ Preguntas sobre tratamientos
- ✅ Precios y promociones
- ✅ Información de la clínica
- ✅ Consultas no relacionadas con agendamiento

**NO debe**:
- ❌ Pedir fecha/hora/nombre/tratamiento
- ❌ Validar disponibilidad
- ❌ Intentar crear citas
- ❌ Guiar el proceso de agendamiento

### Máquina de Estados (appointment-state-machine.js)
**TOMA CONTROL cuando**:
- ✅ Usuario elige "guía paso a paso"
- ✅ Hay un estado activo (AWAITING_*)

**Responsabilidades**:
- ✅ Solicitar datos uno a la vez
- ✅ Validar cada entrada del usuario
- ✅ Verificar disponibilidad con Calendar
- ✅ Crear cita cuando tiene todos los datos
- ✅ Manejar errores y reintentos

## 📝 Flujo de Usuario Ideal

**Ejemplo exitoso**:

```
Usuario: "Quiero agendar una cita"
Bot: "¡Perfecto! Puedo ayudarte de dos formas:
      1️⃣ Agenda directamente aquí: [link]
      2️⃣ Te guío paso a paso
      ¿Cuál prefieres?"

Usuario: "Guíame tú"
Bot: "¡Perfecto! ¿Qué día te gustaría venir?"

Usuario: "Mañana"
Bot: "Perfecto, el 19 de noviembre tenemos disponibilidad 😊
     🌅 Mañana: 09:00, 10:00, 11:00
     ☀️ Tarde: 14:00, 15:00, 16:00
     ¿Qué hora prefieres?"

Usuario: "3pm"
Bot: "¡Excelente! ✅
     📅 Martes 19 de noviembre
     ⏰ 15:00
     ¿Cuál es tu nombre completo?"

Usuario: "María González"
Bot: "Perfecto, María 😊
     ¿Qué tratamiento deseas?"

Usuario: "Limpieza facial"
Bot: "Perfecto, resumiendo tu cita:
     👤 María González
     📅 Martes 19 de noviembre, 2025
     ⏰ 15:00
     💆 Limpieza facial
     ¿Confirmo tu cita? (sí/no)"

Usuario: "Sí"
Bot: "🎉 ¡Cita agendada exitosamente!
     Recibirás un correo de confirmación.
     Te esperamos en BIOSKIN 😊"
```

## 🔄 Manejo de Errores

### Dato inválido
```
Usuario: "ahorita"  (fecha ambigua)
Bot: "No pude entender la fecha 🤔
     ¿Podrías indicarla así?
     • 'Mañana'
     • 'El viernes'
     • '19/11'"
```

### Hora ocupada
```
Usuario: "3pm"
Bot: "Lo siento, las 15:00 ya está ocupado ❌
     Otras opciones disponibles:
     ⏰ 14:00, 16:00, 17:00
     ¿Te sirve alguno?"
```

### Cancelación
```
Usuario: "No confirmo"
Bot: "Sin problema 😊
     ¿Qué deseas cambiar?
     • La fecha
     • La hora
     • El tratamiento
     • Cancelar el agendamiento"
```

## 🎯 Ventajas del Sistema

1. **Predecibilidad**: Flujo siempre sigue el mismo orden
2. **Validación**: Cada dato se valida antes de avanzar
3. **Sin redundancia**: Nunca pregunta dos veces lo mismo
4. **Mantenibilidad**: Lógica centralizada en un solo archivo
5. **Escalabilidad**: Fácil agregar nuevos estados si se necesita
6. **Debugging**: Logs claros del estado actual en cada paso
7. **Persistencia**: Estado se puede guardar/restaurar (preparado para DB)

## 🧪 Testing Manual

Para probar el flujo completo:

1. Enviar: "Quiero agendar"
2. Responder: "Guíame"
3. Indicar fecha válida: "mañana"
4. Indicar hora disponible: "3pm"
5. Proporcionar nombre: "Juan Pérez"
6. Indicar servicio: "Limpieza facial"
7. Confirmar: "sí"

Verificar que:
- ✅ No pide datos dos veces
- ✅ Valida cada entrada
- ✅ Verifica disponibilidad
- ✅ Crea cita en Calendar
- ✅ Envía confirmación

## 🔮 Mejoras Futuras

1. **Persistencia en BD**: Guardar estado en PostgreSQL/Neon
2. **Recordatorios**: Reanudar flujo si usuario abandona
3. **Multi-idioma**: Soporte para inglés
4. **Edición**: Permitir cambiar un solo dato sin reiniciar
5. **Sugerencias inteligentes**: Usar IA para detectar preferencias
6. **Cancelación de citas**: Flujo inverso para cancelar
7. **Reprogramación**: Cambiar cita existente

## 📚 Referencias

- **State Machine Pattern**: https://en.wikipedia.org/wiki/Finite-state_machine
- **Chatbot Design Best Practices**: https://www.smashingmagazine.com/2018/11/chatbot-design-best-practices/
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
