
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
  
  // Try multiple models in order of preference/speed
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"];
  
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`🤖 Intentando análisis con modelo: ${modelName}`);
      // Use the first available key for now (simple logic)
      const genAI = new GoogleGenerativeAI(API_KEYS[0]);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Limpiar markdown json si existe
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      return JSON.parse(text);
    } catch (error) {
      console.warn(`⚠️ Modelo ${modelName} falló:`, error.message);
      lastError = error;
      // Continue to next model
    }
  }

  console.error("Todos los modelos de IA fallaron:", lastError);
  throw new Error("Falló el procesamiento de la nota con todos los modelos de IA disponibles.");
}
