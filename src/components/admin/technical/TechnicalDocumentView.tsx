import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Mail } from 'lucide-react';

export default function TechnicalDocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/technical-service?id=${id}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [id]);

  if (!data) return <div className="p-10 text-center">Cargando documento...</div>;

  const handlePrint = () => {
    window.print();
  };

  const getDocTitle = () => {
    switch(data.document_type) {
      case 'reception': return 'ACTA DE RECEPCIÓN TÉCNICA';
      case 'technical_report': return 'INFORME TÉCNICO';
      case 'proforma': return 'PROFORMA DE SERVICIO';
      default: return 'DOCUMENTO TÉCNICO';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:fixed print:inset-0 print:bg-white print:p-0 print:z-[9999] print:overflow-visible">
      <style>{`
        @media print {
          @page { margin: 0.5cm; size: auto; }
          body * { visibility: hidden; }
          #technical-document, #technical-document * { visibility: visible; }
          #technical-document { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0.5cm; }
        }
      `}</style>

      {/* Action Bar - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between print:hidden">
        <button onClick={() => navigate('/admin/technical')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} /> Volver
        </button>
        <div className="flex gap-4">
          <button onClick={() => window.alert('Función de envío por email pendiente')} className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:shadow flex items-center gap-2">
            <Mail size={18} /> Enviar por Email
          </button>
          <button onClick={handlePrint} className="bg-[#b8860b] text-white px-4 py-2 rounded-lg shadow-sm hover:bg-[#a0750a] flex items-center gap-2">
            <Printer size={18} /> Imprimir PDF
          </button>
        </div>
      </div>

      {/* A4 Format Document */}
      <div id="technical-document" className="max-w-[21cm] mx-auto bg-white shadow-lg print:shadow-none p-[2cm] min-h-[29.7cm] relative overflow-hidden">
        
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <img src="/images/logo/bioskin-tech-icon.png" alt="Watermark" className="w-[80%]" />
        </div>

        {/* Header with Logo */}
        <div className="flex justify-between items-start border-b-2 border-[#b8860b] pb-6 mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <img src="/images/logo/bioskin-tech-full.png" alt="Bioskin Tech Logo" className="h-20 object-contain" />
          </div>
          <div className="text-right">
             <h2 className="text-xl font-bold text-gray-800 uppercase split-words">{getDocTitle()}</h2>
             <div className="bg-gray-100 px-3 py-1 rounded mt-2 inline-block">
               <p className="text-sm font-mono font-bold text-gray-600">#{data.ticket_number}</p>
             </div>
             <p className="text-xs text-gray-400 mt-1">{new Date(data.created_at).toLocaleDateString()} {new Date(data.created_at).toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Common Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="space-y-2">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1">Cliente</h3>
             <p><span className="font-semibold text-gray-700">Razón Social:</span> {data.client_name}</p>
             <p><span className="font-semibold text-gray-700">Contacto:</span> {data.client_contact}</p>
          </div>
           <div className="space-y-2">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1">Equipo</h3>
             <p><span className="font-semibold text-gray-700">Marca/Modelo:</span> {data.equipment_data?.brand} {data.equipment_data?.model}</p>
             <p><span className="font-semibold text-gray-700">Serie/SN:</span> {data.equipment_data?.serial || 'N/A'}</p>
          </div>
        </div>

        {/* Specific Layouts based on Doc Type */}
        
        {/* RECEPTION LAYOUT */}
        {data.document_type === 'reception' && (
          <>
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-800 mb-3 bg-gray-50 p-2 border-l-4 border-[#b8860b]">Estado de Recepción (Checklist)</h3>
              <table className="w-full text-sm border-collapse">
                 <thead>
                   <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase">
                     <th className="py-2 px-3 border border-gray-200">Componente</th>
                     <th className="py-2 px-3 border border-gray-200 text-center w-24">Estado</th>
                     <th className="py-2 px-3 border border-gray-200">Observación</th>
                   </tr>
                 </thead>
                 <tbody>
                   {data.checklist_data?.checks?.map((item: any, i: number) => (
                     <tr key={i}>
                       <td className="py-2 px-3 border border-gray-200">{item.label}</td>
                       <td className={`py-2 px-3 border border-gray-200 text-center font-bold ${
                         item.status === 'ok' ? 'text-green-600' : item.status === 'fail' ? 'text-red-500' : 'text-gray-400'
                       }`}>
                         {item.status === 'ok' ? 'OK' : item.status === 'fail' ? 'MALO' : 'N/A'}
                       </td>
                       <td className="py-2 px-3 border border-gray-200 text-gray-600 text-xs italic">{item.observation}</td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
               <div className="border border-gray-200 p-4 rounded bg-gray-50">
                  <h4 className="font-bold text-gray-700 mb-2">Accesorios Recibidos:</h4>
                  <p className="text-gray-600">{data.equipment_data?.accessories || 'Ninguno declarado.'}</p>
               </div>
               <div className="border border-gray-200 p-4 rounded bg-gray-50">
                  <h4 className="font-bold text-gray-700 mb-2">Condición Visual:</h4>
                  <p className="text-gray-600">{data.equipment_data?.visual_condition || 'Normal, sin daños visibles adicionales.'}</p>
               </div>
            </div>
            
            <div className="mb-8 border-t pt-4">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Términos y Condiciones de Recepción:</h4>
              <p className="text-[10px] text-gray-500 text-justify leading-tight italic">
                1. El cliente autoriza la revisión técnica y diagnóstico del equipo detallado. 2. La empresa NO asume responsabilidad por: pérdida de información/datos (se recomienda respaldo previo), fallas ocultas preexistentes no detectables en la recepción visual, ni accesorios no declarados explícitamente en este documento. 3. Los equipos que no sean retirados en un plazo máximo de 90 días calendario serán considerados en abandono y la empresa dispondrá de ellos según la normativa legal vigente para cubrir gastos de bodegaje y gestión. 4. La garantía aplica únicamente sobre los repuestos cambiados y la mano de obra del servicio específico realizado.
              </p>
            </div>
          </>
        )}

        {/* TECHNICAL REPORT LAYOUT */}
        {data.document_type === 'technical_report' && (
          <>
            <div className="space-y-6 mb-8">
               <div className="border-l-4 border-blue-500 pl-4 py-1">
                 <h3 className="text-sm font-bold text-gray-800 mb-2">Diagnóstico Técnico</h3>
                 <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-light">{data.diagnosis}</p>
               </div>
               
               <div className="border-l-4 border-green-500 pl-4 py-1">
                 <h3 className="text-sm font-bold text-gray-800 mb-2">Trabajos Realizados / Recomendaciones</h3>
                 <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-light">{data.recommendations}</p>
               </div>
            </div>

            {data.checklist_data?.checks?.length > 0 && (
              <div className="mb-8 opacity-75">
                <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Pruebas de Funcionamiento Final</h3>
                <div className="grid grid-cols-2 gap-2">
                   {data.checklist_data.checks.map((item: any, i: number) => (
                     <div key={i} className="flex justify-between items-center text-xs border-b border-gray-100 py-1">
                        <span>{item.label}</span>
                        <span className={item.status === 'ok' ? 'text-green-600 font-bold' : 'text-red-500'}>
                          {item.status === 'ok' ? 'PASS' : 'FAIL'}
                        </span>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </>
        )}

         {/* PROFORMA LAYOUT */}
        {data.document_type === 'proforma' && (
          <>
            <div className="mb-8">
               <h3 className="text-sm font-bold text-gray-800 mb-3 bg-gray-50 p-2">Detalle de Costos</h3>
               <table className="w-full text-sm border-collapse">
                 <thead>
                   <tr className="bg-gray-800 text-white text-left text-xs uppercase">
                     <th className="py-3 px-4 w-2/3">Descripción del Servicio / Repuesto</th>
                     <th className="py-3 px-4 text-right">Valor</th>
                   </tr>
                 </thead>
                 <tbody>
                    <tr>
                      <td className="py-4 px-4 border-b border-gray-100 align-top">
                        <p className="font-bold text-gray-800 mb-1">Servicio Técnico Especializado</p>
                        <p className="text-gray-600 text-xs whitespace-pre-wrap">{data.recommendations}</p>
                        {data.diagnosis && <p className="text-gray-500 text-[10px] mt-2 italic">Ref. Diagnóstico: {data.diagnosis.substring(0, 100)}...</p>}
                      </td>
                      <td className="py-4 px-4 border-b border-gray-100 text-right font-mono">
                        ${Number(data.total_cost).toFixed(2)}
                      </td>
                    </tr>
                    {/* Add tax rows roughly or assume total includes tax based on simple model */}
                    <tr className="bg-gray-50 font-bold text-gray-900">
                      <td className="py-3 px-4 text-right text-xs uppercase">Total a Pagar</td>
                      <td className="py-3 px-4 text-right font-mono text-lg border-t-2 border-gray-800">
                         ${Number(data.total_cost).toFixed(2)}
                      </td>
                    </tr>
                 </tbody>
               </table>
            </div>

            <div className="bg-[#fcfbf7] border border-[#deb887]/30 p-4 rounded text-xs text-gray-600 mb-8">
               <h4 className="font-bold text-[#b8860b] mb-2">Condiciones Comerciales:</h4>
               <ul className="list-disc list-inside space-y-1">
                 <li>Validez de la oferta: 15 días calendario.</li>
                 <li>Tiempo de entrega: Sujeto a disponibilidad de repuestos (aprox. 3-5 días hábiles).</li>
                 <li>Forma de pago: 50% anticipo, 50% contra entrega.</li>
                 <li>Garantía: 3 meses sobre el trabajo realizado (no cubre partes eléctricas por mala manipulación).</li>
               </ul>
            </div>
          </>
        )}

        {/* Footer / Signatures - Conditional per type */}
        <div className="absolute bottom-12 left-0 right-0 px-[2cm]">
            <div className="flex justify-between items-end pt-12">
                <div className="text-center w-48">
                    <div className="border-b border-gray-300 mb-2 h-16"></div>
                    <p className="text-xs font-bold uppercase">Bioskin Tech</p>
                    <p className="text-[10px] text-gray-400">Departamento Técnico</p>
                </div>
                
                {data.document_type === 'reception' && (
                  <div className="text-center w-48">
                      <div className="border-b border-gray-300 mb-2 h-16"></div>
                      <p className="text-xs font-bold uppercase">{data.client_name}</p>
                      <p className="text-[10px] text-gray-400">Firma Cliente / Entregué Conforme</p>
                  </div>
                )}

                {data.document_type === 'proforma' && (
                  <div className="text-center w-48">
                      <div className="border-b border-gray-300 mb-2 h-16"></div>
                      <p className="text-xs font-bold uppercase">Aprobación</p>
                      <p className="text-[10px] text-gray-400">Firma y Sello Cliente</p>
                  </div>
                )}
            </div>
            
            <div className="mt-8 text-[10px] text-center text-gray-300 border-t border-gray-100 pt-2 flex justify-between">
                <span>Bioskin - Medicina Estética & Tecnología</span>
                <span>Generado: {new Date().toLocaleString()} | ID: {data.id}</span>
            </div>
        </div>

      </div>
    </div>
  );
}
