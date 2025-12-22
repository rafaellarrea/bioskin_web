
import React, { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Mark } from './FaceMapCanvas';
import { X } from 'lucide-react';

interface BodyMapCanvasProps {
  marks: Mark[];
  onAddMark: (mark: Omit<Mark, 'id'>) => void;
  onRemoveMark: (id: string) => void;
  readOnly?: boolean;
  selectedCategory?: string;
}

function Model({ onClick }: { onClick: (e: any) => void }) {
  const obj = useLoader(OBJLoader, '/models/manbody.obj');
  
  // Traverse to set material color/properties if needed
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({ 
        color: '#e5e7eb',
        roughness: 0.5,
        metalness: 0.1
      });
    }
  });

  // Adjust scale and position based on typical OBJ exports
  // You might need to tweak these values depending on the specific OBJ file
  return <primitive object={obj} onClick={onClick} scale={0.03} position={[0, -2.5, 0]} />;
}

export default function BodyMapCanvas({ 
  marks, 
  onAddMark, 
  onRemoveMark, 
  readOnly = false,
  selectedCategory 
}: BodyMapCanvasProps) {
  
  const handleCanvasClick = (e: any) => {
    if (readOnly) return;
    e.stopPropagation();
    
    if (!selectedCategory) {
      alert("Por favor seleccione una categoría primero");
      return;
    }

    // e.point is the Vector3 intersection point
    const point = e.point;
    
    onAddMark({
      x: point.x,
      y: point.y,
      z: point.z,
      category: selectedCategory,
      notes: 'Cuerpo'
    });
  };

  return (
    <div className="relative w-full aspect-[3/4] max-w-[500px] mx-auto bg-gray-50 border-2 border-gray-200 rounded-lg overflow-hidden select-none shadow-sm">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={<Html center><div className="text-gray-500">Cargando modelo 3D...</div></Html>}>
          <Model onClick={handleCanvasClick} />
          
          {/* Render Marks */}
          {marks.map((mark) => (
            <mesh key={mark.id} position={[mark.x, mark.y, mark.z || 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" />
              <Html distanceFactor={10}>
                <div className="group relative">
                  {/* Invisible trigger area */}
                  <div className="w-6 h-6 -ml-3 -mt-3 cursor-pointer" />
                  
                  {/* Tooltip */}
                  <div className="hidden group-hover:flex absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 flex-col items-center backdrop-blur-sm">
                    <span className="font-bold">{mark.category}</span>
                    {!readOnly && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveMark(mark.id);
                        }}
                        className="flex items-center gap-1 mt-1 text-red-300 hover:text-red-100 border-t border-gray-600 pt-1 w-full justify-center"
                      >
                        <X size={10} /> Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </Html>
            </mesh>
          ))}
        </Suspense>
        
        <OrbitControls enablePan={true} enableZoom={true} minDistance={2} maxDistance={10} />
      </Canvas>
      
      <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none bg-white/50 px-2 py-1 rounded">
        Rotar: Click izq + arrastrar | Zoom: Rueda | Mover: Click der + arrastrar
      </div>
    </div>
  );
}
