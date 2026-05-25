import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, ShoppingCart, Package } from 'lucide-react';

interface ConsumeModalProps {
  item: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onRestock?: () => void;
}

export default function ConsumeModal({ item, onClose, onSave }: ConsumeModalProps) {
  const isVenta = item.category === 'Venta';

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState(isVenta ? 'Venta directa' : 'Uso en cabina');
  const [costPrice, setCostPrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/records?action=inventoryGetItem&id=${item.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.batches) {
          setBatches(data.batches);
          if (data.batches.length > 0) {
            setSelectedBatchId(data.batches[0].id);
          }
        }
      })
      .catch(() => setError('Error cargando lotes'))
      .finally(() => setLoading(false));
  }, [item.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      setError('Debe seleccionar un lote con stock disponible');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    const batch = batches.find(b => b.id === parseInt(selectedBatchId));
    if (batch && qty > batch.quantity_current) {
      setError(`Stock insuficiente en el lote seleccionado (MÃ¡x: ${batch.quantity_current})`);
      return;
    }

    if (isVenta) {
      if (!salePrice || parseFloat(salePrice) <= 0) {
        setError('Ingresa el precio de venta');
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        batch_id: selectedBatchId,
        quantity: qty,
        reason,
        ...(isVenta && {
          cost_price: costPrice ? parseFloat(costPrice) : null,
          sale_price: parseFloat(salePrice),
        }),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              {isVenta
                ? <ShoppingCart className="w-5 h-5 text-emerald-500" />
                : <Package className="w-5 h-5 text-orange-400" />}
              {isVenta ? 'Registrar Venta' : 'Registrar Consumo'}
            </h3>
            <p className="text-xs text-gray-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Batch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Lote</label>
            {batches.length === 0 ? (
              <p className="text-sm text-red-500">No hay lotes con stock disponible.</p>
            ) : (
              <select
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
              >
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    Lote: {batch.batch_number} (Vence: {new Date(batch.expiration_date).toLocaleDateString()}) â€” Stock: {batch.quantity_current}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isVenta ? 'Cantidad Vendida' : 'Cantidad a Consumir'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="1"
                min="1"
                className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
              <span className="p-2 bg-gray-100 rounded-lg text-gray-600 min-w-[70px] text-center flex items-center justify-center text-sm">
                {item.unit_of_measure || 'Unidad'}
              </span>
            </div>
          </div>

          {/* Price fields â€” only for Venta */}
          {isVenta && (
            <div className="space-y-4 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Precios de esta venta</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo de adquisiciÃ³n
                    <span className="text-gray-400 font-normal"> (opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none text-sm"
                      value={costPrice}
                      onChange={e => setCostPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio de venta <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      required
                      className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-sm"
                      value={salePrice}
                      onChange={e => setSalePrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {costPrice && salePrice && parseFloat(salePrice) > 0 && (
                <div className="flex justify-between items-center text-xs text-gray-600 border-t border-emerald-100 pt-2">
                  <span>Margen por unidad:</span>
                  <span className={`font-semibold ${parseFloat(salePrice) - parseFloat(costPrice) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    ${(parseFloat(salePrice) - parseFloat(costPrice)).toFixed(2)}
                    {parseFloat(costPrice) > 0 && (
                      <span className="text-gray-400 font-normal ml-1">
                        ({(((parseFloat(salePrice) - parseFloat(costPrice)) / parseFloat(costPrice)) * 100).toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <select
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
              value={reason}
              onChange={e => setReason(e.target.value)}
            >
              {isVenta ? (
                <>
                  <option value="Venta directa">Venta directa</option>
                  <option value="Venta con descuento">Venta con descuento</option>
                  <option value="Muestra gratis">Muestra / PromociÃ³n</option>
                </>
              ) : (
                <>
                  <option value="Uso en cabina">Uso en cabina / Tratamiento</option>
                  <option value="Venta directa">Venta directa</option>
                  <option value="Mermas / DaÃ±o">Mermas / DaÃ±o</option>
                  <option value="Vencimiento">Vencimiento</option>
                  <option value="Ajuste de inventario">Ajuste de inventario</option>
                </>
              )}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || batches.length === 0}
              className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${
                isVenta
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-[#deb887] hover:bg-[#c5a075]'
              }`}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Registrando...' : isVenta ? 'Confirmar Venta' : 'Confirmar Consumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

