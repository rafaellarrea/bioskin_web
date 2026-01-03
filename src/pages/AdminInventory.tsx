import React, { useState, useEffect } from 'react';
import { Package, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import InventoryList from '../components/admin/inventory/InventoryList';
import InventoryForm from '../components/admin/inventory/InventoryForm';
import StockMovementModal from '../components/admin/inventory/StockMovementModal';
import { useAuth } from '../context/AuthContext';

export default function AdminInventory() {
  const { username } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/records?action=inventoryListItems');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (data: any) => {
    const res = await fetch('/api/records?action=inventoryCreateItem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al crear producto');
    fetchInventory();
  };

  const handleAddStock = async (data: any) => {
    const res = await fetch('/api/records?action=inventoryAddBatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user_id: username })
    });
    if (!res.ok) throw new Error('Error al agregar stock');
    fetchInventory();
  };

  return (
    <AdminLayout title="Inventario y Stock" subtitle="Gestión de productos, lotes y vencimientos">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Productos</p>
              <p className="text-2xl font-bold text-gray-800">{items.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock Bajo / Agotado</p>
              <p className="text-2xl font-bold text-gray-800">
                {items.filter((i: any) => i.total_stock <= i.min_stock_level).length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Valorización</p>
              <p className="text-2xl font-bold text-gray-800">$ --</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Listado de Productos</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#deb887] text-white px-4 py-2 rounded-lg hover:bg-[#c5a075] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-[#deb887] border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <InventoryList 
            items={items} 
            onSelectItem={(item) => {
              // TODO: Implement detail view / consumption
              alert(`Detalles de ${item.name} (Próximamente)`);
            }}
            onAddStock={(item) => {
              setSelectedItem(item);
              setShowStockModal(true);
            }}
          />
        )}

        {/* Modals */}
        {showForm && (
          <InventoryForm 
            onClose={() => setShowForm(false)} 
            onSave={handleCreateItem} 
          />
        )}

        {showStockModal && selectedItem && (
          <StockMovementModal 
            item={selectedItem}
            onClose={() => {
              setShowStockModal(false);
              setSelectedItem(null);
            }}
            onSave={handleAddStock}
          />
        )}
      </div>
    </AdminLayout>
  );
}
