# Refactor del Chatbot: Sistema IA-First con Reconocimiento de Opciones Numéricas

**Fecha:** 22 de noviembre de 2025  
**Versión:** v2.0.0-refactor-ia-first

## 🎯 Objetivos del Refactor

Transformar el chatbot en un sistema más humano e inteligente que:
- Entienda respuestas numeradas en múltiples formatos
- Gestione opciones de forma estructurada
- Aplique reglas de negocio automáticamente (precios, consultas)
- Mantenga trazabilidad completa de interacciones

## ✅ Implementaciones Completadas

### 1. Sistema de Opciones Estructuradas (`chatbot-medical-ai-service.js`)

**Cambios realizados:**
- `generateMedicalReply()` ahora retorna estructura completa:
  ```javascript
  {
    responseText: string,                  // Texto natural para el usuario
    options: [                             // Máximo 3 opciones
      {
        id: '1',
        label: 'Agendar tratamiento específico',
        action: 'book_treatment',
        payload: { treatmentId, treatmentPrice }
      }
    ],
    lastQuestionId: string,                // UUID único para tracking
    expiresAt: ISOString,                  // Expiración (default: 10 min)
    metadata: {                            // Contexto adicional
      treatmentId, price, duration,
      consultationIncluded: true
    }
  }
  ```

**Caso de uso:**
```
Usuario: "Me interesa tratamiento antimanchas"
Bot: "El tratamiento despigmentante cuesta $30 y dura 90 min.
      1️⃣ Agendar tratamiento
      2️⃣ Más información
      3️⃣ Hablar con Dra.
      ¿Qué prefiere? (responda con el número)"
```

### 2. Reconocimiento Inteligente de Respuestas (`whatsapp-chatbot.js`)

**Funciones implementadas:**

#### `parseOptionReply(userMessage, lastBotQuestion)`
Reconoce múltiples formatos de respuesta:

| Formato | Ejemplo | Confianza |
|---------|---------|-----------|
| Numérico exacto | `"1"` | 1.0 |
| Patrón con texto | `"opción 1"`, `"la 1"` | 0.95 |
| Palabras numéricas | `"uno"`, `"primera"` | 0.90 |
| Emoji digits | `"1️⃣"` | 1.0 |
| Match fuzzy label | `"agendar tratamiento"` | 0.75 |

**Ejemplo:**
```javascript
// Usuario responde "1", "opción 1", "uno" o "la primera"
parseResult = {
  matched: true,
  optionId: '1',
  confidence: 0.95,
  option: { id: '1', label: '...', action: 'book_treatment', payload: {...} }
}
```

#### `saveLastBotQuestion(sessionId, questionData)`
Persiste la pregunta con opciones:
- **Memoria:** Map en memoria para acceso rápido
- **Persistencia:** `saveTrackingEvent()` para auditoría
- **Expiración:** Verifica timestamp antes de devolver

#### `getLastBotQuestion(sessionId)`
Recupera y valida pregunta guardada:
- Verifica expiración automática (10 min default)
- Limpia preguntas expiradas
- Retorna `null` si no existe o expiró

### 3. Flujo de Agendamiento con Tratamiento Pre-llenado (`appointment-state-machine.js`)

**Modificación de `start(phone, options)`:**
```javascript
start(phone, options = {}) {
  if (options.treatmentId) {
    this.data.service = options.treatmentId;
    this.data.treatmentPrice = options.treatmentPrice;
    this.data.consultationIncluded = true;
    this.data.contextQuestionId = options.contextQuestionId;
  }
  // ... resto del flujo
}
```

**Regla de Precios Implementada:**
```javascript
if (this.data.service && this.data.treatmentPrice) {
  // Usuario confirmó tratamiento
  appointmentPrice = this.data.treatmentPrice;
  priceNote = `Tratamiento ${this.data.service} (consulta incluida)`;
} else {
  // Solo consulta
  appointmentPrice = 11.50;
  priceNote = 'Consulta ($11.50 IVA incluido)';
}
```

### 4. Prompts y Few-Shot Centralizados (`chatbot-ai-service.js`)

**Nuevo objeto `PROMPT_TEMPLATES`:**
```javascript
export const PROMPT_TEMPLATES = {
  systemMedicalPrompt: (catalogText) => `...`,
  systemTechnicalPrompt: (productsContext) => `...`,
  classificationMedicalFewShots: [
    { user: "Me interesa antimanchas", classification: {...} },
    // ... 6 ejemplos
  ],
  classificationTechnicalFewShots: [
    { user: "Mi HIFU no enciende", classification: {...} },
    // ... 6 ejemplos
  ],
  PROMPT_VERSION: "v2.0.0-refactor-ia-first"
};
```

**Beneficios:**
- Consistencia en todos los prompts
- Versionado para iteración
- Few-shot examples reutilizables
- Fácil mantenimiento

### 5. Integración Completa en Orquestador (`whatsapp-chatbot.js`)

**Flujo completo implementado:**

