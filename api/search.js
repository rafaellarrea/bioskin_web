import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Load data
    const dataDir = path.join(process.cwd(), 'data');
    const productsPath = path.join(dataDir, 'products.json');
    const servicesPath = path.join(dataDir, 'services.json');

    let products = [];
    let services = [];

    if (fs.existsSync(productsPath)) {
      const productsData = fs.readFileSync(productsPath, 'utf8');
      products = JSON.parse(productsData).map(p => ({
        type: 'product',
        name: p.name,
        description: p.shortDescription,
        category: p.category,
        price: p.price,
        url: `/products/${p.name.toLowerCase().replace(/ /g, '-')}` // Simple slug approximation, ideally use slugify
      }));
    }

    if (fs.existsSync(servicesPath)) {
      const servicesData = fs.readFileSync(servicesPath, 'utf8');
      services = JSON.parse(servicesData).map(s => ({
        type: 'service',
        name: s.title,
        description: s.shortDescription,
        category: s.category,
        price: s.price,
        url: `/services` // Services might not have individual pages, or they do?
      }));
    }

    // Combine data for context (limit to essential info to save tokens)
    const contextData = [
      ...products,
      ...services
    ];

    // Create prompt
    const prompt = `
      Eres un asistente de búsqueda inteligente para la clínica estética BIOSKIN.
      El usuario está buscando: "${query}"
      
      Aquí tienes la lista de productos y servicios disponibles:
      ${JSON.stringify(contextData)}
      
      Tu tarea es:
      1. Identificar la intención del usuario.
      2. Encontrar los elementos más relevantes (máximo 5).
      3. Si la búsqueda es una pregunta, intenta responderla usando la información de las descripciones.
      
      Responde SOLAMENTE con un objeto JSON con este formato:
      {
        "results": [
          { "name": "Nombre", "type": "product/service", "description": "Breve descripción", "url": "url" }
        ],
        "answer": "Respuesta corta y amable si aplica, o null si es solo búsqueda",
        "suggestion": "Sugerencia de búsqueda si no hay resultados claros"
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "Eres un asistente útil que responde en JSON." }, { role: "user", content: prompt }],
      model: "gpt-3.5-turbo", // Use a fast model
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(responseContent);

    res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
