
import { useState, useEffect } from 'react';
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
  Loader2,
  Trash2,
  Edit,
  Filter,
  List as ListIcon,
  PlusCircle,
  X
} from 'lucide-react';

interface FinanceRecord {
  id?: number;
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
  created_at?: string;
}

export default function ExternalMedicalFinance() {
  const navigate = useNavigate();
  
  // UI Mode
  const [viewMode, setViewMode] = useState<'create' | 'list'>('create');

  // Form State
  const [assistant, setAssistant] = useState<string>('');
  const [rawNote, setRawNote] = useState('');
  const [parsedData, setParsedData] = useState<FinanceRecord | null>(null);
  const [idToEdit, setIdToEdit] = useState<number | null>(null);

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
    setParsedData(record);
    setRawNote(record.raw_note || '');
    setAssistant(record.assistant_name);
    setIdToEdit(record.id || null);
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
      setParsedData(data);
      // If we are editing, keep the ID, otherwise null (new record)
      // Actually usually user processes a NEW note, so we might want to reset ID unless re-processing
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
      let url = '/api/external-finance?action=save-record';
      let payload: any = parsedData;

      if (idToEdit) {
        url = '/api/external-finance?action=update';
        payload = { id: idToEdit, updates: parsedData };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al guardar el registro');

      setSuccess(idToEdit ? 'Registro actualizado exitosamente' : 'Registro guardado exitosamente');
      
      // Clear form after successful save
      if (!idToEdit) {
        setRawNote('');
        setParsedData(null);
      } else {
        // If editing, maybe go back to list?
        setTimeout(() => setViewMode('list'), 1500);
      }
      
      setIdToEdit(null);

    } catch (err) {
      console.error(err);
      setError('Error al guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleLogout = () => {
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
                {idToEdit ? 'Editar Registro' : 'Ingreso de Datos'}
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
                      {idToEdit ? 'Reprocesar con IA' : 'Procesar con IA'}
                    </>
                  )}
                </button>
                {idToEdit && (
                  <button
                    onClick={() => {
                        setIdToEdit(null);
                        setRawNote('');
                        setParsedData(null);
                        setSuccess('');
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

            {/* Results Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Resumen Procesado {idToEdit && <span className="text-sm font-normal text-gray-500 ml-2">(Modo Edición)</span>}
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
                      <input 
                        type="text" 
                        value={parsedData.patient_name}
                        onChange={(e) => setParsedData({...parsedData, patient_name: e.target.value})}
                        className="font-semibold text-lg text-gray-900 w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="text-right">
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Fecha</label>
                      <input 
                         type="date"
                         value={parsedData.intervention_date}
                         onChange={(e) => setParsedData({...parsedData, intervention_date: e.target.value})}
                         className="font-medium text-gray-900 text-right w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider">Registrado Por</label>
                        <p className="font-medium text-gray-700">{parsedData.assistant_name}</p>
                    </div>
                    <div className="text-right">
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Clínica</label>
                      <input 
                         type="text"
                         value={parsedData.clinic || ''}
                         onChange={(e) => setParsedData({...parsedData, clinic: e.target.value})}
                         className="text-right w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Pago Total (Ingreso)</span>
                      <div className="flex items-center">
                        <span className="mr-1">$</span>
                        <input 
                            type="number"
                            value={parsedData.total_payment}
                            onChange={(e) => setParsedData({...parsedData, total_payment: parseFloat(e.target.value) || 0})}
                            className="font-medium text-gray-900 w-24 text-right bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-green-600">
                        <span>+ Valores Adicionales</span>
                        <div className="flex items-center">
                            <span className="mr-1">+$</span>
                            <input 
                                type="number"
                                value={parsedData.additional_income || 0}
                                onChange={(e) => setParsedData({...parsedData, additional_income: parseFloat(e.target.value) || 0})}
                                className="font-medium w-24 text-right bg-transparent border-b border-green-200 focus:border-green-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 my-2 pt-2">
                      <p className="text-xs text-gray-500 uppercase mb-2">Honorarios Médicos & Gastos</p>
                      
                      {/* Editable Doctor Fees List */}
                      {parsedData.doctor_fees.map((fee, idx) => (
                        <div key={idx} className="flex justify-between items-center text-red-500 text-sm mb-1 group">
                          <input 
                            value={fee.name}
                            onChange={(e) => {
                                const newFees = [...parsedData.doctor_fees];
                                newFees[idx].name = e.target.value;
                                setParsedData({...parsedData, doctor_fees: newFees});
                            }}
                            className="bg-transparent border-b border-transparent hover:border-red-200 focus:border-red-500 outline-none w-full mr-2"
                          />
                          <div className="flex items-center">
                            <span>-$</span>
                            <input 
                                type="number"
                                value={fee.amount}
                                onChange={(e) => {
                                    const newFees = [...parsedData.doctor_fees];
                                    newFees[idx].amount = parseFloat(e.target.value) || 0;
                                    setParsedData({...parsedData, doctor_fees: newFees});
                                }}
                                className="w-16 text-right bg-transparent border-b border-transparent hover:border-red-200 focus:border-red-500 outline-none"
                            />
                            <button 
                                onClick={() => {
                                    const newFees = parsedData.doctor_fees.filter((_, i) => i !== idx);
                                    setParsedData({...parsedData, doctor_fees: newFees});
                                }}
                                className="ml-2 text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        onClick={() => setParsedData({
                            ...parsedData, 
                            doctor_fees: [...parsedData.doctor_fees, { name: 'Nuevo Doctor', amount: 0 }]
                        })}
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
                                value={parsedData.expenses || 0}
                                onChange={(e) => setParsedData({...parsedData, expenses: parseFloat(e.target.value) || 0})}
                                className="w-24 text-right bg-transparent border-b border-red-200 focus:border-red-500 outline-none"
                            />
                        </div>
                      </div>
                    </div>

                    <div className="border-t-2 border-gray-300 pt-3 mt-3 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-lg">Neto Dr. Juan Pablo Brito</span>
                        <span className="text-xs text-gray-400">Calculado automáticamente al guardar</span>
                      </div>
                      <span className="font-bold text-blue-600 text-2xl">
                        ${parsedData.net_income_juan_pablo} 
                        {/* Note: This is static from AI, ideally we recalculate on frontend edit, but simplistic for now */}
                      </span>
                    </div>
                  </div>

                  {/* Final Actions */}
                  <div className="flex gap-4 pt-4 border-t border-gray-100 print:hidden">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {idToEdit ? 'Actualizar Registro' : 'Guardar Registro'}
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
        )}

        {/* VIEW: LIST */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-center">
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
                <div className="ml-auto text-sm text-gray-500">
                    {records.length} registros encontrados
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading && records.length === 0 ? (
                <div className="p-12 text-center text-gray-500">Cargando registros...</div>
              ) : records.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No se encontraron registros.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="p-4 border-b">Fecha</th>
                      <th className="p-4 border-b">Paciente</th>
                      <th className="p-4 border-b">Asistente</th>
                      <th className="p-4 border-b text-right">Total</th>
                      <th className="p-4 border-b text-right">Neto Dr. JPB</th>
                      <th className="p-4 border-b text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm text-gray-600">{record.intervention_date}</td>
                        <td className="p-4 text-sm font-medium text-gray-900">{record.patient_name}</td>
                        <td className="p-4 text-sm text-gray-600">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                                record.assistant_name === 'Marietha' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
                            }`}>
                                {record.assistant_name}
                            </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600 text-right">${record.total_payment}</td>
                        <td className="p-4 text-sm font-bold text-blue-600 text-right">${record.net_income_juan_pablo}</td>
                        <td className="p-4 flex justify-center gap-2">
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
        )}
      </div>
    </div>
  );
}
