# Fix: Conflicto entre Sistema de Agendamiento y IA

## 🔍 Problema Identificado

Había un **conflicto entre dos sistemas** de agendamiento que causaba que las citas no se agendaran realmente:

### Sistema 1: Máquina de Estados (✅ Correcto)
- Ubicación: `lib/appointment-state-machine.js`
- Funciona: Consulta Google Calendar en tiempo real
- Agenda citas reales en el calendario
- Maneja todo el flujo (fecha → hora → nombre → confirmación)

### Sistema 2: IA con Prompt (❌ Conflicto)
- Ubicación: `lib/chatbot-ai-service.js`
- Problema: También ofrecía opciones de agendamiento
- Resultado: La IA respondía ANTES que la máquina de estados
- Efecto: Usuario veía respuestas pero NO se activaba el sistema real

## 🎯 Situación Anterior

```
Usuario: "Quisiera agendar"
Bot (IA): "¡Con gusto! 😊 Puedo ayudarte de dos formas:
          1️⃣ Agenda directamente aquí: [link]
          2️⃣ Te guío paso a paso
          ¿Cuál prefieres?"

Usuario: "2"
Bot (IA): [Responde con simulación, NO activa máquina de estados]
          ❌ NO consulta calendario real
          ❌ NO agenda realmente
```

## ✅ Solución Implementada

### 1. Mejorar Detección en `whatsapp-chatbot.js`

**Antes:**
```javascript
const wantsGuidance = /(por\s+)?aqu[íi]|opci[óo]n\s*2|la\s*2|gu[íi]a|ayuda/i.test(userMessage);
```

**Ahora:**
```javascript
// Detección más agresiva que captura "2" explícitamente
const wantsGuidance = /(por\s+)?aqu[íi]|opci[óo]n\s*2|la\s*2|gu[íi]a|ayuda|^2$|^\s*2\s*$/i.test(userMessage);

// Patrones adicionales de detección
const botOfferedOptions = lastBotMsg.includes('Puedo ayudarte de dos formas') || 
                          lastBotMsg.includes('¿Cuál prefieres?') ||
                          lastBotMsg.includes('Te ayudo aquí mismo') ||
                          lastBotMsg.includes('reviso horarios disponibles');

// CRÍTICO: Activar skipAI para evitar que IA responda
if (wantsGuidance) {
  skipAI = true; // 🔥 Evitar que la IA interfiera
  const result = stateMachine.start(from);
  directResponse = result.message;
  saveStateMachine(sessionId, stateMachine);
}
```

### 2. Remover Ofertas de IA en `chatbot-ai-service.js`

**Antes (en system prompt):**
```javascript
Cuando el usuario mencione "agendar":
1. RESPONDA EXACTAMENTE: "¡Con gusto! 😊 Puedo ayudarte de dos formas:
   1️⃣ Agenda directamente aquí: [link]
   2️⃣ Te guío paso a paso
   ¿Cuál prefieres?"
```

**Ahora:**
```javascript
Cuando el usuario mencione "agendar":
1. NO responda usted mismo sobre agendamiento
2. NO ofrezca opciones de agendamiento
3. El sistema automático de máquina de estados manejará TODO
4. Simplemente responda: "Con gusto le ayudo a agendar. Un momento por favor..."
```

### 3. Logs Mejorados

Agregados logs detallados para debugging:
```javascript
console.log(`🔍 [StateMachine] Bot ofreció opciones, usuario respondió: guidance=${wantsGuidance}`);
console.log(`🔍 [StateMachine] Mensaje exacto: "${userMessage}"`);
console.log(`🔍 [StateMachine] Último mensaje del bot: "${lastBotMsg.substring(0, 100)}..."`);
console.log('✅ [StateMachine] Usuario eligió guía paso a paso - ACTIVANDO MÁQUINA DE ESTADOS');
```

## 🔄 Flujo Correcto Ahora

```
Usuario: "Quisiera agendar"

Bot (Máquina Estados): "¡Con gusto! 😊 Puedo ayudarte de dos formas:
                       1️⃣ Agenda directamente aquí: [link]
                       2️⃣ Te ayudo aquí mismo (reviso horarios disponibles)
                       ¿Cuál prefieres?"

Usuario: "2"

Bot (Máquina Estados): ✅ ACTIVA sistema de agendamiento real
                       "¡Perfecto! Te ayudo a agendar tu cita 😊
                       ¿Qué día te gustaría venir?"

Usuario: "Jueves próximo"

Bot: [Consulta Google Calendar real]
     "📅 jueves, 28 de noviembre de 2025
     ¿Confirmamos esta fecha?"

Usuario: "Sí"

Bot: [Consulta horarios disponibles en Calendar]
     "Perfecto, el jueves 28 de noviembre tenemos:
     🌅 Mañana: 09:00, 10:00, 11:00
     ☀️ Tarde: 14:00, 15:00, 16:00
     🌙 Noche: 17:00, 18:00
     ¿Qué hora prefieres?"

[Continúa el flujo real de agendamiento...]
```

## 🎯 Prioridades del Sistema

1. **Máquina de Estados** tiene control TOTAL cuando está activa
2. **skipAI = true** previene que la IA interfiera
3. **Detección agresiva** captura "2" explícitamente
4. **IA solo responde** cuando NO hay proceso de agendamiento

## ✅ Verificación

Para confirmar que funciona correctamente:

1. Usuario dice "quiero agendar" → Debe mostrar 2 opciones
2. Usuario responde "2" → Debe activar máquina de estados
3. En logs debe aparecer: `✅ [StateMachine] Usuario eligió guía paso a paso - ACTIVANDO MÁQUINA DE ESTADOS`
4. Bot debe preguntar por fecha (NO simular)
5. Bot debe consultar Google Calendar real
6. Al final debe crear evento real en calendario

## 📝 Fecha de Fix

**26 de noviembre de 2025**

## 🔗 Commits Relacionados

- `c711455` - Fix: Resolver conflicto agendamiento - máquina de estados vs IA
