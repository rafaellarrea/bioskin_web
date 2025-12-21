import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../src/data/legacy_centro.db');
const outputDir = path.join(__dirname, '../src/components/admin/ficha-clinica/data');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const db = new Database(dbPath, { readonly: true });

function extractTable(tableName, query, transform) {
    try {
        const rows = db.prepare(query).all();
        const data = transform ? transform(rows) : rows;
        return data;
    } catch (e) {
        console.error(`Error extracting ${tableName}:`, e.message);
        return [];
    }
}

// 1. History (Antecedentes)
const historyData = extractTable('antecedentes_maestros', 
    "SELECT categoria_id, elemento FROM antecedentes_maestros WHERE activo = 1",
    (rows) => {
        // Group by category
        const grouped = {};
        rows.forEach(row => {
            if (!grouped[row.categoria_id]) grouped[row.categoria_id] = [];
            grouped[row.categoria_id].push(row.elemento);
        });
        return grouped;
    }
);
fs.writeFileSync(path.join(outputDir, 'history_options.json'), JSON.stringify(historyData, null, 2));
console.log('Extracted history_options.json');

// 2. Physical Exam (Examen Físico)
const physicalExamData = extractTable('examen_fisico_maestros',
    "SELECT categoria, elemento FROM examen_fisico_maestros WHERE activo = 1",
    (rows) => {
        const grouped = {};
        rows.forEach(row => {
            if (!grouped[row.categoria]) grouped[row.categoria] = [];
            grouped[row.categoria].push(row.elemento);
        });
        return grouped;
    }
);
fs.writeFileSync(path.join(outputDir, 'physical_exam_options.json'), JSON.stringify(physicalExamData, null, 2));
console.log('Extracted physical_exam_options.json');

// 3. Diagnosis (Diagnóstico)
// Combine diagnosticos_maestros and lesiones_maestras
const diagnosisData = extractTable('diagnosticos_maestros',
    "SELECT categoria_id, nombre FROM diagnosticos_maestros WHERE activo = 1",
    (rows) => {
        // We might need category names, but for now let's just list them or group by ID
        // Actually, let's get category names too
        const categories = db.prepare("SELECT id, categoria FROM categorias_diagnosticas_maestras").all();
        const catMap = {};
        categories.forEach(c => catMap[c.id] = c.categoria);

        const grouped = {};
        rows.forEach(row => {
            const catName = catMap[row.categoria_id] || 'General';
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(row.nombre);
        });
        return grouped;
    }
);
// Also lesions
const lesionsData = extractTable('lesiones_maestras',
    "SELECT nombre FROM lesiones_maestras WHERE activo = 1",
    (rows) => rows.map(r => r.nombre)
);
// Add lesions to diagnosis data under 'Lesiones'
diagnosisData['Lesiones'] = lesionsData;

fs.writeFileSync(path.join(outputDir, 'diagnosis_options.json'), JSON.stringify(diagnosisData, null, 2));
console.log('Extracted diagnosis_options.json');

// 4. Treatment (Tratamiento)
const treatmentData = extractTable('tratamientos_maestros',
    "SELECT categoria, elemento FROM tratamientos_maestros WHERE activo = 1",
    (rows) => {
        const grouped = {};
        rows.forEach(row => {
            if (!grouped[row.categoria]) grouped[row.categoria] = [];
            grouped[row.categoria].push(row.elemento);
        });
        return grouped;
    }
);

const injectablesData = extractTable('inyectables_maestros',
    "SELECT categoria, elemento FROM inyectables_maestros WHERE activo = 1",
    (rows) => {
        const grouped = {};
        rows.forEach(row => {
            if (!grouped[row.categoria]) grouped[row.categoria] = [];
            grouped[row.categoria].push(row.elemento);
        });
        return grouped;
    }
);

const medicationsData = extractTable('medicamentos_maestros',
    "SELECT categoria, elemento FROM medicamentos_maestros WHERE activo = 1",
    (rows) => {
        const grouped = {};
        rows.forEach(row => {
            if (!grouped[row.categoria]) grouped[row.categoria] = [];
            grouped[row.categoria].push(row.elemento);
        });
        return grouped;
    }
);

const fullTreatmentData = {
    procedures: treatmentData,
    injectables: injectablesData,
    medications: medicationsData
};

// 5. Equipment (Equipos)
const equipmentData = extractTable('equipos',
    "SELECT nombre FROM equipos WHERE activo = 1",
    (rows) => rows.map(r => r.nombre)
);
fullTreatmentData.equipment = equipmentData;

fs.writeFileSync(path.join(outputDir, 'treatment_options.json'), JSON.stringify(fullTreatmentData, null, 2));
console.log('Extracted treatment_options.json');

console.log('Extraction complete.');
