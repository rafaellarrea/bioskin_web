
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL);

async function migrate() {
  try {
    console.log('Adding preferred_display_unit column to inventory_items...');
    
    await sql`
      ALTER TABLE inventory_items 
      ADD COLUMN IF NOT EXISTS preferred_display_unit VARCHAR(20) DEFAULT 'absolute';
    `;
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
