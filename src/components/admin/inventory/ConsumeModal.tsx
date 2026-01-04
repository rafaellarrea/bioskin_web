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
  const [remainingLevel, setRemainingLevel] = useState<number | null>(null);

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

  const getBatchCurrentLevel = () => {
    const batch = batches.find(b => b.id === parseInt(selectedBatchId));
    if (!batch) return 1;
    const qty = typeof batch.quantity_current === 'string' ? parseFloat(batch.quantity_current) : batch.quantity_current;
    if (qty === 0) return 0;
    const decimal = qty % 1;
    // If decimal is very close to 0 (floating point), treat as 1 (full) unless total is < 1
    if (decimal < 0.001) return qty >= 1 ? 1 : decimal;
    return decimal;
  };

  const handleLevelSelect = (targetLevel: number) => {
    const batch = batches.find(b => b.id === parseInt(selectedBatchId));
    if (!batch) return;

    const currentLevel = getBatchCurrentLevel();
    let calculatedConsumption = 0;
    
    if (targetLevel <= currentLevel) {
      // Simple consumption: 0.8 -> 0.6 (Consumed 0.2)
      calculatedConsumption = currentLevel - targetLevel;
    } else {
      // New bottle case: 0.1 -> 0.9 (Finished 0.1, Opened new, used 0.1)
      calculatedConsumption = currentLevel + (1 - targetLevel);
    }
    
    // Round to 2 decimals
    calculatedConsumption = Math.round(calculatedConsumption * 100) / 100;
    if (calculatedConsumption < 0) calculatedConsumption = 0;

    setQuantity(calculatedConsumption.toString());
    setRemainingLevel(targetLevel);
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
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <input
                type="checkbox"
                id="visualMode"
                checked={mode === 'visual'}
                onChange={(e) => setMode(e.target.checked ? 'visual' : 'manual')}
                className="w-4 h-4 text-[#deb887] border-gray-300 rounded focus:ring-[#deb887] cursor-pointer"
              />
              <label htmlFor="visualMode" className="text-sm text-gray-700 select-none cursor-pointer flex-1">
                Usar selector visual de nivel restante
                <span className="block text-xs text-gray-500 font-normal">
                  (Recomendado si no se puede medir cantidad exacta)
                </span>
              </label>
            </div>
          )}

          {mode === 'visual' ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Nivel Restante en Envase</label>
                <span className="text-xs text-gray-500">
                  Actual: {Math.round(getBatchCurrentLevel() * 100)}%
                </span>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {[0.2, 0.4, 0.5, 0.8, 1.0].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleLevelSelect(level)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      remainingLevel === level 
                        ? 'border-[#deb887] bg-[#deb887]/10 ring-1 ring-[#deb887]' 
                        : 'border-gray-200 hover:border-[#deb887]/50'
                    }`}
                  >
                    <div className="h-8 w-3 bg-gray-200 rounded-sm relative overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-orange-400 transition-all duration-300"
                        style={{ height: `${level * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-medium text-gray-600">{level * 100}%</span>
                  </button>
                ))}
              </div>
              
              <div className="bg-gray-50 p-2 rounded-lg text-xs text-gray-600 flex justify-between items-center">
                <span>Consumo calculado:</span>
                <span className="font-bold text-[#deb887] text-sm">{quantity} unidades</span>
              </div>
              
              <p className="text-[10px] text-center text-gray-400 mt-1">
                Selecciona cuánto producto QUEDA en el envase abierto.
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
