import React, { useState, useRef } from 'react';
import { paligemmaClient } from '../lib/paligemma-client';
import { Upload, Loader2, AlertCircle, CheckCircle2, FileText, X } from 'lucide-react';

export const AIDiagnosis = () => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [context, setContext] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('https://suffocatingly-unlunate-tonya.ngrok-free.dev');
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean, message: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTestConnection = async () => {
    setLoading(true);
    setConnectionStatus(null);
    try {
        if (customUrl) {
            paligemmaClient.setBaseUrl(customUrl);
        }
        const result = await paligemmaClient.testConnection();
        setConnectionStatus({
            success: true,
            message: `✅ Conectado: ${result.status}`
        });
    } catch (err: any) {
        setConnectionStatus({
            success: false,
            message: `❌ Error: ${err.message}`
        });
    } finally {
        setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      
      setSelectedImages(prev => [...prev, ...newFiles]);
      setPreviewUrls(prev => [...prev, ...newUrls]);
      setAnalysis(null);
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    const newUrls = [...previewUrls];
    
    URL.revokeObjectURL(newUrls[index]); // Clean up memory
    
    newImages.splice(index, 1);
    newUrls.splice(index, 1);
    
    setSelectedImages(newImages);
    setPreviewUrls(newUrls);
  };

  const handleAnalyze = async () => {
    if (selectedImages.length === 0) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Prompt específico para diagnóstico dermatológico
      const prompt = "Analiza estas imágenes dermatológicas. Describe las condiciones visibles de la piel, posibles afecciones y características relevantes. Responde en español detalladamente.";
      
      const result = await paligemmaClient.analyzeImage(selectedImages, prompt, context);
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
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setPreviewUrls([]);
    setContext('');
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
          Sube una o más imágenes de la zona a tratar y proporciona contexto para obtener un análisis preliminar impulsado por Inteligencia Artificial (MedGemma).
        </p>
      </div>

      {/* Configuración de Conexión */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Estado del Servidor:</span>
                <button 
                    onClick={handleTestConnection}
                    disabled={loading}
                    className={`text-xs px-3 py-1 rounded-full border ${connectionStatus?.success ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'} hover:bg-gray-200 transition-colors`}
                >
                    {loading ? 'Verificando...' : connectionStatus?.success ? '✅ Conectado' : '🔄 Verificar Conexión'}
                </button>
            </div>
            
            <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-[#deb887]">
                    <span>⚙️ Configurar URL del Servidor</span>
                </summary>
                <div className="mt-3 space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                    <label className="text-xs text-gray-600 block">URL de Ngrok (Google Colab):</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="https://xxxx.ngrok-free.app"
                            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-[#deb887]"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                        />
                        <button 
                            onClick={() => {
                                paligemmaClient.setBaseUrl(customUrl);
                                handleTestConnection();
                            }}
                            className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded hover:bg-gray-700"
                        >
                            Guardar
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400">
                        Si la URL cambia, actualízala aquí. Valor por defecto: https://suffocatingly-unlunate-tonya.ngrok-free.dev
                    </p>
                </div>
            </details>

            {connectionStatus && !connectionStatus.success && (
                <div className="text-xs p-2 rounded bg-red-50 text-red-600 border border-red-100">
                    {connectionStatus.message}
                </div>
            )}
        </div>
      </div>

      <div className="p-8">
        {selectedImages.length === 0 ? (
          <div 
            className="border-3 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-[#deb887] hover:bg-[#deb887]/5 transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-[#deb887]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="h-10 w-10 text-[#deb887]" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Sube fotos para analizar</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Arrastra imágenes aquí o haz clic para seleccionar. Puedes subir múltiples ángulos.
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*"
              multiple
              onChange={handleImageSelect}
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Columna Imagen y Contexto */}
            <div className="space-y-6">
              {/* Grid de Imágenes */}
              <div className="grid grid-cols-2 gap-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden shadow-sm aspect-square bg-gray-100 group">
                    <img 
                      src={url} 
                      alt={`Análisis ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar imagen"
                    >
                        <X size={14} />
                    </button>
                  </div>
                ))}
                <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center aspect-square cursor-pointer hover:border-[#deb887] hover:bg-[#deb887]/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="text-center">
                        <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                        <span className="text-xs text-gray-500">Agregar más</span>
                    </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                />
              </div>

              {/* Campo de Contexto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contexto del Paciente (Opcional)
                </label>
                <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#deb887] focus:ring-1 focus:ring-[#deb887] min-h-[100px]"
                    placeholder="Describe síntomas, duración, antecedentes o cualquier detalle relevante..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                />
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2 text-gray-500 hover:text-red-500 text-sm font-medium transition-colors"
                disabled={loading}
              >
                Reiniciar todo
              </button>
            </div>

            {/* Columna Análisis */}
            <div className="flex flex-col">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Loader2 className="h-12 w-12 text-[#deb887] animate-spin" />
                  <div>
                    <h4 className="text-lg font-medium text-gray-800">Analizando imágenes...</h4>
                    <p className="text-gray-500 text-sm">Nuestra IA médica está procesando los detalles visuales y el contexto.</p>
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
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Listo para analizar</h3>
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
