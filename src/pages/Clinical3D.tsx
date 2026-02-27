import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { 
  Activity, Save, Layers, Crosshair, 
  CheckCircle2, AlertCircle, X, Loader2, Database, Upload,
  RotateCw, RotateCcw, Move, MousePointer2, ZoomIn, ZoomOut, Maximize, Scan
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
// AHORA: Sistema dinámico basado en zonas registradas o fallback por defecto.
const getFacialZone = (point: THREE.Vector3, registeredZones: Zone[] = []) => {
  // 1. Intentar encontrar zona registrada cercana (Prioridad)
  if (registeredZones.length > 0) {
      let closestZone = null;
      let minDist = Infinity;

      for (const zone of registeredZones) {
          const zoneCenter = new THREE.Vector3(zone.center.x, zone.center.y, zone.center.z);
          const dist = point.distanceTo(zoneCenter);
          if (dist <= zone.radius && dist < minDist) {
              minDist = dist;
              closestZone = zone;
          }
      }
      
      if (closestZone) return closestZone.name;
  }

  // 2. Fallback Heurístico (Si no hay zonas o no coincide ninguna)
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

interface Zone {
  id: string;
  name: string;
  center: { x: number, y: number, z: number };
  radius: number;
}

interface Marker {
  id?: string;
  type: MarkerType;
  pathologyId: string;
  position: { x: number; y: number; z: number };
  rotation: number[];
  normal: { x: number; y: number; z: number };
  zone: string;
  radius?: number; // Para zonas
}

// Base de datos asíncrona simulada
const mockDB = {
  data: [] as Marker[],
  zones: [] as Zone[], // Nueva colección para zonas
  save: async (marker: Marker) => {
    return new Promise<{ success: boolean; marker: Marker }>(resolve => {
      setTimeout(() => {
        const savedMarker = { ...marker, id: Date.now().toString() };
        mockDB.data.push(savedMarker);
        resolve({ success: true, marker: savedMarker });
      }, 800);
    });
  },
  saveZone: async (zone: Zone) => {
      return new Promise<{ success: boolean; zone: Zone }>(resolve => {
        setTimeout(() => {
          mockDB.zones.push(zone);
          resolve({ success: true, zone });
        }, 500);
      });
  },
  load: async () => {
    return new Promise<{ markers: Marker[], zones: Zone[] }>(resolve => {
      setTimeout(() => {
        resolve({ markers: [...mockDB.data], zones: [...mockDB.zones] });
      }, 1200);
    });
  }
};

// ==========================================
// MOTOR 3D VANILLA (THREE.JS)
// ==========================================

const ThreeScene = ({ modelSource, markers, zones, onMeshClick, onLoaded, onError, isZoneEditMode, zoneSelectionMode }: any) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const faceMeshRef = useRef<THREE.Object3D | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  
  // Ref para polígonos
  const polygonPointsRef = useRef<THREE.Vector3[]>([]);
  const polygonGroupRef = useRef<THREE.Group | null>(null);
  const [polygonPointCount, setPolygonPointCount] = useState(0);

  const clearPolygon = useCallback(() => {
    polygonPointsRef.current = [];
    if (polygonGroupRef.current) {
        // Limpiar hijos
        while(polygonGroupRef.current.children.length > 0){ 
            const child = polygonGroupRef.current.children[0];
            polygonGroupRef.current.remove(child);
            // @ts-ignore
            if (child.geometry) child.geometry.dispose();
             // @ts-ignore
            if (child.material) child.material.dispose();
        }
    }
    setPolygonPointCount(0);
  }, []);

  const addPolygonPoint = useCallback((point: THREE.Vector3) => {
    polygonPointsRef.current.push(point);
    setPolygonPointCount(prev => prev + 1);
    
    // Dibujar punto
    if (!polygonGroupRef.current) {
        polygonGroupRef.current = new THREE.Group();
        // Asegurarse de que esté en la escena
        if(sceneRef.current) sceneRef.current.add(polygonGroupRef.current);
    } // Si ya existe, asumimos que está en la escena, si no, lo añadimos
    else if (sceneRef.current && !sceneRef.current.children.includes(polygonGroupRef.current)) {
        sceneRef.current.add(polygonGroupRef.current);
    }
    
    // Esfera visual
    // Reducido tamaño del marcador visual durante selección (de 0.15 a 0.05)
    // El usuario se quejó de que eran "demasiado grandes"
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 16, 16), // Visible - REDUCIDO
        new THREE.MeshBasicMaterial({ color: 0xeab308, depthTest: false, transparent: true }) // yellow-500
    );
    sphere.position.copy(point);
    // Render order para que se vea siempre encima
    sphere.renderOrder = 999;
    
    if (polygonGroupRef.current) {
        polygonGroupRef.current.add(sphere);
    }
    
    // Línea conectora
    const points = polygonPointsRef.current;
    if (points.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            points[points.length - 2],
            points[points.length - 1]
        ]);
        const line = new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({ color: 0xeab308, depthTest: false, transparent: true, linewidth: 2 })
        );
        line.renderOrder = 999;
        polygonGroupRef.current.add(line);
    }
  }, []);

  const finishPolygon = useCallback(() => {
      const points = polygonPointsRef.current;
      if (points.length < 1) return;
      
      // Proyección Simplificada: Bounding Box
      const box = new THREE.Box3().setFromPoints(points);
      
      // Calcular dimensiones y centro
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // La "normal" aproximada es el promedio de la dirección desde el origen al punto
      // Como no las guardamos, usamos la normal del vector Posición->Cámara o (0,1,0) genérico
      
      // FIX: El cálculo del radio estaba siendo demasiado agresivo (usando maxDim completo).
      // El "radius" en DecalGeometry se usa como [size.x, size.y, size.z].
      // Si usamos maxDim como "radius", estamos dibujando un cuadrado del tamaño de la dimensión máxima.
      // Pero si la zona es rectangular alargada, esto crea un cuadrado gigante.
      // Además, el usuario reporta que sale "completamente diferente".
      
      // Vamos a calcular el radio proyectado promedio para tratar de ajustar mejor.
      // Pero dado que nuestro sistema backend solo soporta (center, radius), 
      // estamos limitados a formas "cuadradas/circulares". 
      // La mejor aproximación es usar el promedio de las dimensiones X e Y (del plano cámara).
      
      const avgDim = (size.x + size.y) / 2;
      
      // Reducimos un poco el factor de escala (0.8) para que no se salga tanto de los puntos
      const radius = avgDim * 0.8; 
      
      if (onMeshClick) {
        onMeshClick({
            position: { x: center.x, y: center.y, z: center.z },
            rotation: [0, 0, 0],
            normal: { x: 0, y: 1, z: 0 },
            zone: "Zona Poligonal",
            radius: radius
        });
      }
      
      if (clearPolygon) clearPolygon();
  }, []); // Dependencias vacías para evitar re-creación constante, usamos refs dentro
  const [interactionMode, setInteractionMode] = useState<'rotate' | 'pan'>('rotate');
  
  // Estado para funcionalidad de dibujo de zonas
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{start: {x: number, y: number}, end: {x: number, y: number}} | null>(null);

  // Funciones de control de cámara manual
  const handleManualRotate = (direction: 'left' | 'right' | 'up' | 'down') => {
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

  // Ref para callbacks que permite acceder a las funciones más recientes dentro del closure de Three.js
  const callbacks = useRef({ onMeshClick, onLoaded, onError, zones, isZoneEditMode, zoneSelectionMode, addPolygonPoint, finishPolygon });
  
  // Actualizar refs de callbacks en cada render
  useEffect(() => {
    callbacks.current = { onMeshClick, onLoaded, onError, zones, isZoneEditMode, zoneSelectionMode, addPolygonPoint, finishPolygon };
    
    // Limpiar polígono si salimos del modo edición o cambiamos de herramienta
    if (!isZoneEditMode || zoneSelectionMode !== 'polygon') {
         // No limpiar automáticamente aquí, puede causar loop si no se maneja bien
         // Mejor dejar que el usuario limpie o limpie al cambiar de modo explícitamente
         // Pero para evitar estados inconsistentes:
         if (polygonPointsRef.current.length > 0) clearPolygon();
    }
  });

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
    
    // Variables locales para dibujo (además del estado React) para acceso síncrono en eventos
    let localIsDrawing = false;
    let drawingStartPos = { x: 0, y: 0 };

    const onPointerDown = (e: MouseEvent) => {
      if (callbacks.current.isZoneEditMode) {
          // Si estamos en modo edición de zona, iniciamos el dibujo
          if (controlsRef.current) controlsRef.current.enabled = false; // Desactivar rotación
          
          localIsDrawing = true;
          // Usar coordenadas relativas al contenedor para el dibujo visual
          const rect = renderer.domElement.getBoundingClientRect();
          const relX = e.clientX - rect.left;
          const relY = e.clientY - rect.top;

          drawingStartPos = { x: relX, y: relY };
          setIsDrawing(true);
          setSelectionBox({
              start: { x: relX, y: relY },
              end: { x: relX, y: relY }
          });
      }

      // Lógica estándar de click vs drag para rotación
      isDragging = false;
      startPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: MouseEvent) => {
      // 1. Lógica de Dibujo de Zona
      if (localIsDrawing && callbacks.current.isZoneEditMode) {
          const rect = renderer.domElement.getBoundingClientRect();
          const relX = e.clientX - rect.left;
          const relY = e.clientY - rect.top;

          setSelectionBox({
              start: drawingStartPos,
              end: { x: relX, y: relY }
          });
          return;
      }

      // 2. Lógica estándar de rotación
      if (Math.abs(e.clientX - startPos.x) > 2 || Math.abs(e.clientY - startPos.y) > 2) {
        isDragging = true;
      }
    };

    const onPointerUp = (e: MouseEvent) => {
        if (localIsDrawing && callbacks.current.isZoneEditMode) {
            // Finalizar dibujo
            localIsDrawing = false;
            setIsDrawing(false);
            if (controlsRef.current) controlsRef.current.enabled = true; // Reactivar controles

            // Calcular geometría de la selección
            const rect = renderer.domElement.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;
            
            // Coordenadas del cuadro de selección (YA SON RELATIVAS)
            const x1 = Math.min(drawingStartPos.x, relX);
            const x2 = Math.max(drawingStartPos.x, relX);
            const y1 = Math.min(drawingStartPos.y, relY);
            const y2 = Math.max(drawingStartPos.y, relY);
            
            const width = x2 - x1;
            const height = y2 - y1;

            // Si es un click muy pequeño, ignorar como dibujo y dejar pasar como click normal (si se desea)
            // Pero como hemos desactivado controles, mejor tratamos como "click puntual" si es muy pequeño
            if (width < 5 && height < 5) {
                setSelectionBox(null);
                // Permitir que el evento 'click' maneje esto si es necesario, pero aquí ya consumimos el evento
                // Podríamos llamar a onClick manualmente si quisiéramos seleccionar un punto
                // De momento, reseteamos.
                return;
            }

            setSelectionBox(null);

            // CALCULAR EL CENTRO Y RADIO EN 3D
            const centerX = x1 + width / 2;
            const centerY = y1 + height / 2;

            // Convertir centro 2D RELATIVO a coordenadas normalizadas (-1 a 1) para Raycaster
            mouse.x = (centerX / rect.width) * 2 - 1;
            mouse.y = -(centerY / rect.height) * 2 + 1;

            if (!cameraRef.current || !faceMeshRef.current) return;

            raycaster.setFromCamera(mouse, cameraRef.current);
            const intersects = raycaster.intersectObject(faceMeshRef.current, true);

            if (intersects.length > 0) {
                const intersect = intersects[0];
                const centerPoint = intersect.point;
                // Distancia a la cámara para el cálculo del radio proyectado
                const distance = cameraRef.current.position.distanceTo(centerPoint);
                const fov = THREE.MathUtils.degToRad(cameraRef.current.fov);

                // Radio aproximado en píxeles (usamos la dimensión más grande)
                // Antes dividíamos por 2, pero para abarcar visualmente la zona dibujada,
                // la esfera debería tener el diámetro completo de la selección
                const radiusPx = Math.max(width, height);
                
                // AJUSTE DE ESCALA DEL RADIO: Aumentar factor para que cubra mejor el área visual
                // 1.0 = conversión matemática estricta. 1.1 = un poco de holgura.
                const adjustmentFactor = 1.0; 

                // Fórmula de proyección inversa: (radiusPx / screenHeight) * (visibleHeightAtDistance)
                // visibleHeightAtDistance = 2 * distance * tan(fov / 2)
                const screenHeight = rect.height;
                const visibleHeight = 2 * distance * Math.tan(fov / 2);
                const projectedRadius = ((radiusPx / screenHeight) * visibleHeight) * adjustmentFactor;

                // Llamar al callback con la nueva zona
                callbacks.current.onMeshClick({
                    position: { x: centerPoint.x, y: centerPoint.y, z: centerPoint.z },
                    rotation: [0, 0, 0], // Irrelevante para zona esférica
                    normal: { x: 0, y: 1, z: 0 }, // Irrelevante
                    zone: "Nueva Zona", // Placeholder
                    radius: projectedRadius // Pasamos el radio calculado
                });
            }
        }
    };

    const onClick = (event: MouseEvent) => {
      // Si hubo arrastre de cámara, ignorar click
      if (isDragging || !faceMeshRef.current || !cameraRef.current) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Actualizar raycaster
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(faceMeshRef.current, true);

      // CASO ESPECIAL: MODO POLÍGONO (Agregar puntos)
      if (callbacks.current.isZoneEditMode && callbacks.current.zoneSelectionMode === 'polygon') {
          if (intersects.length > 0) {
              callbacks.current.addPolygonPoint(intersects[0].point);
          }
          // Ignorar el resto de la lógica (no queremos seleccionar zona ni dibujar rectángulo)
          return;
      }
      
      // Si estamos en modo edición ZONA RECTÁNGULO, el click puntual se ignora (se usa drag)
      if (callbacks.current.isZoneEditMode) return; 
      
      // Lógica estándar de click puntual (Marcadores Clínicos)
      
      if (intersects.length > 0) {
        const intersect = intersects[0];
        const point = intersect.point;
        
        // Calcular normal en coordenadas mundiales
        const n = intersect.face ? intersect.face.normal.clone() : new THREE.Vector3(0,1,0);
        // Usar la matriz del objeto interceptado (la malla específica), no del grupo contenedor
        const nTransform = new THREE.Matrix3().getNormalMatrix(intersect.object.matrixWorld);
        n.applyMatrix3(nTransform).normalize();

        const dummy = new THREE.Object3D();
        dummy.position.copy(point);
        dummy.lookAt(point.clone().add(n));

        callbacks.current.onMeshClick({
          position: { x: point.x, y: point.y, z: point.z },
          rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
          normal: { x: n.x, y: n.y, z: n.z },
          zone: getFacialZone(point, callbacks.current.zones),
          radius: 0.6 // Default para click puntual
        });
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp); // Agregar listener
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
        dom.removeEventListener('pointerup', onPointerUp);
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

      // Normalizar la escena completa, no solo la malla
      const model = gltf.scene;

      if (model) {
        // ===== ALGORITMO DE CENTRADO ABSOLUTO V3 (CONSOLIDADO) =====
        
        // 1. Resetear transformaciones previas del contenedor
        model.updateMatrixWorld(true);
        
        // 2. Calcular Bounding Box de TODO el modelo (incluyendo hijos)
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // 3. CENTRADO: Mover todo el grupo para que el centro visual esté en (0,0,0)
        // Usamos la posición del grupo contenedor
        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;

        // 4. CORRECCIÓN DE ROTACIÓN (Detectar Z-up)
        // Algunos modelos vienen con Z como eje vertical.
        // Si la profundidad (Z) es mucho mayor que la altura (Y), probablemente esté "acostado".
        // Sin embargo, para evitar falsos positivos, rotaremos basado en inputs del usuario si es necesario.
        // Por defecto, asumimos Y-up que es el estándar de WebGL.
        
        // Si el usuario reporta que no gira sobre el eje vertical, es probable que la malla interna tenga una rotación extraña.
        // Vamos a encapsular el modelo en un Grupo Pivot para tener control total.
        const pivotGroup = new THREE.Group();
        pivotGroup.add(model);
        
        // Asignar el pivotGroup como el objeto principal a manipular
        // Esto permite que OrbitControls rote alrededor del (0,0,0) donde está el pivot
        sceneRef.current?.add(pivotGroup);
        faceMeshRef.current = pivotGroup; // Usamos la referencia para limpieza
        
        // Encontrar la malla principal para asignarle material (recursivo)
        model.traverse((child: any) => {
             if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Material Clínico
                child.material = new THREE.MeshPhysicalMaterial({
                  color: 0xfae3db,
                  roughness: 0.45,
                  metalness: 0.05,
                  clearcoat: 0.15,
                  clearcoatRoughness: 0.3,
                  transmission: 0.05,
                  thickness: 1.5,
                  side: THREE.DoubleSide
                });
             }
        });

        // 5. ESCALADO
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 5;
        const scaleFactor = targetSize / (maxDim || 1);
        model.scale.setScalar(scaleFactor); // Escalamos el modelo interno, no el grupo

        // 6. ENFOQUE
        if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
        }

        callbacks.current.onLoaded();
      } else {

        callbacks.current.onError("El archivo no contiene una malla 3D válida.");
      }
    };

    const handleLoadError = (error: any) => {
      console.warn("Carga fallida:", error);
      // Evitar propagar error si es un buffer inicial vacío
      if (modelSource.type === 'buffer' && (!modelSource.data)) return;
      callbacks.current.onError("No se pudo cargar el modelo automáticamente por seguridad del entorno. Por favor, súbelo manualmente.");
    };

    try {
      if (modelSource.type === 'buffer') {
        // Aseguramos que sea un ArrayBuffer válido antes de parsear
        if (modelSource.data && (modelSource.data instanceof ArrayBuffer || typeof modelSource.data === 'string')) {
             loader.parse(modelSource.data, '', handleLoadedModel, handleLoadError);
        }
      } else if (modelSource.type === 'url') {
        // Ignorar si la URL está vacía para evitar error prematuro
        if (!modelSource.data) return;

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
        
        // Encontrar la malla objetivo real (ya que faceMesh puede ser un Grupo Pivote)
        let targetMesh: THREE.Mesh | null = null;
        if (faceMesh.type === 'Group' || faceMesh.type === 'Scene') {
            faceMesh.traverse((child: any) => {
                if (child.isMesh && !targetMesh) {
                    targetMesh = child;
                }
            });
        } else if ((faceMesh as any).isMesh) {
            targetMesh = faceMesh as THREE.Mesh;
        }

        if (!targetMesh) return;

        const euler = new THREE.Euler(marker.rotation[0], marker.rotation[1], marker.rotation[2]);
        // Usar el radio guardado en el marcador si existe, sino usar default 0.6
        // Para visualización, el tamaño del Decal es un Vector3. Asumimos una geometría cuadrada/elipsoide
        const scale = marker.radius ? marker.radius : 0.6; 
        
        // CORRECCIÓN DE PROFUNDIDAD (Z-FIGHTING Y DISTORSIÓN)
        // El problema es que el Decal es un CUBO proyectado. Si es muy profundo (Z grande), atraviesa la malla y distorsiona la proyección 
        // en zonas curvas como la nariz o mejillas.
        // Solución: Reducir drásticamente la dimensión Z (profundidad) del decal para que sea más como una "pegatina" superficial
        // y no un volumen profundo.
        const width = scale;
        const height = scale;
        const depth = scale * 0.25; // Reducimos la profundidad al 25% del ancho para evitar proyección atravesada
        
        const size = new THREE.Vector3(width, height, depth);
        
        // DecalGeometry requiere una malla con geometría válida
        const decalGeo = new DecalGeometry(targetMesh, pos, euler, size);
        
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

  return (
    <div className="relative w-full h-full">
        {/* Contenedor 3D: React nunca debe actualizar sus hijos para no borrar el Canvas */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />
        
        {/* Capa de UI Overlay: React gestiona esto libremente sin afectar al canvas */}
        {selectionBox && (
            <div 
                style={{
                    position: 'absolute',
                    left: Math.min(selectionBox.start.x, selectionBox.end.x),
                    top: Math.min(selectionBox.start.y, selectionBox.end.y),
                    width: Math.abs(selectionBox.end.x - selectionBox.start.x),
                    height: Math.abs(selectionBox.end.y - selectionBox.start.y),
                    border: '2px dashed #eab308', // yellow-500
                    background: 'rgba(234, 179, 8, 0.2)',
                    pointerEvents: 'none',
                    zIndex: 50
                }}
            />
        )}

        {/* UI Flotante para Modo Polígono - MOVIDO ABAJO PARA EVITAR SOLAPAMIENTO */}
        {isZoneEditMode && zoneSelectionMode === 'polygon' && (
            <div className="absolute top-[160px] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 border border-yellow-500/50 p-2 rounded-xl backdrop-blur-md shadow-xl z-50 pointer-events-auto">
                <span className="text-yellow-400 font-bold px-2 text-sm flex items-center gap-2">
                    <Maximize className="w-4 h-4" />
                    {polygonPointCount} Puntos
                </span>
                <div className="h-6 w-px bg-slate-700 mx-1" />
                <button 
                    onClick={clearPolygon}
                    disabled={polygonPointCount === 0}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                >
                    Limpiar
                </button>
                <button 
                    onClick={finishPolygon}
                    disabled={polygonPointCount < 3}
                    className="px-4 py-1.5 text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20"
                >
                    Finalizar Zona
                </button>
            </div>
        )}
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL DE LA APLICACIÓN
// ==========================================

export default function Clinical3D() {
  const navigate = useNavigate();
  const [selectedPathology, setSelectedPathology] = useState(PATHOLOGIES[0].id);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [pendingMarker, setPendingMarker] = useState<any>(null);
  
  // Nuevo Estado: Editor de Zonas
  const [isZoneEditMode, setIsZoneEditMode] = useState(false);
  const [zoneSelectionMode, setZoneSelectionMode] = useState<'rectangle' | 'polygon'>('rectangle');
  const [pendingZone, setPendingZone] = useState<any>(null);
  const [newZoneName, setNewZoneName] = useState("");
  
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
      setMarkers(data.markers);
      setZones(data.zones);
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
      // 1. Resetear estados inmediatamente para mostrar carga
      setModelError(false);
      setModelLoaded(false); 
      setNotification(null); // Limpiar notificaciones previas

      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          // 2. Establecer fuente del modelo
          const buffer = e.target.result;
          setModelSource({ type: 'buffer', data: buffer });
          showNotification('Procesando archivo...', 'info');
        }
      };
      
      reader.onerror = () => {
        setModelError(true);
        showNotification('Error al leer el archivo local.', 'error');
      };

      reader.readAsArrayBuffer(file);
    }
    // 3. Resetear input para permitir subir el mismo archivo si falla
    event.target.value = '';
  };

  const handleMeshClick = (interactionData: any) => {
    if (isZoneEditMode) {
        setPendingZone({
            position: interactionData.position,
            radius: interactionData.radius, // Guardar radio calculado si existe
        });
        setNewZoneName("");
    } else {
        setPendingMarker({
            ...interactionData,
            pathologyId: selectedPathology,
        });
    }
  };

  const handleSaveZone = async () => {
    if (!pendingZone || !newZoneName.trim()) return;
    setIsSaving(true);
    const newZone: Zone = {
        id: Date.now().toString(),
        name: newZoneName,
        center: pendingZone.position,
        radius: pendingZone.radius || 0.4 // Reducido de 4 a 0.4 para evitar zonas gigantes por defecto
    };
    
    await mockDB.saveZone(newZone);
    setZones(prev => [...prev, newZone]);
    setPendingZone(null);
    showNotification(`Zona "${newZoneName}" registrada correctamente`, 'success');
    setIsSaving(false);
  };

  const handleConfirmMarker = async (type: MarkerType) => {
    if (!pendingMarker) return;
    setIsSaving(true);
    
    // Si la marcación es ZONAL, intentamos recuperar el radio registrado de esa zona específica
    let markerToSave = { ...pendingMarker, type };
    
    if (type === 'Zonal') {
        const zoneName = pendingMarker.zone;
        // Buscar si existe una zona registrada con este nombre
        const registeredZone = zones.find(z => z.name === zoneName);
        
        if (registeredZone) {
            // Si encontramos la zona registrada, usamos su radio para la visualización del decal
            // Lo guardamos en el objeto marker para que al renderizar se use este tamaño
            markerToSave = {
                ...markerToSave,
                radius: registeredZone.radius, // Usar el radio registrado
                position: registeredZone.center // Opcional: Centrar exactamente en la zona registrada en lugar del click
            };
        } else {
             // Si no hay zona registrada (es una zona autodetectada genérica), usamos un radio default
             // Ya hemos bajado el default a 0.6 en la visualización, pero podemos ser explícitos aquí
             markerToSave = { ...markerToSave, radius: 0.6 };
        }
    }

    const response = await mockDB.save(markerToSave);
    
    if (response.success) {
      setMarkers(prev => [...prev, response.marker]);
      setPendingMarker(null);
      showNotification('Marcador clínico mapeado y guardado con éxito.', 'success');
    }
    setIsSaving(false);
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex overflow-hidden font-sans text-slate-100 relative">
      
      {/* Botón Volver */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <button 
          onClick={() => navigate('/admin')}
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-lg text-white text-sm font-medium border border-slate-700 transition-colors"
        >
          ← Volver al Panel
        </button>
        
        {/* Toggle para Modo Registro de Zonas */}
        <button 
          onClick={() => setIsZoneEditMode(!isZoneEditMode)}
          className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 ${
            isZoneEditMode 
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' 
              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title={isZoneEditMode ? "Salir de Registro" : "Registrar Zonas Anatómicas"}
        >
          <Database className="w-4 h-4" />
          {isZoneEditMode ? 'Finalizar Registro' : 'Configurar Zonas'}
        </button>
      </div>

        {/* Controles Visuales (Overlay en el lienzo 3D) */}
        {!modelError && modelLoaded && (
        <div className="absolute right-6 top-6 flex flex-col gap-2 z-20 pointer-events-auto">
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
                    }} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white" title="Mover Arriba">
                        <Move className="w-4 h-4 rotate-180" />
                    </button>
                    <div />
                    
                    <button onClick={() => handleManualRotate('left')} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white" title="Rotar Izquierda">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="flex items-center justify-center">
                        <Move className="w-4 h-4 text-slate-500" />
                    </div>
                    <button onClick={() => handleManualRotate('right')} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white" title="Rotar Derecha">
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
                    }} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white" title="Mover Abajo">
                        <Move className="w-4 h-4" />
                    </button>
                    <div />
                </div>

                <div className="h-px bg-slate-700 my-1" />

                <div className="flex justify-between gap-2">
                    <button onClick={() => handleZoom(false)} className="flex-1 p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white flex justify-center" title="Alejar">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleZoom(true)} className="flex-1 p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-colors text-white flex justify-center" title="Acercar">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>

                <button 
                  onClick={() => {
                        // Resetear vista
                        // @ts-ignore
                        const c = window.clinical3d_controls;
                        if(c) {
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

            <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-xl pointer-events-none">
                 <p className="text-xs text-slate-400 mb-2">
                    <strong className="text-white">Click Izquierdo:</strong> Rotar<br/>
                    <strong className="text-white">Click Derecho:</strong> Mover (Pan)<br/>
                    <strong className="text-white">Rueda:</strong> Zoom
                 </p>
            </div>
        </div>
        )}

      {/* ÁREA DEL LIENZO 3D */}
      <div className="flex-1 relative h-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        
        {/* Renderizador de Escena */}
        <div className="absolute inset-0 z-0">
          {!modelError && (
              <ThreeScene 
                modelSource={modelSource} 
                markers={markers}
                zones={zones} 
                isZoneEditMode={isZoneEditMode}
                zoneSelectionMode={zoneSelectionMode} // Pasar el modo de selección
                onMeshClick={handleMeshClick}
                onLoaded={() => {
                  console.log("Modelo cargado correctamente");
                  setModelLoaded(true);
                  setModelError(false);
                }}
                onError={(msg: string) => {
                  console.error("Error cargando modelo:", msg);
                  setModelError(true);
                  // Solo mostramos notificación si no es el error inicial forzado
                  if (msg !== "No se pudo cargar el modelo automáticamente por seguridad del entorno. Por favor, súbelo manualmente.") {
                      showNotification(msg, 'error');
                  }
                }}
              />
          )}
        </div>

        {/* MODO EDICIÓN ZONAS: UI de Control */}
        {isZoneEditMode && modelLoaded && (
             <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-50">
                <div className="bg-yellow-500/90 text-slate-900 px-6 py-2 rounded-full backdrop-blur-md shadow-lg font-bold border-2 border-yellow-400 animate-pulse text-sm">
                    MODO REGISTRO DE ZONAS
                </div>
                
                {/* Selector de Herramienta */}
                <div className="flex bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl">
                    <button
                        onClick={() => setZoneSelectionMode('rectangle')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                            zoneSelectionMode === 'rectangle' 
                                ? 'bg-yellow-500 text-slate-900 shadow-md' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <Scan className="w-4 h-4" />
                        Rectángulo
                    </button>
                    <button
                        onClick={() => setZoneSelectionMode('polygon')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                            zoneSelectionMode === 'polygon' 
                                ? 'bg-yellow-500 text-slate-900 shadow-md' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <MousePointer2 className="w-4 h-4" />
                        Puntos (Polígono)
                    </button>
                </div>
             </div>
        )}

        {/* MODAL CREAR ZONA */}
        {isZoneEditMode && pendingZone && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                <div className="bg-slate-900/90 border border-yellow-500/50 p-6 rounded-2xl w-[350px] shadow-2xl relative">
                    <button onClick={() => setPendingZone(null)} className="absolute top-2 right-2 text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                    
                    <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5" /> Registrar Nueva Zona
                    </h3>
                    
                    <div className="mb-4">
                        <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">Nombre de la Zona</label>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                            placeholder="Ej: Frente Central, Pómulo Izq..."
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveZone()}
                        />
                         <p className="text-xs text-slate-500 mt-2">
                            Se registrará el punto seleccionado como el centro de esta zona anatómica.
                         </p>
                    </div>

                    <button 
                        disabled={!newZoneName.trim() || isSaving}
                        onClick={handleSaveZone}
                        className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Zona'}
                    </button>
                </div>
            </div>
        )}

        {/* PANTALLA DE CARGA */}
        {isLoading && !modelError && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity duration-300">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-6" />
              <h2 className="text-xl font-light tracking-[0.2em] text-cyan-100">INICIALIZANDO MÓDULO 3D</h2>
              <p className="text-xs text-slate-500 mt-2 tracking-wide">Procesando geometría facial...</p>
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
