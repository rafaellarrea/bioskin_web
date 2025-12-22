
import React, { useState, useRef } from 'react';
import { X, RotateCw } from 'lucide-react';
import { Mark } from './FaceMapCanvas';

interface BodyMapCanvasProps {
  marks: Mark[];
  onAddMark: (mark: Omit<Mark, 'id'>) => void;
  onRemoveMark: (id: string) => void;
  readOnly?: boolean;
  selectedCategory?: string;
}

export default function BodyMapCanvas({ 
  marks, 
  onAddMark, 
  onRemoveMark, 
  readOnly = false,
  selectedCategory 
}: BodyMapCanvasProps) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (readOnly || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!selectedCategory) {
      alert("Por favor seleccione una categoría primero");
      return;
    }

    onAddMark({
      x,
      y,
      category: selectedCategory,
      notes: view // Store view in notes or a separate field if needed. For now, we'll append to category or handle in parent.
                  // Actually, let's assume the parent handles filtering by view or we store it in the mark.
                  // The Python code had separate lists. Here we might want to add a 'view' property to Mark.
                  // But Mark interface is shared. Let's add 'view' to Mark in the parent or here.
    });
  };

  // Filter marks for current view
  // Note: We need to know which marks belong to which view. 
  // Since the interface Mark doesn't have 'view', we'll assume the parent passes only relevant marks 
  // OR we need to update the Mark interface.
  // For this implementation, I'll assume the parent manages the state and we might need to pass a 'view' context.
  // However, to keep it simple and compatible with the Python logic which had separate lists, 
  // let's assume the parent passes `marks` that are relevant for the current view, 
  // OR we add a `view` property to the Mark interface.
  
  // Let's update the Mark interface in FaceMapCanvas to be more flexible or extend it here.
  // For now, I'll assume the parent handles the filtering based on a 'view' property that I will add to the onAddMark callback.
  
  const handleAddMarkInternal = (mark: Omit<Mark, 'id'>) => {
    // We'll append the view to the notes or category if we can't change the schema.
    // But better: let's assume the parent handles it.
    onAddMark({ ...mark, notes: view }); // Using notes to store view for now if schema is rigid
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setView(v => v === 'front' ? 'back' : 'front')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RotateCw size={16} />
          Vista: {view === 'front' ? 'Frontal' : 'Posterior'}
        </button>
      </div>

      <div className="relative w-full aspect-[3/4] max-w-[400px] bg-gray-50 border-2 border-gray-200 rounded-lg overflow-hidden select-none">
        <div 
          ref={containerRef}
          className={`relative w-full h-full ${!readOnly ? 'cursor-crosshair' : ''}`}
          onClick={handleClick}
        >
          {/* Placeholder Body Image */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {view === 'front' ? '🧍' : 'back'}
              </div>
              <span className="text-sm font-medium">Mapa Corporal {view === 'front' ? 'Frontal' : 'Posterior'}</span>
            </div>
          </div>

          {/* Marks - Filtered by view (assuming notes field contains view for now) */}
          {marks.filter(m => m.notes === view).map((mark) => (
            <div
              key={mark.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
            >
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm hover:scale-125 transition-transform cursor-pointer flex items-center justify-center">
                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveMark(mark.id);
                    }}
                    className="hidden group-hover:flex absolute -top-6 bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10"
                  >
                    Eliminar <X size={10} className="ml-1" />
                  </button>
                )}
              </div>
              <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-white text-xs px-2 py-1 rounded shadow border border-gray-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                {mark.category}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