1. **Verificar respuesta a opciones previas:**
   ```javascript
   const lastBotQuestion = getLastBotQuestion(sessionId);
   if (lastBotQuestion) {
     const parseResult = parseOptionReply(userMessage, lastBotQuestion);
     if (parseResult.matched) {
       // Ejecutar acción
       if (action === 'book_treatment') {
         stateMachine.start(from, {
           treatmentId: payload.treatmentId,
           treatmentPrice: payload.treatmentPrice
         });
       }
     }
   }
   ```

2. **Guardar opciones cuando IA las genera:**
   ```javascript
   if (specializedResponse.options) {
     await saveLastBotQuestion(sessionId, {
       id: specializedResponse.lastQuestionId,
       options: specializedResponse.options,
       expiresAt: specializedResponse.expiresAt
     });
   }
   ```

3. **Tracking de eventos:**
   ```javascript
   await saveTrackingEvent(sessionId, 'option_chosen', {
     questionId, optionId, parseConfidence, rawMessage
   });
   ```

### 6. Tests y Documentación

**Tests como comentarios en archivos:**
- `chatbot-medical-ai-service.js`: 5 casos de prueba documentados
- `chatbot-technical-ai-service.js`: 5 casos de prueba documentados
- Incluye inputs esperados y outputs completos

## 📊 Casos de Uso Documentados

### CASO A: Interés en Tratamiento
```
Input: "Me interesa tratamiento antimanchas"
Output: {
  responseText: "El tratamiento despigmentante cuesta $30...",
  options: [
    { id: '1', action: 'book_treatment', payload: { treatmentId, price } },
    { id: '2', action: 'more_info' },
    { id: '3', action: 'transfer_doctor' }
  ]
}
```

### CASO B: Respuesta Numérica
```
Input: "1" (después de CASO A)
Proceso:
1. parseOptionReply detecta opción 1
2. Acción: book_treatment
3. stateMachine.start(phone, { treatmentId, treatmentPrice })
4. Flujo de agendamiento con precio pre-llenado
```

### CASO C: Fuera de Contexto
```
Input: "mañana" (cuando se esperaba 1, 2 o 3)
Output: "Disculpe, ¿se refiere a:
         1. Agendar
         2. Más info
         3. Hablar con Dra.?"
```

### CASO D: Regla de Precios
```
Escenario 1: Agenda tratamiento antimanchas
→ price = $30, note = "Tratamiento (consulta incluida)"

Escenario 2: Solo consulta
→ price = $11.50, note = "Consulta ($11.50 IVA incluido)"
```

## 🔧 Funciones Auxiliares Creadas

### `generateQuestionId()`
Genera IDs únicos para tracking:
```javascript
`q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
```

### `parseOptionReply(userMessage, lastBotQuestion)`
Parser inteligente con prioridades:
1. Match exacto numérico (1.0)
2. Patrón con texto (0.95)
3. Palabras numéricas (0.90)
4. Fuzzy match (0.75)

## 📈 Mejoras de Trazabilidad

**Eventos de tracking nuevos:**
- `last_question`: Cuando bot hace pregunta con opciones
- `option_chosen`: Cuando usuario elige opción
- Incluye: `questionId`, `optionId`, `parseConfidence`, `rawMessage`

**Versionado de prompts:**
- `PROMPT_VERSION` en cada respuesta generada
- Permite análisis de efectividad por versión

## 🚀 Próximos Pasos (No Implementados)

1. **Mejora técnica IA-first:**
   - `classifyTechnical()` con few-shot mejorado
   - Check de stock automático
   - Detección de operaciones peligrosas

2. **Escalado inteligente:**
   - Detectar casos que requieren experto
   - Generar resúmenes automáticos
   - Notificaciones contextuales

3. **Analytics avanzado:**
   - Dashboard de opciones más elegidas
   - Análisis de confianza de parsing
   - Tasa de conversión por flujo

## 🔄 Retro-compatibilidad

**Garantizado:**
- ✅ Firmas públicas no cambiaron (`start`, `processMessage`, `generateResponse`)
- ✅ Parámetros nuevos son opcionales
- ✅ Funcionalidad existente preservada
- ✅ Sin breaking changes

## 📝 Commit

```bash
git commit -m "Refactor: Sistema IA-first con reconocimiento de opciones numéricas
- generateMedicalReply: retorna estructura con options[], lastQuestionId
- parseOptionReply: múltiples formatos (1, opción 1, uno, 1️⃣)
- stateMachine.start() acepta treatmentId y aplica regla de precios
- PROMPT_TEMPLATES centralizados con few-shot examples
- Tests documentados como comentarios"
```

## 🎓 Aprendizajes

1. **IA-first approach:** Mejor UX que múltiples ramas if/else
2. **Opciones estructuradas:** Facilita tracking y analytics
3. **Parsing flexible:** Reconoce intención del usuario
4. **Reglas de negocio:** Aplicadas automáticamente en momento correcto
5. **Documentación in-code:** Tests como comentarios mantienen código auto-documentado

---

**Notas:** Este refactor mantiene compatibilidad total con el sistema existente mientras agrega capacidades avanzadas de IA y gestión de opciones. El código es más mantenible, trazable y preparado para futuras mejoras.
