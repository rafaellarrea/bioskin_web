import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface HistoryTabProps {
  recordId: number;
  initialData: any;
  onSave: () => void;
}

export default function HistoryTab({ recordId, initialData, onSave }: HistoryTabProps) {
  const [formData, setFormData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/clinical-records?action=saveHistory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId, ...formData }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Antecedentes guardados correctamente' });
        onSave();
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar los antecedentes' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Antecedentes Patológicos</label>
          <textarea
            name="pathological"
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
            placeholder="Enfermedades crónicas, hospitalizaciones previas..."
            value={formData.pathological || ''}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Antecedentes No Patológicos</label>
          <textarea
            name="non_pathological"
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
            placeholder="Tabaco, alcohol, actividad física, alimentación..."
            value={formData.non_pathological || ''}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Antecedentes Familiares</label>
          <textarea
            name="family_history"
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
            placeholder="Enfermedades hereditarias, antecedentes de cáncer..."
            value={formData.family_history || ''}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Antecedentes Quirúrgicos</label>
          <textarea
            name="surgical_history"
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
            placeholder="Cirugías previas, fechas aproximadas..."
            value={formData.surgical_history || ''}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Alergias</label>
          <textarea
            name="allergies"
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
            placeholder="Medicamentos, alimentos, látex..."
            value={formData.allergies || ''}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Medicamentos Actuales</label>
          <textarea
            name="current_medications"
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
            placeholder="Nombre, dosis, frecuencia..."
            value={formData.current_medications || ''}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Antecedentes Estéticos</label>
          <textarea
            name="aesthetic_history"
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
            placeholder="Tratamientos previos, reacciones adversas..."
            value={formData.aesthetic_history || ''}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Antecedentes Ginecológicos</label>
          <textarea
            name="gynecological_history"
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
            placeholder="FUM, anticonceptivos, embarazos..."
            value={formData.gynecological_history || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#deb887] text-white px-6 py-2 rounded-lg hover:bg-[#c5a075] transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}
