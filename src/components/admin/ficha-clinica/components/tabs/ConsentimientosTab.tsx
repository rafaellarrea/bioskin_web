import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Edit, Eye, Save, Printer, 
  CheckCircle, XCircle, AlertTriangle, ChevronRight, ChevronDown,
  Copy, RefreshCw
} from 'lucide-react';

// Load templates
const templatesGlob = import.meta.glob('/src/data/consent-templates/*.json', { eager: true });
const templates = Object.values(templatesGlob).map((mod: any) => mod.default || mod);

interface ConsentForm {
  id?: number;
  record_id: number;
  patient_id: number;
  status: 'draft' | 'finalized' | 'annulled';
  created_at?: string;
  created_by?: string;
  procedure_type: string;
  zone: string;
  sessions: number;
  objectives: string[];
  description: string;
  risks: string[];
  benefits: string[];
  alternatives: string[];
  pre_care: string[];
  post_care: string[];
  contraindications: string[];
  critical_antecedents: {
    allergies: string;
    medications: string;
    pregnancy: boolean;
    herpes: boolean;
    others: string[];
  };
  authorizations: {
    image_use: boolean;
    photo_video: boolean;
  };
  declarations: {
    understanding: boolean;
    questions: boolean;
    results: boolean;
    authorization: boolean;
    revocation: boolean;
    alternatives: boolean;
  };
  signatures: {
    patient_name: string;
    professional_name: string;
    patient_sig_data?: string;
    prof_sig_data?: string;
  };
  attachments: any[];
}

interface Props {
  patientId: number;
  recordId: number;
  patient?: any;
}

const API_URL = '/api/records';

