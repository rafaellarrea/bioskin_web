
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
      raw_note
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `;

  const values = [
    record.assistant_name,
    record.patient_name,
    record.intervention_date,
    record.clinic,
    record.total_payment,
    JSON.stringify(record.doctor_fees), // Ensure JSON is stringified for JSONB column if driver needs it
    record.expenses || 0,
    record.additional_income || 0,
    record.net_income_juan_pablo,
    record.raw_note
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error saving finance record:', error);
    throw error;
  }
}
