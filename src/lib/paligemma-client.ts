import axios from 'axios';

/**
 * Cliente para interactuar con el modelo PaliGemma alojado en Google Colab via Ngrok.
 */
export class PaliGemmaClient {
  private baseUrl: string | undefined;

  constructor(baseUrl?: string) {
    // URL por defecto hardcodeada según solicitud
    const DEFAULT_URL = "https://suffocatingly-unlunate-tonya.ngrok-free.dev";
    this.baseUrl = baseUrl || import.meta.env.VITE_PALIGEMMA_API_URL || process.env.NEXT_PUBLIC_PALIGEMMA_API_URL || DEFAULT_URL;
    
    if (!this.baseUrl) {
      console.warn('⚠️ PaliGemmaClient: URL base no configurada.');
    }
  }

  /**
   * Permite actualizar la URL base dinámicamente (útil para Ngrok que cambia de URL).
   */
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  /**
   * Analiza una o múltiples imágenes utilizando el modelo PaliGemma.
   * @param {File[]} imageFiles - Lista de archivos de imagen a analizar.
   * @param {string} prompt - El prompt para el modelo.
   * @param {string} context - Contexto adicional del paciente (opcional).
   * @returns {Promise<string>} - La respuesta generada por el modelo.
   */
  async analyzeImage(imageFiles: File[], prompt: string = "describe esta imagen detalladamente en español", context?: string): Promise<string> {
    if (!this.baseUrl) {
      throw new Error("La URL de la API de PaliGemma no está configurada.");
    }

    const formData = new FormData();
    // Enviar múltiples archivos con la misma clave 'files'
    imageFiles.forEach((file) => {
        formData.append('files', file);
    });
    formData.append('prompt', prompt);
    if (context) {
        formData.append('context', context);
    }

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
   * Verifica la conexión con el servidor y devuelve detalles.
   */
  async testConnection(): Promise<any> {
    if (!this.baseUrl) {
      throw new Error("URL no configurada");
    }
    try {
      const response = await axios.get(`${this.baseUrl}/`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Error de conexión:', error);
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
  /**
   * Realiza una consulta sobre protocolos médicos de aparatología.
   * @param {string} question - La pregunta sobre el protocolo (ej: "Protocolo para manchas con IPL").
   * @returns {Promise<string>} - La respuesta detallada del modelo.
   */
  async askProtocol(question: string): Promise<string> {
    if (!this.baseUrl) {
      throw new Error("La URL de la API de PaliGemma no está configurada.");
    }

    try {
      const response = await axios.post(`${this.baseUrl}/ask-protocol`, { question }, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', 
        },
      });

      return response.data.result;
    } catch (error) {
      console.error('Error al consultar protocolo:', error);
      throw error;
    }
  }
}

export const paligemmaClient = new PaliGemmaClient();
