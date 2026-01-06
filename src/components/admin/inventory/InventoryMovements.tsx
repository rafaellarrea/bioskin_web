import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownLeft, Activity, Search } from 'lucide-react';

interface Movement {
  id: number;
  item_name: string;
  sku: string;
  batch_number: string;
  movement_type: string;
  quantity_change: number;
  reason: string;
  user_id: string;
  created_at: string;
}

export default function InventoryMovements() {
  const [movements, setMovements] = React.useState<Movement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const res = await fetch('/api/records?action=inventoryListMovements&limit=200');
      if (res.ok) {
        const data = await res.json();
        setMovements(data);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter(m => 
    m.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#deb887]" />
          Historial de Movimientos
        </h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar en historial..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Fecha/Hora</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Lote</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Cantidad</th>
                <th className="px-6 py-4">Razón / Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Cargando movimientos...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                filteredMovements.map((move) => (
                  <tr key={move.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(move.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{move.item_name}</div>
                      <div className="text-xs text-gray-400 font-mono">{move.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                      {move.batch_number}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        move.quantity_change > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {move.quantity_change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        {move.quantity_change > 0 ? 'Ingreso' : 'Salida'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${
                      move.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {move.quantity_change > 0 ? '+' : ''}{move.quantity_change}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-800">{move.reason}</div>
                      <div className="text-xs text-gray-500">{move.user_id}</div>
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
