import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Settings, Clipboard, Printer, Eye, Edit, Trash2 } from 'lucide-react';

interface TechnicalDocument {
  id: number;
  ticket_number: string;
  document_type: string;
  client_name: string;
  status: string;
  created_at: string;
}

export default function TechnicalDashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<TechnicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [filterType]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let url = '/api/technical-service';
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (searchTerm) params.append('search', searchTerm);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'reception': return 'Recepción';
      case 'technical_report': return 'Informe Técnico';
      case 'proforma': return 'Proforma';
      default: return type;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-[#b8860b]">Servicio Técnico BioskinTech</h1>
          <p className="text-gray-500 mt-2">Gestión de documentos técnicos y reparaciones</p>
        </div>
        <button
          onClick={() => navigate('/admin/technical/new')}
          className="bg-[#b8860b] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#a0750a] transition-colors"
        >
          <Plus size={20} />
          Nuevo Documento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['all', 'reception', 'technical_report', 'proforma'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap ${
                  filterType === type
                    ? 'bg-[#b8860b] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'Todos' : getTypeName(type)}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Buscar por cliente o ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20 focus:border-[#b8860b]"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Ticket</th>
                <th className="p-4 font-semibold text-gray-600">Tipo</th>
                <th className="p-4 font-semibold text-gray-600">Cliente</th>
                <th className="p-4 font-semibold text-gray-600">Fecha</th>
                <th className="p-4 font-semibold text-gray-600">Estado</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Cargando documentos...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No se encontraron documentos</td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">#{doc.ticket_number}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-2">
                        {doc.document_type === 'reception' && <Clipboard size={16} className="text-blue-500" />}
                        {doc.document_type === 'technical_report' && <Settings size={16} className="text-purple-500" />}
                        {doc.document_type === 'proforma' && <FileText size={16} className="text-green-500" />}
                        {getTypeName(doc.document_type)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{doc.client_name}</td>
                    <td className="p-4 text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/admin/technical/view/${doc.id}`)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver / Imprimir"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/technical/edit/${doc.id}`)}
                          className="p-2 text-gray-400 hover:text-[#b8860b] hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
