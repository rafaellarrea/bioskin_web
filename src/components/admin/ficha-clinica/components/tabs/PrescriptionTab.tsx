import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Copy, Printer, Search, Calendar } from 'lucide-react';
import prescriptionOptions from '../../data/prescription_options.json';

interface PrescriptionItem {
  medicamento: string;
  nombre_comercial: string;
  presentacion: string;
  dosis: string;
  frecuencia: string;
  via: string;
  duracion: string;
  turno: string;
  indicaciones: string;
  rutina: 'mañana' | 'noche' | 'ambos' | '';
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
  patientAge?: number | string;
}

const EMPTY_ITEM: PrescriptionItem = {
  medicamento: '',
  nombre_comercial: '',
  presentacion: '',
  dosis: '',
  frecuencia: '',
  via: '',
  duracion: '',
  turno: '',
  indicaciones: '',
  rutina: ''
};

export default function PrescriptionTab({ recordId, patientName, patientAge }: PrescriptionTabProps) {
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

    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    const logoUrl = `${window.location.origin}/images/logo/logo.png`;

    const html = `
      <html>
        <head>
          <title>Receta Médica - ${patientName}</title>
          <style>
            @page { size: landscape; margin: 0; }
            body { font-family: 'Arial', sans-serif; padding: 40px; max-width: 100%; margin: 0; box-sizing: border-box; }
            .container { display: flex; gap: 60px; height: 100%; }
            .column { flex: 1; position: relative; display: flex; flex-direction: column; }
            .column:first-child { border-right: 1px dashed #ccc; padding-right: 60px; }
            
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .logo { height: 60px; object-fit: contain; }
            .doctor-info { text-align: right; }
            .doctor-info h2 { margin: 0; font-size: 12px; color: #333; letter-spacing: 2px; font-weight: normal; }
            .doctor-info h3 { margin: 5px 0 0; font-size: 14px; font-weight: bold; }

            .patient-info { margin-bottom: 30px; font-size: 12px; }
            .patient-info p { margin: 5px 0; }
            .patient-details { display: flex; justify-content: space-between; margin-top: 10px; }

            .section-title { font-weight: bold; margin-bottom: 15px; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 2px; width: 20px; border-bottom: 3px solid #000; }
            .section-header { font-weight: bold; margin-bottom: 15px; font-size: 12px; text-transform: uppercase; }

            .product-list { list-style-type: decimal; padding-left: 20px; margin: 0; }
            .product-list li { margin-bottom: 8px; font-size: 12px; line-height: 1.4; }

            .routine-section { margin-bottom: 20px; }
            .routine-title { font-size: 12px; color: #333; margin-bottom: 10px; text-transform: uppercase; }

            .footer { margin-top: auto; font-size: 10px; color: #666; padding-top: 20px; }
            .footer-item { display: flex; align-items: center; gap: 5px; margin-bottom: 3px; }
            .icon { margin-right: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Left Column -->
            <div class="column">
               <div class="header">
                 <img src="${logoUrl}" class="logo" alt="Bio Skin" />
                 <div class="doctor-info">
                   <h2>SALUD Y ESTÉTICA</h2>
                   <h3>DRA. DANIELA CREAMER</h3>
                 </div>
               </div>
               
               <div class="patient-info">
                 <p><strong>Cuenca, a ${dateStr}</strong></p>
                 <div class="patient-details">
                    <span><strong>Paciente:</strong> ${patientName.toUpperCase()}</span>
                    <span><strong>EDAD:</strong> ${patientAge || ''} AÑOS</span>
                 </div>
               </div>

               <div class="section-header">INDICACIONES:</div>
               <ol class="product-list">
                 ${currentPrescription.items.map(item => `
                   <li>
                     ${item.nombre_comercial || item.medicamento} ${item.presentacion || ''}
                   </li>
                 `).join('')}
               </ol>

               <div class="footer">
                  <div class="footer-item"><span class="icon">📞</span> 0998653732 / 0969890689</div>
                  <div class="footer-item"><span class="icon">📍</span> Av. Ordoñez Lasso y Calle del Culantro. Centro Médico Santa María / Consultorio 203.</div>
               </div>
            </div>

            <!-- Right Column -->
            <div class="column">
               <div class="header">
                 <img src="${logoUrl}" class="logo" alt="Bio Skin" />
                 <div class="doctor-info">
                   <h2>SALUD Y ESTÉTICA</h2>
                   <h3>DRA. DANIELA CREAMER</h3>
                 </div>
               </div>
               
               <div class="patient-info">
                 <p><strong>Cuenca, a ${dateStr}</strong></p>
                 <div class="patient-details">
                    <span><strong>Paciente:</strong> ${patientName.toUpperCase()}</span>
                    <span><strong>EDAD:</strong> ${patientAge || ''} AÑOS</span>
                 </div>
               </div>

               <div class="section-header">INDICACIONES:</div>
               
               <div class="routine-section">
                 <div class="routine-title">RUTINA DE MAÑANA</div>
                 <ol class="product-list">
                   ${currentPrescription.items.filter(i => i.rutina === 'mañana' || i.rutina === 'ambos').map(item => `
                     <li>
                       ${item.indicaciones || `Aplicar ${item.nombre_comercial || item.medicamento}`}
                     </li>
                   `).join('')}
                 </ol>
               </div>

               <div class="routine-section">
                 <div class="routine-title">RUTINA DE NOCHE</div>
                 <ol class="product-list">
                   ${currentPrescription.items.filter(i => i.rutina === 'noche' || i.rutina === 'ambos').map(item => `
                     <li>
                       ${item.indicaciones || `Aplicar ${item.nombre_comercial || item.medicamento}`}
                     </li>
                   `).join('')}
                 </ol>
               </div>
               
               <div class="footer">
                  <div class="footer-item"><span class="icon">📞</span> 0998653732 / 0969890689</div>
                  <div class="footer-item"><span class="icon">📍</span> Av. Ordoñez Lasso y Calle del Culantro. Centro Médico Santa María / Consultorio 203.</div>
               </div>
            </div>
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
      <div className="w-56 border-r border-gray-200 pr-4 flex flex-col gap-2 flex-shrink-0">
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
      <div className="flex-1 flex flex-col gap-4 relative overflow-hidden">
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
        <div className="flex-1 overflow-auto border rounded-lg shadow-sm">
          <table className="w-full text-sm min-w-[1200px]">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 text-left w-48 font-semibold text-gray-700">Principio Activo</th>
                <th className="p-3 text-left w-48 font-semibold text-gray-700">Nombre Comercial</th>
                <th className="p-3 text-left w-32 font-semibold text-gray-700">Presentación</th>
                <th className="p-3 text-left w-24 font-semibold text-gray-700">Dosis</th>
                <th className="p-3 text-left w-32 font-semibold text-gray-700">Frecuencia</th>
                <th className="p-3 text-left w-24 font-semibold text-gray-700">Vía</th>
                <th className="p-3 text-left w-32 font-semibold text-gray-700">Duración</th>
                <th className="p-3 text-left w-32 font-semibold text-gray-700">Rutina</th>
                <th className="p-3 text-left min-w-[200px] font-semibold text-gray-700">Indicaciones</th>
                <th className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentPrescription.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-2">
                    <input
                      list={`meds-${idx}`}
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none transition-all"
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
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none transition-all"
                      value={item.nombre_comercial}
                      onChange={e => updateItem(idx, 'nombre_comercial', e.target.value)}
                      placeholder="Opcional"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      list={`pres-${idx}`}
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none transition-all"
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
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none transition-all"
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
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none transition-all"
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
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none transition-all"
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
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none transition-all"
                      value={item.duracion}
                      onChange={e => updateItem(idx, 'duracion', e.target.value)}
                    />
                    <datalist id={`dur-${idx}`}>
                      {prescriptionOptions.durations.map((d, i) => <option key={i} value={d} />)}
                    </datalist>
                  </td>
                  <td className="p-2">
                    <select
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none transition-all"
                      value={item.rutina}
                      onChange={e => updateItem(idx, 'rutina', e.target.value as any)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="mañana">Mañana</option>
                      <option value="noche">Noche</option>
                      <option value="ambos">Ambos</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-[#deb887] focus:border-transparent outline-none transition-all"
                      value={item.indicaciones}
                      onChange={e => updateItem(idx, 'indicaciones', e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeItem(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
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
          className="absolute bottom-6 right-6 bg-[#deb887] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#c5a075] transition-all hover:scale-105 z-20 flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Agregar Medicamento
        </button>
      </div>
    </div>
  );
}
