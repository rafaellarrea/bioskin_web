import React from 'react';
import { Package, AlertTriangle, Plus, History, Search, Droplet, Minus } from 'lucide-react';

interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  group_name?: string;
  unit_of_measure: string;
  total_stock: number;
  min_stock_level: number;
  next_expiry: string;
  requires_cold_chain: boolean;
  sanitary_registration?: string;
}

interface InventoryListProps {
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onAddStock: (item: InventoryItem) => void;
  onConsumeStock: (item: InventoryItem) => void;
}

export default function InventoryList({ items, onSelectItem, onAddStock, onConsumeStock }: InventoryListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, Record<string, InventoryItem[]>> = {};
    filteredItems.forEach(item => {
      const cat = item.category || 'Sin Categoría';
      const sub = item.group_name || 'Otros';
      
      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][sub]) groups[cat][sub] = [];
      
      groups[cat][sub].push(item);
    });
    return groups;
  }, [filteredItems]);

  const categories = Object.keys(groupedItems).sort();

  const getStockStatus = (item: InventoryItem) => {
    if (item.total_stock === 0) return { label: 'Agotado', color: 'bg-red-100 text-red-700' };
    if (item.total_stock <= item.min_stock_level) return { label: 'Bajo Stock', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Normal', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">Todas las Categorías</option>
          <option value="Inyectable">Inyectables</option>
          <option value="Consumible">Consumibles</option>
          <option value="Venta">Venta Directa</option>
          <option value="Equipamiento">Equipamiento</option>
        </select>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
          No se encontraron productos
        </div>
      ) : (
        categories.map(category => (
          <div key={category} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="w-2 h-8 bg-[#deb887] rounded-full"></span>
              {category}
            </h3>
            
            {Object.keys(groupedItems[category]).sort().map(sub => (
              <div key={sub} className="ml-2 space-y-3">
                {sub !== 'Otros' && sub !== 'General' && (
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 ml-1">
                    <div className="w-1.5 h-1.5 bg-[#deb887] rounded-full"></div>
                    {sub}
                  </h4>
                )}
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="p-4 font-semibold text-gray-600">Producto</th>
                          <th className="p-4 font-semibold text-gray-600">Reg. Sanitario</th>
                          <th className="p-4 font-semibold text-gray-600 text-center">Stock Total</th>
                          <th className="p-4 font-semibold text-gray-600">Estado</th>
                          <th className="p-4 font-semibold text-gray-600">Próx. Vencimiento</th>
                          <th className="p-4 font-semibold text-gray-600 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {groupedItems[category][sub].map((item) => {
                          const status = getStockStatus(item);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-500">SKU: {item.sku || 'N/A'}</div>
                                {item.requires_cold_chain && (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mt-1">
                                    ❄️ Cadena de Frío
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-sm text-gray-600">{item.sanitary_registration || '-'}</td>
                              <td className="p-4 text-center">
                                <span className="font-bold text-gray-800">{item.total_stock}</span>
                                <span className="text-xs text-gray-500 ml-1">{item.unit_of_measure}</span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-gray-600">
                                {item.next_expiry ? new Date(item.next_expiry).toLocaleDateString() : '-'}
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => onConsumeStock(item)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Registrar Uso / Consumo"
                                >
                                  {item.category === 'Consumible' ? <Droplet className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => onAddStock(item)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Agregar Stock (Entrada)"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onSelectItem(item)}
                                  className="p-2 text-[#deb887] hover:bg-[#deb887]/10 rounded-lg transition-colors"
                                  title="Ver Detalles"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

