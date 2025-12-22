
import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2, Copy, Printer, Info, Edit2 } from 'lucide-react';
import { CLINICAL_FIELDS, LESION_CATALOG, PARAMETER_TOOLTIPS } from '../../../../../data/clinical-catalogs';
import FaceMapCanvas, { Mark } from '../FaceMapCanvas';
import BodyMapCanvas from '../BodyMapCanvas';

interface PhysicalExam {
  id?: number;
  record_id: number;
  skin_type: string;
  phototype: string;
  glogau_scale: string;
  hydration: string;
  elasticity: string;
  lesions_description: string;
  photoprotection?: string;
  texture?: string;
  pores?: string;
  pigmentation?: string;
  sensitivity?: string;
  face_map_data?: string;
  body_map_data?: string;
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
  lesions_description: '',
  photoprotection: '',
  texture: '',
  pores: '',
  pigmentation: '',
  sensitivity: '',
  face_map_data: '[]',
  body_map_data: '[]'
};

// Modal Component for Editing Marks
const MarkEditModal = ({ mark, onSave, onCancel, categories }: { mark: Mark, onSave: (m: Mark) => void, onCancel: () => void, categories: string[] }) => {
  const [editedMark, setEditedMark] = useState<Mark>({
    ...mark,
    distribution: mark.distribution || 'puntual',
    severity: mark.severity || 'leve'
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Detalles de la Lesión</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Tipo de Lesión</label>
          <select 
            value={editedMark.category}
            onChange={e => setEditedMark({...editedMark, category: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">Severidad / Grado</label>
          <select 
            value={editedMark.severity}
            onChange={e => setEditedMark({...editedMark, severity: e.target.value as any})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
          >
            <option value="leve">Leve</option>
            <option value="moderado">Moderado</option>
            <option value="severo">Severo</option>
            <option value="profundo">Profundo</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700">Distribución</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="distribution" 
                value="puntual"
                checked={editedMark.distribution === 'puntual'}
                onChange={() => setEditedMark({...editedMark, distribution: 'puntual'})}
                className="text-[#deb887] focus:ring-[#deb887]"
              />
              <span className="text-sm">Puntual</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="distribution" 
                value="zonal"
                checked={editedMark.distribution === 'zonal'}
                onChange={() => setEditedMark({...editedMark, distribution: 'zonal'})}
                className="text-[#deb887] focus:ring-[#deb887]"
              />
              <span className="text-sm">Zonal (Toda la zona)</span>
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Zona / Ubicación</label>
          <input 
            type="text"
            value={editedMark.notes || ''}
            onChange={e => setEditedMark({...editedMark, notes: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
            placeholder="Ej: Mejilla derecha, Frente..."
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">Puede ajustar el nombre de la zona manualmente.</p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
          <button onClick={() => onSave(editedMark)} className="px-4 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c5a075] transition-colors">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

export default function PhysicalExamTab({ recordId, physicalExams, patientName, onSave }: PhysicalExamTabProps) {
  const [currentExam, setCurrentExam] = useState<PhysicalExam>({ ...EMPTY_EXAM, record_id: recordId });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Canvas State
  const [faceMarks, setFaceMarks] = useState<Mark[]>([]);
  const [bodyMarks, setBodyMarks] = useState<Mark[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'facial' | 'corporal'>('facial');

  // Modal State
  const [editingMark, setEditingMark] = useState<Mark | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ content: string, x: number, y: number } | null>(null);

  useEffect(() => {
    if (physicalExams.length > 0 && !currentExam.id) {
      loadExam(physicalExams[0]);
    } else if (physicalExams.length === 0 && !currentExam.id) {
      resetExam();
    }
  }, [physicalExams, recordId]);

  const loadExam = (exam: PhysicalExam) => {
    setCurrentExam(exam);
    try {
      const parseData = (data: any) => {
        if (!data) return [];
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch {
            return [];
          }
        }
        return data;
      };

      setFaceMarks(parseData(exam.face_map_data));
      setBodyMarks(parseData(exam.body_map_data));
    } catch (e) {
      console.error("Error parsing map data", e);
      setFaceMarks([]);
      setBodyMarks([]);
    }
  };

  const resetExam = () => {
    setCurrentExam({ ...EMPTY_EXAM, record_id: recordId });
    setFaceMarks([]);
    setBodyMarks([]);
    setMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentExam(prev => ({ ...prev, [name]: value }));
  };

  const handleNew = () => {
    resetExam();
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

    const examToSave = {
      ...currentExam,
      face_map_data: JSON.stringify(faceMarks),
      body_map_data: JSON.stringify(bodyMarks)
    };

    try {
      const response = await fetch('/api/clinical-records?action=savePhysicalExam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examToSave),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Examen físico guardado correctamente' });
        onSave();
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al guardar');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar el examen físico' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    // Simplified print logic for now
    window.print();
  };

  // Map Handlers
  const initiateAddMark = (mark: Omit<Mark, 'id'>) => {
    const newMark = { ...mark, id: Date.now().toString() };
    setEditingMark(newMark);
    setIsModalOpen(true);
  };

  const initiateEditMark = (mark: Mark) => {
    setEditingMark(mark);
    setIsModalOpen(true);
  };

  const saveMarkFromModal = (mark: Mark) => {
    if (activeTab === 'facial') {
      setFaceMarks(prev => {
        const exists = prev.find(m => m.id === mark.id);
        if (exists) return prev.map(m => m.id === mark.id ? mark : m);
        return [...prev, mark];
      });
    } else {
      setBodyMarks(prev => {
        const exists = prev.find(m => m.id === mark.id);
        if (exists) return prev.map(m => m.id === mark.id ? mark : m);
        return [...prev, mark];
      });
    }
    setIsModalOpen(false);
    setEditingMark(null);
  };

  const removeFaceMark = (id: string) => {
    setFaceMarks(prev => prev.filter(m => m.id !== id));
  };

  const removeBodyMark = (id: string) => {
    setBodyMarks(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="flex h-[800px] gap-4">
      {isModalOpen && editingMark && (
        <MarkEditModal 
          mark={editingMark} 
          onSave={saveMarkFromModal} 
          onCancel={() => setIsModalOpen(false)}
          categories={LESION_CATALOG}
        />
      )}
      {/* Sidebar List */}
      <div className="w-64 border-r border-gray-200 pr-4 flex flex-col gap-2 shrink-0">
        <div className="font-semibold text-gray-700 mb-2">Historial</div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {physicalExams.map((exam, index) => (
            <div
              key={exam.id || index}
              onClick={() => loadExam(exam)}
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
          <button 
            onClick={handleNew}
            className="w-full py-2 mt-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#deb887] hover:text-[#deb887] transition-colors"
          >
            + Nuevo Examen
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Toolbar */}
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg shrink-0">
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c5a075] transition-colors">
              <Save size={18} /> Guardar
            </button>
            <button onClick={handleDuplicate} className="p-2 hover:bg-gray-200 rounded-lg" title="Duplicar">
              <Copy size={18} className="text-gray-600" />
            </button>
            <button onClick={handleDelete} className="p-2 hover:bg-gray-200 rounded-lg" title="Eliminar">
              <Trash2 size={18} className="text-red-500" />
            </button>
            <button onClick={handlePrint} className="p-2 hover:bg-gray-200 rounded-lg" title="Imprimir">
              <Printer size={18} className="text-gray-600" />
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {currentExam.id ? `Editando: ${new Date(currentExam.created_at!).toLocaleDateString()}` : 'Nuevo Registro'}
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <AlertCircle size={16} />
            {message.text}
          </div>
        )}

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Column: Maps */}
          <div className="flex-1 flex flex-col overflow-y-auto min-w-[400px]">
            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button 
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'facial' ? 'border-[#deb887] text-[#deb887]' : 'border-transparent text-gray-500'}`}
                onClick={() => setActiveTab('facial')}
              >
                Facial
              </button>
              <button 
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'corporal' ? 'border-[#deb887] text-[#deb887]' : 'border-transparent text-gray-500'}`}
                onClick={() => setActiveTab('corporal')}
              >
                Corporal
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Lesión para Marcar:</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">-- Seleccione una lesión --</option>
                {LESION_CATALOG.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center overflow-auto">
              {activeTab === 'facial' ? (
                <FaceMapCanvas 
                  marks={faceMarks} 
                  onAddMark={initiateAddMark} 
                  onRemoveMark={removeFaceMark}
                  selectedCategory={selectedCategory}
                />
              ) : (
                <BodyMapCanvas 
                  marks={bodyMarks} 
                  onAddMark={initiateAddMark} 
                  onRemoveMark={removeBodyMark}
                  selectedCategory={selectedCategory}
                />
              )}
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Lesiones Marcadas ({activeTab === 'facial' ? faceMarks.length : bodyMarks.length})</h4>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                {(activeTab === 'facial' ? faceMarks : bodyMarks).map((mark, i) => (
                  <div key={mark.id} className="flex justify-between items-center p-2 border-b last:border-0 hover:bg-gray-50 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{i + 1}. {mark.category}</span>
                      <span className="text-xs text-gray-500">
                        {mark.notes && `${mark.notes} `}
                        {mark.severity && `• ${mark.severity.charAt(0).toUpperCase() + mark.severity.slice(1)} `}
                        {mark.distribution && `• ${mark.distribution === 'puntual' ? 'Puntual' : 'Zonal'}`}
                        {mark.view && ` • ${mark.view === 'front' ? 'Frontal' : 'Posterior'}`}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => initiateEditMark(mark)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => activeTab === 'facial' ? removeFaceMark(mark.id) : removeBodyMark(mark.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {(activeTab === 'facial' ? faceMarks : bodyMarks).length === 0 && (
                  <div className="p-4 text-center text-gray-400 text-sm">No hay lesiones marcadas</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Clinical Parameters */}
          <div className="w-[350px] flex flex-col gap-4 overflow-y-auto pr-2 shrink-0">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Parámetros Clínicos</h3>
            
            {Object.entries(CLINICAL_FIELDS).map(([key, field]) => (
              <div key={key} className="space-y-1 group relative">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                  <div className="relative">
                    <Info 
                      size={14} 
                      className="text-gray-400 cursor-help"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          content: PARAMETER_TOOLTIPS[key] || '',
                          x: rect.left - 270,
                          y: rect.top
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  </div>
                </div>
                <select
                  name={key}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none text-sm"
                  value={(currentExam as any)[key] || ''}
                  onChange={handleChange}
                >
                  {field.options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt || 'Seleccionar...'}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="space-y-2 mt-4">
              <label className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
              <textarea
                name="lesions_description"
                rows={4}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none resize-none text-sm"
                placeholder="Observaciones generales..."
                value={currentExam.lesions_description || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>

      {tooltip && (
        <div 
          className="fixed w-64 bg-white border border-gray-200 shadow-xl rounded-lg p-3 z-[9999] text-xs text-gray-600 pointer-events-none animate-in fade-in duration-200"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div dangerouslySetInnerHTML={{ __html: tooltip.content }} />
        </div>
      )}
    </div>
  );
}
