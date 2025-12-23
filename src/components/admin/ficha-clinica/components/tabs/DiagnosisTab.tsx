import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2, Copy, Printer, Sparkles } from 'lucide-react';
import diagnosisOptions from '../../data/diagnosis_options.json';

interface Diagnosis {
  id?: number;
  record_id: number;
  date?: string;
  diagnosis_text: string;
  cie10_code: string;
  type: string;
  severity: string;
  notes: string;
}

interface PhysicalExam {
  id?: number;
  face_map_data?: string;
  body_map_data?: string;
  skin_type?: string;
  phototype?: string;
  glogau_scale?: string;
  lesions_description?: string;
}

interface DiagnosisTabProps {
  recordId: number;
  diagnoses: Diagnosis[];
  physicalExams?: PhysicalExam[];
  patientName?: string;
  onSave: () => void;
}

const EMPTY_DIAGNOSIS: Omit<Diagnosis, 'record_id'> = {
  diagnosis_text: '',
  cie10_code: '',
  type: 'presumptive',
  severity: 'Leve',
  notes: ''
};

export default function DiagnosisTab({ recordId, diagnoses, physicalExams = [], patientName, onSave }: DiagnosisTabProps) {
  const [currentDiagnosis, setCurrentDiagnosis] = useState<Diagnosis>({ ...EMPTY_DIAGNOSIS, record_id: recordId });
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [aiWarning, setAiWarning] = useState<string | null>(null);

  useEffect(() => {
    if (diagnoses.length > 0 && !currentDiagnosis.id) {
      setCurrentDiagnosis(diagnoses[0]);
    } else if (diagnoses.length === 0 && !currentDiagnosis.id) {
      setCurrentDiagnosis({ ...EMPTY_DIAGNOSIS, record_id: recordId });
    }
  }, [diagnoses, recordId]);

  const handleNew = () => {
    setCurrentDiagnosis({ ...EMPTY_DIAGNOSIS, record_id: recordId });
    setMessage(null);
    setAiWarning(null);
  };

  const handleDuplicate = () => {
    const { id, date, ...rest } = currentDiagnosis;
    setCurrentDiagnosis({ ...rest, record_id: recordId });
    setMessage({ type: 'success', text: 'Diagnóstico duplicado. Guarde para crear uno nuevo.' });
  };

  const handleDelete = async () => {
    if (!currentDiagnosis.id || !confirm('¿Eliminar este diagnóstico?')) return;
    
    try {
      const response = await fetch(`/api/records?action=deleteDiagnosis&id=${currentDiagnosis.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onSave();
        handleNew();
        alert('Diagnóstico eliminado correctamente');
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
      alert('Error al eliminar el diagnóstico');
    }
  };

  const handleGenerateAI = async () => {
    if (!physicalExams || physicalExams.length === 0) {
      alert('No hay examen físico registrado para generar el diagnóstico. Por favor complete el examen físico primero.');
      return;
    }

    // Use the most recent exam
    const latestExam = physicalExams[physicalExams.length - 1];
    
    setGeneratingAI(true);
    setMessage(null);

    try {
      const response = await fetch('/api/records?action=generateDiagnosisAI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examData: latestExam,
          patientName
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al generar diagnóstico con IA');
      }

      const data = await response.json();
      
      setCurrentDiagnosis(prev => ({
        ...prev,
        diagnosis_text: data.diagnosis || prev.diagnosis_text,
        notes: data.notes || prev.notes
      }));
      
      setMessage({ type: 'success', text: 'Diagnóstico generado por IA correctamente' });
      setAiWarning('IMPORTANTE: Este diagnóstico ha sido generado por Inteligencia Artificial. Se requiere revisión y validación por parte de un profesional médico antes de guardar.');

    } catch (error: any) {
      console.error('AI Generation error:', error);
      setMessage({ type: 'error', text: error.message || 'Error al generar diagnóstico con IA' });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async () => {
    if (aiWarning && !confirm('¿Ha revisado y validado el diagnóstico generado por IA?')) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setAiWarning(null);

    try {
      const response = await fetch('/api/records?action=saveDiagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentDiagnosis),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Diagnóstico guardado correctamente' });
        alert('Diagnóstico guardado correctamente');
        onSave();
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al guardar');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar el diagnóstico' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Diagnóstico - ${patientName || 'Paciente'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; color: #deb887; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            .section { margin-bottom: 20px; }
            .section h3 { border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #deb887; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; color: #555; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BIOSKIN</h1>
            <p>Dermatología y Medicina Estética</p>
          </div>
          
          <div class="info">
            <p><strong>Paciente:</strong> ${patientName || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${currentDiagnosis.date ? new Date(currentDiagnosis.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h3>Detalle del Diagnóstico</h3>
            <div class="field"><span class="label">Diagnóstico:</span> ${currentDiagnosis.diagnosis_text}</div>
            <div class="field"><span class="label">CIE-10:</span> ${currentDiagnosis.cie10_code || '-'}</div>
            <div class="field"><span class="label">Tipo:</span> ${currentDiagnosis.type}</div>
            <div class="field"><span class="label">Severidad:</span> ${currentDiagnosis.severity}</div>
          </div>

          <div class="section">
            <h3>Notas Adicionales</h3>
            <p>${currentDiagnosis.notes || 'Sin notas registradas.'}</p>
          </div>

          <div class="footer">
            <p>_____________________________</p>
            <p>Firma Profesional</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="flex h-[600px] gap-4">
      {/* Sidebar List */}
      <div className="w-1/4 border-r border-gray-200 pr-4 flex flex-col gap-2">
        <div className="font-semibold text-gray-700 mb-2">Historial de Diagnósticos</div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {diagnoses.map((diag, index) => (
            <div
              key={diag.id || index}
              onClick={() => setCurrentDiagnosis(diag)}
              className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                currentDiagnosis.id === diag.id 
                  ? 'bg-[#deb887] text-white border-[#deb887]' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium truncate">{diag.diagnosis_text}</div>
              <div className="text-sm opacity-80">
                {diag.date ? new Date(diag.date).toLocaleDateString() : 'Nuevo'}
              </div>
            </div>
          ))}
          {diagnoses.length === 0 && (
            <div className="text-gray-400 text-sm text-center py-4">No hay diagnósticos registrados</div>
          )}
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
        {/* Toolbar */}
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg sticky top-0 z-10">
          <div className="flex gap-2">
            <button onClick={handleNew} className="p-2 hover:bg-gray-200 rounded-lg" title="Nuevo Diagnóstico">
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={handleSubmit} disabled={saving} className="p-2 hover:bg-gray-200 rounded-lg" title="Guardar">
              <Save className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={handleDuplicate} className="p-2 hover:bg-gray-200 rounded-lg" title="Duplicar">
              <Copy className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={handleDelete} className="p-2 hover:bg-gray-200 rounded-lg" title="Eliminar">
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
            <button onClick={handlePrint} className="p-2 hover:bg-gray-200 rounded-lg" title="Imprimir">
              <Printer className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={handleGenerateAI} 
              disabled={generatingAI} 
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#deb887] to-[#d4a76a] text-white rounded-lg hover:shadow-md transition-all disabled:opacity-50"
              title="Generar Diagnóstico con IA"
            >
              <Sparkles className={`w-4 h-4 ${generatingAI ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">{generatingAI ? 'Generando...' : 'Diagnóstico IA'}</span>
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {currentDiagnosis.id ? `Editando diagnóstico del ${new Date(currentDiagnosis.date!).toLocaleDateString()}` : 'Nuevo Diagnóstico'}
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <AlertCircle className="w-5 h-5" />
            {message.text}
          </div>
        )}

        {aiWarning && (
          <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Atención</p>
              <p className="text-sm">{aiWarning}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Diagnóstico</label>
            <input
              type="text"
              required
              list="diagnoses-list"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
              value={currentDiagnosis.diagnosis_text}
              onChange={e => setCurrentDiagnosis({...currentDiagnosis, diagnosis_text: e.target.value})}
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
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
              value={currentDiagnosis.cie10_code}
              onChange={e => setCurrentDiagnosis({...currentDiagnosis, cie10_code: e.target.value})}
              placeholder="Ej: L70.0"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
              value={currentDiagnosis.type}
              onChange={e => setCurrentDiagnosis({...currentDiagnosis, type: e.target.value})}
            >
              <option value="presumptive">Presuntivo</option>
              <option value="confirmed">Confirmado</option>
              <option value="differential">Diferencial</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Severidad</label>
            <select
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
              value={currentDiagnosis.severity}
              onChange={e => setCurrentDiagnosis({...currentDiagnosis, severity: e.target.value})}
            >
              <option value="Leve">Leve</option>
              <option value="Moderado">Moderado</option>
              <option value="Severo">Severo</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">Notas / Observaciones</label>
            <textarea
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none"
              value={currentDiagnosis.notes}
              onChange={e => setCurrentDiagnosis({...currentDiagnosis, notes: e.target.value})}
              placeholder="Detalles adicionales del diagnóstico..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
