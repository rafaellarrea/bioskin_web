import React, { useState, useEffect } from 'react';
import { Plus, Calendar, DollarSign, Clock, Save, Trash2, Copy, Sparkles, X, MessageSquare } from 'lucide-react';
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
  ai_suggestion?: string;
}

interface TreatmentTabProps {
  recordId: number;
  treatments: Treatment[];
  physicalExams?: any[];
  patientName?: string;
  patientAge?: number | string;
  onSave: () => void;
}

const EMPTY_TREATMENT: Treatment = {
  date: new Date().toISOString().split('T')[0],
  procedure_name: '',
  equipment_used: '',
  area_treated: '',
  duration_minutes: 30,
  cost: 0,
  notes: '',
  ai_suggestion: ''
};

export default function TreatmentTab({ recordId, treatments, physicalExams = [], patientName, patientAge, onSave }: TreatmentTabProps) {
  const [currentTreatment, setCurrentTreatment] = useState<Treatment>({ ...EMPTY_TREATMENT });
  const [saving, setSaving] = useState(false);
  
  // AI Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [editableExamData, setEditableExamData] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  // Sort treatments by date descending for the history list
  const sortedTreatments = [...treatments].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  useEffect(() => {
    if (showAIModal && physicalExams.length > 0 && !selectedExamId) {
      handleExamSelect(physicalExams[0].id);
    }
  }, [showAIModal, physicalExams]);

  const handleExamSelect = (examId: string | number) => {
    setSelectedExamId(String(examId));
    const exam = physicalExams.find(e => String(e.id) === String(examId));
    if (exam) {
      // Format exam data for display/editing
      let text = `Tipo de Piel: ${exam.skin_type || 'N/A'}\n`;
      text += `Fototipo: ${exam.phototype || 'N/A'}\n`;
      text += `Glogau: ${exam.glogau_scale || 'N/A'}\n`;
      text += `Lesiones: ${exam.lesions_description || 'N/A'}\n`;
      
      try {
        const face = typeof exam.face_map_data === 'string' ? JSON.parse(exam.face_map_data) : exam.face_map_data;
        if (Array.isArray(face) && face.length > 0) {
          text += `\nMapa Facial (Lesiones):\n`;
          face.forEach((f: any) => {
             text += `- ${f.category} (${f.distribution || 'General'}): ${f.severity || 'N/A'} - ${f.notes || 'Zona no especificada'}\n`;
          });
        }
        
        const body = typeof exam.body_map_data === 'string' ? JSON.parse(exam.body_map_data) : exam.body_map_data;
        if (Array.isArray(body) && body.length > 0) {
          text += `\nMapa Corporal (Lesiones):\n`;
          body.forEach((b: any) => {
             text += `- ${b.category} (${b.distribution || 'General'}): ${b.severity || 'N/A'} - ${b.notes || 'Zona no especificada'}\n`;
          });
        }
      } catch (e) {
        console.error('Error parsing map data', e);
      }

      setEditableExamData(text);
    }
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const response = await fetch('/api/records?action=generateTreatmentAI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          patientAge,
          examData: editableExamData, // Send the edited text
          treatmentContext: aiContext
        }),
      });

      if (!response.ok) throw new Error('Error generating AI suggestion');

      const data = await response.json();
      
      // Helper to format recursive objects/arrays
      const formatProtocolValue = (value: any, depth = 0): string => {
        const indent = '  '.repeat(depth);
        
        if (value === null || value === undefined) return '';
        
        if (typeof value === 'string') return value;
        
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        
        if (Array.isArray(value)) {
          return value.map((item, i) => {
             // If item is string, just list it. If object, format it.
             if (typeof item === 'string') return `${indent}${i+1}. ${item}`;
             return `${indent}${i+1}. \n${formatProtocolValue(item, depth + 1)}`;
          }).join('\n');
        }
        
        if (typeof value === 'object') {
          return Object.entries(value).map(([k, v]) => {
            // Format key: device_parameters -> Device Parameters
            const niceKey = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // If value is object/array, put on new line
            if (typeof v === 'object' && v !== null) {
                return `${indent}${niceKey}:\n${formatProtocolValue(v, depth + 1)}`;
            }
            return `${indent}${niceKey}: ${formatProtocolValue(v, depth)}`;
          }).join('\n');
        }
        
        return String(value);
      };

      // Format the result
      let protocolText = formatProtocolValue(data.protocol);

      const formattedSuggestion = `TRATAMIENTO SUGERIDO: ${data.treatment_name}
      
DESCRIPCIÓN:
${data.description}

OBJETIVO:
${data.objective}

PROTOCOLO:
${protocolText}`;

      setCurrentTreatment(prev => ({
        ...prev,
        ai_suggestion: formattedSuggestion,
        // Optionally fill other fields if empty
        procedure_name: prev.procedure_name || data.treatment_name,
        notes: prev.notes || formattedSuggestion
      }));

      setShowAIModal(false);
    } catch (error) {
      console.error('AI Error:', error);
      alert('Error al generar sugerencia');
    } finally {
      setGeneratingAI(false);
    }
  };

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

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Sugerencia IA</label>
              <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center gap-1 text-xs bg-gradient-to-r from-[#deb887] to-[#d4a76a] text-white px-2 py-1 rounded hover:shadow-md transition-all"
              >
                <Sparkles className="w-3 h-3" />
                Generar con IA
              </button>
            </div>
            <textarea
              rows={6}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none bg-gray-50"
              value={currentTreatment.ai_suggestion || ''}
              onChange={e => setCurrentTreatment({...currentTreatment, ai_suggestion: e.target.value})}
              placeholder="La sugerencia generada por IA aparecerá aquí..."
            />
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-[#deb887] text-white rounded-t-xl">
              <h3 className="font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Asistente de Tratamiento IA
              </h3>
              <button onClick={() => setShowAIModal(false)} className="hover:bg-white/20 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <p><strong>Paciente:</strong> {patientName} ({patientAge} años)</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">1. Seleccionar Examen Físico Base</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={selectedExamId}
                  onChange={(e) => handleExamSelect(e.target.value)}
                >
                  <option value="">Seleccionar examen...</option>
                  {physicalExams.map((exam, idx) => (
                    <option key={exam.id || idx} value={exam.id}>
                      {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : `Examen ${exam.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">2. Contexto Clínico (Editable)</label>
                <textarea
                  rows={4}
                  className="w-full p-2 border rounded-lg text-sm"
                  value={editableExamData}
                  onChange={(e) => setEditableExamData(e.target.value)}
                  placeholder="Datos del examen físico..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">3. Contexto del Tratamiento</label>
                <textarea
                  rows={3}
                  className="w-full p-2 border rounded-lg text-sm"
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="Describe el equipo a usar, objetivo, número de sesión, etc..."
                />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
              <button 
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleGenerateAI}
                disabled={generatingAI}
                className="px-4 py-2 bg-gradient-to-r from-[#deb887] to-[#d4a76a] text-white rounded-lg hover:shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {generatingAI ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar Sugerencia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
