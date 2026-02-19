
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Calculator, 
  User, 
  PlusCircle, 
  List as ListIcon, 
  FileText, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Save, 
  Filter, 
  Download, 
  Edit, 
  Trash2 
} from 'lucide-react';

interface FinanceRecord {
  id?: number;
  patient_name: string;
  intervention_date: string;
  intervention_type?: string;
  clinic: string;
  total_payment: number;
  abono?: number; 
  doctor_fees: { name: string; amount: number }[];
  expenses: number;
  additional_income: number;
  net_income_juan_pablo: number;
  raw_note: string;
  details?: string;
  assistant_name?: string;
  created_at?: string;
}

export default function ExternalMedicalFinance() {
  const navigate = useNavigate();
  
  // UI Mode
  const [viewMode, setViewMode] = useState<'create' | 'list'>('create');

  // Form State
  const [assistant, setAssistant] = useState<string>('');
  const [rawNote, setRawNote] = useState('');
  
  // Staging area for parsed records before saving (Multirecord workflow)
  const [parsedRecords, setParsedRecords] = useState<FinanceRecord[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // List State
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [filters, setFilters] = useState({ month: '', assistant: '' });

  // General State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch records when entering list mode
  useEffect(() => {
    if (viewMode === 'list') {
      fetchRecords();
    }
  }, [viewMode, filters.month, filters.assistant]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = `/api/external-finance?action=list`;
      if (filters.assistant) query += `&assistant=${filters.assistant}`;
      if (filters.month) query += `&month=${filters.month}`;
      
      const res = await fetch(query);
      if (!res.ok) throw new Error('Error al cargar lista');
      const data = await res.json();
      setRecords(data);
      if (data.length === 0 && viewMode === 'list') {
        // Optional: Message if empty
      }
    } catch (e) {
      console.error(e);
      setError('Error al cargar registros');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este registro permanentemente?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/external-finance?action=delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Falló eliminación');
      setSuccess('Registro eliminado');
      fetchRecords();
    } catch (e) {
      setError('Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: FinanceRecord) => {
    // If we're editing an existing saved record, we treat it as "staging" a single record
    setParsedRecords([record]);
    setEditingIndex(0); // It's the first (and only) item in staging
    setRawNote(record.raw_note || '');
    setAssistant(record.assistant_name);
    setViewMode('create');
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      
      // Backend now returns an ARRAY of records
      if (Array.isArray(data)) {
        // If we were editing a single record and the result is a single record, preserve the ID
        if (parsedRecords.length === 1 && parsedRecords[0].id && data.length === 1) {
            data[0].id = parsedRecords[0].id;
        }
        setParsedRecords(data);
      } else {
        // Fallback for single record response
         if (parsedRecords.length === 1 && parsedRecords[0].id) {
            data.id = parsedRecords[0].id;
        }
        setParsedRecords([data]);
      }
      
      setEditingIndex(null); // Just show the list of parsed items first
    } catch (err) {
      console.error(err);
      setError('Error al conectar con la IA para procesar la nota');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (parsedRecords.length === 0) return;

    setLoading(true);
    try {
      // Loop through all staged records and save them
      // In a real bulk API we'd send them all at once, but loop reduces risk of partial failures blocking all if API is simple
      // Optimization: We could add a 'bulk-save' action to API later
      
      let successCount = 0;
      
      for (const record of parsedRecords) {
        let url = '/api/external-finance?action=save-record';
        let payload: any = record;



        // Calculate net before saving
        const fees = (record.doctor_fees || []).reduce((acc, f) => acc + (f.amount || 0), 0);
        const net = (
            (record.total_payment || 0) + 
            (record.additional_income || 0) - 
            (record.expenses || 0) - 
            fees
        );

        // Assign to payload for save
        if (!payload.updates) {
             payload.net_income_juan_pablo = net;
        } else {
             payload.updates.net_income_juan_pablo = net;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) successCount++;
      }

      if (successCount === parsedRecords.length) {
        setSuccess(`${successCount} registros guardados exitosamente`);
        setRawNote('');
        setParsedRecords([]); // Clear staging
        setTimeout(() => setViewMode('list'), 1500);
      } else {
        setError(`Guardado parcial: ${successCount} de ${parsedRecords.length} guardados.`);
      }

    } catch (err) {
      console.error(err);
      setError('Error al guardar los registros');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to update a specific record in the staging array
  const updateStagedRecord = (index: number, field: keyof FinanceRecord, value: any) => {
    const updated = [...parsedRecords];
    updated[index] = { ...updated[index], [field]: value };
    setParsedRecords(updated);
  };
    
  const updateStagedDoctorFees = (recordIndex: number, feeIndex: number, field: 'name' | 'amount', value: any) => {
      const updated = [...parsedRecords];
      const fees = [...(updated[recordIndex].doctor_fees || [])];
      fees[feeIndex] = { ...fees[feeIndex], [field]: value };
      updated[recordIndex].doctor_fees = fees;
      setParsedRecords(updated);
  };

  const removeStagedFee = (recordIndex: number, feeIndex: number) => {
      const updated = [...parsedRecords];
      const fees = updated[recordIndex].doctor_fees.filter((_, i) => i !== feeIndex);
      updated[recordIndex].doctor_fees = fees;
      setParsedRecords(updated);
  };

  const addStagedFee = (recordIndex: number) => {
      const updated = [...parsedRecords];
      const fees = [...(updated[recordIndex].doctor_fees || []), { name: 'Nuevo Honorario', amount: 0 }];
      updated[recordIndex].doctor_fees = fees;
      setParsedRecords(updated);
  };

  const handleLogout = () => {
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:p-0 print:bg-white">
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: landscape; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .print-visible { display: block !important; }
          .recharts-wrapper { margin: 0 auto; }
        }
      `}</style>

      {/* Print Only Header */}
      <div className="hidden print-visible mb-8 text-center border-b-2 border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Reporte Financiero Médico</h1>
        <h2 className="text-xl text-gray-700 mt-1">Dr. Juan Pablo Brito</h2>
        <p className="text-sm text-gray-500 mt-2">
            Período: {filters.month ? new Date(filters.month + '-01').toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }) : 'Histórico Completo'} 
            {filters.assistant && ` | Asistente: ${filters.assistant}`}
        </p>
      </div>

      {/* Screen Header */}
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

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex gap-2 print:hidden">
        <button
          onClick={() => setViewMode('create')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
            viewMode === 'create' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Registro
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
            viewMode === 'list' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ListIcon className="w-4 h-4" />
          Ver Registros
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        
        {/* VIEW: CREATE / EDIT */}
        {viewMode === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
            {/* Input Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:hidden">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                {parsedRecords.some(r => r.id) ? 'Editar Registro' : 'Ingreso de Datos'}
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
    Pago 1000 en la mds...`}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
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
                      {parsedRecords.some(r => r.id) ? 'Reprocesar con IA' : 'Procesar con IA'}
                    </>
                  )}
                </button>
                {parsedRecords.some(r => r.id) && (
                  <button
                    onClick={() => {
                        setEditingIndex(null);
                        setRawNote('');
                        setParsedRecords([]);
                        setSuccess('');
                        setViewMode('list');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                  >
                    Cancelar Edición
                  </button>
                )}
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

            {/* Results Section - NOW HANDLES LIST OF PARSED RECORDS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Resumen Procesado ({parsedRecords.length} Registros)
              </h2>

              {parsedRecords.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <Calculator className="w-12 h-12 mb-4 opacity-50" />
                  <p>Los datos procesados aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Iterate over all parsed records */}
                  {parsedRecords.map((record, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 hover:bg-white transition-colors hover:shadow-md">
                      <div className="mb-4 flex justify-between items-start">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">Registro #{index + 1}</span>
                        <div className="flex gap-2">
                            {/* Details toggle could go here, but for now just show it if exists */}
                        <button 
                            onClick={() => {
                                const newRecords = parsedRecords.filter((_, i) => i !== index);
                                setParsedRecords(newRecords);
                            }}
                            className="text-gray-400 hover:text-red-500"
                            title="Descartar este registro"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        </div>
                      </div>

                      {/* Header Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                        <div className="col-span-1 md:col-span-2">
                           <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Detalles / Notas</label>
                           <input 
                              type="text"
                              value={record.details || ''}
                              onChange={(e) => updateStagedRecord(index, 'details', e.target.value)}
                              placeholder="Detalles adicionales (ej: factura, transferencia...)"
                              className="w-full text-sm text-gray-600 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent italic"
                           />
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Paciente</label>
                          <input 
                            type="text" 
                            value={record.patient_name}
                            onChange={(e) => updateStagedRecord(index, 'patient_name', e.target.value)}
                            className="font-semibold text-lg text-gray-900 w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                          />
                        </div>
                        <div className="text-right">
                          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Fecha</label>
                          <input 
                             type="date"
                             value={record.intervention_date}
                             onChange={(e) => updateStagedRecord(index, 'intervention_date', e.target.value)}
                             className="font-medium text-gray-900 text-right w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Intervención</label>
                          <input 
                            type="text" 
                            value={record.intervention_type || ''}
                            onChange={(e) => updateStagedRecord(index, 'intervention_type', e.target.value)}
                            className="font-medium text-gray-900 w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                            placeholder="Consulta, Botox, etc."
                          />
                        </div>

                        <div className="text-right">
                          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Clínica</label>
                          <input 
                             type="text"
                             value={record.clinic || ''}
                             onChange={(e) => updateStagedRecord(index, 'clinic', e.target.value)}
                             className="text-right w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                          />
                        </div>
                      </div>

                      {/* Financial Breakdown */}
                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Pago Total (Ingreso)</span>
                          <div className="flex items-center">
                            <span className="mr-1">$</span>
                            <input 
                                type="number"
                                value={record.total_payment}
                                onChange={(e) => updateStagedRecord(index, 'total_payment', parseFloat(e.target.value) || 0)}
                                className="font-medium text-gray-900 w-24 text-right bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-blue-600 text-sm">
                          <span>› Abono / Pago Parcial</span>
                          <div className="flex items-center">
                            <span className="mr-1">$</span>
                            <input 
                                type="number"
                                value={record.abono || 0}
                                onChange={(e) => updateStagedRecord(index, 'abono', parseFloat(e.target.value) || 0)}
                                className="font-medium text-gray-900 w-24 text-right bg-transparent border-b border-blue-200 focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-green-600">
                            <span>+ Valores Adicionales</span>
                            <div className="flex items-center">
                                <span className="mr-1">+$</span>
                                <input 
                                    type="number"
                                    value={record.additional_income || 0}
                                    onChange={(e) => updateStagedRecord(index, 'additional_income', parseFloat(e.target.value) || 0)}
                                    className="font-medium w-24 text-right bg-transparent border-b border-green-200 focus:border-green-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-200 my-2 pt-2">
                          <p className="text-xs text-gray-500 uppercase mb-2">Honorarios Médicos & Gastos</p>
                          
                          {/* Editable Doctor Fees List */}
                          {(record.doctor_fees || []).map((fee, feeIdx) => (
                            <div key={feeIdx} className="flex justify-between items-center text-red-500 text-sm mb-1 group">
                              <input 
                                value={fee.name}
                                onChange={(e) => updateStagedDoctorFees(index, feeIdx, 'name', e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-red-200 focus:border-red-500 outline-none w-full mr-2"
                              />
                              <div className="flex items-center">
                                <span>-$</span>
                                <input 
                                    type="number"
                                    value={fee.amount}
                                    onChange={(e) => updateStagedDoctorFees(index, feeIdx, 'amount', parseFloat(e.target.value) || 0)}
                                    className="w-16 text-right bg-transparent border-b border-transparent hover:border-red-200 focus:border-red-500 outline-none"
                                />
                                <button 
                                    onClick={() => removeStagedFee(index, feeIdx)}
                                    className="ml-2 text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          <button 
                            onClick={() => addStagedFee(index)}
                            className="text-xs text-blue-500 hover:underline mt-1 mb-2 block"
                          >
                            + Agregar Honorario
                          </button>

                          <div className="flex justify-between items-center text-red-500 text-sm">
                            <span>- Gastos Operativos</span>
                            <div className="flex items-center">
                                <span>-$</span>
                                <input 
                                    type="number"
                                    value={record.expenses || 0}
                                    onChange={(e) => updateStagedRecord(index, 'expenses', parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right bg-transparent border-b border-red-200 focus:border-red-500 outline-none"
                                />
                            </div>
                          </div>
                        </div>

                        <div className="border-t-2 border-gray-300 pt-3 mt-3 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-lg">Neto Dr. Juan Pablo Brito</span>
                            {/* Ideally calculate on backend, but for display: total + add - expenses - fees */}
                            <span className="text-xs text-gray-400">Total calculado al guardar</span>
                          </div>
                          <button 
                            className="text-xs bg-gray-100 px-2 py-1 rounded"
                            title="El cálculo final se realizará en el servidor"
                          >
                           Estimado: ${(
                             (record.total_payment || 0) + 
                             (record.additional_income || 0) - 
                             (record.expenses || 0) - 
                             (record.doctor_fees || []).reduce((acc, f) => acc + (f.amount || 0), 0)
                           ).toFixed(2)}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Final Actions */}
                  <div className="flex gap-4 pt-4 border-t border-gray-100 print:hidden sticky bottom-0 bg-white p-4 shadow-lg border-t-2 border-blue-100">
                    <button
                      onClick={handleSaveAll}
                      disabled={loading || parsedRecords.length === 0}
                      className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      {editingIndex !== null ? 'Actualizar Registro' : `Guardar Todos (${parsedRecords.length})`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}



        {/* VIEW: LIST */}
        {viewMode === 'list' && (() => {
          // Calculate totals for summary INSIDE the render block or move outside of return
          // Moving outside required state derived from records, but here we can compute locally
          
          const totalIncome = records.reduce((acc, r) => acc + (Number(r.total_payment) || 0), 0);
          const totalExpenses = records.reduce((acc, r) => acc + (Number(r.expenses) || 0), 0);
          const totalFees = records.reduce((acc, r) => {
             const fees = (r.doctor_fees || []).reduce((facc, f) => facc + (Number(f.amount) || 0), 0);
             return acc + fees;
          }, 0);
          const totalNetJPB = records.reduce((acc, r) => acc + (Number(r.net_income_juan_pablo) || 0), 0);

          return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-center print:hidden">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filtros:</span>
                </div>
                <select 
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                    value={filters.assistant}
                    onChange={(e) => setFilters({...filters, assistant: e.target.value})}
                >

                    <option value="">Todas las asistentes</option>
                    <option value="Marietha">Marietha</option>
                    <option value="Diana">Diana</option>
                </select>
                <input 
                    type="month" 
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                    value={filters.month}
                    onChange={(e) => setFilters({...filters, month: e.target.value})}
                />
                
                <button 
                  onClick={() => window.print()}
                  className="ml-auto bg-gray-100 p-2 rounded hover:bg-gray-200 text-gray-700 font-medium text-xs flex items-center gap-1"
                >
                    <Download className="w-4 h-4" />
                    Exportar PDF
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white border-b border-gray-100">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">Total Ingresos</p>
                    <p className="text-2xl font-bold text-gray-900">${totalIncome.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Gastos Operativos</p>
                    <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Honorarios Médicos</p>
                    <p className="text-2xl font-bold text-gray-900">${totalFees.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Neto Dr. JPB</p>
                    <p className="text-2xl font-bold text-gray-900">${totalNetJPB.toFixed(2)}</p>
                </div>
            </div>


            {/* Report Container */}
            <div className="flex flex-col print:flex-col-reverse print:gap-8">
            
            {/* Charts Section - Will be at BOTTOM in print due to column-reverse (if placed first) or using order */}
            {/* Actually, let's keep them in DOM order for screen, but use order classes for print */}
            {records.length > 0 && (
                <div className="p-6 border-b border-gray-100 print:break-inside-avoid print:order-2 print:border-t-2 print:mt-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 print:text-lg print:text-gray-800 print:font-bold">Análisis Visual</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-64 print:h-80">
                        <div className="h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Ingresos', value: totalIncome },
                                    { name: 'Gastos', value: totalExpenses + totalFees },
                                    { name: 'Neto', value: totalNetJPB }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                                    <Bar dataKey="value" fill="#3b82f6">
                                        {
                                            [0, 1, 2].map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#ea384c' : '#22c55e'} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <p className="text-sm text-gray-500 mb-2">Distribución Financiera Global</p>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Gastos Op.', value: totalExpenses },
                                            { name: 'Honorarios', value: totalFees },
                                            { name: 'Neto JPB', value: totalNetJPB }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#ef4444" /> {/* Gastos */}
                                        <Cell fill="#f97316" /> {/* Honorarios */}
                                        <Cell fill="#22c55e" /> {/* Neto */}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Table - Will be at TOP in print (order 1) */}
            <div className="overflow-x-auto print:overflow-visible print:order-1">
              {loading && records.length === 0 ? (
                <div className="p-12 text-center text-gray-500">Cargando registros...</div>
              ) : records.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No se encontraron registros.</div>
              ) : (
                <table className="w-full text-left border-collapse text-sm print:text-xs">

                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider print:bg-gray-100 print:text-black">
                      <th className="p-4 border-b">Fecha</th>
                      <th className="p-4 border-b">Paciente / Concepto</th>
                      <th className="p-4 border-b print:hidden">Tipo / Detalles</th>
                      <th className="p-4 border-b print:hidden">Asistente</th>
                      <th className="p-4 border-b text-right">Total / Gasto</th>
                      <th className="p-4 border-b text-right">Neto Dr. JPB</th>
                      <th className="p-4 border-b text-center print:hidden">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">

                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors print:break-inside-avoid">
                        <td className="p-4 text-gray-600 border-b whitespace-nowrap">
                            {/* Format date properly */}
                            {new Date(record.intervention_date).toLocaleDateString('es-EC')}
                        </td>
                        <td className="p-4 font-medium text-gray-900 border-b">
                            {record.patient_name}
                            <span className="print:hidden">
                            {record.intervention_type && record.intervention_type.toLowerCase().includes('compra') && <span className="text-xs text-red-500 block">Gasto Operativo</span>}
                            </span>
                             {/* Show intervention type inline for print */}
                             <span className="hidden print:block text-gray-500 text-xs italic">
                                {record.intervention_type}
                             </span>
                        </td>
                        <td className="p-4 text-gray-500 border-b print:hidden">
                            <span className="font-medium text-gray-700 block">{record.intervention_type || '-'}</span>
                            {record.details && <span className="text-xs text-gray-400 italic block mt-1">{record.details}</span>}
                            {record.clinic && <span className="text-xs text-blue-400 block">{record.clinic}</span>}
                        </td>
                        <td className="p-4 text-gray-600 border-b print:hidden">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                                record.assistant_name === 'Marietha' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
                            }`}>
                                {record.assistant_name}
                            </span>
                        </td>
                        <td className="p-4 text-gray-600 text-right font-medium">
                          {Number(record.total_payment) > 0 ? (
                             <span className="text-gray-900">${Number(record.total_payment).toFixed(2)}</span>
                          ) : (
                             <span className="text-red-500">-${Number(record.expenses).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-blue-600 text-right">
                            ${(Number(record.net_income_juan_pablo) || 0).toFixed(2)}
                        </td>
                        <td className="p-4 flex justify-center gap-2 print:hidden">
                            <button 
                                onClick={() => handleEdit(record)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Editar"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => record.id && handleDelete(record.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            </div>

          </div>
          );
        })()}
      </div>
    </div>
  );
}
