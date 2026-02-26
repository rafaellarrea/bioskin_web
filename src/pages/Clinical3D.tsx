import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { 
  Activity, Save, Layers, Crosshair, 
  CheckCircle2, AlertCircle, X, Loader2, Database, Upload,
  RotateCw, RotateCcw, Move, MousePointer2, ZoomIn, ZoomOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================

const PATHOLOGIES = [
  { id: 'botox', name: 'Toxina Botulínica', color: '#06b6d4' }, // Cian
  { id: 'filler', name: 'Relleno Dérmico', color: '#8b5cf6' }, // Violeta
  { id: 'thread', name: 'Hilos Tensores', color: '#f59e0b' }, // Ámbar
  { id: 'melasma', name: 'Melasma / Pigmentación', color: '#10b981' }, // Esmeralda
  { id: 'acnescar', name: 'Cicatrices de Acné', color: '#ef4444' }, // Rojo
];

// Función heurística para estimar las zonas faciales
const getFacialZone = (point: THREE.Vector3) => {
  const { y } = point;
  if (y > 4) return "Frente";
  if (y > 1) return "Glabela y Cejas";
  if (y > -1) return "Ojeras y Región Orbital";
  if (y > -4) return "Nariz y Surco Nasogeniano";
  if (y > -7) return "Arco Cigomático y Mejillas";
  if (y > -10) return "Región Perioral y Labios";
  return "Mandíbula, Mentón y Cuello";
};

type MarkerType = 'Puntual' | 'Zonal';

interface Marker {
  id?: string;
  type: MarkerType;
  pathologyId: string;
  position: { x: number; y: number; z: number };
  rotation: number[];
  normal: { x: number; y: number; z: number };
  zone: string;
}

// Base de datos asíncrona simulada
const mockDB = {
  data: [] as Marker[],
  save: async (marker: Marker) => {
    return new Promise<{ success: boolean; marker: Marker }>(resolve => {
      setTimeout(() => {
        const savedMarker = { ...marker, id: Date.now().toString() };
        mockDB.data.push(savedMarker);
        resolve({ success: true, marker: savedMarker });
      }, 800);
    });
  },
  load: async () => {
    return new Promise<Marker[]>(resolve => {
      setTimeout(() => {
        resolve([...mockDB.data]);
      }, 1200);
    });
  }
};

// ==========================================
// MOTOR 3D VANILLA (THREE.JS)
// ==========================================

const ThreeScene = ({ modelSource, markers, onMeshClick, onLoaded, onError }: any) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const faceMeshRef = useRef<THREE.Object3D | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);

  const [interactionMode, setInteractionMode] = useState<'rotate' | 'pan'>('rotate');

  // Funciones de control de cámara manual
  const handleManualRotate = (direction: 'left' | 'right' | 'up' | 'down') => {
      // Implementación simple de rotación mediante eventos simulados o acceso directo
      // Para simplificar, usaremos acceso directo a la cámara si es posible, 
      // pero OrbitControls "pelea" con la cámara. Lo ideal es mover la cámara y llamar update.
      // @ts-ignore
      const controls = window.clinical3d_controls; // Hack para acceso global temporal
      if (!controls) return;
      
      const angle = Math.PI / 8; // 22.5 grados
      const camera = controls.object;
      
      // Moveremos la cámara en coordenadas esféricas relativas al target
      const position = camera.position.clone().sub(controls.target);
      let r = position.length();
      let theta = Math.atan2(position.x, position.z); // horizontal
      let phi = Math.acos(position.y / r); // vertical
      
      if (direction === 'left') theta += angle;
      if (direction === 'right') theta -= angle;
      if (direction === 'up') phi = Math.max(0.1, phi - angle);
      if (direction === 'down') phi = Math.min(Math.PI - 0.1, phi + angle);
      
      const newX = r * Math.sin(phi) * Math.sin(theta);
      const newY = r * Math.cos(phi);
      const newZ = r * Math.sin(phi) * Math.cos(theta);
      
      camera.position.set(newX + controls.target.x, newY + controls.target.y, newZ + controls.target.z);
      controls.update();
  };

  const handleZoom = (zoomIn: boolean) => {
      // @ts-ignore
      const controls = window.clinical3d_controls;
      if (!controls) return;
      
      const camera = controls.object;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      
      const distance = zoomIn ? 5 : -5;
      camera.position.add(direction.multiplyScalar(distance));
      controls.update();  
  };

  // 1. Inicializar la Escena Básica (Solo se ejecuta una vez)
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0f172a');
    scene.fog = new THREE.Fog('#0f172a', 40, 100);

    const markersGroup = new THREE.Group();
    markersGroupRef.current = markersGroup;
    scene.add(markersGroup);

    const camera = new THREE.PerspectiveCamera(35, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 40);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true; // Permitir mover el modelo con click derecho
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    // Eliminamos restricciones de ángulo para libertad total
    controls.minPolarAngle = 0; 
    controls.maxPolarAngle = Math.PI; 
    controlsRef.current = controls;

    // Exponer controles globalmente para los botones de UI (solución rápida)
    // @ts-ignore
    window.clinical3d_controls = controls;

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xf0f5ff, 0.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(15, 20, 15);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.9);
    fillLight.position.set(-15, 5, 10);
    scene.add(fillLight);

    const rimLight = new THREE.SpotLight(0xe0e7ff, 1.5, 0, 0.8, 1);
    rimLight.position.set(0, -5, -20);
    scene.add(rimLight);

    // Raycasting y Lógica de Interacción
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let startPos = { x: 0, y: 0 };

    const onPointerDown = (e: MouseEvent) => {
      isDragging = false;
      startPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: MouseEvent) => {
      if (Math.abs(e.clientX - startPos.x) > 2 || Math.abs(e.clientY - startPos.y) > 2) {
        isDragging = true;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (isDragging || !faceMeshRef.current || !cameraRef.current) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(faceMeshRef.current);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        const point = intersect.point;
        
        const n = intersect.face ? intersect.face.normal.clone() : new THREE.Vector3(0,1,0);
        const nTransform = new THREE.Matrix3().getNormalMatrix(faceMeshRef.current.matrixWorld);
        n.applyMatrix3(nTransform).normalize();

        const dummy = new THREE.Object3D();
        dummy.position.copy(point);
        dummy.lookAt(point.clone().add(n));

        callbacks.current.onMeshClick({
          position: { x: point.x, y: point.y, z: point.z },
          rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
          normal: { x: n.x, y: n.y, z: n.z },
          zone: getFacialZone(point)
        });
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    // Bucle de Animación
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Redimensionamiento
    const onResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        const dom = rendererRef.current.domElement;
        dom.removeEventListener('pointerdown', onPointerDown);
        dom.removeEventListener('pointermove', onPointerMove);
        dom.removeEventListener('click', onClick);
      }
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []); // Dependencias vacías: Solo se inicializa una vez

  // 2. Lógica de Carga del Modelo (Se ejecuta cuando modelSource cambia)
  useEffect(() => {
    if (!sceneRef.current || !modelSource) return;

    // Remover modelo anterior si existe
    if (faceMeshRef.current) {
      sceneRef.current.remove(faceMeshRef.current);
      // @ts-ignore
      if (faceMeshRef.current.geometry) faceMeshRef.current.geometry.dispose();
      // @ts-ignore
      if (faceMeshRef.current.material) faceMeshRef.current.material.dispose();
      faceMeshRef.current = null;
    }

    const loader = new GLTFLoader();

    const handleLoadedModel = (gltf: any) => {
      let faceMesh: any = null;
      gltf.scene.traverse((child: any) => {
        if (child.isMesh && !faceMesh) {
          faceMesh = child; 
        }
      });

      if (faceMesh) {
        // ===== ALGORITMO DE CENTRADO ABSOLUTO V2 (MÁS ROBUSTO) =====
        
        // 1. Asegurar que las matrices estén actualizadas
        faceMesh.updateMatrixWorld(true);
        
        // 2. Calcular Bounding Box inicial en coordenadas mundiales
        const box = new THREE.Box3().setFromObject(faceMesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // 3. CENTRADO: Mover el objeto para que su centro visual esté en (0,0,0)
        // La lógica anterior (pos += pos - center) era inestable. 
        // Lo correcto es desplazarlo inversamente a su centro calculado.
        faceMesh.position.x += (faceMesh.position.x - center.x);
        faceMesh.position.y += (faceMesh.position.y - center.y);
        faceMesh.position.z += (faceMesh.position.z - center.z);

        // 4. ESCALADO NORMALIZADO
        // Buscamos que el objeto tenga un tamaño estándar (ej: 10 unidades) en su dimensión mayor
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 5; // Reducido un poco para dar margen
        const scaleFactor = targetSize / (maxDim || 1); // Evitar división por cero
        
        faceMesh.scale.setScalar(scaleFactor);

        // 5. ENFOQUE DE CÁMARA
        // Resetear el target de los controles al origen (0,0,0) donde ahora está el modelo
        if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
        }

        faceMesh.castShadow = true;
        faceMesh.receiveShadow = true;
        
        // Material Clínico Fotorealista
        faceMesh.material = new THREE.MeshPhysicalMaterial({
          color: 0xfae3db,
          roughness: 0.45,
          metalness: 0.05,
          clearcoat: 0.15,
          clearcoatRoughness: 0.3,
          transmission: 0.05,
          thickness: 1.5,
          side: THREE.DoubleSide // Asegura que se vea por dentro y por fuera
        });
        
        sceneRef.current?.add(faceMesh);
        faceMeshRef.current = faceMesh;
        callbacks.current.onLoaded();
      } else {
        callbacks.current.onError("El archivo no contiene una malla 3D válida.");
      }
    };

    const handleLoadError = (error: any) => {
      console.warn("Carga fallida:", error);
      callbacks.current.onError("No se pudo cargar el modelo automáticamente por seguridad del entorno. Por favor, súbelo manualmente.");
    };

    try {
      if (modelSource.type === 'buffer') {
        loader.parse(modelSource.data, '', handleLoadedModel, handleLoadError);
      } else if (modelSource.type === 'url') {
        // Evitar explícitamente fetch en entornos blob con URLs relativas
        const isBlobEnvironment = window.location.href.startsWith('blob:');
        const isRelativeUrl = !modelSource.data.startsWith('http') && !modelSource.data.startsWith('data:') && !modelSource.data.startsWith('blob:');
        
        if (isBlobEnvironment && isRelativeUrl) {
          throw new Error("Peticiones fetch relativas no permitidas.");
        }

        loader.load(modelSource.data, handleLoadedModel, undefined, handleLoadError);
      }
    } catch (err) {
      handleLoadError(err);
    }

  }, [modelSource]); // Se eliminan onLoaded y onError de aquí para evitar bucles infinitos

  // 3. Lógica de Actualización de Marcadores
  useEffect(() => {
    const group = markersGroupRef.current;
    const faceMesh = faceMeshRef.current;
    if (!group) return;

    // Limpiar marcadores antiguos
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      // @ts-ignore
      if (child.geometry) child.geometry.dispose();
      // @ts-ignore
      if (child.material) {
        // @ts-ignore
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        // @ts-ignore
        else child.material.dispose();
      }
    }

    // Renderizar nuevos marcadores
    markers.forEach((marker: Marker) => {
      const pathology = PATHOLOGIES.find(p => p.id === marker.pathologyId);
      const colorHex = pathology?.color || '#ffffff';
      const color = new THREE.Color(colorHex);
      const pos = new THREE.Vector3(marker.position.x, marker.position.y, marker.position.z);

      if (marker.type === 'Puntual') {
        const markerGroup = new THREE.Group();
        markerGroup.position.copy(pos);

        // Núcleo interno
        const coreGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        markerGroup.add(new THREE.Mesh(coreGeo, coreMat));

        // Envoltura luminosa
        const outerGeo = new THREE.SphereGeometry(0.4, 32, 32);
        const outerMat = new THREE.MeshPhysicalMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 1.5,
          transparent: true,
          opacity: 0.8,
          roughness: 0,
          transmission: 0.9,
          thickness: 0.5
        });
        markerGroup.add(new THREE.Mesh(outerGeo, outerMat));
        
        group.add(markerGroup);

      } else if (marker.type === 'Zonal' && faceMesh) {
        const euler = new THREE.Euler(marker.rotation[0], marker.rotation[1], marker.rotation[2]);
        const size = new THREE.Vector3(3, 3, 3);
        const decalGeo = new DecalGeometry(faceMesh as THREE.Mesh, pos, euler, size);
        
        const decalMat = new THREE.MeshPhysicalMaterial({
          color: color,
          transparent: true,
          opacity: 0.6,
          roughness: 0.2,
          clearcoat: 1,
          polygonOffset: true,
          polygonOffsetFactor: -1
        });
        
        const decalMesh = new THREE.Mesh(decalGeo, decalMat);
        group.add(decalMesh);
      }
    });
  }, [markers]);

  return <div ref={mountRef} className="w-full h-full cursor-crosshair" />;
};

