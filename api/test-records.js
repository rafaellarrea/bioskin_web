import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');

export default function handler(req, res) {
  const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    return res.status(500).json({ error: 'No connection string found' });
  }

  try {
    const pool = new Pool({ 
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1
    });
    
    res.status(200).json({ 
      message: 'Pool created successfully', 
      hasConnectionString: !!connectionString 
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create pool', details: e.message });
  }
}
