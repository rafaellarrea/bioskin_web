// api/ai-blog/status.js

import { 
  getWeeklyStatus,
  BLOG_TOPICS
} from '../../lib/ai-service.js';
import { initializeDatabase } from '../../lib/database.js';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const dbPath = path.join(__dirname, '..', '..', 'data', 'blogs.db');
    const db = new Database(dbPath);
    initializeDatabase();

    const weeklyStatus = await getWeeklyStatus(db);
    
    res.status(200).json({
      success: true,
      weeklyStatus: weeklyStatus,
      topics: BLOG_TOPICS,
      message: 'Estado semanal obtenido correctamente'
    });

    db.close();

  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado semanal',
      error: error.message
    });
  }
}