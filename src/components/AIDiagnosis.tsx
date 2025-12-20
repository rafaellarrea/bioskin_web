import React, { useState, useRef } from 'react';
import { paligemmaClient } from '../lib/paligemma-client';
import { Upload, Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

export const AIDiagnosis = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Prompt específico para diagnóstico dermatológico
      const prompt = "Analiza esta imagen dermatológica. Describe las condiciones visibles de la piel, posibles afecciones y características relevantes. Responde en español detalladamente.";
      
      const result = await paligemmaClient.analyzeImage(selectedImage, prompt);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || err.message || "Error desconocido";
      setError(`Error: ${errorMessage}. Asegúrate de que el servidor en Colab esté activo y la URL sea correcta.`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#deb887]/20 max-w-4xl mx-auto my-12">
      <div className="bg-[#deb887] p-6 text-white">
        <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
          <div className="bg-white/20 p-2 rounded-lg">
            <FileText className="h-6 w-6" />
          </div>
          Diagnóstico IA Preliminar
        </h2>
        <p className="text-white/90 mt-2">
          Sube una imagen de la zona a tratar para obtener un análisis preliminar impulsado por Inteligencia Artificial (MedGemma).
        </p>
      </div>

      <div className="p-8">
        {!selectedImage ? (
          <div 
            className="border-3 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-[#deb887] hover:bg-[#deb887]/5 transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-[#deb887]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="h-10 w-10 text-[#deb887]" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Sube una foto para analizar</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Arrastra una imagen aquí o haz clic para seleccionar. Asegúrate de que la zona esté bien iluminada y enfocada.
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*"
              onChange={handleImageSelect}
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Columna Imagen */}
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden shadow-md aspect-square bg-gray-100">
                <img 
                  src={previewUrl!} 
                  alt="Análisis" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={handleReset}
                className="w-full py-2 text-gray-500 hover:text-red-500 text-sm font-medium transition-colors"
                disabled={loading}
              >
                Cambiar imagen
              </button>
            </div>

            {/* Columna Análisis */}
            <div className="flex flex-col">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Loader2 className="h-12 w-12 text-[#deb887] animate-spin" />
                  <div>
                    <h4 className="text-lg font-medium text-gray-800">Analizando imagen...</h4>
                    <p className="text-gray-500 text-sm">Nuestra IA médica está procesando los detalles visuales.</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 bg-red-50 rounded-xl border border-red-100">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                  <div>
                    <h4 className="text-lg font-medium text-red-800">Error en el análisis</h4>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>

                  <div className="w-full max-w-xs bg-white p-3 rounded-lg border border-red-200 mt-2">
                    <label className="block text-xs text-left text-gray-600 mb-1 font-medium">Actualizar URL del Servidor (Ngrok):</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="https://xxxx.ngrok-free.app"
                            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-[#deb887]"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                        />
                        <button 
                            onClick={() => {
                                if(customUrl) {
                                    paligemmaClient.setBaseUrl(customUrl);
                                    handleAnalyze();
                                }
                            }}
                            className="bg-gray-800 text-white text-xs px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-left">Copia la URL 'public_url' de la salida de Colab.</p>
                  </div>

                  <button 
                    onClick={handleAnalyze}
                    className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                  >
                    Intentar de nuevo (Misma URL)
                  </button>
                </div>
              ) : analysis ? (
                <div className="flex-1 bg-green-50/50 rounded-xl border border-green-100 p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-4 text-green-800">
                    <CheckCircle2 className="h-6 w-6" />
                    <h3 className="text-lg font-bold">Resultados del Análisis</h3>
                  </div>
                  <div className="prose prose-sm prose-stone max-w-none flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {analysis}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-green-100">
                    <p className="text-xs text-gray-500 italic">
                      * Este es un análisis preliminar generado por IA y no sustituye el diagnóstico de un profesional médico.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <FileText className="h-8 w-8 text-[#deb887]" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Imagen lista</h3>
                  <p className="text-gray-500 mb-8 max-w-xs">
                    Haz clic en el botón para iniciar el procesamiento con MedGemma.
                  </p>
                  <button
                    onClick={handleAnalyze}
                    className="w-full max-w-xs bg-[#deb887] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#c5a075] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Iniciar Diagnóstico
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
