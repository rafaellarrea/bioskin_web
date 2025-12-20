import axios from 'axios';

/**
 * Cliente para interactuar con el modelo PaliGemma alojado en Google Colab via Ngrok.
 */
export class PaliGemmaClient {
  private baseUrl: string | undefined;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_PALIGEMMA_API_URL || process.env.NEXT_PUBLIC_PALIGEMMA_API_URL;
    if (!this.baseUrl) {
      console.warn('⚠️ PaliGemmaClient: URL base no configurada. Asegúrate de definir VITE_PALIGEMMA_API_URL o NEXT_PUBLIC_PALIGEMMA_API_URL.');
    }
  }

  /**
   * Permite actualizar la URL base dinámicamente (útil para Ngrok que cambia de URL).
   */
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  /**
   * Analiza una imagen utilizando el modelo PaliGemma.
   * @param {File | Blob} imageFile - El archivo de imagen a analizar.
   * @param {string} prompt - El prompt para el modelo (ej: "describe esta imagen en español").
   * @returns {Promise<string>} - La respuesta generada por el modelo.
   */
  async analyzeImage(imageFile: File | Blob, prompt: string = "describe esta imagen detalladamente en español"): Promise<string> {
    if (!this.baseUrl) {
      throw new Error("La URL de la API de PaliGemma no está configurada.");
    }

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('prompt', prompt);

    try {
      const response = await axios.post(`${this.baseUrl}/analyze`, formData, {
        headers: {
          // No establecer Content-Type manualmente con FormData, axios lo hace automáticamente con el boundary correcto
          'ngrok-skip-browser-warning': 'true', 
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
  async checkStatus(): Promise<boolean> {
    if (!this.baseUrl) return false;
    try {
      const response = await axios.get(`${this.baseUrl}/`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        }
      });
      return response.data.status === 'online';
    } catch (error) {
      return false;
    }
  }
}

export const paligemmaClient = new PaliGemmaClient();
