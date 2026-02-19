
import { Pool } from '@neondatabase/serverless';

let poolInstance = null;

function getPool() {
  if (poolInstance) return poolInstance;

  const connectionString = process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error('Database connection string is missing');
  }

  poolInstance = new Pool({ connectionString });
  return poolInstance;
}

export async function saveFinanceRecord(record) {
  const pool = getPool();
  
  const query = `
    INSERT INTO external_finance_records (
      assistant_name,
      patient_name,
      intervention_date,
      clinic,
      total_payment,
      doctor_fees,
      expenses,
      additional_income,
      net_income_juan_pablo,
      raw_note,
      intervention_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id
  `;

  const values = [
    record.assistant_name,
    record.patient_name,
    record.intervention_date || record.date, // Handle both key names
    record.clinic || 'BIOSKIN', // Default clinic if missing
    record.total_payment || record.total_amount, // Handle both key names
    JSON.stringify(record.doctor_fees || {}), 
    record.expenses || 0,
    record.additional_income || 0,
    record.net_income_juan_pablo || 0, // Default to 0 if not calculated yet
    record.raw_note,
    record.intervention_type || 'Consulta' // Default type
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error saving finance record:', error);
    throw error;
  }
}

export async function getFinanceRecords(filters = {}) {
  const pool = getPool();
  let query = `SELECT * FROM external_finance_records WHERE 1=1`;
  const values = [];
  let index = 1;

  if (filters.assistant) {
    query += ` AND assistant_name = $${index++}`;
    values.push(filters.assistant);
  }
  
  if (filters.month) {
    // Expects 'YYYY-MM'
    query += ` AND TO_CHAR(intervention_date, 'YYYY-MM') = $${index++}`;
    values.push(filters.month);
  }

  query += ` ORDER BY intervention_date DESC`;

  try {
    const result = await pool.query(query, values);
    return result.rows.map(row => ({
      ...row,
      // Parse doctor_fees in case it comes as a string (some drivers do auto-parse JSON, others don't)
      doctor_fees: typeof row.doctor_fees === 'string' ? JSON.parse(row.doctor_fees) : row.doctor_fees
    }));
  } catch (error) {
    console.error('Error fetching finance records:', error);
    throw error;
  }
}

export async function updateFinanceRecord(id, updates) {
  const pool = getPool();
  
  // Build dynamic update query
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    // Skip id or created_at
    if (key === 'id' || key === 'created_at') continue;
    
    fields.push(`${key} = $${index++}`);
    values.push(key === 'doctor_fees' ? JSON.stringify(value) : value);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE external_finance_records 
    SET ${fields.join(', ')} 
    WHERE id = $${index}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating finance record:', error);
    throw error;
  }
}

export async function deleteFinanceRecord(id) {
  const pool = getPool();
  try {
    const result = await pool.query('DELETE FROM external_finance_records WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting finance record:', error);
    throw error;
  }
}
