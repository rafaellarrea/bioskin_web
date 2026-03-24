
import { Pool } from '@neondatabase/serverless';

export default async function handler(request, response) {
  const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    return response.status(500).json({ error: 'Database configuration missing' });
  }

  const pool = new Pool({ connectionString });

  const schema = `
  -- Technical Service Documents Table
  CREATE TABLE IF NOT EXISTS technical_service_documents (
      id SERIAL PRIMARY KEY,
      ticket_number VARCHAR(50) UNIQUE NOT NULL,
      document_type VARCHAR(50) NOT NULL, -- 'reception', 'technical_report', 'proforma'
      client_name VARCHAR(150),
      client_contact VARCHAR(100),
      equipment_data JSONB, -- { brand, model, serial, accessories, visual_condition }
      checklist_data JSONB, -- { checks: [{ label, status, observation }] }
      diagnosis TEXT,
      recommendations TEXT,
      total_cost DECIMAL(10, 2),
      status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'delivered'
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_technical_docs_type ON technical_service_documents(document_type);
  CREATE INDEX IF NOT EXISTS idx_technical_docs_status ON technical_service_documents(status);
  CREATE INDEX IF NOT EXISTS idx_technical_docs_ticket ON technical_service_documents(ticket_number);
  `;

  try {
    const client = await pool.connect();
    console.log('📝 Creating Technical Service schema on Vercel DB...');
    await client.query(schema);
    client.release();
    
    return response.status(200).json({ 
        success: true, 
        message: 'Table technical_service_documents created/verified successfully on Vercel environment.' 
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return response.status(500).json({ error: 'Failed to initialize DB', details: error.message });
  } finally {
      await pool.end();
  }
}
