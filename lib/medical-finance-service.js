
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
  
  // Use the first available key for now
  const genAI = new GoogleGenerativeAI(API_KEYS[0]);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Actúa como un asistente contable médico experto. Analiza la siguiente nota informal de una intervención quirúrgica y extrae los datos financieros en formato JSON estricto.
    
    Nota:
    "${noteText}"

    Instrucciones de interpretación:
    1. Identifica el nombre del paciente.
    2. Identifica la fecha y conviértela a YYYY-MM-DD.
    3. Identifica la clínica (ej: MDS = Médica del Sur, HSJ = Hospital San Juan de Dios, u otra mencionada).
    4. "Pago" es el ingreso total.
    5. "Honorarios" son pagos a otros doctores que se descuentan.
    6. Identifica gastos o valores adicionales.
    7. Calcula el "net_income_juan_pablo" restando honorarios y gastos del pago total, o sumando/restando según la lógica del texto (ej: "doc se hace cargo de la diferencia").
    8. Si el texto dice "honorarios... del Dr Juan Pablo" usa ese valor explícito si está claro, sino calcúlalo.
    9. Ignora texto irrelevante.

    Formato requerido del JSON (SOLO JSON, sin markdown):
    {
      "patient_name": "string",
      "intervention_date": "YYYY-MM-DD",
      "clinic": "string",
      "total_payment": number,
      "doctor_fees": [
        { "name": "Dr. Nombre", "amount": number }
      ],
      "expenses": number,
      "additional_income": number,
      "net_income_juan_pablo": number,
      "analysis_notes": "string (breve explicación de cómo calculaste el neto)"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpiar markdown json si existe
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing medical note with AI:", error);
    throw new Error("Falló el procesamiento de la nota con IA");
  }
}
