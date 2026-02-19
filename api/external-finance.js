
import { parseMedicalNote } from '../lib/medical-finance-service.js';
import { saveFinanceRecord } from '../lib/finance-db.js';

export default async function handler(req, res) {
  // CORS basics if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query;

  try {
    if (action === 'process-note') {
      const { note, assistant } = req.body;
      if (!note || !assistant) {
        return res.status(400).json({ error: 'Missing note or assistant name' });
      }

      const parsedData = await parseMedicalNote(note);
      
      const result = {
        ...parsedData,
        assistant_name: assistant,
        raw_note: note
      };

      return res.status(200).json(result);
    } 
    
    else if (action === 'save-record') {
      const record = req.body;
      if (!record || !record.patient_name || !record.assistant_name) {
        return res.status(400).json({ error: 'Missing required record fields' });
      }

      const savedRecord = await saveFinanceRecord(record);
      return res.status(200).json({ success: true, id: savedRecord.id });
    }

    else {
      return res.status(400).json({ error: 'Invalid action parameter' });
    }

  } catch (error) {
    console.error(`Error in external-finance [${action}]:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
