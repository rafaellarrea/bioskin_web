
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, DollarSign, TrendingUp, TrendingDown, 
  Trash2, Edit2, Check, X, FileText, PieChart, BarChart2 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

interface FinanceRecord {
  id: number;
  date: string;
  invoice_number?: string;
  entity: string;
  description?: string;
  type: 'ingreso' | 'egreso';
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  registered_by?: string;
}

const AdminFinance = () => {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Global' | 'Rafael' | 'Daniela'>('Global');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<FinanceRecord>>({});

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userFilter = activeTab === 'Global' ? 'all' : activeTab;
      const queryParams = new URLSearchParams({
        action: 'financeList',
        registered_by: userFilter,
        startDate: dateRange.start || '',
        endDate: dateRange.end || ''
      });
      
      const recordsRes = await fetch(`/api/records?${queryParams.toString()}`);
      const recordsData = await recordsRes.json();

      if (Array.isArray(recordsData)) setRecords(recordsData);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
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

  const getMetrics = () => {
    const totalIngresos = records
      .filter(r => r.type === 'ingreso')
      .reduce((s, r) => s + parseFloat(String(r.total || 0)), 0);
      
    const totalEgresos = records
      .filter(r => r.type === 'egreso')
      .reduce((s, r) => s + parseFloat(String(r.total || 0)), 0);

    const totalIVA = records
      .reduce((s, r) => s + parseFloat(String(r.tax || 0)), 0);

    const totalSubtotal = records
      .reduce((s, r) => s + parseFloat(String(r.subtotal || 0)), 0);

    return { totalIngresos, totalEgresos, totalIVA, totalSubtotal };
  };

  const metrics = getMetrics();

  const graphData = [
    { name: 'Ingresos', value: metrics.totalIngresos, fill: '#10b981' },
    { name: 'Egresos', value: metrics.totalEgresos, fill: '#ef4444' }
  ];

  const taxData = [
    { name: 'Subtotal Net', value: metrics.totalSubtotal, fill: '#3b82f6' },
    { name: 'Impuestos (IVA)', value: metrics.totalIVA, fill: '#f59e0b' }
  ];

  const startEdit = (record: FinanceRecord) => {
    setEditingId(record.id);
    setEditFormData({ ...record });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setLoading(true);
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'financeUpdate', 
          ...editFormData 
        })
      });
      
      if (!res.ok) throw new await res.text();
      
      alert("✅ Registro actualizado correctamente");
      fetchData(); // Refresh data
      setEditingId(null);
    } catch(e) {
      console.error(e);
      alert('Error updating record: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field: keyof FinanceRecord, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white pt-12 pb-24 px-4 shadow-xl">
        <div className="container-custom mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2 flex items-center gap-3">
                <DollarSign className="text-yellow-500" /> Finanzas & Facturas
              </h1>
              <p className="opacity-70">Control inteligente de ingresos y egresos</p>
            </div>
            
            <div className="flex bg-gray-800/50 p-1 rounded-xl mt-4 md:mt-0 backdrop-blur-sm border border-gray-700">
              {(['Global', 'Rafael', 'Daniela'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab 
                      ? 'bg-yellow-500 text-gray-900 shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab === 'Global' ? 'Vista Global' : `Dr/Ing. ${tab}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom mx-auto -mt-16 px-4">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={18} />
            <span className="font-medium">Rango de Fechas:</span>
          </div>
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-4 py-2 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
          />
          <span className="text-gray-300">→</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-4 py-2 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard 
            title="Balance Total" 
            amount={metrics.totalIngresos - metrics.totalEgresos} 
            icon={DollarSign} 
            color={metrics.totalIngresos >= metrics.totalEgresos ? "blue" : "red"} 
          />
          <MetricCard 
            title="Ingresos" 
            amount={metrics.totalIngresos} 
            icon={TrendingUp} 
            color="green" 
          />
          <MetricCard 
            title="Egresos" 
            amount={metrics.totalEgresos} 
            icon={TrendingDown} 
            color="red" 
          />
          <MetricCard 
            title="Total IVA Agregado" 
            amount={metrics.totalIVA} 
            icon={PieChart} 
            color="orange" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BarChart2 size={20} className="text-gray-400" /> Flujo de Caja
            </h3>
            <div className="h-64 cursor-default">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <PieChart size={20} className="text-gray-400" /> Composición Fiscal
            </h3>
            <div className="h-64 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={taxData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taxData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Factura</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Entidad / Detalle</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">IVA</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      Cargando registros...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No hay registros para este filtro.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                      {editingId === record.id ? (
                        <EditRow 
                          data={editFormData} 
                          onChange={handleEditChange} 
                          onSave={saveEdit} 
                          onCancel={cancelEdit} 
                        />
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-gray-400" />
                              {record.invoice_number || 'S/N'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                             <div className="font-semibold text-gray-800 truncate">{record.entity}</div>
                             <div className="text-xs text-gray-400 truncate">{record.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              record.type === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {record.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            ${parseFloat(String(record.subtotal || 0)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            ${parseFloat(String(record.tax || 0)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-800">
                            ${parseFloat(String(record.total)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => startEdit(record)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(record.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
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

interface MetricCardProps {
  title: string;
  amount: number;
  icon: any;
  color: 'blue' | 'green' | 'red' | 'orange';
}

const MetricCard = ({ title, amount, icon: Icon, color }: MetricCardProps) => {
  const colorStyles = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-emerald-600 bg-emerald-50 border-emerald-100",
    red: "text-rose-600 bg-rose-50 border-rose-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100"
  };

  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`p-6 rounded-2xl border ${colorStyles[color].replace('text-', 'border-')} bg-white shadow-sm`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorStyles[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
};

interface EditRowProps {
  data: Partial<FinanceRecord>;
  onChange: (field: keyof FinanceRecord, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditRow = ({ data, onChange, onSave, onCancel }: EditRowProps) => {
  return (
    <>
      <td className="px-4 py-2"><input type="date" value={data.date?.split('T')[0]} onChange={e => onChange('date', e.target.value)} className="w-full text-xs p-1 border rounded" /></td>
      <td className="px-4 py-2"><input type="text" value={data.invoice_number} onChange={e => onChange('invoice_number', e.target.value)} className="w-full text-xs p-1 border rounded" /></td>
      <td className="px-4 py-2">
        <input type="text" value={data.entity} onChange={e => onChange('entity', e.target.value)} className="w-full text-xs p-1 border rounded mb-1" placeholder="Entidad" />
        <input type="text" value={data.description} onChange={e => onChange('description', e.target.value)} className="w-full text-xs p-1 border rounded" placeholder="Desc" />
      </td>
      <td className="px-4 py-2">
        <select value={data.type} onChange={e => onChange('type', e.target.value)} className="text-xs p-1 border rounded">
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
      </td>
      <td className="px-4 py-2"><input type="number" value={data.subtotal} onChange={e => onChange('subtotal', e.target.value)} className="w-20 text-xs p-1 border rounded text-right" step="0.01"/></td>
      <td className="px-4 py-2"><input type="number" value={data.tax} onChange={e => onChange('tax', e.target.value)} className="w-20 text-xs p-1 border rounded text-right" step="0.01"/></td>
      <td className="px-4 py-2"><input type="number" value={data.total} onChange={e => onChange('total', e.target.value)} className="w-20 text-xs p-1 border rounded text-right font-bold" step="0.01"/></td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-1">
          <button onClick={onSave} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check size={14}/></button>
          <button onClick={onCancel} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"><X size={14}/></button>
        </div>
      </td>
    </>
  );
};

export default AdminFinance;
