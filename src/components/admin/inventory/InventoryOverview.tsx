import React from 'react';
import { Package, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';

interface StatsProps {
  items: any[];
  batches?: any[];
}

export default function InventoryOverview({ items, batches = [] }: StatsProps) {
  const lowStockCount = items.filter(i => i.total_stock <= i.min_stock_level && i.total_stock > 0).length;
  const outOfStockCount = items.filter(i => i.total_stock === 0).length;
  
  // Calculate expiry risks (batches < 30 days)
  // If batches are provided, use them for precise count.
  // If not, use generic item next_expiry field.
  let expiringCount = 0;
  let expiredCount = 0;

  if (batches.length > 0) {
    expiringCount = batches.filter(b => {
      const today = new Date();
      const expiry = new Date(b.expiration_date);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays <= 30 && diffDays >= 0;
    }).length;

    expiredCount = batches.filter(b => {
       const today = new Date();
       const expiry = new Date(b.expiration_date);
       return expiry < today;
    }).length;
  } else {
    // Fallback using items next_expiry
    expiringCount = items.filter(i => {
      if (!i.next_expiry) return false;
      const today = new Date();
      const expiry = new Date(i.next_expiry);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays <= 30 && diffDays >= 0;
    }).length;
    
    expiredCount = items.filter(i => {
       if (!i.next_expiry) return false;
       const today = new Date();
       const expiry = new Date(i.next_expiry);
       return expiry < today;
    }).length;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Productos</p>
          <p className="text-2xl font-bold text-gray-800">{items.length}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Bajo Stock</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-800">{lowStockCount}</p>
            <span className="text-xs text-red-500 font-medium">{outOfStockCount} Agotados</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Lotes por Vencer</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-800">{expiringCount}</p>
            {expiredCount > 0 && <span className="text-xs text-red-600 font-medium">{expiredCount} Vencidos</span>}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
          <RefreshCw className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Movimientos (Mes)</p>
          <p className="text-2xl font-bold text-gray-800">--</p>
        </div>
      </div>
    </div>
  );
}
