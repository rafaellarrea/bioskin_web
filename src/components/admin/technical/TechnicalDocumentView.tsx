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

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
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
      <div className="max-w-[21cm] mx-auto bg-white shadow-lg print:shadow-none p-[2cm] min-h-[29.7cm] relative">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#b8860b] pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-serif text-[#b8860b] font-bold">BIOSKIN TECH</h1>
            <p className="text-sm text-gray-500 mt-1">Departamento Técnico Especializado</p>
            <p className="text-sm text-gray-500">Quito, Ecuador | Tel: +593 999 999 999</p>
          </div>
          <div className="text-right">
             <h2 className="text-xl font-bold text-gray-800 uppercase split-words">{data.document_type.replace('_', ' ')}</h2>
             <p className="text-gray-500 mt-1">Ticket #{data.ticket_number}</p>
             <p className="text-sm text-gray-400 mt-1">{new Date(data.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Client & Equipment Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50 p-4 rounded border border-gray-100 print:border-none print:bg-transparent print:p-0">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Información del Cliente</h3>
             <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Cliente:</span> {data.client_name}</p>
                <p><span className="font-semibold">Contacto:</span> {data.client_contact}</p>
             </div>
          </div>
           <div className="bg-gray-50 p-4 rounded border border-gray-100 print:border-none print:bg-transparent print:p-0">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Información del Equipo</h3>
             <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Marca/Modelo:</span> {data.equipment_data?.brand} {data.equipment_data?.model}</p>
                <p><span className="font-semibold">Serie:</span> {data.equipment_data?.serial}</p>
             </div>
          </div>
        </div>

        {/* Table / Checklist */}
        {data.checklist_data?.checks?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">Lista de Verificación</h3>
            <table className="w-full text-sm">
               <thead>
                 <tr className="text-left text-gray-500 border-b">
                   <th className="py-2">Punto</th>
                   <th className="py-2 text-center">Estado</th>
                   <th className="py-2">Observación</th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {data.checklist_data.checks.map((item: any, i: number) => (
                   <tr key={i}>
                     <td className="py-2">{item.label}</td>
                     <td className="py-2 text-center">
                       {item.status === 'ok' ? '✅' : item.status === 'fail' ? '❌' : '-'}
                     </td>
                     <td className="py-2 text-gray-500 italic">{item.observation}</td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        )}

        {/* Diagnosis & Recommendations */}
        <div className="space-y-6 mb-8">
           {data.diagnosis && (
             <div>
               <h3 className="text-sm font-bold text-gray-800 mb-2">Diagnóstico Técnico</h3>
               <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{data.diagnosis}</p>
             </div>
           )}
           {data.recommendations && (
             <div>
               <h3 className="text-sm font-bold text-gray-800 mb-2">Recomendaciones / Trabajos</h3>
               <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{data.recommendations}</p>
             </div>
           )}
        </div>

         {/* Visual Condition & Accessories */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-xs text-gray-500 border-t pt-4">
           <div>
              <span className="font-semibold">Accesorios:</span> {data.equipment_data?.accessories || 'Ninguno'}
           </div>
           <div>
              <span className="font-semibold">Condición Visual:</span> {data.equipment_data?.visual_condition || 'Normal'}
           </div>
        </div>

        {/* Footer / Signatures */}
        <div className="absolute bottom-8 left-0 right-0 px-[2cm]">
            <div className="flex justify-between items-end pt-8">
                <div className="text-center w-40">
                    <div className="border-b border-gray-300 mb-2 h-16"></div>
                    <p className="text-xs font-semibold">Técnico Responsable</p>
                    <p className="text-[10px] text-gray-400">BIOSKIN TECH</p>
                </div>
                <div className="text-center w-40">
                    <div className="border-b border-gray-300 mb-2 h-16"></div>
                    <p className="text-xs font-semibold">Recibí Conforme</p>
                    <p className="text-[10px] text-gray-400">Cliente</p>
                </div>
            </div>
            <div className="mt-8 text-[10px] text-center text-gray-400 border-t pt-2">
                Documento generado electrónicamente el {new Date().toLocaleString()} | BioskinTech v3.0
            </div>
        </div>

      </div>
    </div>
  );
}
