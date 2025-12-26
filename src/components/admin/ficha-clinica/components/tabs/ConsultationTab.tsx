import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Check } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Motivo de Consulta y Enfermedad Actual</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c5a075] transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Guardar Cambios
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Motivo de Consulta
          </label>
          <input
            type="text"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Ingrese el motivo principal de la consulta..."
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Enfermedad Actual
          </label>
          <textarea
            name="current_illness"
            rows={8}
            value={formData.current_illness}
            onChange={handleChange}
            placeholder="Describa la enfermedad actual, síntomas, evolución..."
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
}
