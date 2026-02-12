
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, User, TrendingUp, TrendingDown, Trash2, Filter } from 'lucide-react';

const AdminFinance = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('all'); // all, Rafael, Daniela
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchData();
  }, [filterUser, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const recordsRes = await fetch(`/api/records?action=financeList&registered_by=${filterUser}&startDate=${dateRange.start}&endDate=${dateRange.end}`);
      const statsRes = await fetch(`/api/records?action=financeStats&startDate=${dateRange.start}&endDate=${dateRange.end}`);
      
      const recordsData = await recordsRes.json();
      const statsData = await statsRes.json();

      if (Array.isArray(recordsData)) setRecords(recordsData);
      if (Array.isArray(statsData)) setStats(statsData);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'financeDelete', id })
      });
      fetchData();
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  const calculateTotal = (user, type) => {
    return stats
      .filter(s => (user === 'all' || s.registered_by === user) && s.type === type)
      .reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white py-12 px-4 shadow-lg">
        <div className="container-custom mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-2">Finanzas & Facturas</h1>
          <p className="opacity-90">Gestión de Ingresos y Egresos (Rafael / Daniela)</p>
        </div>
      </div>

      <div className="container-custom mx-auto -mt-8 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-medium">Ingresos Totales</p>
                <h3 className="text-2xl font-bold text-gray-800">${calculateTotal(filterUser, 'ingreso').toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full text-green-600">
                <TrendingUp size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-medium">Egresos Totales</p>
                <h3 className="text-2xl font-bold text-gray-800">${calculateTotal(filterUser, 'egreso').toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                <TrendingDown size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
             <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-medium">Balance</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  ${(calculateTotal(filterUser, 'ingreso') - calculateTotal(filterUser, 'egreso')).toFixed(2)}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <DollarSign size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="font-medium text-gray-700">Filtrar:</span>
          </div>
          
          <select 
            value={filterUser} 
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
          >
            <option value="all">Todos los registros</option>
            <option value="Rafael">Ing. Rafael</option>
            <option value="Daniela">Dra. Daniela</option>
          </select>

          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-4 py-2 border rounded-lg"
          />
          <span className="text-gray-400">a</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Factura</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entidad</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrado Por</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Cargando registros...</td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No hay registros financieros.</td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {record.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.entity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {record.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          record.type === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {record.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        {record.registered_by}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-800">
                        ${parseFloat(record.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinance;
