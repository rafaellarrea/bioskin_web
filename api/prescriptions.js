import { db } from '../lib/database.js';

export default async function handler(req, res) {
  const { method } = req;
  const { action, id, record_id } = req.query;

  try {
    // Ensure tables exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS recetas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ficha_id INTEGER,
        fecha TEXT,
        diagnostico TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS receta_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receta_id INTEGER,
        medicamento TEXT,
        presentacion TEXT,
        dosis TEXT,
        frecuencia TEXT,
        via TEXT,
        duracion TEXT,
        turno TEXT,
        indicaciones TEXT,
        orden INTEGER,
        FOREIGN KEY(receta_id) REFERENCES recetas(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS receta_plantillas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        items_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    if (method === 'GET') {
      if (action === 'list') {
        const rows = db.prepare('SELECT * FROM recetas WHERE ficha_id = ? ORDER BY fecha DESC, id DESC').all(record_id);
        return res.status(200).json(rows);
      }
      
      if (action === 'get') {
        const receta = db.prepare('SELECT * FROM recetas WHERE id = ?').get(id);
        if (!receta) return res.status(404).json({ error: 'Receta not found' });
        
        const items = db.prepare('SELECT * FROM receta_items WHERE receta_id = ? ORDER BY orden ASC').all(id);
        return res.status(200).json({ ...receta, items });
      }

      if (action === 'templates') {
        const templates = db.prepare('SELECT * FROM receta_plantillas ORDER BY nombre ASC').all();
        return res.status(200).json(templates);
      }
    }

    if (method === 'POST') {
      if (action === 'create') {
        const { ficha_id, fecha, diagnostico, items } = req.body;
        
        const insert = db.prepare('INSERT INTO recetas (ficha_id, fecha, diagnostico) VALUES (?, ?, ?)');
        const result = insert.run(ficha_id, fecha, diagnostico);
        const recetaId = result.lastInsertRowid;

        const insertItem = db.prepare(`
          INSERT INTO receta_items (receta_id, medicamento, presentacion, dosis, frecuencia, via, duracion, turno, indicaciones, orden)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const createMany = db.transaction((items) => {
          items.forEach((item, index) => {
            insertItem.run(
              recetaId,
              item.medicamento,
              item.presentacion,
              item.dosis,
              item.frecuencia,
              item.via,
              item.duracion,
              item.turno,
              item.indicaciones,
              index
            );
          });
        });

        createMany(items);
        return res.status(200).json({ id: recetaId, message: 'Receta created' });
      }

      if (action === 'saveTemplate') {
        const { nombre, items } = req.body;
        const stmt = db.prepare('INSERT INTO receta_plantillas (nombre, items_json) VALUES (?, ?)');
        const result = stmt.run(nombre, JSON.stringify(items));
        return res.status(200).json({ id: result.lastInsertRowid, message: 'Template saved' });
      }
    }

    if (method === 'PUT') {
      if (action === 'update') {
        const { id, fecha, diagnostico, items } = req.body;
        
        db.prepare('UPDATE recetas SET fecha = ?, diagnostico = ? WHERE id = ?').run(fecha, diagnostico, id);
        
        // Replace items
        db.prepare('DELETE FROM receta_items WHERE receta_id = ?').run(id);
        
        const insertItem = db.prepare(`
          INSERT INTO receta_items (receta_id, medicamento, presentacion, dosis, frecuencia, via, duracion, turno, indicaciones, orden)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const createMany = db.transaction((items) => {
          items.forEach((item, index) => {
            insertItem.run(
              id,
              item.medicamento,
              item.presentacion,
              item.dosis,
              item.frecuencia,
              item.via,
              item.duracion,
              item.turno,
              item.indicaciones,
              index
            );
          });
        });

        createMany(items);
        return res.status(200).json({ message: 'Receta updated' });
      }
    }

    if (method === 'DELETE') {
      if (action === 'delete') {
        db.prepare('DELETE FROM recetas WHERE id = ?').run(id);
        return res.status(200).json({ message: 'Receta deleted' });
      }
      
      if (action === 'deleteTemplate') {
        db.prepare('DELETE FROM receta_plantillas WHERE id = ?').run(id);
        return res.status(200).json({ message: 'Template deleted' });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