// ==========================================
// COMPONENTE PRINCIPAL DE LA APLICACIÓN
// ==========================================

export default function Clinical3D() {
  const navigate = useNavigate();
  const [selectedPathology, setSelectedPathology] = useState(PATHOLOGIES[0].id);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [pendingMarker, setPendingMarker] = useState<any>(null);
  
  // Estado para manejar el origen del modelo 3D
  const [modelSource, setModelSource] = useState<{ type: 'url' | 'buffer'; data: string | ArrayBuffer }>({ 
    type: 'url', 
    data: '' // Iniciamos vacío para que no intente cargar una URL externa que falle
  });
  
  // Al montar, forzamos error para pedir carga manual si no hay URL válida
  useEffect(() => {
     if (modelSource.type === 'url' && modelSource.data === '') {
         // Pequeño timeout para que la UI se monte
         setTimeout(() => {
             setModelError(true);
             // setModelLoaded(true); // Opcional: si queremos quitar el spinner, pero mejor dejar error visible
         }, 500);
     }
  }, []);
  const [modelError, setModelError] = useState(false);
  
  const [dbLoaded, setDbLoaded] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const isLoading = !(dbLoaded && modelLoaded) && !modelError;

  // Inicializar base de datos
  useEffect(() => {
    const initializeData = async () => {
      const data = await mockDB.load();
      setMarkers(data);
      setDbLoaded(true);
    };
    initializeData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Manejador para la subida de archivos manual
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setModelError(false);
      setModelLoaded(false); // Mostrar pantalla de carga
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setModelSource({ type: 'buffer', data: e.target.result });
          showNotification('Modelo 3D cargado correctamente.', 'success');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleMeshClick = (interactionData: any) => {
    setPendingMarker({
      ...interactionData,
      pathologyId: selectedPathology,
    });
  };

  const handleConfirmMarker = async (type: MarkerType) => {

        {/* Controles Visuales (Overlay en el lienzo 3D) */}
        <div className="absolute right-6 top-6 flex flex-col gap-2 z-20">
            <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-xl flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-center text-slate-500 mb-1">Cámara</span>
                
                <div className="grid grid-cols-3 gap-1">
                    <div />
                    <button onClick={() => {
                        // @ts-ignore
                        if (window.clinical3d_controls) {
                            // @ts-ignore
                            window.clinical3d_controls.object.position.y += 5; 
                            // @ts-ignore
                            window.clinical3d_controls.update();
                        }
                    }} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white">
                        <Move className="w-4 h-4 rotate-180" />
                    </button>
                    <div />
                    
                    <button onClick={() => handleManualRotate('left')} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="flex items-center justify-center">
                        <Move className="w-4 h-4 text-slate-500" />
                    </div>
                    <button onClick={() => handleManualRotate('right')} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white">
                        <RotateCw className="w-4 h-4" />
                    </button>

                    <div />
                    <button onClick={() => {
                         // @ts-ignore
                         if (window.clinical3d_controls) {
                             // @ts-ignore
                             window.clinical3d_controls.object.position.y -= 5; 
                             // @ts-ignore
                             window.clinical3d_controls.update();
                         }
                    }} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white">
                        <Move className="w-4 h-4" />
                    </button>
                    <div />
                </div>

                <div className="h-px bg-slate-700 my-1" />

                <div className="flex justify-between gap-2">
                    <button onClick={() => handleZoom(false)} className="flex-1 p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white flex justify-center">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleZoom(true)} className="flex-1 p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white flex justify-center">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>

                <button 
                  onClick={() => {
                        // Resetear vista
                        // @ts-ignore
                        const c = window.clinical3d_controls;
                        if(c) {
                            c.reset();
                            c.target.set(0,0,0);
                            c.object.position.set(0,0,40); // Posición inicial hardcodeada
                            c.update();
                        }
                  }}
                  className="mt-2 text-xs text-center text-cyan-400 hover:text-cyan-300 py-1"
                >
                    Resetear Vista
                </button>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-xl">
                 <p className="text-xs text-slate-400 mb-2">
                    <strong className="text-white">Click Izquierdo:</strong> Rotar<br/>
                    <strong className="text-white">Click Derecho:</strong> Mover (Pan)<br/>
                    <strong className="text-white">Rueda:</strong> Zoom
                 </p>
            </div>
        </div>

    if (!pendingMarker) return;
    setIsSaving(true);
    
    const newMarker = { ...pendingMarker, type };
    const response = await mockDB.save(newMarker);
    
    if (response.success) {
      setMarkers(prev => [...prev, response.marker]);
      setPendingMarker(null);
      showNotification('Marcador clínico mapeado y guardado con éxito.', 'success');
    }
    setIsSaving(false);
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex overflow-hidden font-sans text-slate-100">
      
      {/* Botón Volver */}
      <div className="absolute top-4 left-4 z-50">
        <button 
          onClick={() => navigate('/admin')}
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-lg text-white text-sm font-medium border border-slate-700 transition-colors"
        >
          ← Volver al Panel
        </button>
      </div>

      {/* ÁREA DEL LIENZO 3D */}
      <div className="flex-1 relative h-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        
        {/* Renderizador de Escena */}
        <div className="absolute inset-0 z-10">
          <ThreeScene 
            modelSource={modelSource} 
            markers={markers}
            onMeshClick={handleMeshClick}
            onLoaded={() => {
              setModelLoaded(true);
              setModelError(false);
            }}
            onError={(msg: string) => {
              setModelError(true);
              showNotification(msg, 'error');
            }}
          />
        </div>

        {/* PANTALLA DE CARGA */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
              <h2 className="text-xl font-light tracking-widest text-white">INICIALIZANDO MÓDULO 3D</h2>
            </div>
          </div>
        )}

        {/* MENSAJE DE ERROR Y SUBIDA MANUAL EN EL CENTRO */}
        {modelError && (
          <div className="z-20 flex flex-col items-center p-8 bg-slate-900/90 border border-slate-700 rounded-2xl backdrop-blur-md shadow-2xl text-center max-w-md absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Se requiere carga manual</h2>
            <p className="text-sm text-slate-400 mb-6">
              Por razones de seguridad del entorno virtual, no se pudo leer automáticamente el archivo. Por favor, selecciona tu archivo <strong>.glb</strong> manualmente para continuar.
            </p>
            <label className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl cursor-pointer transition-colors shadow-lg font-medium">
              <Upload className="w-5 h-5" />
              Subir Modelo 3D (.glb)
              <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN (Glassmorphic) */}
        {pendingMarker && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900/80 border border-slate-700 shadow-2xl rounded-2xl p-6 w-[400px] backdrop-blur-xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-medium text-white flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-cyan-400" />
                    Confirmar Ubicación
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Selecciona el tipo de mapeo anatómico.</p>
                </div>
                <button 
                  onClick={() => setPendingMarker(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Zona Detectada</span>
                  <span className="text-sm font-medium text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">
                    {pendingMarker.zone}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Coordenadas</span>
                  <span className="text-xs font-mono text-slate-400">
                    X:{pendingMarker.position.x.toFixed(2)} Y:{pendingMarker.position.y.toFixed(2)} Z:{pendingMarker.position.z.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleConfirmMarker('Puntual')}
                  disabled={isSaving}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all group disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-400 relative flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  </div>
                  <span className="font-medium text-sm">Puntual</span>
                  <span className="text-xs text-slate-400 text-center">Punto de inyección o lesión específica</span>
                </button>

                <button
                  onClick={() => handleConfirmMarker('Zonal')}
                  disabled={isSaving}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-violet-500/20 hover:border-violet-500/50 transition-all group disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400/40 to-violet-600/40 border border-violet-400/50 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">Zonal</span>
                  <span className="text-xs text-slate-400 text-center">Área de superficie o región de tratamiento</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICACIÓN TOAST */}
        {notification && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-slate-800/90 border border-slate-700 shadow-xl backdrop-blur-md animate-in slide-in-from-top-4">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}
      </div>

      {/* PANEL LATERAL UI (Clínico Glassmorphic) */}
      <div className="w-[340px] flex flex-col bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-30">
        
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Mapa Estético</h1>
          </div>
          <p className="text-sm text-slate-400">Módulo Interactivo de Patología 3D</p>
        </div>

        {/* Subir archivo manual (Alternativa Lateral) */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20">
          <label className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg cursor-pointer transition-colors text-xs font-medium">
            <Upload className="w-4 h-4" />
            Cargar nuevo modelo 3D (.glb)
            <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {/* Sección de Herramientas */}
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Herramienta Activa</h2>
          
          <div className="space-y-3">
            {PATHOLOGIES.map((pathology) => {
              const isActive = selectedPathology === pathology.id;
              return (
                <button
                  key={pathology.id}
                  onClick={() => setSelectedPathology(pathology.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-slate-800 border border-slate-600 shadow-md' 
                      : 'hover:bg-slate-800/50 border border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm" 
                    style={{ 
                      backgroundColor: pathology.color,
                      boxShadow: isActive ? `0 0 10px ${pathology.color}80` : 'none' 
                    }} 
                  />
                  <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                    {pathology.name}
                  </span>
                  {isActive && <CheckCircle2 className="w-4 h-4 ml-auto text-slate-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sección de Historial / Datos */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registros del Paciente</h2>
            <div className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
              <Database className="w-3 h-3" />
              {markers.length} mapeados
            </div>
          </div>

          <div className="space-y-3">
            {markers.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-slate-700 rounded-xl text-slate-500 text-sm">
                No hay marcadores anatómicos registrados. Haz clic en el modelo 3D para comenzar.
              </div>
            ) : (
              [...markers].reverse().map((marker) => {
                const pathology = PATHOLOGIES.find(p => p.id === marker.pathologyId);
                return (
                  <div key={marker.id} className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${marker.type === 'Puntual' ? 'opacity-100' : 'opacity-50'}`}
                          style={{ backgroundColor: pathology?.color }}
                        />
                        <span className="text-sm font-medium">{pathology?.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-sm">
                        {marker.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      {marker.zone}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Acciones de pie de página */}
        <div className="p-6 border-t border-slate-800 bg-slate-900">
          <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-lg">
            <Save className="w-4 h-4" />
            Guardar en Expediente
          </button>
        </div>

      </div>
    </div>
  );
}
