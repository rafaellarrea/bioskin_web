import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.CLINICAL_DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No database connection string found in .env (checked CLINICAL_DATABASE_URL, NEON_DATABASE_URL, POSTGRES_URL)');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const schema = `
-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    rut VARCHAR(20) UNIQUE,
    email VARCHAR(150),
    phone VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(20),
    address TEXT,
    occupation VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Clinical Records
CREATE TABLE IF NOT EXISTS clinical_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Medical History
CREATE TABLE IF NOT EXISTS medical_history (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    pathological TEXT,
    non_pathological TEXT,
    family_history TEXT,
    surgical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    aesthetic_history TEXT,
    gynecological_history TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Physical Exam
CREATE TABLE IF NOT EXISTS physical_exams (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    skin_type VARCHAR(50),
    phototype VARCHAR(10),
    glogau_scale VARCHAR(10),
    hydration VARCHAR(50),
    elasticity VARCHAR(50),
    lesions_description TEXT,
    face_map_data JSONB,
    body_map_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Diagnoses
CREATE TABLE IF NOT EXISTS diagnoses (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT NOW(),
    diagnosis_text TEXT NOT NULL,
    cie10_code VARCHAR(20),
    type VARCHAR(20) DEFAULT 'presumptive',
    severity VARCHAR(20),
    notes TEXT
);

-- Treatments
CREATE TABLE IF NOT EXISTS treatments (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT NOW(),
    procedure_name VARCHAR(150) NOT NULL,
    equipment_used VARCHAR(100),
    parameters JSONB,
    area_treated VARCHAR(100),
    duration_minutes INTEGER,
    cost DECIMAL(10, 2),
    notes TEXT,
    performed_by VARCHAR(100)
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT NOW(),
    diagnosis TEXT,
    items JSONB,
    notes TEXT
);

-- Prescription Templates
CREATE TABLE IF NOT EXISTS prescription_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    items_json JSONB
);

-- Consent Forms (Updated with remote signature fields)
CREATE TABLE IF NOT EXISTS consent_forms (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    procedure_type VARCHAR(150),
    zone VARCHAR(150),
    sessions INTEGER,
    objectives JSONB,
    description TEXT,
    risks JSONB,
    benefits JSONB,
    alternatives JSONB,
    pre_care JSONB,
    post_care JSONB,
    contraindications JSONB,
    critical_antecedents JSONB,
    authorizations JSONB,
    declarations JSONB,
    signatures JSONB,
    attachments JSONB,
    signing_token VARCHAR(100),
    signing_status VARCHAR(20) DEFAULT 'pending'
);

-- Add columns if they don't exist (for existing tables)
ALTER TABLE consent_forms ADD COLUMN IF NOT EXISTS patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE consent_forms ADD COLUMN IF NOT EXISTS signing_token VARCHAR(100);
ALTER TABLE consent_forms ADD COLUMN IF NOT EXISTS signing_status VARCHAR(20) DEFAULT 'pending';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consent_forms_record_id ON consent_forms(record_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_patient_id ON consent_forms(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_signing_token ON consent_forms(signing_token);
`;

async function initDB() {
  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected.');

    console.log('🛠️ Applying schema...');
    await client.query(schema);
    console.log('✅ Schema applied successfully.');

    client.release();
    await pool.end();
    console.log('👋 Done.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
}

initDB();
