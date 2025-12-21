import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import physicalExamOptions from '../../data/physical_exam_options.json';

interface PhysicalExamTabProps {
  recordId: number;
  initialData: any;
  onSave: () => void;
}

export default function PhysicalExamTab({ recordId, initialData, onSave }: PhysicalExamTabProps) {
  const [formData, setFormData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const getOptions = (category: string) => 
    physicalExamOptions
      .filter((opt: any) => opt.categoria === category)
      .map((opt: any) => opt.elemento);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/clinical-records?action=savePhysicalExam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId, ...formData }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Examen físico guardado correctamente' });
        onSave();
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar el examen físico' });
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Tipo de Piel</label>
          <select
            name="skin_type"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
            value={formData.skin_type || ''}
            onChange={handleChange}
          >
            <option value="">Seleccionar...</option>
            {getOptions('tipo_piel').map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Fototipo (Fitzpatrick)</label>
          <select
            name="phototype"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
            value={formData.phototype || ''}
            onChange={handleChange}
          >
            <option value="">Seleccionar...</option>
            {getOptions('fototipo').map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Escala Glogau</label>
          <select
            name="glogau_scale"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
            value={formData.glogau_scale || ''}
            onChange={handleChange}
          >
            <option value="">Seleccionar...</option>
            {getOptions('glogau').map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Hidratación</label>
          <select
            name="hydration"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
            value={formData.hydration || ''}
            onChange={handleChange}
          >
            <option value="">Seleccionar...</option>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Elasticidad</label>
          <select
            name="elasticity"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
            value={formData.elasticity || ''}
            onChange={handleChange}
          >
            <option value="">Seleccionar...</option>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Buena">Buena</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Descripción de Lesiones / Observaciones</label>
        <textarea
          name="lesions_description"
          rows={6}
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
          placeholder="Describa las lesiones observadas, localización, características..."
          value={formData.lesions_description || ''}
          onChange={handleChange}
        />
      </div>

      {/* Placeholder for Face Map */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-500">Mapa Facial Interactivo (Próximamente)</p>
        <p className="text-sm text-gray-400 mt-2">Aquí se podrá dibujar y marcar puntos sobre el rostro del paciente.</p>
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
