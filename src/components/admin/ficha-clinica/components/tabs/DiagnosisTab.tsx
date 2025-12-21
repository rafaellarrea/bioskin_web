import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import diagnosisOptions from '../../data/diagnosis_options.json';

interface Diagnosis {
  id: number;
  date: string;
  diagnosis_text: string;
  cie10_code: string;
  type: string;
  severity: string;
  notes: string;
}

interface DiagnosisTabProps {
  recordId: number;
  diagnoses: Diagnosis[];
  onSave: () => void;
}

export default function DiagnosisTab({ recordId, diagnoses, onSave }: DiagnosisTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [newDiagnosis, setNewDiagnosis] = useState({
    diagnosis_text: '',
    cie10_code: '',
    type: 'presumptive',
    severity: 'Leve',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/clinical-records?action=addDiagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId, ...newDiagnosis }),
      });

      if (response.ok) {
        onSave();
        setShowForm(false);
        setNewDiagnosis({
          diagnosis_text: '',
          cie10_code: '',
          type: 'presumptive',
          severity: 'Leve',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error adding diagnosis:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Diagnósticos</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#deb887] text-white px-4 py-2 rounded-lg hover:bg-[#c5a075] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Diagnóstico
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Diagnóstico</label>
              <input
                type="text"
                required
                list="diagnoses-list"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={newDiagnosis.diagnosis_text}
                onChange={e => setNewDiagnosis({...newDiagnosis, diagnosis_text: e.target.value})}
                placeholder="Ej: Acné Vulgar"
              />
              <datalist id="diagnoses-list">
                {Object.values(diagnosisOptions).flat().map((d: string, i: number) => (
                  <option key={i} value={d} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">CIE-10 (Opcional)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={newDiagnosis.cie10_code}
                onChange={e => setNewDiagnosis({...newDiagnosis, cie10_code: e.target.value})}
                placeholder="Ej: L70.0"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={newDiagnosis.type}
                onChange={e => setNewDiagnosis({...newDiagnosis, type: e.target.value})}
              >
                <option value="presumptive">Presuntivo</option>
                <option value="definitive">Definitivo</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Severidad</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={newDiagnosis.severity}
                onChange={e => setNewDiagnosis({...newDiagnosis, severity: e.target.value})}
              >
                <option value="Leve">Leve</option>
                <option value="Moderada">Moderada</option>
                <option value="Severa">Severa</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
            <textarea
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
              value={newDiagnosis.notes}
              onChange={e => setNewDiagnosis({...newDiagnosis, notes: e.target.value})}
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
        {diagnoses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No hay diagnósticos registrados
          </div>
        ) : (
          diagnoses.map((diag) => (
            <div key={diag.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{diag.diagnosis_text}</h4>
                    {diag.cie10_code && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {diag.cie10_code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>{new Date(diag.date).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      diag.type === 'definitive' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {diag.type === 'definitive' ? 'Definitivo' : 'Presuntivo'}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span>{diag.severity}</span>
                  </div>
                  {diag.notes && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                      {diag.notes}
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
