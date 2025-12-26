import pg from 'pg';
const { Pool } = pg;

console.log('✅ [API] records.js loaded');

// Global flag to track initialization in the current container instance
let dbInitialized = false;
let poolInstance = null;

function getPool() {
  if (poolInstance) return poolInstance;
  
  const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found (checked NEON_DATABASE_URL, POSTGRES_URL)');
    return null;
  }

  try {
    poolInstance = new Pool({ 
      connectionString,
      ssl: {
        rejectUnauthorized: false // Required for Neon/Vercel in some configs
      },
      max: 1, // Limit connections in serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    return poolInstance;
  } catch (e) {
    console.error('❌ Error creating pool:', e);
    return null;
  }
}

export default async function handler(req, res) {
  console.log(`[Clinical Records API] Request received: ${req.method} ${req.url}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let { action } = req.query;
    const body = req.body || {};

    // Allow action to be passed in body for POST requests
    if (!action && body.action) {
      action = body.action;
    }

    // Get pool instance lazily
    const pool = getPool();

    if (!pool) {
      console.error('❌ Database connection missing');
      return res.status(500).json({ error: 'Database connection not configured. Check NEON_DATABASE_URL.' });
    }

    // Test connection on health check
    if (action === 'health') {
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        return res.status(200).json({ 
          status: 'ok', 
          message: 'Clinical Records API is running', 
          db_time: result.rows[0].now 
        });
      } catch (err) {
        console.error('❌ Health check failed:', err);
        return res.status(500).json({ error: 'Database connection failed', details: err.message });
      }
    }

    switch (action) {
      case 'init':
        return res.status(200).json({ message: 'Database initialized (skipped)' });

      case 'listPatients':
        const patients = await pool.query('SELECT * FROM patients ORDER BY last_name, first_name');
        return res.status(200).json(patients.rows);

      case 'getPatient':
        const { id } = req.query;
        const patient = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
        if (patient.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
        
        // Also fetch active record ID
        const record = await pool.query('SELECT id FROM clinical_records WHERE patient_id = $1 AND status = \'active\' LIMIT 1', [id]);
        
        return res.status(200).json({ 
          ...patient.rows[0], 
          active_record_id: record.rows[0]?.id || null 
        });

      case 'listRecords':
        const { patient_id } = req.query;
        const records = await pool.query(
          'SELECT * FROM clinical_records WHERE patient_id = $1 ORDER BY created_at DESC', 
          [patient_id]
        );
        return res.status(200).json(records.rows);

      case 'createRecord':
        const { patient_id: p_id } = body;
        const newRecord = await pool.query(
          'INSERT INTO clinical_records (patient_id, status) VALUES ($1, \'active\') RETURNING *',
          [p_id]
        );
        return res.status(201).json(newRecord.rows[0]);

      case 'createPatient':
        try {
          const { first_name, last_name, rut, email, phone, birth_date, gender, address, occupation } = body;
          
          console.log('📝 Creating patient:', { first_name, last_name, rut, email });

          // Handle empty strings as null for optional fields
          const cleanRut = rut && rut.trim() !== '' ? rut.trim() : null;
          const cleanBirthDate = birth_date && birth_date.trim() !== '' ? birth_date : null;
          
          const newPatient = await pool.query(
            `INSERT INTO patients (first_name, last_name, rut, email, phone, birth_date, gender, address, occupation) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [first_name, last_name, cleanRut, email, phone, cleanBirthDate, gender, address, occupation]
          );
          // Create an initial clinical record for the patient
          await pool.query('INSERT INTO clinical_records (patient_id, status) VALUES ($1, \'active\')', [newPatient.rows[0].id]);
          
          return res.status(201).json(newPatient.rows[0]);
        } catch (err) {
          console.error('❌ Error creating patient:', err);
          
          if (err.code === '23505') {
            if (err.detail.includes('rut')) {
              return res.status(400).json({ error: 'El RUT ya está registrado en el sistema.' });
            }
            if (err.detail.includes('email')) {
              return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
            }
          }
          
          if (err.code === '22007') {
             return res.status(400).json({ error: 'Formato de fecha inválido.' });
          }

          return res.status(500).json({ error: `Error al crear paciente: ${err.message}` });
        }

      case 'updatePatient': {
        const { id: pid, ...updates } = body;
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        
        const updatedPatient = await pool.query(
          `UPDATE patients SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
          [pid, ...values]
        );
        return res.status(200).json(updatedPatient.rows[0]);
      }

      case 'deletePatient':
        const { id: delPid } = req.query;
        // Delete related records first (cascade usually handles this but good to be explicit or safe)
        // Assuming cascade delete is set up in DB, otherwise we need to delete children first.
        // For safety, let's just delete the patient and let DB handle constraints or errors.
        try {
          await pool.query('DELETE FROM patients WHERE id = $1', [delPid]);
          return res.status(200).json({ success: true });
        } catch (err) {
          console.error('Error deleting patient:', err);
          return res.status(500).json({ error: 'Error al eliminar paciente. Puede tener registros asociados.' });
        }

      case 'deleteRecord':
        const { id: delRecordId } = req.query;
        try {
          await pool.query('DELETE FROM clinical_records WHERE id = $1', [delRecordId]);
          return res.status(200).json({ success: true });
        } catch (err) {
          console.error('Error deleting record:', err);
          return res.status(500).json({ error: 'Error al eliminar expediente.' });
        }

      case 'getRecordData': {
        const { recordId, patientId } = req.query;
        let targetRecordId = recordId;

        // If no recordId provided, try to find one for the patient
        if ((!targetRecordId || targetRecordId === 'undefined' || targetRecordId === 'null') && patientId) {
           // Try to find active record first
           let r = await pool.query('SELECT id FROM clinical_records WHERE patient_id = $1 AND status = \'active\' LIMIT 1', [patientId]);
           
           // If no active record, try to find ANY record
           if (r.rows.length === 0) {
             r = await pool.query('SELECT id FROM clinical_records WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1', [patientId]);
           }
           
           // If still no record, create one
           if (r.rows.length === 0) {
             const newRec = await pool.query('INSERT INTO clinical_records (patient_id, status) VALUES ($1, \'active\') RETURNING id', [patientId]);
             targetRecordId = newRec.rows[0].id;
           } else {
             targetRecordId = r.rows[0].id;
           }
        }

        if (!targetRecordId || targetRecordId === 'undefined' || targetRecordId === 'null') {
          return res.status(404).json({ error: 'Record not found' });
        }

        const recordDetails = await pool.query('SELECT * FROM clinical_records WHERE id = $1', [targetRecordId]);
        
        if (recordDetails.rows.length === 0) {
           return res.status(404).json({ error: 'Record ID not found in database' });
        }

        const patientIdFromRecord = recordDetails.rows[0]?.patient_id;

        // Helper to safely query tables that might not exist yet
        const safeQuery = async (query, params) => {
          try {
            return await pool.query(query, params);
          } catch (err) {
            if (err.code === '42P01') { // undefined_table
              return { rows: [] };
            }
            if (err.code === '42703') { // undefined_column
              console.warn(`⚠️ Column missing in query: ${query}`, err.message);
              return { rows: [] };
            }
            throw err;
          }
        };

        const [
          history, 
          physical, 
          diagnoses, 
          treatments, 
          prescriptions, 
          consents, 
          injectables,
          consultation
        ] = await Promise.all([
          safeQuery('SELECT * FROM medical_history WHERE record_id = $1', [targetRecordId]),
          safeQuery('SELECT * FROM physical_exams WHERE record_id = $1 ORDER BY created_at DESC', [targetRecordId]),
          safeQuery('SELECT * FROM diagnoses WHERE record_id = $1 ORDER BY date DESC', [targetRecordId]),
          safeQuery('SELECT * FROM treatments WHERE record_id = $1 ORDER BY date DESC', [targetRecordId]),
          safeQuery('SELECT * FROM prescriptions WHERE record_id = $1 ORDER BY date DESC', [targetRecordId]),
          safeQuery('SELECT * FROM consent_forms WHERE record_id = $1 ORDER BY id DESC', [targetRecordId]),
          safeQuery('SELECT * FROM injectables WHERE record_id = $1 ORDER BY date DESC', [targetRecordId]),
          safeQuery('SELECT * FROM consultation_info WHERE record_id = $1', [targetRecordId])
        ]);

        return res.status(200).json({
          recordId: targetRecordId,
          patientId: patientIdFromRecord,
          history: history.rows[0] || {},
          physicalExams: physical.rows,
          diagnoses: diagnoses.rows,
          treatments: treatments.rows,
          prescriptions: prescriptions.rows,
          consentForms: consents.rows,
          injectables: injectables.rows,
          consultation: consultation.rows[0] || {}
        });
      }

      case 'saveConsultation': {
        const { recordId, reason, current_illness } = body;
        
        if (!recordId) return res.status(400).json({ error: 'Record ID required' });

        // Check if exists
        const existing = await pool.query('SELECT id FROM consultation_info WHERE record_id = $1', [recordId]);

        if (existing.rows.length > 0) {
          await pool.query(
            'UPDATE consultation_info SET reason = $1, current_illness = $2, updated_at = NOW() WHERE record_id = $3',
            [reason, current_illness, recordId]
          );
        } else {
          await pool.query(
            'INSERT INTO consultation_info (record_id, reason, current_illness) VALUES ($1, $2, $3)',
            [recordId, reason, current_illness]
          );
        }
        
        return res.status(200).json({ success: true });
      }

      case 'saveHistory':
        const { record_id: hid, ...historyData } = body;
        
        // Remove system fields that shouldn't be updated manually
        delete historyData.id;
        delete historyData.created_at;
        delete historyData.updated_at;

        const existingHistory = await pool.query('SELECT id FROM medical_history WHERE record_id = $1', [hid]);
        if (existingHistory.rows.length > 0) {
           const hFields = Object.keys(historyData);
           const hValues = Object.values(historyData);
           const hSet = hFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
           await pool.query(`UPDATE medical_history SET ${hSet}, updated_at = NOW() WHERE record_id = $1`, [hid, ...hValues]);
        } else {
           const hFields = ['record_id', ...Object.keys(historyData)];
           const hValues = [hid, ...Object.values(historyData)];
           const hParams = hFields.map((_, i) => `$${i + 1}`).join(', ');
           await pool.query(`INSERT INTO medical_history (${hFields.join(', ')}) VALUES (${hParams})`, hValues);
        }
        return res.status(200).json({ success: true });

      case 'savePhysicalExam': {
        const { id: examId, record_id: pid_exam, created_at, ...examData } = body;
        
        if (examId) {
           const eFields = Object.keys(examData);
           const eValues = Object.values(examData);
           if (eFields.length > 0) {
             const eSet = eFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
             await pool.query(`UPDATE physical_exams SET ${eSet} WHERE id = $1`, [examId, ...eValues]);
           }
        } else {
           if (!pid_exam) return res.status(400).json({ error: 'Falta el ID del expediente (record_id)' });
           const eFields = ['record_id', ...Object.keys(examData)];
           const eValues = [pid_exam, ...Object.values(examData)];
           const eParams = eFields.map((_, i) => `$${i + 1}`).join(', ');
           await pool.query(`INSERT INTO physical_exams (${eFields.join(', ')}) VALUES (${eParams})`, eValues);
        }
        return res.status(200).json({ success: true });
      }

      case 'deletePhysicalExam':
        const { id: delExamId } = req.query;
        await pool.query('DELETE FROM physical_exams WHERE id = $1', [delExamId]);
        return res.status(200).json({ success: true });

      case 'saveDiagnosis':
        const { id: diagId, record_id: did, date: diagDate, ...diagData } = body;
        if (diagId) {
           const dFields = Object.keys(diagData);
           const dValues = Object.values(diagData);
           if (dFields.length > 0) {
             const dSet = dFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
             await pool.query(`UPDATE diagnoses SET ${dSet} WHERE id = $1`, [diagId, ...dValues]);
           }
           return res.status(200).json({ success: true });
        } else {
           const dFields = ['record_id', ...Object.keys(diagData)];
           const dValues = [did, ...Object.values(diagData)];
           const dParams = dFields.map((_, i) => `$${i + 1}`).join(', ');
           const newDiag = await pool.query(`INSERT INTO diagnoses (${dFields.join(', ')}) VALUES (${dParams}) RETURNING *`, dValues);
           return res.status(201).json(newDiag.rows[0]);
        }

      case 'deleteDiagnosis':
        const { id: delDiagId } = req.query;
        await pool.query('DELETE FROM diagnoses WHERE id = $1', [delDiagId]);
        return res.status(200).json({ success: true });

      case 'addTreatment':
        const { record_id: tid, ...treatData } = body;
        const tFields = ['record_id', ...Object.keys(treatData)];
        const tValues = [tid, ...Object.values(treatData)];
        const tParams = tFields.map((_, i) => `$${i + 1}`).join(', ');
        const newTreat = await pool.query(`INSERT INTO treatments (${tFields.join(', ')}) VALUES (${tParams}) RETURNING *`, tValues);
        return res.status(201).json(newTreat.rows[0]);

      case 'updateTreatment':
        const { id: upTreatId, ...upTreatData } = body;
        const upTFields = Object.keys(upTreatData);
        const upTValues = Object.values(upTreatData);
        const upTSet = upTFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        await pool.query(`UPDATE treatments SET ${upTSet} WHERE id = $1`, [upTreatId, ...upTValues]);
        return res.status(200).json({ success: true });

      case 'updateSchema':
        try {
          await pool.query('ALTER TABLE treatments ADD COLUMN IF NOT EXISTS ai_suggestion TEXT');
          return res.status(200).json({ message: 'Schema updated successfully' });
        } catch (err) {
          console.error('Schema update error:', err);
          return res.status(500).json({ error: err.message });
        }

      case 'generateTreatmentAI': {
        const { patientName, patientAge, examData, treatmentContext } = body;
        
        try {
          const { getOpenAIClient } = await import('../lib/ai-service.js');
          const openai = getOpenAIClient();

          const systemPrompt = `Eres un experto en medicina estética y dermatología avanzada. Tu tarea es generar una sugerencia de tratamiento detallada y profesional.
          
          Contexto del Paciente:
          - Nombre: ${patientName}
          - Edad: ${patientAge}
          
          Examen Físico (Contexto Clínico):
          ${JSON.stringify(examData, null, 2)}
          
          Contexto del Tratamiento (Proporcionado por el médico):
          ${treatmentContext}
          
          Instrucciones:
          Genera una respuesta estructurada en formato JSON con los siguientes campos:
          1. "treatment_name": Nombre corto y técnico del tratamiento.
          2. "description": Descripción breve del procedimiento.
          3. "objective": Objetivo principal del tratamiento.
          4. "protocol": Protocolo completo y detallado. Si es aparatología, incluye parámetros específicos (energía, filtros, frecuencia, tiempos, pasadas, etc.). Si es inyectable o tópico, detalla productos, dosis y técnica.
          
          La respuesta debe ser profesional, segura y basada en estándares médicos actuales.`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "Genera la sugerencia de tratamiento." }
            ],
            response_format: { type: "json_object" }
          });

          const result = JSON.parse(completion.choices[0].message.content);
          return res.status(200).json(result);
        } catch (aiError) {
          console.error('AI Treatment Error:', aiError);
          return res.status(500).json({ error: 'Error generating treatment suggestion: ' + aiError.message });
        }
      }

      case 'deleteTreatment':
        const { id: delTreatId } = req.query;
        await pool.query('DELETE FROM treatments WHERE id = $1', [delTreatId]);
        return res.status(200).json({ success: true });

      case 'listPrescriptions':
        const { record_id: presc_record_id } = req.query;
        const prescriptionsList = await pool.query('SELECT * FROM prescriptions WHERE record_id = $1 ORDER BY date DESC, id DESC', [presc_record_id]);
        const mappedPrescriptions = prescriptionsList.rows.map(p => ({
          ...p,
          fecha: p.date,
          diagnostico: p.diagnosis
        }));
        return res.status(200).json(mappedPrescriptions);

      case 'getPrescription':
        const { id: getPrescId } = req.query;
        const presc = await pool.query('SELECT * FROM prescriptions WHERE id = $1', [getPrescId]);
        if (presc.rows.length === 0) return res.status(404).json({ error: 'Prescription not found' });
        const pData = presc.rows[0];
        return res.status(200).json({
          ...pData,
          fecha: pData.date,
          diagnostico: pData.diagnosis,
          items: pData.items || []
        });

      case 'createPrescription':
        const { ficha_id, fecha, diagnostico, items } = body;
        const newPresc = await pool.query(
          'INSERT INTO prescriptions (record_id, date, diagnosis, items) VALUES ($1, $2, $3, $4) RETURNING id',
          [ficha_id, fecha, diagnostico, JSON.stringify(items)]
        );
        return res.status(200).json({ id: newPresc.rows[0].id, message: 'Receta created' });

      case 'updatePrescription':
        const { id: updPrescId, fecha: updFecha, diagnostico: updDiag, items: updItems } = body;
        await pool.query(
          'UPDATE prescriptions SET date = $1, diagnosis = $2, items = $3 WHERE id = $4',
          [updFecha, updDiag, JSON.stringify(updItems), updPrescId]
        );
        return res.status(200).json({ message: 'Receta updated' });

      case 'deletePrescription':
        const { id: delPrescId } = req.query;
        await pool.query('DELETE FROM prescriptions WHERE id = $1', [delPrescId]);
        return res.status(200).json({ message: 'Receta deleted' });

      case 'getTemplates':
        const templates = await pool.query('SELECT * FROM prescription_templates ORDER BY name ASC');
        const mappedTemplates = templates.rows.map(t => ({
          ...t,
          nombre: t.name
        }));
        return res.status(200).json(mappedTemplates);

      case 'saveTemplate':
        const { nombre, items: tItems } = body;
        const newTempl = await pool.query(
          'INSERT INTO prescription_templates (name, items_json) VALUES ($1, $2) RETURNING id',
          [nombre, JSON.stringify(tItems)]
        );
        return res.status(200).json({ id: newTempl.rows[0].id, message: 'Template saved' });

      case 'deleteTemplate':
        const { id: delTemplId } = req.query;
        await pool.query('DELETE FROM prescription_templates WHERE id = $1', [delTemplId]);
        return res.status(200).json({ message: 'Template deleted' });

      // --- CONSENTIMIENTOS ---

      case 'migrateConsents':
        // Add signing columns if they don't exist
        try {
          await pool.query(`
            ALTER TABLE consent_forms 
            ADD COLUMN IF NOT EXISTS signing_token VARCHAR(100),
            ADD COLUMN IF NOT EXISTS signing_status VARCHAR(20) DEFAULT 'pending';
            CREATE INDEX IF NOT EXISTS idx_consent_forms_signing_token ON consent_forms(signing_token);
          `);
          return res.status(200).json({ message: 'Consent forms table migrated' });
        } catch (err) {
          console.error('Migration error:', err);
          return res.status(500).json({ error: 'Migration failed', details: err.message });
        }

      case 'initConsents':
        // WARNING: This drops the table! Use with caution.
        await pool.query(`
          DROP TABLE IF EXISTS consent_forms;
          CREATE TABLE consent_forms (
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
          CREATE INDEX idx_consent_forms_record_id ON consent_forms(record_id);
          CREATE INDEX idx_consent_forms_patient_id ON consent_forms(patient_id);
          CREATE INDEX idx_consent_forms_signing_token ON consent_forms(signing_token);
        `);
        return res.status(200).json({ message: 'Consent forms table initialized' });

      case 'initProfessionalSignatures':
        await pool.query(`
          CREATE TABLE IF NOT EXISTS professional_signatures (
            id SERIAL PRIMARY KEY,
            professional_name VARCHAR(150),
            signature_data TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        return res.status(200).json({ message: 'Professional signatures table initialized' });

      case 'saveProfessionalSignature': {
        const { name, signature } = body;
        // Upsert based on name (simple approach for single doctor/admin)
        // Check if exists
        const existing = await pool.query('SELECT id FROM professional_signatures WHERE professional_name = $1', [name]);
        
        if (existing.rows.length > 0) {
          await pool.query(
            'UPDATE professional_signatures SET signature_data = $1, updated_at = NOW() WHERE professional_name = $2',
            [signature, name]
          );
        } else {
          await pool.query(
            'INSERT INTO professional_signatures (professional_name, signature_data) VALUES ($1, $2)',
            [name, signature]
          );
        }
        return res.status(200).json({ success: true });
      }

      case 'getProfessionalSignature': {
        const { name } = req.query;
        const result = await pool.query('SELECT signature_data FROM professional_signatures WHERE professional_name = $1', [name]);
        return res.status(200).json({ signature: result.rows[0]?.signature_data || null });
      }

      case 'generateSigningToken': {
        const { id: signId } = body;
        if (!signId) return res.status(400).json({ error: 'Consent ID required' });
        
        // Generate a simple random token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        await pool.query(
          'UPDATE consent_forms SET signing_token = $1, signing_status = $2 WHERE id = $3',
          [token, 'pending', signId]
        );
        
        return res.status(200).json({ token, url: `/consent-signing/${token}` });
      }

      case 'getSigningSession': {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token required' });
        
        const session = await pool.query(
          'SELECT * FROM consent_forms WHERE signing_token = $1',
          [token]
        );
        
        if (session.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        
        const data = session.rows[0];
        
        // Fetch patient details
        const patient = await pool.query(
          'SELECT first_name, last_name, rut, phone, birth_date FROM patients WHERE id = $1',
          [data.patient_id]
        );
        
        return res.status(200).json({
          ...data,
          patient: patient.rows[0] || {}
        });
      }

      case 'submitSignature': {
        const { token, signature, declarations, authorizations } = body;
        if (!token || !signature) return res.status(400).json({ error: 'Token and signature required' });
        
        // Get current signatures to preserve professional signature if exists
        const current = await pool.query('SELECT signatures FROM consent_forms WHERE signing_token = $1', [token]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        
        const currentSigs = current.rows[0].signatures || {};
        const newSigs = {
          ...currentSigs,
          patient_sig_data: signature,
          patient_signed_at: new Date().toISOString()
        };
        
        await pool.query(
          'UPDATE consent_forms SET signatures = $1, declarations = $2, authorizations = $3, signing_status = $4, status = $5, updated_at = NOW() WHERE signing_token = $6',
          [JSON.stringify(newSigs), JSON.stringify(declarations), JSON.stringify(authorizations || {}), 'signed', 'finalized', token]
        );
        
        return res.status(200).json({ success: true });
      }

      case 'listConsents': {
        const { patient_id: pid, record_id: rid } = req.query;
        let query = 'SELECT * FROM consent_forms WHERE ';
        let params = [];
        if (rid) {
          query += 'record_id = $1';
          params.push(rid);
        } else if (pid) {
          query += 'patient_id = $1';
          params.push(pid);
        } else {
          return res.status(400).json({ error: 'Missing patient_id or record_id' });
        }
        query += ' ORDER BY created_at DESC';
        const consents = await pool.query(query, params);
        return res.status(200).json(consents.rows);
      }

      case 'getConsent':
        const { id: cid } = req.query;
        const consent = await pool.query('SELECT * FROM consent_forms WHERE id = $1', [cid]);
        if (consent.rows.length === 0) return res.status(404).json({ error: 'Consent not found' });
        return res.status(200).json(consent.rows[0]);

      case 'saveConsent': {
        const { 
          id: saveCid, 
          record_id: saveRid, 
          patient_id: savePid,
          status,
          created_by,
          procedure_type,
          zone,
          sessions,
          objectives,
          description,
          risks,
          benefits,
          alternatives,
          pre_care,
          post_care,
          contraindications,
          critical_antecedents,
          authorizations,
          declarations,
          signatures,
          attachments
        } = body;

        if (saveCid) {
          // Update
          const updateQuery = `
            UPDATE consent_forms SET
              status = COALESCE($1, status),
              updated_at = NOW(),
              procedure_type = COALESCE($2, procedure_type),
              zone = COALESCE($3, zone),
              sessions = COALESCE($4, sessions),
              objectives = COALESCE($5, objectives),
              description = COALESCE($6, description),
              risks = COALESCE($7, risks),
              benefits = COALESCE($8, benefits),
              alternatives = COALESCE($9, alternatives),
              pre_care = COALESCE($10, pre_care),
              post_care = COALESCE($11, post_care),
              contraindications = COALESCE($12, contraindications),
              critical_antecedents = COALESCE($13, critical_antecedents),
              authorizations = COALESCE($14, authorizations),
              declarations = COALESCE($15, declarations),
              signatures = COALESCE($16, signatures),
              attachments = COALESCE($17, attachments)
            WHERE id = $18 RETURNING *
          `;
          const updated = await pool.query(updateQuery, [
            status, procedure_type, zone, sessions, 
            JSON.stringify(objectives), description, JSON.stringify(risks), JSON.stringify(benefits), JSON.stringify(alternatives),
            JSON.stringify(pre_care), JSON.stringify(post_care), JSON.stringify(contraindications),
            JSON.stringify(critical_antecedents), JSON.stringify(authorizations), JSON.stringify(declarations),
            JSON.stringify(signatures), JSON.stringify(attachments),
            saveCid
          ]);
          return res.status(200).json(updated.rows[0]);
        } else {
          // Create
          const insertQuery = `
            INSERT INTO consent_forms (
              record_id, patient_id, status, created_by,
              procedure_type, zone, sessions,
              objectives, description, risks, benefits, alternatives,
              pre_care, post_care, contraindications,
              critical_antecedents, authorizations, declarations,
              signatures, attachments
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6, $7,
              $8, $9, $10, $11, $12,
              $13, $14, $15,
              $16, $17, $18,
              $19, $20
            ) RETURNING *
          `;
          const created = await pool.query(insertQuery, [
            saveRid, savePid, status || 'draft', created_by,
            procedure_type, zone, sessions,
            JSON.stringify(objectives || []), description || '', JSON.stringify(risks || []), JSON.stringify(benefits || []), JSON.stringify(alternatives || []),
            JSON.stringify(pre_care || []), JSON.stringify(post_care || []), JSON.stringify(contraindications || []),
            JSON.stringify(critical_antecedents || {}), JSON.stringify(authorizations || {}), JSON.stringify(declarations || {}),
            JSON.stringify(signatures || {}), JSON.stringify(attachments || [])
          ]);
          return res.status(200).json(created.rows[0]);
        }
      }

      case 'deleteConsent':
        const { id: delCid } = req.query;
        await pool.query('DELETE FROM consent_forms WHERE id = $1', [delCid]);
        return res.status(200).json({ message: 'Consent deleted' });

      case 'generateDiagnosisAI': {
        const { examData, patientName } = body;
        if (!examData) return res.status(400).json({ error: 'Missing exam data' });

        try {
          const { getOpenAIClient } = await import('../lib/ai-service.js');
          const openai = getOpenAIClient();
          
          let lesions = [];
          try {
            const faceMarks = typeof examData.face_map_data === 'string' ? JSON.parse(examData.face_map_data || '[]') : (examData.face_map_data || []);
            const bodyMarks = typeof examData.body_map_data === 'string' ? JSON.parse(examData.body_map_data || '[]') : (examData.body_map_data || []);
            lesions = [...faceMarks, ...bodyMarks];
          } catch (e) {
            console.error('Error parsing map data:', e);
          }

          const lesionNames = [...new Set(lesions.map(l => l.category))];
          let linkedDiagnostics = [];

          if (lesionNames.length > 0) {
            try {
              const tableCheck = await pool.query("SELECT to_regclass('public.lesiones_maestras')");
              if (tableCheck.rows[0].to_regclass) {
                const placeholders = lesionNames.map((_, i) => `$${i + 1}`).join(',');
                const query = `SELECT diagnosticos_vinculados FROM lesiones_maestras WHERE nombre IN (${placeholders})`;
                const results = await pool.query(query, lesionNames);
                
                results.rows.forEach(row => {
                  if (row.diagnosticos_vinculados) {
                    const diags = row.diagnosticos_vinculados.split(';').map(d => d.trim());
                    linkedDiagnostics.push(...diags);
                  }
                });
              }
            } catch (dbError) {
              console.warn('Warning: Could not fetch linked diagnostics from DB:', dbError.message);
            }
          }
          linkedDiagnostics = [...new Set(linkedDiagnostics)];

          const systemPrompt = `Eres un dermatólogo experto y asistente médico de IA. Tu tarea es analizar los datos del examen físico de un paciente y sugerir un diagnóstico preliminar y notas clínicas detalladas.
          
          Utiliza la siguiente información:
          - Datos del paciente: ${patientName || 'Paciente'}
          - Tipo de piel: ${examData.skin_type || 'No especificado'}
          - Fototipo: ${examData.phototype || 'No especificado'}
          - Escala Glogau: ${examData.glogau_scale || 'No especificado'}
          - Descripción de lesiones: ${examData.lesions_description || 'Sin descripción adicional'}
          - Lesiones identificadas: ${lesionNames.join(', ') || 'Ninguna'}
          - Diagnósticos asociados (BD): ${linkedDiagnostics.join(', ') || 'Ninguno (Usar conocimiento médico general)'}
          
          Instrucciones:
          1. Genera un "Diagnóstico Preliminar" conciso basado en las lesiones y los diagnósticos asociados. Si hay múltiples posibilidades, lístalas por probabilidad.
          2. Genera "Notas/Observaciones" detalladas que justifiquen el diagnóstico basándose en los parámetros clínicos (tipo de piel, fototipo, Glogau) y las lesiones encontradas. Incluye recomendaciones generales de estudio o tratamiento si aplica.
          3. Mantén un tono profesional, médico y objetivo.
          4. Responde SOLAMENTE en formato JSON válido con las claves "diagnosis" y "notes".`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "Genera el diagnóstico y las notas clínicas." }
            ],
            response_format: { type: "json_object" }
          });

          const result = JSON.parse(completion.choices[0].message.content);
          return res.status(200).json(result);
        } catch (aiError) {
          console.error('AI Service Error:', aiError);
          return res.status(500).json({ error: 'Error generating diagnosis: ' + aiError.message });
        }
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Clinical Records API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
