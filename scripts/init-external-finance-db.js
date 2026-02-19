
import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

async function main() {
  console.log('🚀 Starting External Finance Database Initialization...');

  const connectionString = process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: POSTGRES_URL or NEON_DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log('📦 Creating table external_finance_records...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS external_finance_records (
        id SERIAL PRIMARY KEY,
        assistant_name VARCHAR(50) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        intervention_date DATE NOT NULL,
        clinic VARCHAR(50),
        total_payment NUMERIC(10, 2) NOT NULL,
        doctor_fees JSONB,
        expenses NUMERIC(10, 2) DEFAULT 0,
        additional_income NUMERIC(10, 2) DEFAULT 0,
        net_income_juan_pablo NUMERIC(10, 2),
        raw_note TEXT,
        intervention_type VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add column if it doesn't exist (for existing tables)
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='external_finance_records' AND column_name='intervention_type') THEN
          ALTER TABLE external_finance_records ADD COLUMN intervention_type VARCHAR(255);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='external_finance_records' AND column_name='abono') THEN
          ALTER TABLE external_finance_records ADD COLUMN abono NUMERIC(10, 2) DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='external_finance_records' AND column_name='details') THEN
          ALTER TABLE external_finance_records ADD COLUMN details TEXT;
        END IF;
      END $$;
    `);

    console.log('✅ Table external_finance_records created/updated successfully with intervention_type.');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