export default function ConsentimientosTab({ patientId, recordId, patient }: Props) {
  const [consents, setConsents] = useState<ConsentForm[]>([]);
  const [view, setView] = useState<'list' | 'form' | 'preview'>('list');
  const [loading, setLoading] = useState(false);
  const [currentConsent, setCurrentConsent] = useState<ConsentForm | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadConsents();
  }, [patientId, recordId]);

  const loadConsents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=listConsents&patient_id=${patientId}&record_id=${recordId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setConsents(data);
      }
    } catch (error) {
      console.error('Error loading consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (index: string) => {
    const template = templates[parseInt(index)];
    if (!template || !currentConsent) return;

    setCurrentConsent({
      ...currentConsent,
      procedure_type: template.procedure_type,
      description: template.description,
      objectives: template.objectives || [],
      risks: template.risks || [],
      benefits: template.benefits || [],
      pre_care: template.pre_care || [],
      post_care: template.post_care || []
    });
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleNew = () => {
    setCurrentConsent({
      record_id: recordId,
      patient_id: patientId,
      status: 'draft',
      procedure_type: '',
      zone: '',
      sessions: 1,
      objectives: [],
      description: '',
      risks: [],
      benefits: [],
      alternatives: [],
      pre_care: [],
      post_care: [],
      contraindications: [],
      critical_antecedents: {
        allergies: '',
        medications: '',
        pregnancy: false,
        herpes: false,
        others: []
      },
      authorizations: {
        image_use: false,
        photo_video: false
      },
      declarations: {
        understanding: false,
        questions: false,
        results: false,
        authorization: false,
        revocation: false,
        alternatives: false
      },
      signatures: {
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : '',
        professional_name: 'Dra. Daniela Creamer'
      },
      attachments: []
    });
    setView('form');
    setActiveTab(0);
  };

  const handleEdit = (consent: ConsentForm) => {
    setCurrentConsent(consent);
    setView('form');
    setActiveTab(0);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este consentimiento?')) return;
    try {
      await fetch(`${API_URL}?action=deleteConsent&id=${id}`, { method: 'POST' }); // Using POST for delete action usually in this API style
      loadConsents();
    } catch (error) {
      console.error('Error deleting consent:', error);
    }
  };

  const handleSave = async () => {
    if (!currentConsent) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=saveConsent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentConsent)
      });
      const saved = await res.json();
      if (saved.id) {
        loadConsents();
        setView('list');
      }
    } catch (error) {
      console.error('Error saving consent:', error);
      alert('Error al guardar el consentimiento');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ConsentForm, value: any) => {
    if (!currentConsent) return;
    setCurrentConsent({ ...currentConsent, [field]: value });
  };

  const updateNestedField = (parent: keyof ConsentForm, child: string, value: any) => {
    if (!currentConsent) return;
    setCurrentConsent({
      ...currentConsent,
      [parent]: {
        ...(currentConsent[parent] as any),
        [child]: value
      }
    });
  };

  const renderList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Historial de Consentimientos</h3>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c5a075] transition-colors"
        >
          <Plus size={20} />
          Nuevo Consentimiento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedimiento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {consents.map((consent) => (
              <tr key={consent.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(consent.created_at || '').toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {consent.procedure_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${consent.status === 'finalized' ? 'bg-green-100 text-green-800' : 
                      consent.status === 'annulled' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {consent.status === 'finalized' ? 'Finalizado' : 
                     consent.status === 'annulled' ? 'Anulado' : 'Borrador'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(consent)} className="text-blue-600 hover:text-blue-900">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(consent.id!)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {consents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No hay consentimientos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderForm = () => {
    if (!currentConsent) return null;

    const tabs = [
      { id: 0, label: 'Información Básica', icon: FileText },
      { id: 1, label: 'Detalles Médicos', icon: AlertTriangle },
      { id: 2, label: 'Autorizaciones', icon: CheckCircle },
      { id: 3, label: 'Firmas', icon: Edit },
    ];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">
              &larr; Volver
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {currentConsent.id ? 'Editar Consentimiento' : 'Nuevo Consentimiento'}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('preview')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Eye size={18} />
              Vista Previa
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c5a075]"
            >
              <Save size={18} />
              Guardar
            </button>
          </div>
        </div>

        {/* Template Selector */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <label className="block text-sm font-medium text-blue-900 mb-2">Cargar Plantilla de Consentimiento</label>
          <select 
            className="w-full p-2 border border-blue-200 rounded-lg bg-white text-gray-700"
            onChange={(e) => loadTemplate(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Seleccione un procedimiento...</option>
            {templates.map((t: any, i) => (
              <option key={i} value={i}>{t.procedure_type}</option>
            ))}
          </select>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-[#deb887] text-[#deb887] font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Procedimiento</label>
                  <input
                    type="text"
                    value={currentConsent.procedure_type}
                    onChange={(e) => updateField('procedure_type', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                    placeholder="Ej: Toxina Botulínica"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zona a Tratar</label>
                  <input
                    type="text"
                    value={currentConsent.zone}
                    onChange={(e) => updateField('zone', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                    placeholder="Ej: Tercio superior facial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Sesiones</label>
                  <input
                    type="number"
                    value={currentConsent.sessions}
                    onChange={(e) => updateField('sessions', parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Procedimiento</label>
                <textarea
                  value={currentConsent.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                  placeholder="Describa el procedimiento detalladamente..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivos (uno por línea)</label>
                <textarea
                  value={currentConsent.objectives?.join('\n')}
                  onChange={(e) => updateField('objectives', e.target.value.split('\n'))}
                  rows={4}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                  placeholder="Objetivo 1&#10;Objetivo 2"
                />
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Riesgos (uno por línea)</label>
                  <textarea
                    value={currentConsent.risks?.join('\n')}
                    onChange={(e) => updateField('risks', e.target.value.split('\n'))}
                    rows={4}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beneficios (uno por línea)</label>
                  <textarea
                    value={currentConsent.benefits?.join('\n')}
                    onChange={(e) => updateField('benefits', e.target.value.split('\n'))}
                    rows={4}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuidados Previos</label>
                  <textarea
                    value={currentConsent.pre_care?.join('\n')}
                    onChange={(e) => updateField('pre_care', e.target.value.split('\n'))}
                    rows={4}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuidados Posteriores</label>
                  <textarea
                    value={currentConsent.post_care?.join('\n')}
                    onChange={(e) => updateField('post_care', e.target.value.split('\n'))}
                    rows={4}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Antecedentes Críticos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alergias</label>
                    <input
                      type="text"
                      value={currentConsent.critical_antecedents?.allergies}
                      onChange={(e) => updateNestedField('critical_antecedents', 'allergies', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medicación Actual</label>
                    <input
                      type="text"
                      value={currentConsent.critical_antecedents?.medications}
                      onChange={(e) => updateNestedField('critical_antecedents', 'medications', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentConsent.critical_antecedents?.pregnancy}
                        onChange={(e) => updateNestedField('critical_antecedents', 'pregnancy', e.target.checked)}
                        className="rounded text-[#deb887] focus:ring-[#deb887]"
                      />
                      <span className="text-sm text-gray-700">Embarazo / Lactancia</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentConsent.critical_antecedents?.herpes}
                        onChange={(e) => updateNestedField('critical_antecedents', 'herpes', e.target.checked)}
                        className="rounded text-[#deb887] focus:ring-[#deb887]"
                      />
                      <span className="text-sm text-gray-700">Herpes Recurrente</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Autorizaciones de Imagen</h4>
                <div className="space-y-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={currentConsent.authorizations?.image_use}
                      onChange={(e) => updateNestedField('authorizations', 'image_use', e.target.checked)}
                      className="mt-1 rounded text-[#deb887] focus:ring-[#deb887]"
                    />
                    <span className="text-sm text-gray-700">
                      Autorizo el uso de mis imágenes con fines educativos y/o promocionales, entendiendo que se protegerá mi identidad en la medida de lo posible.
                    </span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={currentConsent.authorizations?.photo_video}
                      onChange={(e) => updateNestedField('authorizations', 'photo_video', e.target.checked)}
                      className="mt-1 rounded text-[#deb887] focus:ring-[#deb887]"
                    />
                    <span className="text-sm text-gray-700">
                      Autorizo la toma de fotografías y/o videos del procedimiento para registro clínico.
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Declaraciones del Paciente</h4>
                <div className="space-y-3">
                  {[
                    { key: 'understanding', label: 'He recibido información clara y completa del tratamiento.' },
                    { key: 'questions', label: 'He tenido oportunidad de resolver todas mis dudas.' },
                    { key: 'results', label: 'Entiendo que los resultados pueden variar y no se garantizan resultados específicos.' },
                    { key: 'authorization', label: 'Autorizo voluntariamente la realización del tratamiento.' },
                    { key: 'revocation', label: 'Sé que puedo revocar este consentimiento en cualquier momento antes del procedimiento.' },
                    { key: 'alternatives', label: 'Me han explicado las alternativas de tratamiento, incluyendo la opción de no tratarme.' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={(currentConsent.declarations as any)?.[item.key]}
                        onChange={(e) => updateNestedField('declarations', item.key, e.target.checked)}
                        className="rounded text-[#deb887] focus:ring-[#deb887]"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border p-4 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-4">Firma del Paciente</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        value={currentConsent.signatures?.patient_name}
                        onChange={(e) => updateNestedField('signatures', 'patient_name', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                      <span className="text-gray-400 text-sm">Espacio para firma digital (Próximamente)</span>
                    </div>
                  </div>
                </div>

                <div className="border p-4 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-4">Firma del Profesional</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Registro</label>
                      <input
                        type="text"
                        value={currentConsent.signatures?.professional_name}
                        onChange={(e) => updateNestedField('signatures', 'professional_name', e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                    <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                      <span className="text-gray-400 text-sm">Espacio para firma digital (Próximamente)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <div className="flex items-center gap-4">
                  <label className="block text-sm font-medium text-gray-700">Estado del Documento:</label>
                  <select
                    value={currentConsent.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                  >
                    <option value="draft">Borrador</option>
                    <option value="finalized">Finalizado</option>
                    <option value="annulled">Anulado</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!currentConsent) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b pb-4 no-print">
          <button onClick={() => setView('form')} className="text-gray-500 hover:text-gray-700">
            &larr; Volver a Edición
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            <Printer size={18} />
            Imprimir
          </button>
        </div>

        <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-[#deb887] pb-4">
            <div className="flex items-center gap-4">
              <img src="/images/logo/logo.png" alt="BioSkin Logo" className="h-20 w-auto object-contain" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">BIOSKIN SALUD Y ESTETICA</h2>
                <p className="text-sm font-semibold text-[#deb887]">DRA. DANIELA CREAMER</p>
                <p className="text-xs text-gray-500">Cosmiatría y Dermatocosmiatría Clínica</p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Expediente:</strong> #{recordId}</p>
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-8 text-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">INFORMACIÓN DEL PACIENTE</h3>
            <div className="grid grid-cols-2 gap-4">
              <p><strong>Nombre:</strong> {patient?.first_name} {patient?.last_name}</p>
              <p><strong>Identificación:</strong> {patient?.rut || 'N/A'}</p>
              <p><strong>Edad:</strong> {patient?.birth_date ? calculateAge(patient.birth_date) : 'N/A'} años</p>
              <p><strong>Teléfono:</strong> {patient?.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">CONSENTIMIENTO INFORMADO</h1>
            <h2 className="text-xl text-[#deb887] mt-2">{currentConsent.procedure_type}</h2>
          </div>

          <div className="space-y-6 text-gray-800">
            <section>
              <h3 className="font-bold border-b border-[#deb887] mb-2">1. DESCRIPCIÓN DEL PROCEDIMIENTO</h3>
              <p className="mb-2"><strong>Zona a tratar:</strong> {currentConsent.zone}</p>
              <p className="mb-2"><strong>Sesiones estimadas:</strong> {currentConsent.sessions}</p>
              <p className="whitespace-pre-wrap">{currentConsent.description}</p>
            </section>

            {currentConsent.objectives?.length > 0 && (
              <section>
                <h3 className="font-bold border-b border-[#deb887] mb-2">2. OBJETIVOS</h3>
                <ul className="list-disc pl-5">
                  {currentConsent.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                </ul>
              </section>
            )}

            <section>
              <h3 className="font-bold border-b border-[#deb887] mb-2">3. RIESGOS Y BENEFICIOS</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Riesgos:</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {currentConsent.risks?.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Beneficios:</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {currentConsent.benefits?.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-bold border-b border-[#deb887] mb-2">4. CUIDADOS</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Previos:</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {currentConsent.pre_care?.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Posteriores:</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {currentConsent.post_care?.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-bold border-b border-[#deb887] mb-2">5. ANTECEDENTES CRÍTICOS</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Alergias:</strong> {currentConsent.critical_antecedents?.allergies || 'Niega'}</p>
                  <p><strong>Medicación:</strong> {currentConsent.critical_antecedents?.medications || 'Niega'}</p>
                </div>
                <div>
                  <p><strong>Embarazo/Lactancia:</strong> {currentConsent.critical_antecedents?.pregnancy ? 'Sí' : 'No'}</p>
                  <p><strong>Herpes Recurrente:</strong> {currentConsent.critical_antecedents?.herpes ? 'Sí' : 'No'}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-bold border-b border-[#deb887] mb-2">6. DECLARACIONES Y AUTORIZACIONES</h3>
              <div className="space-y-2 text-sm">
                <p>
                  {currentConsent.declarations?.understanding ? '☑' : '☐'} Declaro haber recibido información clara y completa del tratamiento.
                </p>
                <p>
                  {currentConsent.declarations?.questions ? '☑' : '☐'} He tenido oportunidad de resolver todas mis dudas.
                </p>
                <p>
                  {currentConsent.declarations?.results ? '☑' : '☐'} Entiendo que los resultados pueden variar y no se garantizan resultados específicos.
                </p>
                <p>
                  {currentConsent.declarations?.authorization ? '☑' : '☐'} Autorizo voluntariamente la realización del tratamiento.
                </p>
                <p>
                  {currentConsent.declarations?.revocation ? '☑' : '☐'} Sé que puedo revocar este consentimiento en cualquier momento antes del procedimiento.
                </p>
                <p>
                  {currentConsent.declarations?.alternatives ? '☑' : '☐'} Me han explicado las alternativas de tratamiento, incluyendo la opción de no tratarme.
                </p>
                <div className="mt-4 pt-2 border-t border-gray-100">
                  <p>
                    {currentConsent.authorizations?.image_use ? '☑' : '☐'} Autorizo el uso de mis imágenes con fines educativos y/o promocionales.
                  </p>
                  <p>
                    {currentConsent.authorizations?.photo_video ? '☑' : '☐'} Autorizo la toma de fotografías y/o videos del procedimiento para registro clínico.
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-12 grid grid-cols-2 gap-12 pt-12">
              <div className="text-center border-t border-gray-400 pt-2">
                <p className="font-bold">{currentConsent.signatures?.patient_name}</p>
                <p className="text-sm text-gray-500">Firma del Paciente</p>
              </div>
              <div className="text-center border-t border-gray-400 pt-2">
                <p className="font-bold">{currentConsent.signatures?.professional_name}</p>
                <p className="text-sm text-gray-500">Firma del Profesional</p>
              </div>
            </div>
            
            <div className="text-center text-xs text-gray-400 mt-8">
              Documento generado el {new Date().toLocaleDateString()} • BIOSKIN
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {view === 'list' && renderList()}
      {view === 'form' && renderForm()}
      {view === 'preview' && renderPreview()}
    </div>
  );
}
