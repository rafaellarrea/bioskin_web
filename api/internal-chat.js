import { sql } from '@vercel/postgres';
import { processInternalChatMessage } from '../lib/internal-chat-service.js';

export default async function handler(req, res) {
  // Allow GET, POST, DELETE
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ==========================================
  // GET: List Conversations or Get Messages
  // ==========================================
  if (req.method === 'GET') {
    const { action, sessionId } = req.query;

    try {
      if (action === 'list') {
        // List all internal conversations
        const result = await sql`
          SELECT session_id, last_message_at, total_messages, user_info
          FROM chat_conversations 
          WHERE session_id LIKE 'internal_%'
          ORDER BY last_message_at DESC
          LIMIT 50
        `;
        return res.status(200).json({ conversations: result.rows });
      }

      if (action === 'get' && sessionId) {
        // Get messages for a specific session
        const result = await sql`
          SELECT role, content, timestamp
          FROM chat_messages 
          WHERE session_id = ${sessionId}
          ORDER BY timestamp ASC
        `;
        return res.status(200).json({ messages: result.rows });
      }

      return res.status(400).json({ error: 'Invalid action or missing sessionId' });
    } catch (error) {
      console.error('GET Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // DELETE: Delete Conversation
  // ==========================================
  if (req.method === 'DELETE') {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    try {
      await sql`DELETE FROM chat_conversations WHERE session_id = ${sessionId}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('DELETE Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // POST: Send Message (Chat Logic)
  // ==========================================
  const { message, sessionId, isNewSession, isNewPatient, mode } = req.body;

  try {
    const aiResponse = await processInternalChatMessage({
      message,
      sessionId,
      isNewSession,
      isNewPatient,
      mode
    });

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Internal Chat Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

