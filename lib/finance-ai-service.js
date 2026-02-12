
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Inicializar con múltiples claves si es necesario para rotación (según disponibilidad)
const API_KEYS = [
  process.env.GOOGLE_GEMINI_API_KEY, // Variable existente en Vercel
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY,
 // process.env.GEMINI_API_KEY_2 
].filter(Boolean);

let currentKeyIndex = 0;

function getClient() {
  if (API_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured");
  }
  const key = API_KEYS[currentKeyIndex];
  // Rotación simple para siguiente llamada
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return new GoogleGenerativeAI(key);
}

function getFileManager() {
  if (API_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured");
  }
  const key = API_KEYS[currentKeyIndex];
  return new GoogleAIFileManager(key);
}

export async function analyzeInvoiceImage(imageBuffer, mimeType = "image/jpeg") {
  // Variantes con diferentes tier de cuotas para maximizar éxito
  const models = [
    "gemini-2.0-flash-lite-preview-02-05", // Modelo experimental super ligero y rápido
    "gemini-1.5-flash", // Workhorse standard (suele tener buena disponibilidad)
    "gemini-2.0-flash", // New flagship speed
    "gemini-flash-latest" // Fallback genérico
  ];
  
  for (const modelName of models) {
    try {
      console.log(`🤖 Intentando análisis con modelo: ${modelName}`);
      console.log(`🤖 Intentando análisis con modelo: ${modelName}`);
      // Manual instantiation to capture key for PDF handling
      const currentKey = API_KEYS[currentKeyIndex];
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
      const genAI = new GoogleGenerativeAI(currentKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `Analiza esta imagen. Si es una factura, recibo o comprobante comercial, extrae la siguiente información en formato JSON estricto:
      {
        "is_invoice": boolean, // true si es factura
        "invoice_number": string, // número de factura o null
        "date": string, // fecha en formato YYYY-MM-DD
        "entity": string, // Nombre del cliente (venta) o proveedor (compra)
        "subtotal": number,
        "tax": number, // IVA/Impuestos
        "total": number,
        "description": string, // Breve descripción de los items principales
        "type": string // "ingreso" (venta) o "egreso" (compra/gasto) - infiérelo por el contexto
      }
      Si no es legible o no es una factura, devuelve {"is_invoice": false}.
      Solo responde con el JSON, sin bloques de código markdown.`;

      let contentPart;
      if (mimeType === "application/pdf") {
          const fm = new GoogleAIFileManager(currentKey);
          const tmpPath = join(tmpdir(), `invoice-${Date.now()}.pdf`);
          await writeFile(tmpPath, imageBuffer);
          const upload = await fm.uploadFile(tmpPath, { mimeType, displayName: "Invoice" });
          await unlink(tmpPath);
          contentPart = { fileData: { mimeType: upload.file.mimeType, fileUri: upload.file.uri } };
      } else {
          contentPart = { inlineData: { data: imageBuffer.toString("base64"), mimeType } };
      }

      const result = await model.generateContent([prompt, contentPart]);
      const response = await result.response;
      let text = response.text();
      
      // Limpiar markdown si existe
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      return JSON.parse(text);

    } catch (error) {
      console.error(`⚠️ Falló modelo ${modelName}:`, error.message);
      // Continuar al siguiente modelo
    }
  }
  
  throw new Error("Todos los modelos de IA fallaron al analizar la imagen.");
}
