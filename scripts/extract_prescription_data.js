import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../src/data/legacy_centro.db');
const outputDir = path.join(__dirname, '../src/components/admin/ficha-clinica/data');

const db = new Database(dbPath, { readonly: true });

function getUniqueValues(column) {
    try {
        const rows = db.prepare(`SELECT DISTINCT ${column} FROM receta_items WHERE ${column} IS NOT NULL AND ${column} != '' ORDER BY ${column}`).all();
        return rows.map(r => r[column]);
    } catch (e) {
        console.error(`Error extracting ${column}:`, e.message);
        return [];
    }
}

const prescriptionOptions = {
    presentations: getUniqueValues('presentacion'),
    doses: getUniqueValues('dosis'),
    frequencies: getUniqueValues('frecuencia'),
    routes: getUniqueValues('via'),
    durations: getUniqueValues('duracion'),
    turns: ['Mañana', 'Tarde', 'Noche', 'Día', 'Condicional'] // Static or extracted
};

// Also get medications list flat
const medications = db.prepare("SELECT elemento FROM medicamentos_maestros WHERE activo = 1 ORDER BY elemento").all().map(r => r.elemento);
prescriptionOptions.medications = medications;

fs.writeFileSync(path.join(outputDir, 'prescription_options.json'), JSON.stringify(prescriptionOptions, null, 2));
console.log('Extracted prescription_options.json');
