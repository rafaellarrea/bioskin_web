import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Printer, Plus, Trash2, Box, FileText, CheckSquare, DollarSign } from 'lucide-react';

interface CheckItem {
  id: string;
  label: string;
  status: 'ok' | 'fail' | 'na';
  observation: string;
}

export default function TechnicalDocumentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    ticket_number: '',
    document_type: 'reception',
    client_name: '',
    client_contact: '',
    equipment_data: {
      brand: '',
      model: '',
      serial: '',
      accessories: '',
      visual_condition: '',
      reported_issue: '' // New field for Reception
    },
    checklist_data: {
      checks: [] as CheckItem[]
    },
    diagnosis: '',
    recommendations: '',
    total_cost: 0,
    status: 'pending'
  });

  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);

  useEffect(() => {
    if (id) {
      fetchDocument(id);
    } else {
      // Initialize with a default ticket number generator (could be improved)
      setFormData(prev => ({
        ...prev,
        ticket_number: `TK-${Date.now().toString().slice(-6)}`
      }));
    }
  }, [id]);

  // Adjust checklist/defaults based on type ONLY when creating new
  useEffect(() => {
    if (!id) {
        if (formData.document_type === 'reception') {
          setCheckItems([
            { id: '1', label: 'Enciende', status: 'na', observation: '' },
            { id: '2', label: 'Pantalla', status: 'na', observation: '' },
            { id: '3', label: 'Botones / Perillas', status: 'na', observation: '' },
            { id: '4', label: 'Cables / Conectores', status: 'na', observation: '' },
            { id: '5', label: 'Carcasa / Estructura', status: 'na', observation: '' },
            { id: '6', label: 'Funcionalidad Básica', status: 'na', observation: '' },
          ]);
        } else if (formData.document_type === 'technical_report') {
          // Reports can start empty or with technical checks
           if(checkItems.length === 0) {
               setCheckItems([
                { id: '1', label: 'Voltaje Entrada', status: 'na', observation: '' },
                { id: '2', label: 'Fuente Poder', status: 'na', observation: '' },
                { id: '3', label: 'Sistema Refrigeración', status: 'na', observation: '' },
                { id: '4', label: 'Emisión de Energía', status: 'na', observation: '' },
               ]);
           }
        } else if (formData.document_type === 'proforma') {
            setCheckItems([]); // Proformas usually don't need a checklist
        }
    }
  }, [formData.document_type, id]);

  const fetchDocument = async (docId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/technical-service?id=${docId}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
        if (data.checklist_data?.checks) {
          setCheckItems(data.checklist_data.checks);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Merge checklist into form data
    const payload = {
      ...formData,
      checklist_data: { checks: checkItems }
    };

    try {
      const method = id ? 'PUT' : 'POST';
      const res = await fetch('/api/technical-service', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id, ...payload } : payload)
      });

      if (res.ok) {
        navigate('/admin/technical');
      } else {
        alert('Error al guardar el documento');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/admin/technical')} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <ArrowLeft size={20} /> Volver
        </button>
        <h1 className="text-2xl font-serif text-[#b8860b]">
            {id ? 'Editar Documento' : 'Nuevo Documento Técnico'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 space-y-8">
        
        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">Tipo de Documento</label>
            <select
              value={formData.document_type}
              onChange={(e) => setFormData({...formData, document_type: e.target.value})}
              className="w-full rounded-lg border-gray-300 focus:ring-[#b8860b] focus:border-[#b8860b] font-medium"
            >
              <option value="reception">Recepción de Equipo</option>
              <option value="technical_report">Informe Técnico</option>
              <option value="proforma">Proforma</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket #</label>
            <input
              type="text"
              value={formData.ticket_number}
              readOnly
              className="w-full bg-white rounded-lg border-gray-300 font-mono text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full rounded-lg border-gray-300 focus:ring-[#b8860b] focus:border-[#b8860b]"
            >
              <option value="pending">Pendiente</option>
              <option value="in_progress">En Revisión</option>
              <option value="completed">Finalizado</option>
              <option value="delivered">Entregado</option>
            </select>
          </div>
        </div>

        {/* Client Info - Shared by All */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <span className="p-1 bg-[#b8860b]/10 rounded text-[#b8860b]"><Box size={18}/></span>
            Información del Cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre Cliente / Clínica</label>
              <input
                required
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                className="w-full rounded-lg border-gray-200"
                placeholder="Ej. Clínica Estética..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Contacto / Teléfono</label>
              <input
                type="text"
                value={formData.client_contact}
                onChange={(e) => setFormData({...formData, client_contact: e.target.value})}
                className="w-full rounded-lg border-gray-200"
                placeholder="Ej. 099..."
              />
            </div>
          </div>
        </div>

        {/* --- SECTION: EQUIPMENT DATA (RECEPTION & REPORT) --- */}
        {(formData.document_type === 'reception' || formData.document_type === 'technical_report') && (
        <div className="border-b pb-6">
           <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <span className="p-1 bg-[#b8860b]/10 rounded text-[#b8860b]"><Box size={18}/></span>
            Datos del Equipo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
              <label className="block text-sm text-gray-600 mb-1">Marca</label>
              <input
                type="text"
                value={formData.equipment_data.brand}
                onChange={(e) => setFormData({...formData, equipment_data: {...formData.equipment_data, brand: e.target.value}})}
                className="w-full rounded-lg border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Modelo</label>
              <input
                type="text"
                value={formData.equipment_data.model}
                onChange={(e) => setFormData({...formData, equipment_data: {...formData.equipment_data, model: e.target.value}})}
                className="w-full rounded-lg border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Serie</label>
              <input
                type="text"
                value={formData.equipment_data.serial}
                onChange={(e) => setFormData({...formData, equipment_data: {...formData.equipment_data, serial: e.target.value}})}
                className="w-full rounded-lg border-gray-200"
              />
            </div>
             
             {/* Only Reception needs specific reception details prominent */}
             {formData.document_type === 'reception' && (
                <>
                <div className="col-span-3">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Problema Reportado / Motivo de Ingreso</label>
                    <textarea
                        rows={2}
                        value={formData.equipment_data.reported_issue || ''}
                        onChange={(e) => setFormData({...formData, equipment_data: {...formData.equipment_data, reported_issue: e.target.value}})}
                        className="w-full rounded-lg border-gray-200 bg-red-50"
                        placeholder="Descripción falla indicada por el cliente..."
                    />
                </div>
                <div className="col-span-3 md:col-span-1">
                    <label className="block text-sm text-gray-600 mb-1">Accesorios Recibidos</label>
                    <input
                        type="text"
                        placeholder="Pedal, cable poder..."
                        value={formData.equipment_data.accessories}
                        onChange={(e) => setFormData({...formData, equipment_data: {...formData.equipment_data, accessories: e.target.value}})}
                        className="w-full rounded-lg border-gray-200"
                    />
                </div>
                <div className="col-span-3 md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Condición Visual</label>
                    <input
                        type="text"
                        placeholder="Rayones, golpes, estado general..."
                        value={formData.equipment_data.visual_condition}
                        onChange={(e) => setFormData({...formData, equipment_data: {...formData.equipment_data, visual_condition: e.target.value}})}
                        className="w-full rounded-lg border-gray-200"
                    />
                </div>
                </>
             )}
          </div>
        </div>
        )}

        {/* --- SECTION: CHECKLIST (RECEPTION ONLY or OPTIONAL in OTHERS) --- */}
        {formData.document_type === 'reception' && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-medium text-gray-700 flex items-center gap-2">
                        <CheckSquare size={18} className="text-[#b8860b]"/> Checklist de Ingreso
                    </h3>
                    <button 
                        type="button" 
                        onClick={() => setCheckItems([...checkItems, { id: Date.now().toString(), label: '', status: 'na', observation: '' }])}
                        className="text-sm text-[#b8860b] hover:text-[#a0750a] flex items-center gap-1"
                    >
                        <Plus size={16} /> Agregar Item
                    </button>
                </div>
                <div className="p-0">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3 text-left">Punto de Control</th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-left">Observación</th>
                                <th className="px-6 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {checkItems.map((item, idx) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-2">
                                        <input 
                                            type="text" 
                                            value={item.label}
                                            onChange={(e) => {
                                                const newItems = [...checkItems];
                                                newItems[idx].label = e.target.value;
                                                setCheckItems(newItems);
                                            }}
                                            placeholder="Componente..."
                                            className="w-full border-none focus:ring-0 bg-transparent"
                                        />
                                    </td>
                                    <td className="px-6 py-2 text-center">
                                         <select
                                            value={item.status}
                                            onChange={(e) => {
                                                const newItems = [...checkItems];
                                                newItems[idx].status = e.target.value as any;
                                                setCheckItems(newItems);
                                            }}
                                            className={`rounded-full text-xs font-semibold px-2 py-1 border-none focus:ring-0 cursor-pointer
                                                ${item.status === 'ok' ? 'bg-green-100 text-green-800' : 
                                                  item.status === 'fail' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                                        >
                                            <option value="ok">OK</option>
                                            <option value="fail">MALO</option>
                                            <option value="na">N/A</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-2">
                                         <input 
                                            type="text" 
                                            value={item.observation}
                                            onChange={(e) => {
                                                const newItems = [...checkItems];
                                                newItems[idx].observation = e.target.value;
                                                setCheckItems(newItems);
                                            }}
                                            placeholder="..."
                                            className="w-full border-none focus:ring-0 bg-transparent text-sm text-gray-500"
                                        />
                                    </td>
                                    <td className="px-6 py-2 text-center">
                                        <button type="button" onClick={() => setCheckItems(checkItems.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- SECTION: TECHNICAL DIAGNOSIS (REPORT & PROFORMA) --- */}
        {(formData.document_type === 'technical_report' || formData.document_type === 'proforma') && (
         <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <span className="p-1 bg-[#b8860b]/10 rounded text-[#b8860b]"><FileText size={18}/></span>
            {formData.document_type === 'proforma' ? 'Detalle de la Oferta' : 'Análisis Técnico'}
          </h3>
          <div className="space-y-4">
            
            {formData.document_type === 'technical_report' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Diagnóstico / Hallazgos</label>
              <textarea
                rows={4}
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                className="w-full rounded-lg border-gray-200 mb-4"
                placeholder="Describa el problema encontrado y pruebas realizadas..."
              />
            </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                  {formData.document_type === 'proforma' ? 'Servicios y Repuestos a COTIZAR' : 'Trabajos Realizados / Recomendaciones'}
              </label>
              <textarea
                rows={6}
                value={formData.recommendations}
                onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                className="w-full rounded-lg border-gray-200 font-mono text-sm"
                placeholder={formData.document_type === 'proforma' 
                    ? "1. Repuesto X - $100\n2. Mano de Obra - $50" 
                    : "Describa la solución aplicada..."}
              />
            </div>
             
             <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <DollarSign size={16}/> Total ({formData.document_type === 'proforma' ? 'A Pagar' : 'Costo Reparación'})
              </label>
              <input
                type="number"
                value={formData.total_cost}
                onChange={(e) => setFormData({...formData, total_cost: parseFloat(e.target.value)})}
                className="w-48 rounded-lg border-gray-300 text-lg font-bold text-gray-800"
              />
            </div>
          </div>
        </div>
        )}

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
            <button
                type="button"
                onClick={() => navigate('/admin/technical')}
                className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                disabled={loading}
            >
                Cancelar
            </button>
            <button
                type="submit"
                disabled={loading}
                className="bg-[#b8860b] text-white px-8 py-2 rounded-lg hover:bg-[#a0750a] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
                <Save size={20} />
                {loading ? 'Guardando...' : 'Guardar Documento'}
            </button>
        </div>

      </form>
    </div>
  );
}