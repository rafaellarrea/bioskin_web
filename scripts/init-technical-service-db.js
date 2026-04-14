
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No database connection string found in .env (checked NEON_DATABASE_URL, POSTGRES_URL)');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const schema = `
-- Technical Service Documents Table
CREATE TABLE IF NOT EXISTS technical_service_documents (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'reception', 'technical_report', 'proforma'
    client_name VARCHAR(150) NOT NULL,
    client_contact VARCHAR(100),
    client_cedula VARCHAR(20),
    client_center VARCHAR(200),
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

async function initDB() {
  try {
    console.log('🔌 Connecting to Neon Database...');
    const client = await pool.connect();
    
    console.log('📝 Creating Technical Service schema...');
    await client.query(schema);
    
    console.log('✅ Technical Service schema initialized successfully');
    client.release();
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDB();
