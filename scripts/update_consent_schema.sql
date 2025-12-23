-- Update Consent Forms Schema
DROP TABLE IF EXISTS consent_forms;

CREATE TABLE consent_forms (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES clinical_records(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Metadata
    status VARCHAR(20) DEFAULT 'draft', -- draft, finalized, annulled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    
    -- Procedure Info
    procedure_type VARCHAR(150),
    zone VARCHAR(150),
    sessions INTEGER,
    
    -- Content (JSONB for flexibility)
    objectives JSONB, -- Array of strings
    description TEXT,
    risks JSONB, -- Array of strings
    benefits JSONB, -- Array of strings
    alternatives JSONB, -- Array of strings
    pre_care JSONB, -- Array of strings
    post_care JSONB, -- Array of strings
    contraindications JSONB, -- Array of strings
    
    -- Medical Context
    critical_antecedents JSONB, -- { allergies, medications, pregnancy, etc. }
    
    -- Legal/Auth
    authorizations JSONB, -- { image_use, photo_video }
    declarations JSONB, -- { understanding, questions, etc. }
    
    -- Signatures
    signatures JSONB, -- { patient_name, professional_name, patient_sig_data, prof_sig_data }
    
    -- Files
    attachments JSONB -- [ { name, url }, ... ]
);

-- Create index for faster lookups
CREATE INDEX idx_consent_forms_record_id ON consent_forms(record_id);
CREATE INDEX idx_consent_forms_patient_id ON consent_forms(patient_id);
