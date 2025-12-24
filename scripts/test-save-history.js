
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function testSaveHistory() {
    const existingHistory = await pool.query('SELECT id, record_id FROM medical_history LIMIT 1');
    let hid;
    let isUpdate = false;

    if (existingHistory.rows.length > 0) {
      hid = existingHistory.rows[0].record_id;
      isUpdate = true;
      console.log(`Found existing history for record_id ${hid}`);
    } else {
      // Find a record without history or just use 1
      hid = 1;
      console.log(`No existing history found, using record_id ${hid}`);
    }
  
  // Simulate formData from frontend
  const historyDataRaw = {
    id: existingHistory.rows[0]?.id || 99999, // Use existing ID or dummy
    record_id: hid,
    updated_at: '2024-01-01T00:00:00.000Z',
    pathological: 'None',
    facial_routine: 'Soap and water'
  };

  // Logic from api/records.js
  try {
    // Remove record_id from data to update (simulating const { record_id: hid, ...historyData } = body)
    const { record_id: _, ...historyData } = historyDataRaw;
    
    // Remove system fields that shouldn't be updated manually
    delete historyData.id;
    delete historyData.created_at;
    delete historyData.updated_at;

    console.log('Data to update:', historyData);

    const check = await pool.query('SELECT id FROM medical_history WHERE record_id = $1', [hid]);
    
    if (check.rows.length > 0) {
       console.log('Updating existing history...');
       const hFields = Object.keys(historyData);
       const hValues = Object.values(historyData);
       const hSet = hFields.map((f, i) => `${f} = $${i + 2}`).join(', ');
       
       const query = `UPDATE medical_history SET ${hSet}, updated_at = NOW() WHERE record_id = $1`;
       console.log('Query:', query);
       console.log('Values:', [hid, ...hValues]);
       
       await pool.query(query, [hid, ...hValues]);
       console.log('Update successful');
    } else {
       console.log('Inserting new history...');
       const hFields = ['record_id', ...Object.keys(historyData)];
       const hValues = [hid, ...Object.values(historyData)];
       const hParams = hFields.map((_, i) => `$${i + 1}`).join(', ');
       const query = `INSERT INTO medical_history (${hFields.join(', ')}) VALUES (${hParams})`;
       console.log('Query:', query);
       console.log('Values:', hValues);
       await pool.query(query, hValues);
       console.log('Insert successful');
    }

  } catch (err) {
    console.error('❌ Error in test:', err);
  } finally {
    await pool.end();
  }
}

testSaveHistory();
