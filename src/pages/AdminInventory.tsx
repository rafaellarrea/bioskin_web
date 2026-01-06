import React, { useState, useEffect } from 'react';
import { Package, Plus, CheckCircle, List, Activity, Calendar, BarChart3 } from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import InventoryList from '../components/admin/inventory/InventoryList';
import InventoryForm from '../components/admin/inventory/InventoryForm';
import StockMovementModal from '../components/admin/inventory/StockMovementModal';
import ConsumeModal from '../components/admin/inventory/ConsumeModal';
import InventoryMovements from '../components/admin/inventory/InventoryMovements';
import InventoryBatches from '../components/admin/inventory/InventoryBatches';
import InventoryOverview from '../components/admin/inventory/InventoryOverview';
import { useAuth } from '../context/AuthContext';

export default function AdminInventory() {
  const { username } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'batches' | 'movements'>('inventory');
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
    setShowForm(false);
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
    setShowStockModal(false);
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
    setShowConsumeModal(false);
  };

  return (
    <AdminLayout title="Inventario Clínico" subtitle="Gestión integral de productos e insumos">
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Simplified Tabs - Clean UI */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-gray-100/80 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'inventory' 
              ? 'bg-white text-[#deb887] shadow-sm ring-1 ring-gray-200' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <Package className="w-4 h-4" />
          Stock Actual
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'batches' 
              ? 'bg-white text-[#deb887] shadow-sm ring-1 ring-gray-200' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Lotes y Vencimientos
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'movements' 
              ? 'bg-white text-[#deb887] shadow-sm ring-1 ring-gray-200' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          Auditoría de Movimientos
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        
        {/* Inventory View - Integrates Stats & List */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in space-y-6">
            {/* Quick Stats Integrated */}
            <InventoryOverview items={items} />
            
            <div className="flex justify-between items-center pt-2">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                 Listado de Productos
              </h3>
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#deb887] text-white px-4 py-2 rounded-lg hover:bg-[#c5a075] transition-colors flex items-center text-sm font-medium shadow-sm shadow-[#deb887]/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20 bg-white rounded-xl border border-gray-100">
                <div className="animate-spin w-8 h-8 border-4 border-[#deb887] border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <InventoryList 
                items={items} 
                onSelectItem={(item) => setSelectedItem(item)}
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
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'batches' && (
          <div className="animate-fade-in">
             <InventoryBatches />
          </div>
        )}
        
        {activeTab === 'movements' && (
          <div className="animate-fade-in">
             <InventoryMovements />
          </div>
        )}

      </div>

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
    </AdminLayout>
  );
}
