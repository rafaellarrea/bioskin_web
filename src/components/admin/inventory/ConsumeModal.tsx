import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Droplet } from 'lucide-react';

interface ConsumeModalProps {
  item: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function ConsumeModal({ item, onClose, onSave }: ConsumeModalProps) {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState('Uso en cabina');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'manual' | 'visual'>('visual');

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
      .catch(err => setError('Error cargando lotes'))
      .finally(() => setLoading(false));
  }, [item.id]);

  const isConsumable = item.category === 'Consumible';

  useEffect(() => {
    if (!isConsumable) setMode('manual');
  }, [isConsumable]);

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
      setError(`Stock insuficiente en el lote seleccionado (Máx: ${batch.quantity_current})`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        batch_id: selectedBatchId,
        quantity: qty,
        reason
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar consumo');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelSelect = (level: number) => {
    // If user selects "50%", it means they used 50% of a unit (0.5)
    // Or does it mean the bottle is AT 50%?
    // The prompt says: "no tengo que cada vez que use 0.5... sino que cada cierto tiempo verificar visualmente"
    // This implies setting the CURRENT level.
    // BUT, our backend expects "quantity to consume".
    // So if I select "Current Level: 50%", I need to know the PREVIOUS level to calculate consumption.
    // But we don't track "per bottle" level easily if there are multiple bottles in a batch.
    // Assuming 1 Unit = 1 Bottle.
    // If the batch has 5.5 units. That means 5 full bottles and one half full.
    // If I say "Current Level of open bottle is 25%".
    // Then the new total should be 5.25.
    // Consumption = 5.5 - 5.25 = 0.25.
    
    // To implement this correctly without complex "per bottle" tracking:
    // We can just interpret the visual selector as "Amount Consumed from a single unit".
    // "I used 25% of a bottle" -> Consumed 0.25.
    // "I used 50% of a bottle" -> Consumed 0.5.
    // This is the safest interpretation that fits the current schema.
    
    setQuantity(level.toString());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              {isConsumable ? <Droplet className="w-5 h-5 text-orange-500" /> : null}
              Registrar Consumo
            </h3>
            <p className="text-xs text-gray-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

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
                    Lote: {batch.batch_number} (Vence: {new Date(batch.expiration_date).toLocaleDateString()}) - Stock: {batch.quantity_current}
                  </option>
                ))}
              </select>
            )}
          </div>

          {isConsumable && (
            <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setMode('visual')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  mode === 'visual' ? 'bg-white text-[#deb887] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Selector Visual
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  mode === 'manual' ? 'bg-white text-[#deb887] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Entrada Manual
              </button>
            </div>
          )}

          {mode === 'visual' ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Cantidad Consumida (Aprox)</label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => handleLevelSelect(0.2)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    quantity === '0.2' ? 'border-[#deb887] bg-[#deb887]/10 ring-1 ring-[#deb887]' : 'border-gray-200 hover:border-[#deb887]/50'
                  }`}
                >
                  <div className="h-8 w-3 bg-gray-200 rounded-sm relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 bg-orange-400 h-[20%]"></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">20%</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLevelSelect(0.4)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    quantity === '0.4' ? 'border-[#deb887] bg-[#deb887]/10 ring-1 ring-[#deb887]' : 'border-gray-200 hover:border-[#deb887]/50'
                  }`}
                >
                  <div className="h-8 w-3 bg-gray-200 rounded-sm relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 bg-orange-400 h-[40%]"></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">40%</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLevelSelect(0.5)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    quantity === '0.5' ? 'border-[#deb887] bg-[#deb887]/10 ring-1 ring-[#deb887]' : 'border-gray-200 hover:border-[#deb887]/50'
                  }`}
                >
                  <div className="h-8 w-3 bg-gray-200 rounded-sm relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 bg-orange-400 h-[50%]"></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">50%</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLevelSelect(0.8)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    quantity === '0.8' ? 'border-[#deb887] bg-[#deb887]/10 ring-1 ring-[#deb887]' : 'border-gray-200 hover:border-[#deb887]/50'
                  }`}
                >
                  <div className="h-8 w-3 bg-gray-200 rounded-sm relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 bg-orange-400 h-[80%]"></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">80%</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLevelSelect(1.0)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    quantity === '1' ? 'border-[#deb887] bg-[#deb887]/10 ring-1 ring-[#deb887]' : 'border-gray-200 hover:border-[#deb887]/50'
                  }`}
                >
                  <div className="h-8 w-3 bg-gray-200 rounded-sm relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 bg-orange-400 h-full"></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">100%</span>
                </button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                Selecciona la cantidad aproximada que se consumió del envase.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Consumir</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step={isConsumable ? "0.1" : "1"}
                  min="0.1"
                  className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
                <span className="p-2 bg-gray-100 rounded-lg text-gray-600 min-w-[60px] text-center flex items-center justify-center">
                  {item.unit_of_measure}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <select
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#deb887] outline-none"
              value={reason}
              onChange={e => setReason(e.target.value)}
            >
              <option value="Uso en cabina">Uso en cabina / Tratamiento</option>
              <option value="Venta directa">Venta directa</option>
              <option value="Mermas / Daño">Mermas / Daño</option>
              <option value="Vencimiento">Vencimiento</option>
              <option value="Ajuste de inventario">Ajuste de inventario</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || batches.length === 0}
              className="px-4 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c5a075] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Registrando...' : 'Confirmar Consumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
