
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  FileText, 
  Save, 
  Download, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface FinanceRecord {
  patient_name: string;
  intervention_date: string;
  clinic: string;
  total_payment: number;
  doctor_fees: { name: string; amount: number }[];
  expenses: number;
  additional_income: number;
  net_income_juan_pablo: number;
  raw_note: string;
  assistant_name: string;
}

export default function ExternalMedicalFinance() {
  const navigate = useNavigate();
  const [assistant, setAssistant] = useState<string>('');
  const [rawNote, setRawNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<FinanceRecord | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleProcessNote = async () => {
    if (!assistant) {
      setError('Por favor selecciona quién está registrando (Marietha o Diana)');
      return;
    }
    if (!rawNote.trim()) {
      setError('Por favor ingresa la nota para procesar');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/external-finance?action=process-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: rawNote, assistant })
      });

      if (!response.ok) throw new Error('Error al procesar la nota');

      const data = await response.json();
      setParsedData(data);
    } catch (err) {
      console.error(err);
      setError('Error al conectar con la IA para procesar la nota');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData) return;

    setLoading(true);
    try {
      const response = await fetch('/api/external-finance?action=save-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData)
      });

      if (!response.ok) throw new Error('Error al guardar el registro');

      setSuccess('Registro guardado exitosamente en la base de datos');
      setRawNote('');
      setParsedData(null);
    } catch (err) {
      console.error(err);
      setError('Error al guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // Simple print to PDF for now
    window.print();
  };

  const handleLogout = () => {
    // Simple redirect since we don't have a real session for this specific "Mary" user
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-8 h-8 text-blue-600" />
            Gestión Financiera - Dr. Juan Pablo Brito
          </h1>
          <p className="text-gray-500 mt-1">
            Sistema de registro y control de cirugías e intervenciones
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">Usuario: Mary</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 underline text-sm"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
        
        {/* Input Section - Hidden when printing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:hidden">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Ingreso de Datos
          </h2>

          {/* Assistant Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Quién registra la información?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAssistant('Marietha')}
                className={`py-3 px-4 rounded-lg border text-center transition-colors ${
                  assistant === 'Marietha' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dra. Marietha Larrea
              </button>
              <button
                type="button"
                onClick={() => setAssistant('Diana')}
                className={`py-3 px-4 rounded-lg border text-center transition-colors ${
                  assistant === 'Diana' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dra. Diana
              </button>
            </div>
          </div>

          {/* Note Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pegar nota de intervención
            </label>
            <textarea
              value={rawNote}
              onChange={(e) => setRawNote(e.target.value)}
              placeholder={`Ejemplo:
María Eugenia Ramírez 
Fecha 14/01/2026 
Pago 1000 en la mds 
Honorarios Dr Orbe $300...`}
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Puedes pegar el texto tal cual viene del formato de notas.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleProcessNote}
              disabled={loading || !assistant || !rawNote}
              className={`flex-1 py-3 px-6 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors ${
                loading || !assistant || !rawNote
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  Procesar con IA
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Resumen Procesado
          </h2>

          {!parsedData ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <Calculator className="w-12 h-12 mb-4 opacity-50" />
              <p>Los datos procesados aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Paciente</label>
                  <p className="font-semibold text-lg text-gray-900">{parsedData.patient_name}</p>
                </div>
                <div className="text-right">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Fecha</label>
                  <p className="font-medium text-gray-900">{parsedData.intervention_date}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Registrado Por</label>
                  <p className="font-medium text-gray-700">{parsedData.assistant_name}</p>
                </div>
                <div className="text-right">
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Clínica</label>
                  <span className="inline-block px-2 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700">
                    {parsedData.clinic || 'No especificada'}
                  </span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Pago Total (Ingreso)</span>
                  <span className="font-medium text-gray-900">${parsedData.total_payment}</span>
                </div>
                
                {parsedData.additional_income > 0 && (
                   <div className="flex justify-between items-center text-green-600">
                    <span>+ Valores Adicionales</span>
                    <span className="font-medium">+${parsedData.additional_income}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 my-2 pt-2">
                  <p className="text-xs text-gray-500 uppercase mb-2">Honorarios Médicos & Gastos</p>
                  {parsedData.doctor_fees.map((fee, idx) => (
                    <div key={idx} className="flex justify-between items-center text-red-500 text-sm">
                      <span>- {fee.name}</span>
                      <span>-${fee.amount}</span>
                    </div>
                  ))}
                  {parsedData.expenses > 0 && (
                    <div className="flex justify-between items-center text-red-500 text-sm">
                      <span>- Gastos Operativos</span>
                      <span>-${parsedData.expenses}</span>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-gray-300 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-lg">Neto Dr. Juan Pablo Brito</span>
                  <span className="font-bold text-blue-600 text-2xl">${parsedData.net_income_juan_pablo}</span>
                </div>
              </div>

              {/* Original Note Toggle */}
              <details className="text-sm border border-gray-200 rounded p-2 print:hidden">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Ver nota original</summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs whitespace-pre-wrap font-mono text-gray-600">
                  {parsedData.raw_note}
                </pre>
              </details>

              {/* Final Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-100 print:hidden">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar Registro
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex-1 py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Print Footer */}
      <div className="hidden print:block text-center text-gray-400 text-xs mt-8">
        Generado por Sistema Financiero BIOSKIN IA - {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
