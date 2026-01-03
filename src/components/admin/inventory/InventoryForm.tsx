import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

interface InventoryFormProps {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function InventoryForm({ onClose, onSave }: InventoryFormProps) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'Inyectable',
    unit_of_measure: 'Vial',
    min_stock_level: 5,
    requires_cold_chain: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Nuevo Producto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Código</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
              rows={2}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="Inyectable">Inyectable</option>
                <option value="Consumible">Consumible</option>
                <option value="Venta">Venta Directa</option>
                <option value="Equipamiento">Equipamiento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
              <select
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={formData.unit_of_measure}
                onChange={e => setFormData({...formData, unit_of_measure: e.target.value})}
              >
                <option value="Vial">Vial</option>
                <option value="Jeringa">Jeringa</option>
                <option value="Unidad">Unidad</option>
                <option value="Caja">Caja</option>
                <option value="mL">mL</option>
                <option value="Kit">Kit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                min="0"
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={formData.min_stock_level}
                onChange={e => setFormData({...formData, min_stock_level: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                id="coldChain"
                className="w-4 h-4 text-[#deb887] rounded focus:ring-[#deb887]"
                checked={formData.requires_cold_chain}
                onChange={e => setFormData({...formData, requires_cold_chain: e.target.checked})}
              />
              <label htmlFor="coldChain" className="text-sm text-gray-700">Requiere Cadena de Frío ❄️</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c5a075] transition-colors flex items-center gap-2"
            >
              {loading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
              Guardar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
