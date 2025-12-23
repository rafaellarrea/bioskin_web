import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Copy, Printer, Search, Calendar } from 'lucide-react';
import prescriptionOptions from '../../data/prescription_options.json';

interface PrescriptionItem {
  medicamento: string;
  presentacion: string;
  dosis: string;
  frecuencia: string;
  via: string;
  duracion: string;
  turno: string;
  indicaciones: string;
}

interface Prescription {
  id?: number;
  fecha: string;
  diagnostico: string;
  items: PrescriptionItem[];
}

interface PrescriptionTabProps {
  recordId: number;
  patientName: string;
}

const EMPTY_ITEM: PrescriptionItem = {
  medicamento: '',
  presentacion: '',
  dosis: '',
  frecuencia: '',
  via: '',
  duracion: '',
  turno: '',
  indicaciones: ''
};

export default function PrescriptionTab({ recordId, patientName }: PrescriptionTabProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [currentPrescription, setCurrentPrescription] = useState<Prescription>({
    fecha: new Date().toISOString().split('T')[0],
    diagnostico: '',
    items: [{ ...EMPTY_ITEM }]
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    loadPrescriptions();
    loadTemplates();
  }, [recordId]);

  const loadPrescriptions = async () => {
    try {
      const res = await fetch(`/api/records?action=listPrescriptions&record_id=${recordId}`);
      const data = await res.json();
      setPrescriptions(data);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/records?action=getTemplates');
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const action = currentPrescription.id ? 'updatePrescription' : 'createPrescription';
      const body = {
        ...currentPrescription,
        ficha_id: recordId,
        items: currentPrescription.items.filter(i => i.medicamento) // Filter empty rows
      };

      const res = await fetch(`/api/records?action=${action}`, {
        method: currentPrescription.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await loadPrescriptions();
        if (action === 'create') {
          // Reset form if new
          setCurrentPrescription({
            fecha: new Date().toISOString().split('T')[0],
            diagnostico: '',
            items: [{ ...EMPTY_ITEM }]
          });
        }
        alert('Receta guardada correctamente');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar la receta');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPrescription = async (id: number) => {
    try {
      const res = await fetch(`/api/records?action=getPrescription&id=${id}`);
      const data = await res.json();
      setCurrentPrescription(data);
    } catch (error) {
      console.error('Error loading details:', error);
    }
  };

  const handleNew = () => {
    setCurrentPrescription({
      fecha: new Date().toISOString().split('T')[0],
      diagnostico: '',
      items: [{ ...EMPTY_ITEM }]
    });
  };

  const handleDuplicate = () => {
    const { id, ...rest } = currentPrescription;
    setCurrentPrescription({
      ...rest,
      fecha: new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = async () => {
    if (!currentPrescription.id || !confirm('¿Eliminar esta receta?')) return;
    
    try {
      await fetch(`/api/records?action=deletePrescription&id=${currentPrescription.id}`, { method: 'DELETE' });
      await loadPrescriptions();
      handleNew();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const newItems = [...currentPrescription.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setCurrentPrescription(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setCurrentPrescription(prev => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }]
    }));
  };

  const removeItem = (index: number) => {
    setCurrentPrescription(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSaveTemplate = async () => {
    const name = prompt('Nombre de la plantilla:');
    if (!name) return;

    try {
      await fetch('/api/records?action=saveTemplate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: name,
          items: currentPrescription.items.filter(i => i.medicamento)
        })
      });
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleApplyTemplate = () => {
    const template = templates.find(t => t.id.toString() === selectedTemplate);
    if (template) {
      const items = JSON.parse(template.items_json);
      setCurrentPrescription(prev => ({
        ...prev,
        items: [...prev.items.filter(i => i.medicamento), ...items]
      }));
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Receta Médica - ${patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; color: #deb887; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            .prescription-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .prescription-table th, .prescription-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .prescription-table th { background-color: #f9f9f9; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BIOSKIN</h1>
            <p>Dermatología y Medicina Estética</p>
          </div>
          
          <div class="info">
            <p><strong>Paciente:</strong> ${patientName}</p>
            <p><strong>Fecha:</strong> ${currentPrescription.fecha}</p>
            <p><strong>Diagnóstico:</strong> ${currentPrescription.diagnostico}</p>
          </div>

          <h3>Prescripción</h3>
          <ul>
            ${currentPrescription.items.map(item => `
              <li>
                <strong>${item.medicamento}</strong> ${item.presentacion} ${item.dosis}
                <br/>
                <em>${item.indicaciones}</em> (${item.frecuencia} por ${item.duracion})
              </li>
            `).join('')}
          </ul>

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
        <div className="font-semibold text-gray-700 mb-2">Historial</div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {prescriptions.map(p => (
            <div
              key={p.id}
              onClick={() => p.id && handleLoadPrescription(p.id)}
              className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                currentPrescription.id === p.id 
                  ? 'bg-[#deb887] text-white border-[#deb887]' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{p.fecha}</div>
              <div className="text-sm opacity-80 truncate">{p.diagnostico || 'Sin diagnóstico'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 flex flex-col gap-4 relative">
        {/* Toolbar */}
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
          <div className="flex gap-2">
            <button onClick={handleNew} className="p-2 hover:bg-gray-200 rounded-lg" title="Nueva Receta">
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={handleSave} disabled={loading} className="p-2 hover:bg-gray-200 rounded-lg" title="Guardar">
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
          
          <div className="flex gap-2 items-center">
            <select 
              className="p-2 border rounded-lg text-sm"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">Seleccionar Plantilla...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            <button onClick={handleApplyTemplate} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
              Aplicar
            </button>
            <button onClick={handleSaveTemplate} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
              Guardar como Plantilla
            </button>
          </div>
        </div>

        {/* Header Fields */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              className="w-full p-2 border rounded-lg"
              value={currentPrescription.fecha}
              onChange={e => setCurrentPrescription(prev => ({ ...prev, fecha: e.target.value }))}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg"
              value={currentPrescription.diagnostico}
              onChange={e => setCurrentPrescription(prev => ({ ...prev, diagnostico: e.target.value }))}
              placeholder="Diagnóstico o indicaciones generales..."
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-2 text-left w-1/4">Medicamento</th>
                <th className="p-2 text-left">Presentación</th>
                <th className="p-2 text-left">Dosis</th>
                <th className="p-2 text-left">Frecuencia</th>
                <th className="p-2 text-left">Vía</th>
                <th className="p-2 text-left">Duración</th>
                <th className="p-2 text-left">Indicaciones</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {currentPrescription.items.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    <input
                      list={`meds-${idx}`}
                      className="w-full p-1 border rounded"
                      value={item.medicamento}
                      onChange={e => updateItem(idx, 'medicamento', e.target.value)}
                      placeholder="Buscar..."
                    />
                    <datalist id={`meds-${idx}`}>
                      {prescriptionOptions.medications.map((m, i) => <option key={i} value={m} />)}
                    </datalist>
                  </td>
                  <td className="p-2">
                    <input
                      list={`pres-${idx}`}
                      className="w-full p-1 border rounded"
                      value={item.presentacion}
                      onChange={e => updateItem(idx, 'presentacion', e.target.value)}
                    />
                    <datalist id={`pres-${idx}`}>
                      {prescriptionOptions.presentations.map((p, i) => <option key={i} value={p} />)}
                    </datalist>
                  </td>
                  <td className="p-2">
                    <input
                      list={`dose-${idx}`}
                      className="w-full p-1 border rounded"
                      value={item.dosis}
                      onChange={e => updateItem(idx, 'dosis', e.target.value)}
                    />
                    <datalist id={`dose-${idx}`}>
                      {prescriptionOptions.doses.map((d, i) => <option key={i} value={d} />)}
                    </datalist>
                  </td>
                  <td className="p-2">
                    <input
                      list={`freq-${idx}`}
                      className="w-full p-1 border rounded"
                      value={item.frecuencia}
                      onChange={e => updateItem(idx, 'frecuencia', e.target.value)}
                    />
                    <datalist id={`freq-${idx}`}>
                      {prescriptionOptions.frequencies.map((f, i) => <option key={i} value={f} />)}
                    </datalist>
                  </td>
                  <td className="p-2">
                    <input
                      list={`route-${idx}`}
                      className="w-full p-1 border rounded"
                      value={item.via}
                      onChange={e => updateItem(idx, 'via', e.target.value)}
                    />
                    <datalist id={`route-${idx}`}>
                      {prescriptionOptions.routes.map((r, i) => <option key={i} value={r} />)}
                    </datalist>
                  </td>
                  <td className="p-2">
                    <input
                      list={`dur-${idx}`}
                      className="w-full p-1 border rounded"
                      value={item.duracion}
                      onChange={e => updateItem(idx, 'duracion', e.target.value)}
                    />
                    <datalist id={`dur-${idx}`}>
                      {prescriptionOptions.durations.map((d, i) => <option key={i} value={d} />)}
                    </datalist>
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full p-1 border rounded"
                      value={item.indicaciones}
                      onChange={e => updateItem(idx, 'indicaciones', e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeItem(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button
          onClick={addItem}
          className="absolute bottom-6 right-6 bg-[#deb887] text-white p-3 rounded-full shadow-lg hover:bg-[#c5a075] transition-all hover:scale-110 z-10 flex items-center justify-center"
          title="Agregar Medicamento"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
