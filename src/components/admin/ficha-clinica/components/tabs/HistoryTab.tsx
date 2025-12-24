import React, { useState, useEffect, useRef } from 'react';
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
  disabled?: boolean;
}

const HistoryField = ({ label, name, value, onChange, placeholder, categoryId, disabled }: HistoryFieldProps) => {
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
            className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none disabled:bg-gray-50 disabled:text-gray-400"
            placeholder="Buscar y agregar..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd(inputValue);
              }
            }}
            // No deshabilitar el input de búsqueda para permitir agregar items rápidamente
          />
          <datalist id={`list-${name}`}>
            {items.map((item: string, index: number) => (
              <option key={index} value={item} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => handleAdd(inputValue)}
            className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Agregar"
            // No deshabilitar el botón de agregar
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      <textarea
        name={name}
        rows={4}
        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500"
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        // No deshabilitar el textarea para permitir edición continua
      />
    </div>
  );
};

export default function HistoryTab({ recordId, initialData, onSave }: HistoryTabProps) {
  const [formData, setFormData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Referencia para mantener el recordId incluso si las props fallan momentáneamente
  const recordIdRef = useRef(recordId);

  useEffect(() => {
    if (recordId) {
      recordIdRef.current = recordId;
    }
  }, [recordId]);

  // NOTA: Eliminamos la sincronización automática de initialData -> formData
  // porque causaba que se sobrescribieran los cambios del usuario si la actualización
  // del servidor llegaba mientras el usuario seguía editando.
  // Al montar el componente, useState(initialData) ya carga los datos iniciales.
  // Al guardar, formData ya tiene los datos más recientes, así que no necesitamos
  // que el servidor nos los devuelva para actualizar el formulario.

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Iniciando guardado de antecedentes...');
    
    const idToUse = recordId || recordIdRef.current;

    if (!idToUse) {
      console.error('❌ Error: ID de expediente no encontrado');
      setMessage({ type: 'error', text: 'Error: No se encontró el ID del expediente. Intente recargar la página.' });
      return;
    }

    // Check for empty fields
    const emptyFields = Object.entries(formData).filter(([_, value]) => !value || (value as string).trim() === '');
    if (emptyFields.length > 0) {
      // Usar confirmación nativa puede bloquear el hilo principal, pero es lo más seguro para detener el envío
      // Si el usuario dice "Cancelar", detenemos.
      if (!window.confirm('Hay campos de antecedentes vacíos. ¿Desea guardar de todos modos?')) {
        console.log('❌ Guardado cancelado por el usuario (campos vacíos)');
        return;
      }
    }

    setSaving(true);
    setMessage(null);

    try {
      console.log('🚀 Enviando datos al servidor:', { record_id: idToUse, ...formData });
      const response = await fetch('/api/records?action=saveHistory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: idToUse, ...formData }),
      });

      if (response.ok) {
        console.log('✅ Guardado exitoso');
        setMessage({ type: 'success', text: 'Antecedentes guardados correctamente' });
        setTimeout(() => setMessage(null), 3000); // Auto ocultar mensaje
        onSave();
      } else {
        const errText = await response.text();
        console.error('❌ Error en respuesta del servidor:', errText);
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('❌ Error al guardar antecedentes:', error);
      setMessage({ type: 'error', text: 'Error al guardar los antecedentes' });
    } finally {
      setSaving(false);
    }
  };
        body: JSON.stringify({ record_id: idToUse, ...formData }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Antecedentes guardados correctamente' });
        setTimeout(() => setMessage(null), 3000); // Auto ocultar mensaje
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
