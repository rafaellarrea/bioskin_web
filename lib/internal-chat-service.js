import { sql } from '@vercel/postgres';
import { googleCalendarService } from './google-calendar-service.js';
import { PromotionsService } from './promotions-service.js';

const promotionsService = new PromotionsService();

// Helper to initialize DB if needed
export async function ensureTablesExist() {
  try {
    console.log('Initializing tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        last_message_at TIMESTAMP DEFAULT NOW(),
        total_messages INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        user_info JSONB DEFAULT '{}'
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        tokens_used INT DEFAULT 0,
        message_id VARCHAR(255),
        FOREIGN KEY (session_id) REFERENCES chat_conversations(session_id) ON DELETE CASCADE
      )
    `;
    // Ensure user_info column exists (for existing tables)
    try {
      await sql`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS user_info JSONB DEFAULT '{}'`;
    } catch (e) {
      // Ignore if column exists or other non-critical error
      console.log('Column check note:', e.message);
    }
    console.log('Tables initialized.');
  } catch (error) {
    console.error('Error initializing tables:', error);
    throw new Error('Database initialization failed: ' + error.message);
  }
}

export async function processInternalChatMessage({ message, sessionId, isNewSession, isNewPatient, mode }) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  console.log('Internal Chat Service:', { 
    sessionId, 
    isNewSession, 
    hasApiKey: !!apiKey,
    mode: mode || 'draft'
  });

  if (!apiKey) {
    throw new Error('Missing Gemini API Key');
  }

  try {
    // 1. Manage Session
    if (isNewSession) {
      try {
        // Create new conversation
        await sql`
          INSERT INTO chat_conversations (session_id, phone_number, is_active, user_info)
          VALUES (${sessionId}, 'INTERNAL_ADMIN', true, ${JSON.stringify({ isNewPatient, mode })})
          ON CONFLICT (session_id) DO UPDATE 
          SET is_active = true, last_message_at = NOW(), user_info = ${JSON.stringify({ isNewPatient, mode })}
        `;
      } catch (dbError) {
        console.error('DB Insert Error:', dbError);
        // If table doesn't exist (code 42P01), try to create it
        if (dbError.message?.includes('relation "chat_conversations" does not exist') || dbError.code === '42P01') {
          console.log('Tables missing, attempting to create...');
          await ensureTablesExist();
          // Retry insert
          await sql`
            INSERT INTO chat_conversations (session_id, phone_number, is_active, user_info)
            VALUES (${sessionId}, 'INTERNAL_ADMIN', true, ${JSON.stringify({ isNewPatient, mode })})
            ON CONFLICT (session_id) DO UPDATE 
            SET is_active = true, last_message_at = NOW(), user_info = ${JSON.stringify({ isNewPatient, mode })}
          `;
        } else {
          throw dbError;
        }
      }

      // Cleanup old internal sessions (older than 24h) to prevent saturation
      // This runs asynchronously without blocking the response
      sql`
        DELETE FROM chat_conversations 
        WHERE session_id LIKE 'internal_%' 
        AND last_message_at < NOW() - INTERVAL '24 hours'
      `.catch(err => console.error('Cleanup error:', err));
    }

    // 2. Save User Message
    await sql`
      INSERT INTO chat_messages (session_id, role, content, timestamp)
      VALUES (${sessionId}, 'user', ${message}, NOW())
    `;

    // 3. Get History (Last 10 messages)
    const historyResult = await sql`
      SELECT role, content 
      FROM chat_messages 
      WHERE session_id = ${sessionId} 
      ORDER BY timestamp DESC 
      LIMIT 10
    `;
    
    // Reverse to chronological order
    const history = historyResult.rows.reverse().map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // 4. Construct System Prompt
    let systemPrompt = '';

    if (mode === 'assistant') {
      // --- ASSISTANT MODE LOGIC ---
      
      // Gather Context
      let contextData = [];
      const lowerMsg = message.toLowerCase();

      // A. Calendar Context
      if (lowerMsg.includes('agenda') || lowerMsg.includes('cita') || lowerMsg.includes('horario') || lowerMsg.includes('disponible') || lowerMsg.includes('calendario') || lowerMsg.includes('mañana') || lowerMsg.includes('hoy') || lowerMsg.includes('cancelar') || lowerMsg.includes('eliminar')) {
        try {
          const events = await googleCalendarService.getUpcomingEvents(168); // Next 7 days (increased from 48h)
          if (events && events.length > 0) {
            const eventList = events.map(e => 
              `- [ID: ${e.id}] ${e.summary} (${new Date(e.start.dateTime || e.start.date).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })})`
            ).join('\n');
            contextData.push(`AGENDA (Próximos 7 días):\n${eventList}`);
          } else {
            contextData.push(`AGENDA: No hay eventos programados en los próximos 7 días.`);
          }
        } catch (err) {
          console.error('Error fetching calendar:', err);
          contextData.push(`AGENDA: Error al consultar el calendario (${err.message}).`);
        }
      }

      // B. Promotions Context
      if (lowerMsg.includes('promocion') || lowerMsg.includes('oferta') || lowerMsg.includes('descuento') || lowerMsg.includes('precio')) {
        try {
          const promos = promotionsService.loadPromotions();
          if (promos.active) {
            const servicePromos = promos.promotions.services.map(p => `- ${p.serviceName}: $${p.promoPrice}`).join('\n');
            const productPromos = promos.promotions.products.map(p => `- ${p.productName}: $${p.promoPrice}`).join('\n');
            contextData.push(`PROMOCIONES ACTIVAS:\nServicios:\n${servicePromos}\nProductos:\n${productPromos}`);
          }
        } catch (err) {
          console.error('Error fetching promotions:', err);
        }
      }

      const nowEcuador = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'full', timeStyle: 'short' });

      systemPrompt = `Eres el Asistente Virtual Interno de BIOSKIN.
      
      TU OBJETIVO:
      Ayudar al personal de la clínica con información precisa sobre tratamientos, agenda, promociones y protocolos.
      
      INFORMACIÓN DE BIOSKIN:
      - Ubicación: Cuenca, Ecuador (Av. Ordoñez Lasso y calle de la Menta).
      - Especialidad: Medicina Estética y Dermatología.
      - Directora: Dra. Daniela Creamer.
      - FECHA Y HORA ACTUAL (Ecuador): ${nowEcuador}
      
      CONTEXTO ACTUAL (Usa esto si es relevante para la pregunta):
      ${contextData.join('\n\n')}
      
      INSTRUCCIONES:
      - Responde de manera profesional, clara y concisa.
      - Si te preguntan por la agenda, usa la información provista arriba. Si no hay info, indícalo.
      - Si te preguntan por tratamientos, explica beneficios, procedimientos y cuidados generales.
      - Si te preguntan por promociones, menciona las vigentes.
      - NO inventes información médica crítica. Si no sabes, sugiere consultar con la Dra. Daniela.
      - Eres una herramienta interna, no estás hablando con un paciente, sino con el staff.

      CAPACIDAD DE GESTIÓN DE CITAS:
      - Si el usuario pide CANCELAR o ELIMINAR una cita, primero verifica que la cita exista en el contexto "AGENDA".
      - Si existe, pide confirmación si no está claro.
      - Si el usuario confirma o la intención es clara (ej: "Cancela la cita de Juan Pérez"), DEBES incluir al final de tu respuesta el siguiente comando:
        [[CANCEL_EVENT: <ID_DEL_EVENTO>]]
      - Reemplaza <ID_DEL_EVENTO> con el ID exacto que aparece en el contexto (ej: [ID: abc123xyz]).
      - Ejemplo de respuesta: "Entendido, procedo a cancelar la cita de Juan Pérez. [[CANCEL_EVENT: abc123xyz]]"
      `;

    } else {
      // --- DRAFTING MODE LOGIC (Original) ---
      systemPrompt = `Eres la Dra. Daniela Creamer, especialista en medicina estética y directora de BIOSKIN Salud y Estética.
    
    TU OBJETIVO:
    Generar la respuesta EXACTA que se le enviará al paciente por WhatsApp.
    
    REGLA DE ORO (CRÍTICA):
    - NO saludes a la doctora (tú ERES la doctora).
    - NO digas "Aquí tienes la respuesta".
    - NO des explicaciones de por qué escribiste eso.
    - TU SALIDA DEBE SER ÚNICAMENTE EL MENSAJE PARA EL PACIENTE.
    
    FORMATO DE SALUDO OBLIGATORIO:
    Si es el inicio de la conversación o un saludo, DEBES comenzar con:
    "Buenas tardes/días, le saluda la Dra. Daniela Creamer de BIOSKIN Salud y Estética..."
    (Ajusta tardes/días según corresponda o usa un genérico si no sabes la hora).
    
    PERSONALIDAD (MUY IMPORTANTE):
    - Eres extremadamente cálida, amable y empática.
    - Tu misión es hacer sentir al paciente escuchado y cuidado.
    - NUNCA seas seca o robótica.
    - SIEMPRE usa emojis suaves (✨, 🌸, 💖, 👩‍⚕️) para suavizar el tono.
    - SIEMPRE trata al paciente de "USTED". Nunca uses "tú" o "vos".
    - HABLA EN PRIMERA PERSONA ("Yo") para tus sentimientos y acciones directas ("Lamento", "Agradezco", "Quedo atenta").
    - EVITA el uso excesivo del pronombre "YO" explícito. Di "Le reservo un espacio" en lugar de "Yo le reservo un espacio".
    - REFIÉRETE a la clínica como "Bioskin" o "la clínica" para sonar más profesional y fluido, en lugar de repetir siempre "mi consultorio".
    
    CONTEXTO:
    - Estás redactando una respuesta para un paciente en WhatsApp.
    - ${isNewPatient ? 'Este es un NUEVO PACIENTE. Hazle sentir bienvenido.' : 'Es un paciente recurrente. Mantén el hilo de la conversación con naturalidad.'}
    
    INFORMACIÓN CLAVE:
    - Ubicación: Cuenca, Ecuador (Av. Ordoñez Lasso y calle de la Menta).
    - Consulta: $10 (abonables al tratamiento).
    
    INSTRUCCIONES ESPECÍFICAS:
    - Si el paciente cancela una cita: NO digas solo "Entendido". Di algo como: "Entiendo perfectamente, [Nombre]. 🌸 Lamento mucho que no pueda acompañarme, pero agradezco mucho que me avise. Quedo atenta para cuando desee reagendar. ¡Que tenga un lindo día! ✨"
    - Si pregunta precios: Da un rango o invita a evaluación.
    - Si pregunta por citas: Ofrece horarios con entusiasmo.
    `;
    }

    // 5. Call Gemini with Fallback Strategy
    // Primary: gemini-2.5-flash (Latest stable flash)
    // Backups: gemini-2.0-flash-exp (Experimental - often separate quota), gemini-exp-1206 (Experimental), gemini-2.0-flash (Previous stable)
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-exp-1206', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];
    let aiText = null;
    let lastError = null;

    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      ...history
    ];

    for (const model of models) {
      try {
        console.log(`🤖 Intentando generar respuesta con modelo: ${model}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          })
        });

        if (!response.ok) {
          const err = await response.json();
          console.warn(`⚠️ Error con modelo ${model}:`, err.error?.message || response.statusText);
          
          // If it's a 404 (Model not found) or 429 (Quota), we continue to next model
          if (response.status === 404 || response.status === 429 || response.status >= 500) {
            lastError = new Error(err.error?.message || `Error ${response.status}`);
            continue; 
          }
          
          throw new Error(err.error?.message || 'Gemini API Error');
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (text) {
          aiText = text;
          console.log(`✅ Éxito con modelo: ${model}`);
          break; // Success!
        } else {
           console.warn(`⚠️ Modelo ${model} no generó texto.`);
           continue;
        }

      } catch (e) {
        console.error(`❌ Excepción con modelo ${model}:`, e.message);
        lastError = e;
      }
    }

    if (!aiText) {
      throw lastError || new Error('No se pudo generar respuesta con ninguno de los modelos disponibles.');
    }

    // 6. Save AI Message
    await sql`
      INSERT INTO chat_messages (session_id, role, content, timestamp)
      VALUES (${sessionId}, 'assistant', ${aiText}, NOW())
    `;

    // Update conversation timestamp
    await sql`
      UPDATE chat_conversations 
      SET last_message_at = NOW(), total_messages = total_messages + 2
      WHERE session_id = ${sessionId}
    `;

    // 7. Execute Commands (Cancel Event)
    const cancelMatch = aiText.match(/\[\[CANCEL_EVENT:\s*([a-zA-Z0-9_]+)\]\]/);
    if (cancelMatch) {
      const eventId = cancelMatch[1];
      console.log(`🗑️ Detectada orden de cancelación para evento: ${eventId}`);
      try {
        await googleCalendarService.deleteEvent(eventId);
        // Remove the command from the text shown to user
        const cleanText = aiText.replace(cancelMatch[0], '').trim() + "\n\n✅ Cita cancelada correctamente en Google Calendar.";
        return cleanText;
      } catch (err) {
        console.error('Error executing cancel command:', err);
        const errorText = aiText.replace(cancelMatch[0], '').trim() + `\n\n⚠️ Hubo un error al intentar cancelar la cita: ${err.message}`;
        return errorText;
      }
    }

    return aiText;

  } catch (error) {
    console.error('Internal Chat Service Error:', error);
    throw error;
  }
}
