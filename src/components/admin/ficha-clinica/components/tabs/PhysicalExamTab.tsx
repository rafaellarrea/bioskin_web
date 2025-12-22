import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2, Copy, Printer } from 'lucide-react';
import physicalExamOptions from '../../data/physical_exam_options.json';

interface PhysicalExam {
  id?: number;
  record_id: number;
  skin_type: string;
  phototype: string;
  glogau_scale: string;
  hydration: string;
  elasticity: string;
  lesions_description: string;
  created_at?: string;
}

interface PhysicalExamTabProps {
  recordId: number;
  physicalExams: PhysicalExam[];
  patientName: string;
  onSave: () => void;
}

const EMPTY_EXAM: Omit<PhysicalExam, 'record_id'> = {
  skin_type: '',
  phototype: '',
  glogau_scale: '',
  hydration: '',
  elasticity: '',
  lesions_description: ''
};

export default function PhysicalExamTab({ recordId, physicalExams, patientName, onSave }: PhysicalExamTabProps) {
  const [currentExam, setCurrentExam] = useState<PhysicalExam>({ ...EMPTY_EXAM, record_id: recordId });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (physicalExams.length > 0 && !currentExam.id) {
      setCurrentExam(physicalExams[0]);
    } else if (physicalExams.length === 0 && !currentExam.id) {
      setCurrentExam({ ...EMPTY_EXAM, record_id: recordId });
    }
  }, [physicalExams, recordId]);

  const getOptions = (category: string) => 
    (physicalExamOptions as any)[category] || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentExam(prev => ({ ...prev, [name]: value }));
  };

  const handleNew = () => {
    setCurrentExam({ ...EMPTY_EXAM, record_id: recordId });
    setMessage(null);
  };

  const handleDuplicate = () => {
    const { id, created_at, ...rest } = currentExam;
    setCurrentExam({ ...rest, record_id: recordId });
    setMessage({ type: 'success', text: 'Examen duplicado. Guarde para crear uno nuevo.' });
  };

  const handleDelete = async () => {
    if (!currentExam.id || !confirm('¿Eliminar este examen físico?')) return;
    
    try {
      const response = await fetch(`/api/clinical-records?action=deletePhysicalExam&id=${currentExam.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onSave();
        handleNew();
        alert('Examen eliminado correctamente');
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Error al eliminar el examen');
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/clinical-records?action=savePhysicalExam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentExam),
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Examen Físico - ${patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; color: #deb887; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            .section { margin-bottom: 20px; }
            .section h3 { border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #deb887; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
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
            <p><strong>Paciente:</strong> ${patientName}</p>
            <p><strong>Fecha de Examen:</strong> ${currentExam.created_at ? new Date(currentExam.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h3>Evaluación Cutánea</h3>
            <div class="grid">
              <div class="field"><span class="label">Tipo de Piel:</span> ${currentExam.skin_type || '-'}</div>
              <div class="field"><span class="label">Fototipo:</span> ${currentExam.phototype || '-'}</div>
              <div class="field"><span class="label">Escala Glogau:</span> ${currentExam.glogau_scale || '-'}</div>
              <div class="field"><span class="label">Hidratación:</span> ${currentExam.hydration || '-'}</div>
              <div class="field"><span class="label">Elasticidad:</span> ${currentExam.elasticity || '-'}</div>
            </div>
          </div>

          <div class="section">
            <h3>Observaciones / Lesiones</h3>
            <p>${currentExam.lesions_description || 'Sin observaciones registradas.'}</p>
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
        <div className="font-semibold text-gray-700 mb-2">Historial de Exámenes</div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {physicalExams.map((exam, index) => (
            <div
              key={exam.id || index}
              onClick={() => setCurrentExam(exam)}
              className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                currentExam.id === exam.id 
                  ? 'bg-[#deb887] text-white border-[#deb887]' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">
                {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : 'Nuevo Examen'}
              </div>
              <div className="text-sm opacity-80 truncate">
                {exam.skin_type ? `Piel ${exam.skin_type}` : 'Sin datos'}
              </div>
            </div>
          ))}
          {physicalExams.length === 0 && (
            <div className="text-gray-400 text-sm text-center py-4">No hay exámenes registrados</div>
          )}
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
        {/* Toolbar */}
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg sticky top-0 z-10">
          <div className="flex gap-2">
            <button onClick={handleNew} className="p-2 hover:bg-gray-200 rounded-lg" title="Nuevo Examen">
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
          </div>
          <div className="text-sm text-gray-500">
            {currentExam.id ? `Editando examen del ${new Date(currentExam.created_at!).toLocaleDateString()}` : 'Nuevo Examen'}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tipo de Piel</label>
            <select
              name="skin_type"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
              value={currentExam.skin_type || ''}
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
              value={currentExam.phototype || ''}
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
              value={currentExam.glogau_scale || ''}
              onChange={handleChange}
            >
              <option value="">Seleccionar...</option>
              {getOptions('clasificacion_glogau').map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Hidratación</label>
            <select
              name="hydration"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
              value={currentExam.hydration || ''}
              onChange={handleChange}
            >
              <option value="">Seleccionar...</option>
              {getOptions('hidratacion').map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Elasticidad</label>
            <select
              name="elasticity"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
              value={currentExam.elasticity || ''}
              onChange={handleChange}
            >
              <option value="">Seleccionar...</option>
              {getOptions('elasticidad').map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
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
            value={currentExam.lesions_description || ''}
            onChange={handleChange}
          />
        </div>

        {/* Placeholder for Face Map */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500">Mapa Facial Interactivo (Próximamente)</p>
          <p className="text-sm text-gray-400 mt-2">Aquí se podrá dibujar y marcar puntos sobre el rostro del paciente.</p>
        </div>
      </div>
    </div>
  );
}
