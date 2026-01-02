import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, sessionId, isNewSession, isNewPatient } = req.body;
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing Gemini API Key' });
  }

  try {
    // 1. Manage Session
    if (isNewSession) {
      // Create new conversation
      await sql`
        INSERT INTO chat_conversations (session_id, phone_number, is_active, user_info)
        VALUES (${sessionId}, 'INTERNAL_ADMIN', true, ${JSON.stringify({ isNewPatient })})
        ON CONFLICT (session_id) DO UPDATE 
        SET is_active = true, last_message_at = NOW(), user_info = ${JSON.stringify({ isNewPatient })}
      `;

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

    // 3. Get History (Last 5 messages)
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
    const systemPrompt = `Eres Gema, una asistente virtual experta en comunicación médica y atención al paciente para la clínica estética BIOSKIN de la Dra. Daniela Creamer.
    
    TU OBJETIVO:
    Redactar respuestas empáticas, profesionales y persuasivas que la Dra. Daniela revisará antes de enviar al paciente.
    
    CONTEXTO:
    - Estás en un chat interno con la doctora. Ella te pega lo que escribe el paciente, y tú le das la respuesta sugerida.
    - ${isNewPatient ? 'Este es un NUEVO PACIENTE. Saluda cordialmente, preséntate como el equipo de la Dra. Daniela y hazle sentir bienvenido.' : 'Es un paciente recurrente o la conversación continúa.'}
    
    TONO Y ESTILO:
    - Empático y cálido: Usa emojis moderados (✨, 🌸, 👩‍⚕️).
    - Profesional y seguro: Transmite confianza médica.
    - Persuasivo pero ético: Invita a agendar o visitar la clínica sin presionar agresivamente.
    - Claro y conciso: Evita textos muy largos, usa párrafos cortos.
    
    INFORMACIÓN CLAVE:
    - Ubicación: Cuenca, Ecuador (Av. Ordoñez Lasso y calle de la Menta).
    - Consulta: $10 (abonables al tratamiento).
    - Dra. Daniela Creamer: Especialista en medicina estética.
    
    INSTRUCCIONES:
    - Analiza el mensaje del paciente.
    - Si pregunta precios, da un rango o invita a evaluación, mencionando que cada piel es única.
    - Si pregunta por citas, ofrece horarios o pide preferencia.
    - Si está molesto, sé comprensiva y ofrece soluciones.
    - Redacta la respuesta lista para copiar y pegar (o con mínimas ediciones).
    `;

    // 5. Call Gemini
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      ...history
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gemini API Error');
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude generar una respuesta.";

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

    return res.status(200).json({ response: aiText });

  } catch (error) {
    console.error('Internal Chat Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
