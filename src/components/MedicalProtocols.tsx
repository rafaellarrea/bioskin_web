import React, { useState, useRef, useEffect } from 'react';
import { paligemmaClient } from '../lib/paligemma-client';
import { Send, Bot, User, Loader2, AlertCircle, Settings, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const MedicalProtocols = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola. Soy tu asistente clínico especializado en aparatología estética. Puedo brindarte protocolos detallados para Nd:YAG, CO2, IPL, HIFU, Radiofrecuencia y más. ¿Qué tratamiento deseas consultar hoy?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('https://suffocatingly-unlunate-tonya.ngrok-free.dev');
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean, message: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
            message: `✅ Conectado`
        });
    } catch (err: any) {
        setConnectionStatus({
            success: false,
            message: `❌ Error`
        });
    } finally {
        setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await paligemmaClient.askProtocol(userMessage.content);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message || "No se pudo conectar con el servidor."}. Verifica la URL de Ngrok.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#deb887]/20 max-w-4xl mx-auto my-12 flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-[#deb887] p-4 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold">Protocolos Clínicos IA</h2>
            <p className="text-xs text-white/80">Especialista en Aparatología (Nd:YAG, CO2, IPL...)</p>
          </div>
        </div>
        
        {/* Configuración Rápida */}
        <div className="flex items-center gap-2">
            <button 
                onClick={handleTestConnection}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    connectionStatus?.success 
                        ? 'bg-green-500/20 text-green-100 border border-green-500/30' 
                        : connectionStatus?.success === false
                            ? 'bg-red-500/20 text-red-100 border border-red-500/30'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
                title="Verificar conexión con servidor IA"
            >
                {loading && !messages.length ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : connectionStatus?.success ? (
                    <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                ) : connectionStatus?.success === false ? (
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                ) : (
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                )}
                <span className="hidden sm:inline">
                    {connectionStatus?.success ? 'Conectado' : 'Verificar Conexión'}
                </span>
            </button>

            <details className="relative group">
                <summary className="list-none cursor-pointer p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white">
                    <Settings className="h-5 w-5" />
                </summary>
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl p-4 border border-gray-100 z-50 text-gray-800">
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-[#deb887]" />
                        Configuración del Servidor
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">URL del Servidor (Ngrok):</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="https://..."
                                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-2 text-gray-600 bg-gray-50 focus:bg-white focus:border-[#deb887] outline-none transition-all"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                                * URL por defecto configurada para el servidor de producción.
                            </p>
                        </div>
                    </div>
                </div>
            </details>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-[#deb887] text-white'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-white text-gray-800 rounded-tr-none border border-gray-100' 
                : 'bg-white text-gray-800 rounded-tl-none border border-[#deb887]/20'
            }`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <span className="text-[10px] text-gray-400 mt-2 block">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#deb887] text-white flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-[#deb887]/20 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#deb887]" />
              <span className="text-xs text-gray-500">Generando protocolo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre un protocolo (ej: Parámetros para depilación láser en fototipo IV)..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#deb887] focus:ring-1 focus:ring-[#deb887] transition-all"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[#deb887] text-white p-3 rounded-xl hover:bg-[#c5a075] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          * La IA puede cometer errores. Verifica siempre los parámetros con las guías oficiales del fabricante.
        </p>
      </div>
    </div>
  );
};
