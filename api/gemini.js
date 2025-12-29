import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API client
// We will use the REST API via fetch if the package is not available, 
// but since we are in a Node environment in Vercel, we can try to use the SDK if installed, 
// or just use fetch. To be safe and dependency-free for now, I'll use fetch.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  const { action, prompt, images, context } = req.body;

  try {
    let systemInstruction = "";
    let userPrompt = prompt;

    if (action === 'diagnosis') {
      systemInstruction = "Eres un asistente experto en dermatología. Analiza las imágenes proporcionadas y describe las condiciones visibles de la piel, posibles afecciones y características relevantes. Responde en español detalladamente. Incluye un descargo de responsabilidad de que esto es una herramienta de ayuda y no sustituye el diagnóstico médico profesional.";
      if (context) {
        userPrompt += `\n\nContexto adicional del paciente: ${context}`;
      }
    } else if (action === 'protocol') {
      systemInstruction = "Eres un asistente clínico experto en aparatología estética (Nd:YAG, CO2, IPL, HIFU, Radiofrecuencia, etc.). Proporciona protocolos detallados, parámetros sugeridos y recomendaciones de seguridad. Responde en español.";
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Construct the payload for Gemini API (REST)
    // Model: gemini-flash-latest (fast and good for vision)
    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [
      {
        role: "user",
        parts: [
          { text: systemInstruction + "\n\n" + userPrompt }
        ]
      }
    ];

    // Add images if present (for diagnosis)
    if (images && Array.isArray(images)) {
      // images should be array of { data: base64String, mimeType: string }
      for (const img of images) {
        contents[0].parts.push({
          inline_data: {
            mime_type: img.mimeType,
            data: img.data
          }
        });
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error calling Gemini API');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response generated');
    }

    return res.status(200).json({ result: text });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
