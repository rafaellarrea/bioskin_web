
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEYS = [
  process.env.GOOGLE_GEMINI_API_KEY,
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY
].filter(Boolean);

export async function parseMedicalNote(noteText) {
  if (API_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured");
  }
  
  // Try multiple models in order of preference/speed, mirroring the working configuration in finance-ai-service.js
  const models = [
    "gemini-2.0-flash-lite-preview-02-05", // Experimental lightweight model
    "gemini-1.5-flash", 
    "gemini-2.0-flash", 
    "gemini-flash-latest"
  ];
  
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`🤖 Intentando análisis con modelo: ${modelName}`);
      // Use the first available key for now (simple logic)
      const genAI = new GoogleGenerativeAI(API_KEYS[0]);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
        Analiza el siguiente texto que puede contener UNO o MÚLTIPLES registros de procedimientos médicos.
        Tu tarea es extraer la información financiera de CADA procedimiento y estructurarla en una lista JSON.

        Texto: "${noteText}"

        Reglas de extracción para CADA registro:
        1. Identifica el nombre del paciente.
        2. Identifica la fecha (si falta, usa hoy ${new Date().toISOString().split('T')[0]}). Campo: intervention_date.
        3. Identifica el tipo de intervención (ej: "Consulta", "Botox", "Hilos", "Relleno", "Láser"). Campo: intervention_type.
        4. Identifica el monto total cobrado. Campo: total_payment.
        5. Identifica método de pago.
        6. Si se mencionan Clínicas/Lugares (ej: MDS, HSJD, CONSULTORIO), extraelo en el campo 'clinic'. Default: "BIOSKIN".
        7. Honorarios médicos explícitos e implícitos.
           - Campos: juan_pablo, mary, anesthesiologist, assistant, other.

        Formato de respuesta JSON esperado (SOLO JSON, sin markdown):
        {
          "registros": [
            {
              "patient_name": "string",
              "intervention_date": "YYYY-MM-DD",
              "intervention_type": "string",
              "total_payment": number,
              "payment_method": "string",
              "clinic": "string",
              "doctor_fees": {
                "juan_pablo": number,
                "mary": number,
                "anesthesiologist": number,
                "assistant": number,
                "other": number
              },
              "notes": "string (resumen de lo realizado)"
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Limpiar markdown json si existe
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const parsed = JSON.parse(text);
      const records = parsed.registros || [parsed]; // Support both array wrapper and single object fallback

      // Process each record to ensure doctor_fees is an array
      const processedRecords = records.map(record => {
        // Default doctor_fees to empty array if undefined
        if (!record.doctor_fees) {
          record.doctor_fees = [];
        }

        // Transform doctor_fees object to array for frontend compatibility if it's an object
        if (typeof record.doctor_fees === 'object' && !Array.isArray(record.doctor_fees)) {
          const feesArray = [];
          const feeMap = {
            'juan_pablo': 'Dr. Juan Pablo',
            'mary': 'Dra. Mary',
            'anesthesiologist': 'Anestesiólogo',
            'assistant': 'Asistente',
            'other': 'Otro'
          };

          for (const [key, amount] of Object.entries(record.doctor_fees)) {
            if (amount > 0) {
              feesArray.push({
                name: feeMap[key] || key,
                amount: Number(amount)
              });
            }
          }
          record.doctor_fees = feesArray;
        }
        return record;
      });

      return processedRecords;

    } catch (error) {
      console.warn(`⚠️ Modelo ${modelName} falló:`, error.message);
      lastError = error;
      // Continue to next model
    }
  }

  console.error("Todos los modelos de IA fallaron:", lastError);
  throw new Error("Falló el procesamiento de la nota con todos los modelos de IA disponibles.");
}
