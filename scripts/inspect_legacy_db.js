import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../src/data/legacy_centro.db');
const db = new Database(dbPath, { readonly: true });

// List tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

// For each table, get columns and first row
tables.forEach(table => {
    try {
        const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
        const count = db.prepare(`SELECT count(*) as count FROM ${table.name}`).get();
        console.log(`\nTable: ${table.name} (${count.count} rows)`);
        console.log('Columns:', columns.map(c => c.name).join(', '));
        
        if (count.count > 0) {
            const firstRow = db.prepare(`SELECT * FROM ${table.name} LIMIT 1`).get();
            console.log('Sample:', firstRow);
        }
    } catch (e) {
        console.error(`Error reading table ${table.name}:`, e.message);
    }
});
