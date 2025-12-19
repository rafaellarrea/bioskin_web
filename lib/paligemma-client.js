import axios from 'axios';

/**
 * Cliente para interactuar con el modelo PaliGemma alojado en Google Colab via Ngrok.
 */
export class PaliGemmaClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_PALIGEMMA_API_URL;
    if (!this.baseUrl) {
      console.warn('⚠️ PaliGemmaClient: URL base no configurada. Asegúrate de definir NEXT_PUBLIC_PALIGEMMA_API_URL.');
    }
  }

  /**
   * Analiza una imagen utilizando el modelo PaliGemma.
   * @param {File | Blob} imageFile - El archivo de imagen a analizar.
   * @param {string} prompt - El prompt para el modelo (ej: "describe esta imagen en español").
   * @returns {Promise<string>} - La respuesta generada por el modelo.
   */
  async analyzeImage(imageFile, prompt = "describe esta imagen detalladamente en español") {
    if (!this.baseUrl) {
      throw new Error("La URL de la API de PaliGemma no está configurada.");
    }

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('prompt', prompt);

    try {
      const response = await axios.post(`${this.baseUrl}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.result;
    } catch (error) {
      console.error('Error al analizar imagen con PaliGemma:', error);
      throw error;
    }
  }

  /**
   * Verifica si el servidor está en línea.
   */
  async checkStatus() {
    if (!this.baseUrl) return false;
    try {
      const response = await axios.get(`${this.baseUrl}/`);
      return response.data.status === 'online';
    } catch (error) {
      return false;
    }
  }
}

export const paligemmaClient = new PaliGemmaClient();
