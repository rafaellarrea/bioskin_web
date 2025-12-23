import React, { useState } from 'react';
import { Plus, Calendar, DollarSign, Clock, Save, Trash2, Copy } from 'lucide-react';
import treatmentOptions from '../../data/treatment_options.json';

interface Treatment {
  id?: number;
  date: string;
  procedure_name: string;
  equipment_used: string;
  area_treated: string;
  duration_minutes: number;
  cost: number;
  notes: string;
}

interface TreatmentTabProps {
  recordId: number;
  treatments: Treatment[];
  onSave: () => void;
}

const EMPTY_TREATMENT: Treatment = {
  date: new Date().toISOString().split('T')[0],
  procedure_name: '',
  equipment_used: '',
  area_treated: '',
  duration_minutes: 30,
  cost: 0,
  notes: ''
};

export default function TreatmentTab({ recordId, treatments, onSave }: TreatmentTabProps) {
  const [currentTreatment, setCurrentTreatment] = useState<Treatment>({ ...EMPTY_TREATMENT });
  const [saving, setSaving] = useState(false);

  // Sort treatments by date descending for the history list
  const sortedTreatments = [...treatments].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleNew = () => {
    setCurrentTreatment({ ...EMPTY_TREATMENT, date: new Date().toISOString().split('T')[0] });
  };

  const handleSelect = (treatment: Treatment) => {
    setCurrentTreatment({ ...treatment });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const action = currentTreatment.id ? 'updateTreatment' : 'addTreatment';
      const body = {
        record_id: recordId,
        ...currentTreatment
      };

      const response = await fetch(`/api/records?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSave();
        if (!currentTreatment.id) {
          handleNew();
        }
        alert('Tratamiento guardado correctamente');
      } else {
        alert('Error al guardar el tratamiento');
      }
    } catch (error) {
      console.error('Error saving treatment:', error);
      alert('Error al guardar el tratamiento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentTreatment.id || !confirm('¿Eliminar este tratamiento?')) return;
    
    try {
      const response = await fetch(`/api/records?action=deleteTreatment&id=${currentTreatment.id}`, { 
        method: 'DELETE' 
      });

      if (response.ok) {
        onSave();
        handleNew();
        alert('Tratamiento eliminado');
      } else {
        alert('Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar');
    }
  };

  const handleDuplicate = () => {
    const { id, ...rest } = currentTreatment;
    setCurrentTreatment({
      ...rest,
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="flex h-[600px] gap-4">
      {/* Sidebar List */}
      <div className="w-1/4 border-r border-gray-200 pr-4 flex flex-col gap-2">
        <div className="font-semibold text-gray-700 mb-2">Historial</div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {sortedTreatments.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">No hay tratamientos previos</div>
          ) : (
            sortedTreatments.map(t => (
              <div
                key={t.id}
                onClick={() => t && handleSelect(t)}
                className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                  currentTreatment.id === t.id 
                    ? 'bg-[#deb887] text-white border-[#deb887]' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm">{new Date(t.date).toLocaleDateString()}</div>
                <div className="font-semibold truncate">{t.procedure_name}</div>
                <div className="text-xs opacity-80 truncate">{t.equipment_used || 'Sin equipo'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
          <div className="flex gap-2">
            <button onClick={handleNew} className="p-2 hover:bg-gray-200 rounded-lg" title="Nuevo Tratamiento">
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={handleSave} disabled={saving} className="p-2 hover:bg-gray-200 rounded-lg" title="Guardar">
              <Save className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={handleDuplicate} disabled={!currentTreatment.id} className="p-2 hover:bg-gray-200 rounded-lg" title="Duplicar">
              <Copy className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={handleDelete} disabled={!currentTreatment.id} className="p-2 hover:bg-gray-200 rounded-lg" title="Eliminar">
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={currentTreatment.date}
                onChange={e => setCurrentTreatment({...currentTreatment, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Procedimiento</label>
              <input
                type="text"
                required
                list="procedures-list"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={currentTreatment.procedure_name}
                onChange={e => setCurrentTreatment({...currentTreatment, procedure_name: e.target.value})}
                placeholder="Ej: Limpieza Facial Profunda"
              />
              <datalist id="procedures-list">
                {Object.values(treatmentOptions.procedures).flat().map((p: string, i: number) => (
                  <option key={i} value={p} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Equipo Utilizado</label>
              <input
                type="text"
                list="equipment-list"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={currentTreatment.equipment_used}
                onChange={e => setCurrentTreatment({...currentTreatment, equipment_used: e.target.value})}
                placeholder="Ej: Hydrafacial, Laser CO2"
              />
              <datalist id="equipment-list">
                {treatmentOptions.equipment.map((e: string, i: number) => (
                  <option key={i} value={e} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Zona Tratada</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={currentTreatment.area_treated}
                onChange={e => setCurrentTreatment({...currentTreatment, area_treated: e.target.value})}
                placeholder="Ej: Rostro completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Duración (min)</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                  value={currentTreatment.duration_minutes}
                  onChange={e => setCurrentTreatment({...currentTreatment, duration_minutes: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Costo</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                  value={currentTreatment.cost}
                  onChange={e => setCurrentTreatment({...currentTreatment, cost: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Notas / Parámetros</label>
            <textarea
              rows={5}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
              value={currentTreatment.notes}
              onChange={e => setCurrentTreatment({...currentTreatment, notes: e.target.value})}
              placeholder="Detalles de la sesión, parámetros del equipo..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
