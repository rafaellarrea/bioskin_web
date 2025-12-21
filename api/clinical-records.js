import pool, { initClinicalDatabase } from '../lib/neon-clinical-db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ensure DB is initialized (lazy init)
    // In production, this should be done via a migration script, but for this setup we'll check/run it.
    // To avoid running it every time, we could check a flag or just rely on IF NOT EXISTS.
    // For now, we'll assume it's initialized or call it on specific 'init' action.

    const { action } = req.query;
    const body = req.body || {};

    if (!pool) {
      return res.status(500).json({ error: 'Database connection not configured' });
    }

    switch (action) {
      case 'init':
        await initClinicalDatabase();
        return res.status(200).json({ message: 'Database initialized' });

      case 'init':
        await initClinicalDatabase();
        return res.status(200).json({ message: 'Database initialized' });

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
        const { first_name, last_name, rut, email, phone, birth_date, gender, address, occupation } = body;
        
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
          pool.query('SELECT * FROM physical_exams WHERE record_id = $1', [targetRecordId]),
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
          physicalExam: physical.rows[0] || {},
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
        const { record_id: pid_exam, ...examData } = body;
        // Upsert physical exam
        const existingExam = await pool.query('SELECT id FROM physical_exams WHERE record_id = $1', [pid_exam]);
        if (existingExam.rows.length > 0) {
           const eFields = Object.keys(examData);
           const eValues = Object.values(examData);
           const eSet = eFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
           await pool.query(`UPDATE physical_exams SET ${eSet} WHERE record_id = $1`, [pid_exam, ...eValues]);
        } else {
           const eFields = ['record_id', ...Object.keys(examData)];
           const eValues = [pid_exam, ...Object.values(examData)];
           const eParams = eFields.map((_, i) => `$${i + 1}`).join(', ');
           await pool.query(`INSERT INTO physical_exams (${eFields.join(', ')}) VALUES (${eParams})`, eValues);
        }
        return res.status(200).json({ success: true });

      case 'addDiagnosis':
        const { record_id: did, ...diagData } = body;
        const dFields = ['record_id', ...Object.keys(diagData)];
        const dValues = [did, ...Object.values(diagData)];
        const dParams = dFields.map((_, i) => `$${i + 1}`).join(', ');
        const newDiag = await pool.query(`INSERT INTO diagnoses (${dFields.join(', ')}) VALUES (${dParams}) RETURNING *`, dValues);
        return res.status(201).json(newDiag.rows[0]);

      case 'addTreatment':
        const { record_id: tid, ...treatData } = body;
        const tFields = ['record_id', ...Object.keys(treatData)];
        const tValues = [tid, ...Object.values(treatData)];
        const tParams = tFields.map((_, i) => `$${i + 1}`).join(', ');
        const newTreat = await pool.query(`INSERT INTO treatments (${tFields.join(', ')}) VALUES (${tParams}) RETURNING *`, tValues);
        return res.status(201).json(newTreat.rows[0]);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Clinical Records API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
