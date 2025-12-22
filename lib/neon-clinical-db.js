import { Pool } from '@neondatabase/serverless';

// Validar que existe la URL de conexión
const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.warn('⚠️ NEON_DATABASE_URL ni POSTGRES_URL están configuradas. La funcionalidad de Fichas Clínicas no funcionará correctamente.');
}

const pool = connectionString 
  ? new Pool({ connectionString }) 
  : null;

/**
 * Inicializa el esquema de base de datos para Fichas Clínicas
 */
export async function initClinicalDatabase() {
  if (!pool) return;

  try {
    console.log('🏥 Inicializando base de datos de Fichas Clínicas...');

    // Patients
    await pool.query(`
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
      )
    `);

    // Clinical Records
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clinical_records (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Medical History
    await pool.query(`
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
      )
    `);

    // Physical Exams
    await pool.query(`
      CREATE TABLE IF NOT EXISTS physical_exams (
        id SERIAL PRIMARY KEY,
        record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
        skin_type VARCHAR(50),
        phototype VARCHAR(255),
        glogau_scale VARCHAR(255),
        hydration VARCHAR(50),
        elasticity VARCHAR(50),
        photoprotection VARCHAR(50),
        texture VARCHAR(50),
        pores VARCHAR(50),
        pigmentation VARCHAR(50),
        sensitivity VARCHAR(50),
        lesions_description TEXT,
        face_map_data JSONB,
        body_map_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Diagnoses
    await pool.query(`
      CREATE TABLE IF NOT EXISTS diagnoses (
        id SERIAL PRIMARY KEY,
        record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
        date TIMESTAMP DEFAULT NOW(),
        diagnosis_text TEXT NOT NULL,
        cie10_code VARCHAR(20),
        type VARCHAR(255) DEFAULT 'presumptive',
        severity VARCHAR(255),
        notes TEXT
      )
    `);

    // Treatments
    await pool.query(`
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
      )
    `);

    // Prescriptions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id SERIAL PRIMARY KEY,
        record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
        date TIMESTAMP DEFAULT NOW(),
        items JSONB,
        notes TEXT
      )
    `);

    // Consent Forms
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consent_forms (
        id SERIAL PRIMARY KEY,
        record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
        form_type VARCHAR(100) NOT NULL,
        content_text TEXT,
        signature_data TEXT,
        signed_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'signed'
      )
    `);

    // Injectables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS injectables (
        id SERIAL PRIMARY KEY,
        record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
        date TIMESTAMP DEFAULT NOW(),
        product_name VARCHAR(100),
        brand VARCHAR(50),
        lot_number VARCHAR(50),
        expiration_date DATE,
        volume_used DECIMAL(5, 2),
        areas_treated JSONB,
        technique VARCHAR(100),
        notes TEXT
      )
    `);

    console.log('✅ Base de datos de Fichas Clínicas inicializada');
  } catch (error) {
    console.error('❌ Error inicializando base de datos de Fichas Clínicas:', error);
    throw error;
  }
}

export default pool;
