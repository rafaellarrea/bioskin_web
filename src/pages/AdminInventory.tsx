import React, { useState, useEffect } from 'react';
import { Package, Plus, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import InventoryList from '../components/admin/inventory/InventoryList';
import InventoryForm from '../components/admin/inventory/InventoryForm';
import StockMovementModal from '../components/admin/inventory/StockMovementModal';
import ConsumeModal from '../components/admin/inventory/ConsumeModal';
import { useAuth } from '../context/AuthContext';

export default function AdminInventory() {
  const { username } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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
    const action = data.id ? 'inventoryUpdateItem' : 'inventoryCreateItem';
    const res = await fetch(`/api/records?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(data.id ? 'Error al actualizar producto' : 'Error al crear producto');
    setSuccessMessage(data.id ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
    fetchInventory();
  };

  const handleDeleteItem = async (item: any) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${item.name}"? Esta acción no se puede deshacer.`)) return;
    
    try {
      const res = await fetch(`/api/records?action=inventoryDeleteItem&id=${item.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar');
      }
      
      setSuccessMessage('Producto eliminado exitosamente');
      fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddStock = async (data: any) => {
    const res = await fetch('/api/records?action=inventoryAddBatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user_id: username })
    });
    if (!res.ok) throw new Error('Error al agregar stock');
    setSuccessMessage('Stock agregado exitosamente');
    fetchInventory();
  };

  const handleConsumeStock = async (data: any) => {
    const res = await fetch('/api/records?action=inventoryConsume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user_id: username })
    });
    if (!res.ok) throw new Error('Error al registrar consumo');
    setSuccessMessage('Consumo registrado exitosamente');
    fetchInventory();
  };

  return (
    <AdminLayout title="Inventario y Stock" subtitle="Gestión de productos, lotes y vencimientos">
      <div className="space-y-6">
        {successMessage && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </div>
        )}

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
              setSelectedItem(item);
              // Logic to show details modal if needed
            }}
            onEditItem={(item) => {
              setSelectedItem(item);
              setShowForm(true);
            }}
            onDeleteItem={handleDeleteItem}
            onAddStock={(item) => {
              setSelectedItem(item);
              setShowStockModal(true);
            }}
            onConsumeStock={(item) => {
              setSelectedItem(item);
              setShowConsumeModal(true);
            }}
          />
        )}

        {/* Modals */}
        {showForm && (
          <InventoryForm 
            initialData={selectedItem}
            onClose={() => {
              setShowForm(false);
              setSelectedItem(null);
            }}
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

        {showConsumeModal && selectedItem && (
          <ConsumeModal 
            item={selectedItem}
            onClose={() => {
              setShowConsumeModal(false);
              setSelectedItem(null);
            }}
            onSave={handleConsumeStock}
          />
        )}
      </div>
    </AdminLayout>
  );
}
