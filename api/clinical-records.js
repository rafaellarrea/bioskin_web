// import pg from 'pg';
// const { Pool } = pg;

// Global flag to track initialization in the current container instance
let dbInitialized = false;
let poolInstance = null;

function getPool() {
  return null; // Disabled for debug
  /*
  if (poolInstance) return poolInstance;
  const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) return null;
  try {
    poolInstance = new Pool({ connectionString });
    return poolInstance;
  } catch (e) {
    console.error(e);
    return null;
  }
  */
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // DEBUG MODE
  return res.status(200).json({ status: 'ok', message: 'DEBUG MODE: API is reachable' });

  try {
    const { action } = req.query;
    const body = req.body || {};

    // Get pool instance lazily
    const pool = getPool();

    if (!pool) {
      console.error('❌ Database connection missing');
      return res.status(500).json({ error: 'Database connection not configured. Check NEON_DATABASE_URL.' });
    }

    // Auto-initialize database if not done yet in this instance
    if (!dbInitialized) {
      // Inline initialization logic or skip for now to test connection
      // For now, we assume tables exist or we skip init to prevent crash
      dbInitialized = true; 
    }

    switch (action) {
      case 'health':
        return res.status(200).json({ status: 'ok', message: 'Clinical Records API is running' });

      case 'init':
        // await initClinicalDatabase(); // Disabled for now
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

          // Handle empty strings as null for optional fields to avoid unique constraint violations (RUT) or date errors
          const cleanRut = rut && rut.trim() !== '' ? rut.trim() : null;
          const cleanBirthDate = birth_date && birth_date.trim() !== '' ? birth_date : null;
          
          const newPatient = await pool.query(
            `INSERT INTO patients (first_name, last_name, rut, email, phone, birth_date, gender, address, occupation) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [first_name, last_name, cleanRut, email, phone, cleanBirthDate, gender, address, occupation]
          );
          // Create an initial clinical record for the patient
          await pool.query('INSERT INTO clinical_records (patient_id) VALUES ($1)', [newPatient.rows[0].id]);
          
          return res.status(201).json(newPatient.rows[0]);
        } catch (err) {
          console.error('❌ Error creating patient:', err);
          
          // Handle unique constraint violations
          if (err.code === '23505') {
            if (err.detail.includes('rut')) {
              return res.status(400).json({ error: 'El RUT ya está registrado en el sistema.' });
            }
            if (err.detail.includes('email')) {
              return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
            }
          }
          
          // Handle invalid date format
          if (err.code === '22007') {
             return res.status(400).json({ error: 'Formato de fecha inválido.' });
          }

          return res.status(500).json({ error: `Error al crear paciente: ${err.message}` });
        }

      case 'updatePatient':
        const { id: pid, ...updates } = body;
        // Construct dynamic update query
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        
        const updatedPatient = await pool.query(
          `UPDATE patients SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
          [pid, ...values]
        );
        return res.status(200).json(updatedPatient.rows[0]);

      case 'getRecordData':
        // Fetch all data for a specific record (or patient's active record)
        const { recordId, patientId } = req.query;
        let targetRecordId = recordId;

        if (!targetRecordId && patientId) {
           const r = await pool.query('SELECT id FROM clinical_records WHERE patient_id = $1 AND status = \'active\' LIMIT 1', [patientId]);
           if (r.rows.length > 0) targetRecordId = r.rows[0].id;
        }

        if (!targetRecordId) return res.status(404).json({ error: 'Record not found' });

        // Fetch record details to get patient_id
        const recordDetails = await pool.query('SELECT * FROM clinical_records WHERE id = $1', [targetRecordId]);
        const patientIdFromRecord = recordDetails.rows[0]?.patient_id;

        // Fetch data from all tables in parallel
        const [
          history, 
          physical, 
          diagnoses, 
          treatments, 
          prescriptions, 
          consents, 
          injectables
        ] = await Promise.all([
          pool.query('SELECT * FROM medical_history WHERE record_id = $1', [targetRecordId]),
          pool.query('SELECT * FROM physical_exams WHERE record_id = $1 ORDER BY created_at DESC', [targetRecordId]),
          pool.query('SELECT * FROM diagnoses WHERE record_id = $1 ORDER BY date DESC', [targetRecordId]),
          pool.query('SELECT * FROM treatments WHERE record_id = $1 ORDER BY date DESC', [targetRecordId]),
          pool.query('SELECT * FROM prescriptions WHERE record_id = $1 ORDER BY date DESC', [targetRecordId]),
          pool.query('SELECT * FROM consent_forms WHERE record_id = $1 ORDER BY signed_at DESC', [targetRecordId]),
          pool.query('SELECT * FROM injectables WHERE record_id = $1 ORDER BY date DESC', [targetRecordId])
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
          injectables: injectables.rows
        });

      case 'saveHistory':
        const { record_id: hid, ...historyData } = body;
        // Upsert history
        const existingHistory = await pool.query('SELECT id FROM medical_history WHERE record_id = $1', [hid]);
        if (existingHistory.rows.length > 0) {
           // Update
           const hFields = Object.keys(historyData);
           const hValues = Object.values(historyData);
           const hSet = hFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
           await pool.query(`UPDATE medical_history SET ${hSet}, updated_at = NOW() WHERE record_id = $1`, [hid, ...hValues]);
        } else {
           // Insert
           const hFields = ['record_id', ...Object.keys(historyData)];
           const hValues = [hid, ...Object.values(historyData)];
           const hParams = hFields.map((_, i) => `$${i + 1}`).join(', ');
           await pool.query(`INSERT INTO medical_history (${hFields.join(', ')}) VALUES (${hParams})`, hValues);
        }
        return res.status(200).json({ success: true });

      case 'savePhysicalExam':
        const { id: examId, record_id: pid_exam, created_at, ...examData } = body;
        
        console.log('💾 Saving Physical Exam:', { examId, pid_exam, dataKeys: Object.keys(examData) });

        if (examId) {
           // Update existing exam
           const eFields = Object.keys(examData);
           const eValues = Object.values(examData);
           
           if (eFields.length > 0) {
             const eSet = eFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
             await pool.query(`UPDATE physical_exams SET ${eSet} WHERE id = $1`, [examId, ...eValues]);
           }
        } else {
           // Insert new exam
           if (!pid_exam) {
             return res.status(400).json({ error: 'Falta el ID del expediente (record_id)' });
           }

           const eFields = ['record_id', ...Object.keys(examData)];
           const eValues = [pid_exam, ...Object.values(examData)];
           const eParams = eFields.map((_, i) => `$${i + 1}`).join(', ');
           await pool.query(`INSERT INTO physical_exams (${eFields.join(', ')}) VALUES (${eParams})`, eValues);
        }
        return res.status(200).json({ success: true });

      case 'deletePhysicalExam':
        const { id: delExamId } = req.query;
        await pool.query('DELETE FROM physical_exams WHERE id = $1', [delExamId]);
        return res.status(200).json({ success: true });

      case 'saveDiagnosis':
        const { id: diagId, record_id: did, date: diagDate, ...diagData } = body;
        
        if (diagId) {
           // Update
           const dFields = Object.keys(diagData);
           const dValues = Object.values(diagData);
           if (dFields.length > 0) {
             const dSet = dFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
             await pool.query(`UPDATE diagnoses SET ${dSet} WHERE id = $1`, [diagId, ...dValues]);
           }
           return res.status(200).json({ success: true });
        } else {
           // Insert
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

      // === PRESCRIPTIONS ===
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

      case 'generateDiagnosisAI':
        const { examData, patientName } = body;
        if (!examData) return res.status(400).json({ error: 'Missing exam data' });

        // Dynamic import for OpenAI
        const { getOpenAIClient } = await import('../lib/ai-service.js');
        const openai = getOpenAIClient();
        
        // 1. Parse lesions
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

        // 2. Try to fetch linked diagnostics from DB (if table exists)
        if (lesionNames.length > 0) {
          try {
            // Check if table exists first to avoid error
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

        // 3. Call OpenAI
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

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Clinical Records API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
