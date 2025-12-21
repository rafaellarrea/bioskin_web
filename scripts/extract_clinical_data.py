import sqlite3
import json
import os

# Configuration
DB_PATH = r"c:\Users\Gamer\Documents\BIO SKIN\BIOTECH\software\centroEstetico\database\centro.db"
OUTPUT_DIR = r"c:\Users\Gamer\Documents\BIO SKIN\BIOTECH\WEBSITE\2.0\project-bolt-sb1-cpovnqbq (1)\project2.0\src\components\admin\ficha-clinica\data"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dump_table_to_json(table_name, output_filename, query=None):
    conn = get_db_connection()
    try:
        if query is None:
            query = f"SELECT * FROM {table_name}"
        
        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        
        data = [dict(row) for row in rows]
        
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully exported {len(data)} rows from {table_name} to {output_filename}")
    except Exception as e:
        print(f"Error exporting {table_name}: {e}")
    finally:
        conn.close()

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # 1. Diagnoses
    dump_table_to_json('categorias_diagnosticas_maestras', 'diagnosis_categories.json')
    dump_table_to_json('diagnosticos_maestros', 'diagnoses.json')
    dump_table_to_json('lesiones_maestras', 'lesions.json')

    # 2. History (Antecedentes)
    dump_table_to_json('categorias_antecedentes_maestras', 'history_categories.json')
    dump_table_to_json('antecedentes_maestros', 'history_items.json')

    # 3. Physical Exam
    dump_table_to_json('examen_fisico_maestros', 'physical_exam_options.json')

    # 4. Treatments & Medications
    dump_table_to_json('tratamientos_maestros', 'treatments.json')
    dump_table_to_json('inyectables_maestros', 'injectables.json')
    dump_table_to_json('medicamentos_maestros', 'medications.json')
    dump_table_to_json('categorias_tratamientos_maestras', 'treatment_categories.json')

    # 5. Consents
    dump_table_to_json('consentimientos_maestros', 'consent_templates.json')

if __name__ == "__main__":
    main()
