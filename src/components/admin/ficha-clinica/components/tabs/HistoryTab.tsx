import React, { useState } from 'react';
import { Save, AlertCircle, Plus } from 'lucide-react';
import historyOptions from '../../data/history_options.json';

interface HistoryTabProps {
  recordId: number;
  initialData: any;
  onSave: () => void;
}

interface HistoryFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  categoryId?: keyof typeof historyOptions;
}

const HistoryField = ({ label, name, value, onChange, placeholder, categoryId }: HistoryFieldProps) => {
  const [inputValue, setInputValue] = useState('');

  const items = categoryId ? (historyOptions[categoryId] || []) : [];

  const handleAdd = (val: string) => {
    if (!val) return;
    
    const currentValue = value || '';
    // Usar viñeta y salto de línea en lugar de coma
    const separator = currentValue.length > 0 ? '\n• ' : '• ';
    const newValue = `${currentValue}${separator}${val}`;
    
    // Create a synthetic event to propagate change
    const event = {
      target: {
        name,
        value: newValue
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onChange(event);
    setInputValue('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {items.length > 0 && (
        <div className="flex gap-2 mb-2">
          <input
            list={`list-${name}`}
            type="text"
            className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
            placeholder="Buscar y agregar..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // If the value matches an option exactly, add it? 
              // Better to let user click a button or press enter, but datalist selection is tricky to detect reliably without a library.
              // We'll add a button.
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd(inputValue);
              }
            }}
          />
          <datalist id={`list-${name}`}>
            {items.map((item: string, index: number) => (
              <option key={index} value={item} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => handleAdd(inputValue)}
            className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            title="Agregar"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      <textarea
        name={name}
        rows={4}
        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
      />
    </div>
  );
};

export default function HistoryTab({ recordId, initialData, onSave }: HistoryTabProps) {
  const [formData, setFormData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for empty fields
    const emptyFields = Object.entries(formData).filter(([_, value]) => !value || (value as string).trim() === '');
    if (emptyFields.length > 0) {
      const confirmSave = window.confirm('Hay campos de antecedentes vacíos. ¿Desea guardar de todos modos?');
      if (!confirmSave) return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/records?action=saveHistory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId, ...formData }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Antecedentes guardados correctamente' });
        // Show confirmation alert as requested
        alert('Antecedentes guardados correctamente');
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
        <HistoryField
          label="Antecedentes Patológicos"
          name="pathological"
          value={formData.pathological}
          onChange={handleChange}
          placeholder="Enfermedades crónicas, hospitalizaciones previas..."
          categoryId="antecedente_personal"
        />

        <HistoryField
          label="Hábitos"
          name="non_pathological"
          value={formData.non_pathological}
          onChange={handleChange}
          placeholder="Tabaco, alcohol, actividad física, alimentación..."
          categoryId="habito"
        />

        <HistoryField
          label="Antecedentes Familiares"
          name="family_history"
          value={formData.family_history}
          onChange={handleChange}
          placeholder="Enfermedades hereditarias, antecedentes de cáncer..."
          categoryId="antecedente_familiar"
        />

        <HistoryField
          label="Antecedentes Quirúrgicos"
          name="surgical_history"
          value={formData.surgical_history}
          onChange={handleChange}
          placeholder="Cirugías previas, fechas aproximadas..."
          categoryId="quirurgico"
        />

        <HistoryField
          label="Alergias"
          name="allergies"
          value={formData.allergies}
          onChange={handleChange}
          placeholder="Medicamentos, alimentos, látex..."
          categoryId="alergia"
        />

        <HistoryField
          label="Medicamentos Actuales"
          name="current_medications"
          value={formData.current_medications}
          onChange={handleChange}
          placeholder="Nombre, dosis, frecuencia..."
          categoryId="medicacion"
        />

        <HistoryField
          label="Antecedentes Estéticos"
          name="aesthetic_history"
          value={formData.aesthetic_history}
          onChange={handleChange}
          placeholder="Tratamientos previos, reacciones adversas..."
          categoryId="otros"
        />

        <HistoryField
          label="Antecedentes Ginecológicos"
          name="gynecological_history"
          value={formData.gynecological_history}
          onChange={handleChange}
          placeholder="FUM, anticonceptivos, embarazos..."
          categoryId="obstetrico"
        />

        <HistoryField
          label="Rutina de Cuidado Facial"
          name="facial_routine"
          value={formData.facial_routine}
          onChange={handleChange}
          placeholder="Limpieza, hidratación, protección solar..."
          categoryId="rutina_cuidado_facial"
        />
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
