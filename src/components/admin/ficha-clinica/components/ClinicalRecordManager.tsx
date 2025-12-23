import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Activity, 
  Stethoscope, 
  Syringe, 
  Pill, 
  FileSignature, 
  ArrowLeft,
  Save
} from 'lucide-react';
import AdminLayout from '../../AdminLayout';
import HistoryTab from './tabs/HistoryTab';
import PhysicalExamTab from './tabs/PhysicalExamTab';
import DiagnosisTab from './tabs/DiagnosisTab';
import TreatmentTab from './tabs/TreatmentTab';
import PrescriptionTab from './tabs/PrescriptionTab';
import ConsentimientosTab from './tabs/ConsentimientosTab';

interface TabButtonProps {
  id: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
      active 
        ? 'border-[#deb887] text-[#deb887]' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

export default function ClinicalRecordManager() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('history');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [recordData, setRecordData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordId) {
      fetchData();
    }
  }, [recordId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch record data first
      const recordRes = await fetch(`/api/records?action=getRecordData&recordId=${recordId}`);
      if (recordRes.ok) {
        const rData = await recordRes.json();
        setRecordData(rData);

        // Fetch patient info using patientId from record
        if (rData.patientId) {
          const patientRes = await fetch(`/api/records?action=getPatient&id=${rData.patientId}`);
          if (patientRes.ok) {
            const pData = await patientRes.json();
            setPatient(pData);
          }
        }
      } else {
        const errData = await recordRes.json().catch(() => ({ error: 'Error desconocido' }));
        setError(errData.error || 'Error al cargar el expediente');
      }
    } catch (error: any) {
      console.error('Error loading clinical record:', error);
      setError(error.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <AdminLayout title="Cargando..." showBack={false}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-[#deb887] border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!recordData || error) {
    return (
      <AdminLayout title="Error" showBack={true}>
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-800">Expediente no encontrado</h3>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <button 
            onClick={() => navigate('/admin/clinical-records')}
            className="mt-4 text-[#deb887] hover:underline"
          >
            Volver a la lista
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={patient ? `${patient.first_name} ${patient.last_name}` : 'Cargando...'} 
      subtitle={`Expediente #${recordId} • ${patient?.rut || 'Sin RUT'}`}
    >
      <div className="space-y-6">
        {/* Header with Back Button to Patient Profile */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <button 
            onClick={() => navigate(`/admin/ficha-clinica/paciente/${patient?.id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Volver al perfil del paciente</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Ficha Activa
            </span>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100">
            <TabButton 
              id="history" 
              label="Antecedentes" 
              icon={ClipboardList} 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')} 
            />
            <TabButton 
              id="physical" 
              label="Examen Físico" 
              icon={Activity} 
              active={activeTab === 'physical'} 
              onClick={() => setActiveTab('physical')} 
            />
            <TabButton 
              id="diagnosis" 
              label="Diagnóstico" 
              icon={Stethoscope} 
              active={activeTab === 'diagnosis'} 
              onClick={() => setActiveTab('diagnosis')} 
            />
            <TabButton 
              id="treatment" 
              label="Tratamientos" 
              icon={Syringe} 
              active={activeTab === 'treatment'} 
              onClick={() => setActiveTab('treatment')} 
            />
            <TabButton 
              id="prescription" 
              label="Recetas" 
              icon={Pill} 
              active={activeTab === 'prescription'} 
              onClick={() => setActiveTab('prescription')} 
            />
            <TabButton 
              id="consent" 
              label="Consentimientos" 
              icon={FileSignature} 
              active={activeTab === 'consent'} 
              onClick={() => setActiveTab('consent')} 
            />
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {activeTab === 'history' && (
              <HistoryTab 
                recordId={recordData?.recordId} 
                initialData={recordData?.history} 
                onSave={fetchData}
              />
            )}
            {activeTab === 'physical' && (
              <PhysicalExamTab 
                recordId={recordData?.recordId} 
                physicalExams={recordData?.physicalExams || []}
                patientName={patient ? `${patient.first_name} ${patient.last_name}` : ''}
                onSave={fetchData}
              />
            )}
            {activeTab === 'diagnosis' && (
              <DiagnosisTab 
                recordId={recordData?.recordId} 
                diagnoses={recordData?.diagnoses || []}
                physicalExams={recordData?.physicalExams || []}
                patientName={patient ? `${patient.first_name} ${patient.last_name}` : ''}
                onSave={fetchData}
              />
            )}
            {activeTab === 'treatment' && (
              <TreatmentTab 
                recordId={recordData?.recordId} 
                treatments={recordData?.treatments || []}
                physicalExams={recordData?.physicalExams || []}
                patientName={patient ? `${patient.first_name} ${patient.last_name}` : ''}
                patientAge={patient?.birth_date ? calculateAge(patient.birth_date) : ''}
                onSave={fetchData}
              />
            )}
            {activeTab === 'prescription' && (
              <PrescriptionTab 
                recordId={recordData?.recordId} 
                patientName={patient ? `${patient.first_name} ${patient.last_name}` : ''}
                patientAge={patient?.birth_date ? calculateAge(patient.birth_date) : ''}
              />
            )}
            {activeTab === 'consent' && (
              <ConsentimientosTab 
                patientId={patient?.id}
                recordId={parseInt(recordId!)}
                patient={patient}
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
