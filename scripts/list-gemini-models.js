
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// Wait, the instructions said:
// "Variable requerida: OPENAI_API_KEY ... consumido por la función serverless api/ai-blog/generate.js"
// But for internal-chat-service.js, let's check what key it uses.

async function listModels() {
  if (!apiKey) {
    console.error("No API Key found in environment variables.");
    return;
  }

  console.log("Using API Key starting with:", apiKey.substring(0, 5) + "...");

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Error fetching models:", data.error);
    } else {
      console.log("Available Models:");
      if (data.models) {
        data.models.forEach(model => {
            if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                 console.log(`- ${model.name} (${model.displayName})`);
            }
        });
      } else {
          console.log("No models found in response:", data);
      }
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

listModels();
