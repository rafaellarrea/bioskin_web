import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Trash2, Edit, Eye, Save, Printer, 
  CheckCircle, XCircle, AlertTriangle, ChevronRight, ChevronDown,
  Copy, RefreshCw, QrCode, Smartphone, Eraser, X, Maximize2, Search
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SignatureCanvas from 'react-signature-canvas';

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
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const profSigCanvas = useRef<SignatureCanvas>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredTemplates = templates.filter((t: any) => 
    t.procedure_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    loadConsents();
    // Initialize professional signatures table
    fetch('/api/records?action=initProfessionalSignatures').catch(console.error);
  }, [patientId, recordId]);

  const loadProfessionalSignature = async (name: string) => {
    if (!name) return;
    try {
      const res = await fetch(`/api/records?action=getProfessionalSignature&name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.signature) {
          // If signature exists, update the current consent
          updateNestedField('signatures', 'professional_sig_data', data.signature);
        }
      }
    } catch (err) {
      console.error('Error loading signature:', err);
    }
  };

  const saveProfessionalSignature = async () => {
    const name = currentConsent?.signatures?.professional_name;
    const sigData = currentConsent?.signatures?.professional_sig_data;
    
    if (!name || !sigData) {
      alert('Se requiere nombre y firma para guardar');
      return;
    }

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveProfessionalSignature',
          name,
          signature: sigData
        })
      });
      
      if (res.ok) {
        alert('Firma guardada como predeterminada para ' + name);
      }
    } catch (err) {
      console.error('Error saving signature:', err);
      alert('Error al guardar firma');
    }
  };

  const clearProfSignature = () => {
    profSigCanvas.current?.clear();
    updateNestedField('signatures', 'professional_sig_data', null);
  };

  const handleProfSignatureEnd = () => {
    if (profSigCanvas.current) {
      const dataUrl = profSigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      updateNestedField('signatures', 'professional_sig_data', dataUrl);
    }
  };

  const handleResetAndGenerate = async () => {
    if (!currentConsent) return;
    if (!confirm('¿Está seguro de eliminar la firma actual y generar una nueva solicitud? El paciente deberá firmar nuevamente.')) return;

    // Clear signature locally
    const updatedConsent = {
      ...currentConsent,
      signatures: {
        ...currentConsent.signatures,
        patient_sig_data: '',
        patient_name: currentConsent.signatures?.patient_name || '' // Keep name if exists
      }
    };
    setCurrentConsent(updatedConsent);
    
    // Save and generate new link
    setLoading(true);
    try {
      // First save the cleared signature
      await fetch(`${API_URL}?action=saveConsent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConsent)
      });

      // Then generate new token
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateSigningToken',
          id: currentConsent.id
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const url = `${window.location.origin}/#${data.url}`;
        setSigningUrl(url);
        setShowQr(true);
      } else {
        alert('Error al generar nuevo enlace');
      }
    } catch (error) {
      console.error('Error resetting signature:', error);
      alert('Error al restablecer firma');
    } finally {
      setLoading(false);
    }
  };

  const generateSigningLink = async () => {
    if (!currentConsent?.id) {
      alert('Guarde el consentimiento antes de generar la firma remota');
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateSigningToken',
          id: currentConsent.id
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const url = `${window.location.origin}/#${data.url}`;
        setSigningUrl(url);
        setShowQr(true);
      } else {
        alert('Error al generar enlace de firma');
      }
    } catch (error) {
      console.error('Error generating signing link:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSigningStatus = async () => {
    if (!currentConsent?.id) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?action=getConsent&id=${currentConsent.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentConsent(data);
        if (data.signatures?.patient_sig_data) {
          setShowQr(false);
          alert('¡Firma recibida correctamente!');
        } else {
          alert('Aún no se ha recibido la firma');
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const migrateDB = async () => {
    if (!confirm('¿Actualizar estructura de base de datos? Esto agregará las columnas necesarias para la firma remota.')) return;
    try {
      const res = await fetch('/api/records?action=migrateConsents');
      if (res.ok) alert('Base de datos actualizada correctamente');
      else alert('Error al actualizar base de datos');
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  const renderList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Historial de Consentimientos</h3>
        <div className="flex gap-2">
          <button
            onClick={migrateDB}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
          >
            <RefreshCw size={16} />
            Configurar DB
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c5a075] transition-colors"
          >
            <Plus size={20} />
            Nuevo Consentimiento
          </button>
        </div>
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
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                className="w-full p-2 pl-10 border border-blue-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Buscar procedimiento..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              {searchTerm && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((t: any, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 transition-colors border-b last:border-0"
                      onClick={() => {
                        const originalIndex = templates.indexOf(t);
                        loadTemplate(originalIndex.toString());
                        setSearchTerm(t.procedure_type);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {t.procedure_type}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">No se encontraron resultados</div>
                )}
              </div>
            )}
          </div>
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
                    
                    <div className="min-h-[160px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white p-4">
                      {currentConsent.signatures?.patient_sig_data ? (
                        <div className="w-full flex flex-col items-center">
                          <img 
                            src={currentConsent.signatures.patient_sig_data} 
                            alt="Firma Paciente" 
                            className="max-h-32 object-contain mb-2"
                          />
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Firmado digitalmente
                          </span>
                          <button 
                            onClick={handleResetAndGenerate}
                            className="mt-3 flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                          >
                            <RefreshCw size={12} /> Generar Nueva Solicitud
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 w-full">
                          {!showQr ? (
                            <>
                              <span className="text-gray-400 text-sm">Sin firma registrada</span>
                              <button
                                onClick={generateSigningLink}
                                className="flex items-center gap-2 px-4 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c5a075] transition-colors"
                              >
                                <QrCode className="w-4 h-4" />
                                Generar Firma Remota
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-4 w-full">
                              <div className="bg-white p-2 rounded shadow-sm border">
                                {signingUrl && <QRCodeSVG value={signingUrl} size={150} />}
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-700">Escanee para firmar</p>
                                <a href={signingUrl!} target="_blank" rel="noreferrer" className="text-xs text-[#deb887] underline break-all">
                                  {signingUrl}
                                </a>
                              </div>
                              <div className="flex gap-2 w-full">
                                <button
                                  onClick={checkSigningStatus}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Verificar
                                </button>
                                <button
                                  onClick={() => setShowQr(false)}
                                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                                >
                                  Cerrar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border p-4 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-4">Firma del Profesional</h4>
                  <div className="space-y-4">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Registro</label>
                        <input
                          type="text"
                          value={currentConsent.signatures?.professional_name}
                          onChange={(e) => updateNestedField('signatures', 'professional_name', e.target.value)}
                          className="w-full p-2 border rounded-lg"
                          placeholder="Dra. Daniela Creamer"
                        />
                      </div>
                      <button
                        onClick={() => loadProfessionalSignature(currentConsent.signatures?.professional_name || '')}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        title="Cargar firma guardada"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-4 flex flex-col items-center justify-center min-h-[160px]">
                      {currentConsent.signatures?.professional_sig_data ? (
                        <div className="relative w-full flex flex-col items-center">
                          <img 
                            src={currentConsent.signatures.professional_sig_data} 
                            alt="Firma Profesional" 
                            className="max-h-32 object-contain mb-2"
                          />
                          <button 
                            onClick={() => {
                              clearProfSignature();
                              setIsSignatureModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={14} /> Cambiar firma
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="flex flex-col items-center gap-2 text-gray-500 hover:text-[#deb887] transition-colors w-full py-8"
                        >
                          <div className="p-4 bg-gray-100 rounded-full group-hover:bg-[#deb887] group-hover:text-white transition-colors">
                            <Edit size={32} />
                          </div>
                          <span className="font-medium text-lg">Haga clic para firmar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Modal */}
              {isSignatureModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center p-4 border-b">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Edit className="text-[#deb887]" />
                        Firma del Profesional
                      </h3>
                      <button 
                        onClick={() => setIsSignatureModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X size={28} />
                      </button>
                    </div>
                    
                    <div className="flex-1 p-6 bg-gray-50 overflow-hidden relative flex flex-col">
                      <div className="flex-1 bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden relative">
                        <SignatureCanvas 
                          ref={profSigCanvas}
                          canvasProps={{
                            className: 'w-full h-full cursor-crosshair',
                            style: { width: '100%', height: '100%' }
                          }}
                          onEnd={handleProfSignatureEnd}
                          backgroundColor="white"
                        />
                        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none opacity-30">
                          <span className="text-lg font-medium text-gray-400">Dibuje su firma aquí</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t flex justify-between items-center bg-white rounded-b-xl">
                      <button
                        onClick={() => {
                          profSigCanvas.current?.clear();
                          updateNestedField('signatures', 'professional_sig_data', '');
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                      >
                        <Eraser size={20} />
                        Limpiar
                      </button>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={saveProfessionalSignature}
                          className="flex items-center gap-2 px-4 py-2 text-[#deb887] hover:bg-[#fff8f0] rounded-lg font-medium transition-colors border border-[#deb887]"
                        >
                          <Save size={20} />
                          Guardar como predeterminada
                        </button>
                        <button
                          onClick={() => setIsSignatureModalOpen(false)}
                          className="px-8 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c5a075] font-medium shadow-lg shadow-orange-100 transition-all transform hover:scale-105"
                        >
                          Aceptar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-consent, #printable-consent * {
              visibility: visible;
            }
            #printable-consent {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
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

        <div id="printable-consent" className="bg-white p-4 md:p-8 max-w-4xl mx-auto shadow-lg print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b-2 border-[#deb887] pb-4 gap-4 md:gap-0">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="space-y-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-12 pt-12">
              <div className="flex flex-col items-center">
                {currentConsent.signatures?.patient_sig_data && (
                  <img 
                    src={currentConsent.signatures.patient_sig_data} 
                    alt="Firma Paciente" 
                    className="h-24 object-contain mb-2"
                  />
                )}
                <div className="w-full border-t border-gray-400 pt-2 text-center">
                  <p className="font-bold">{currentConsent.signatures?.patient_name}</p>
                  <p className="text-sm text-gray-500">Firma del Paciente</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                {currentConsent.signatures?.professional_sig_data && (
                  <img 
                    src={currentConsent.signatures.professional_sig_data} 
                    alt="Firma Profesional" 
                    className="h-24 object-contain mb-2"
                  />
                )}
                <div className="w-full border-t border-gray-400 pt-2 text-center">
                  <p className="font-bold">{currentConsent.signatures?.professional_name}</p>
                  <p className="text-sm text-gray-500">Firma del Profesional</p>
                </div>
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
