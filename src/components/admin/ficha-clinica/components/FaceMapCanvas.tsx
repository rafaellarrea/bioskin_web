
import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

export interface Mark {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  category: string;
  notes?: string;
}

interface FaceMapCanvasProps {
  marks: Mark[];
  onAddMark: (mark: Omit<Mark, 'id'>) => void;
  onRemoveMark: (id: string) => void;
  readOnly?: boolean;
  selectedCategory?: string;
}

export default function FaceMapCanvas({ 
  marks, 
  onAddMark, 
  onRemoveMark, 
  readOnly = false,
  selectedCategory 
}: FaceMapCanvasProps) {
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
      notes: ''
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (readOnly || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoverPos({ x, y });
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
  };

  return (
    <div className="relative w-full aspect-square max-w-[500px] mx-auto bg-gray-50 border-2 border-gray-200 rounded-lg overflow-hidden select-none">
      {/* Map Container */}
      <div 
        ref={containerRef}
        className={`relative w-full h-full ${!readOnly ? 'cursor-crosshair' : ''}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Placeholder Face Image - Replace with actual image */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
            <path fill="currentColor" d="M100,10 C50,10 10,50 10,100 C10,150 50,190 100,190 C150,190 190,150 190,100 C190,50 150,10 100,10 Z M60,80 C60,75 65,75 65,80 C65,85 60,85 60,80 Z M140,80 C140,75 145,75 145,80 C145,85 140,85 140,80 Z M100,120 C100,120 120,140 140,120" />
          </svg>
          <span className="absolute text-sm font-medium">Mapa Facial (Imagen pendiente)</span>
        </div>

        {/* Marks */}
        {marks.map((mark) => (
          <div
            key={mark.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
          >
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm hover:scale-125 transition-transform cursor-pointer flex items-center justify-center">
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
            {/* Tooltip */}
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-white text-xs px-2 py-1 rounded shadow border border-gray-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
              {mark.category}
            </div>
          </div>
        ))}

        {/* Hover Preview */}
        {!readOnly && hoverPos && selectedCategory && (
          <div 
            className="absolute w-4 h-4 bg-red-500/50 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${hoverPos.x}%`, top: `${hoverPos.y}%` }}
          />
        )}
      </div>
    </div>
  );
}
