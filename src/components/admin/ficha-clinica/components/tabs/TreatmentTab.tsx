import React, { useState } from 'react';
import { Plus, Calendar, DollarSign, Clock } from 'lucide-react';
import treatmentOptions from '../../data/treatment_options.json';

interface Treatment {
  id: number;
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

export default function TreatmentTab({ recordId, treatments, onSave }: TreatmentTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    procedure_name: '',
    equipment_used: '',
    area_treated: '',
    duration_minutes: 30,
    cost: 0,
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/clinical-records?action=addTreatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId, ...newTreatment }),
      });

      if (response.ok) {
        onSave();
        setShowForm(false);
        setNewTreatment({
          procedure_name: '',
          equipment_used: '',
          area_treated: '',
          duration_minutes: 30,
          cost: 0,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error adding treatment:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Tratamientos Realizados</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#deb887] text-white px-4 py-2 rounded-lg hover:bg-[#c5a075] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Tratamiento
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Procedimiento</label>
              <input
                type="text"
                required
                list="procedures-list"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={newTreatment.procedure_name}
                onChange={e => setNewTreatment({...newTreatment, procedure_name: e.target.value})}
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
                value={newTreatment.equipment_used}
                onChange={e => setNewTreatment({...newTreatment, equipment_used: e.target.value})}
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
                value={newTreatment.area_treated}
                onChange={e => setNewTreatment({...newTreatment, area_treated: e.target.value})}
                placeholder="Ej: Rostro completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Duración (min)</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                  value={newTreatment.duration_minutes}
                  onChange={e => setNewTreatment({...newTreatment, duration_minutes: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Costo</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                  value={newTreatment.cost}
                  onChange={e => setNewTreatment({...newTreatment, cost: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Notas / Parámetros</label>
            <textarea
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
              value={newTreatment.notes}
              onChange={e => setNewTreatment({...newTreatment, notes: e.target.value})}
              placeholder="Detalles de la sesión, parámetros del equipo..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#deb887] text-white px-4 py-2 rounded-lg hover:bg-[#c5a075] transition-colors"
            >
              {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {treatments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No hay tratamientos registrados
          </div>
        ) : (
          treatments.map((treat) => (
            <div key={treat.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-900 text-lg">{treat.procedure_name}</h4>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(treat.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    {treat.equipment_used && (
                      <div className="bg-gray-50 px-3 py-1 rounded-lg">
                        <span className="font-medium">Equipo:</span> {treat.equipment_used}
                      </div>
                    )}
                    {treat.area_treated && (
                      <div className="bg-gray-50 px-3 py-1 rounded-lg">
                        <span className="font-medium">Zona:</span> {treat.area_treated}
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {treat.duration_minutes} min
                      </span>
                      {treat.cost > 0 && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <DollarSign className="w-4 h-4" />
                          {treat.cost}
                        </span>
                      )}
                    </div>
                  </div>

                  {treat.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg italic">
                      "{treat.notes}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
