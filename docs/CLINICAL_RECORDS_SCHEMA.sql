-- Schema for Clinical Records (Fichas Clínicas) - Neon PostgreSQL

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    rut VARCHAR(20) UNIQUE, -- Chilean ID or similar
    email VARCHAR(150),
    phone VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(20),
    address TEXT,
    occupation VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Clinical Records (Fichas)
-- A patient can have multiple records (though usually one active)
CREATE TABLE IF NOT EXISTS clinical_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active', -- active, archived
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Consultation Info (Motivo de Consulta y Enfermedad Actual)
CREATE TABLE IF NOT EXISTS consultation_info (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    reason TEXT, -- Motivo de consulta
    current_illness TEXT, -- Enfermedad actual
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(record_id)
);

-- Medical History (Antecedentes)
CREATE TABLE IF NOT EXISTS medical_history (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    pathological TEXT, -- Diabetes, Hypertension, etc.
    non_pathological TEXT, -- Smoking, Alcohol, etc.
    family_history TEXT,
    surgical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    aesthetic_history TEXT, -- Previous aesthetic treatments
    gynecological_history TEXT, -- For female patients
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Physical Exam (Examen Físico)
CREATE TABLE IF NOT EXISTS physical_exams (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    skin_type VARCHAR(50), -- Normal, Dry, Oily, Mixed
    phototype VARCHAR(10), -- Fitzpatrick I-VI
    glogau_scale VARCHAR(10), -- I-IV
    hydration VARCHAR(50),
    elasticity VARCHAR(50),
    lesions_description TEXT,
    face_map_data JSONB, -- Stores coordinates/points for face mapping
    body_map_data JSONB, -- Stores coordinates for body mapping
    created_at TIMESTAMP DEFAULT NOW()
);

-- Diagnoses (Diagnósticos)
CREATE TABLE IF NOT EXISTS diagnoses (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT NOW(),
    diagnosis_text TEXT NOT NULL,
    cie10_code VARCHAR(20),
    type VARCHAR(20) DEFAULT 'presumptive', -- presumptive, definitive
    severity VARCHAR(20),
    notes TEXT
);

-- Treatments / Sessions (Tratamientos)
CREATE TABLE IF NOT EXISTS treatments (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT NOW(),
    procedure_name VARCHAR(150) NOT NULL,
    equipment_used VARCHAR(100),
    parameters JSONB, -- Energy, frequency, etc.
    area_treated VARCHAR(100),
    duration_minutes INTEGER,
    cost DECIMAL(10, 2),
    notes TEXT,
    performed_by VARCHAR(100)
);

-- Prescriptions (Recetas)
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT NOW(),
    items JSONB, -- Array of {medication, dosage, frequency, duration}
    notes TEXT
);

-- Consent Forms (Consentimientos)
CREATE TABLE IF NOT EXISTS consent_forms (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    form_type VARCHAR(100) NOT NULL,
    content_text TEXT, -- The legal text agreed to
    signature_data TEXT, -- Base64 signature or URL
    signed_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'signed'
);

-- Injectables (Inyectables - Specific tracking)
CREATE TABLE IF NOT EXISTS injectables (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT NOW(),
    product_name VARCHAR(100),
    brand VARCHAR(50),
    lot_number VARCHAR(50),
    expiration_date DATE,
    volume_used DECIMAL(5, 2), -- ml
    areas_treated JSONB, -- Array of areas
    technique VARCHAR(100),
    notes TEXT
);
