
import pool from '../lib/neon-clinical-db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not configured' });
    }

    console.log('🔄 Starting Physical Exam schema migration via API...');

    const columnsToAdd = [
      { name: 'photoprotection', type: 'VARCHAR(50)' },
      { name: 'texture', type: 'VARCHAR(50)' },
      { name: 'pores', type: 'VARCHAR(50)' },
      { name: 'pigmentation', type: 'VARCHAR(50)' },
      { name: 'sensitivity', type: 'VARCHAR(50)' }
    ];

    const results = [];

    for (const col of columnsToAdd) {
      try {
        await pool.query(`
          ALTER TABLE physical_exams 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
        `);
        results.push(`✅ Added column: ${col.name}`);
      } catch (e) {
        results.push(`ℹ️ Column ${col.name} might already exist or error: ${e.message}`);
      }
    }

    return res.status(200).json({ 
      message: 'Migration completed', 
      details: results 
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
