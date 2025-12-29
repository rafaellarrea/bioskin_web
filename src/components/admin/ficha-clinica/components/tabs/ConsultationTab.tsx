import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, Check, Stethoscope } from 'lucide-react';
import { Tooltip } from '../../../ui/Tooltip';

interface ConsultationTabProps {
  recordId: number;
  initialData: any;
  onSave: () => void;
}

export default function ConsultationTab({ recordId, initialData, onSave }: ConsultationTabProps) {
  const [formData, setFormData] = useState({
    reason: '',
    current_illness: '',
    ...initialData
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        reason: initialData.reason || '',
        current_illness: initialData.current_illness || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveConsultation',
          recordId,
          reason: formData.reason,
          current_illness: formData.current_illness
        })
      });

      if (!response.ok) throw new Error('Error al guardar');

      setMessage({ type: 'success', text: 'Información guardada correctamente' });
      
      // Auto-hide success message
      setTimeout(() => {
        setMessage(null);
      }, 3000);

      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving consultation:', error);
      setMessage({ type: 'error', text: 'Error al guardar la información' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#deb887]/10 rounded-lg">
            <Stethoscope className="w-6 h-6 text-[#deb887]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Consulta Médica</h3>
            <p className="text-sm text-gray-500">Motivo de consulta y enfermedad actual</p>
          </div>
        </div>
        
        <Tooltip content="Guardar cambios">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#deb887] text-white rounded-xl hover:bg-[#c5a075] transition-colors disabled:opacity-50 shadow-lg shadow-[#deb887]/20 font-medium"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </motion.button>
        </Tooltip>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center gap-3 shadow-sm ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
            <div className={`p-1.5 rounded-full ${message.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <span className="font-medium text-sm">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm"
      >
        <div className="space-y-3 group">
          <label className="block text-sm font-bold text-gray-700 group-hover:text-[#deb887] transition-colors">
            Motivo de Consulta
          </label>
          <input
            type="text"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Ingrese el motivo principal de la consulta..."
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none transition-all bg-gray-50/30 focus:bg-white text-gray-800 placeholder-gray-400"
          />
        </div>

        <div className="space-y-3 group">
          <label className="block text-sm font-bold text-gray-700 group-hover:text-[#deb887] transition-colors">
            Enfermedad Actual
          </label>
          <textarea
            name="current_illness"
            rows={8}
            value={formData.current_illness}
            onChange={handleChange}
            placeholder="Describa la enfermedad actual, síntomas, evolución..."
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none resize-none transition-all bg-gray-50/30 focus:bg-white text-gray-800 placeholder-gray-400 leading-relaxed"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
