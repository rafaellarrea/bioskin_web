
import { Pool } from '@neondatabase/serverless';

export default async function handler(request, response) {
  const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    return response.status(500).json({ error: 'Database configuration missing' });
  }

  const pool = new Pool({ connectionString });
  
  if (request.method === 'GET') {
    const { id, type, status, search, limit = 50 } = request.query;
    
    try {
      if (id) {
         const result = await pool.query('SELECT * FROM technical_service_documents WHERE id = $1', [id]);
         if (result.rows.length === 0) return response.status(404).json({ error: 'Document not found' });
         return response.status(200).json(result.rows[0]);
      }

      let query = 'SELECT * FROM technical_service_documents WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (type) {
        query += ` AND document_type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }
      
      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (search) {
        query += ` AND (client_name ILIKE $${paramIndex} OR ticket_number ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC LIMIT 50'; // Safe limit

      const result = await pool.query(query, params);
      return response.status(200).json(result.rows);
      
    } catch (error) {
       console.error('Error fetching documents:', error);
       return response.status(500).json({ error: 'Database error' });
    }
    
  } else if (request.method === 'POST') {
    const { 
      ticket_number, 
      document_type, 
      client_name, 
      client_contact, 
      equipment_data, 
      checklist_data,
      diagnosis,
      recommendations,
      total_cost,
      status 
    } = request.body;

    try {
      const result = await pool.query(
        `INSERT INTO technical_service_documents 
         (ticket_number, document_type, client_name, client_contact, equipment_data, checklist_data, diagnosis, recommendations, total_cost, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [ticket_number, document_type, client_name, client_contact, equipment_data, checklist_data, diagnosis, recommendations, total_cost, status || 'pending']
      );
      return response.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating document:', error);
      return response.status(500).json({ error: 'Failed to create document' });
    }
  } else if (request.method === 'PUT') {
      const { id, ...updates } = request.body;
      if(!id) return response.status(400).json({ error: 'Document ID required' });

      // Construct dynamic update query
      const fields = Object.keys(updates);
      if(fields.length === 0) return response.status(400).json({ error: 'No fields to update' });

      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [id, ...Object.values(updates)];

      try {
          const result = await pool.query(
              `UPDATE technical_service_documents SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
              values
          );
          if (result.rows.length === 0) return response.status(404).json({ error: 'Document not found' });
          return response.status(200).json(result.rows[0]);
      } catch (error) {
          console.error('Error updating document:', error);
          return response.status(500).json({ error: 'Failed to update document' });
      }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
