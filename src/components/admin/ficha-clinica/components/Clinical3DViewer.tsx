import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import {
  Loader2, AlertCircle, Upload,
  RotateCw, RotateCcw
} from 'lucide-react';
import type { ReferenceLine, LineType } from './ReferenceLinePanel';
export type { ReferenceLine, LineType };

// ==========================================
// TIPOS COMPARTIDOS
// ==========================================

export const PATHOLOGIES = [
  { id: 'botox', name: 'Toxina Botulínica', color: '#06b6d4' },
  { id: 'filler', name: 'Relleno Dérmico', color: '#8b5cf6' },
  { id: 'thread', name: 'Hilos Tensores', color: '#f59e0b' },
  { id: 'melasma', name: 'Melasma / Pigmentación', color: '#10b981' },
  { id: 'acnescar', name: 'Cicatrices de Acné', color: '#ef4444' },
];

export type MarkerType = 'Puntual' | 'Zonal';

export interface Zone {
  id: string;
  name: string;
  center: { x: number; y: number; z: number };
  radius: number;
  rotation?: number[];
  scale?: { x: number; y: number };
  points?: { x: number; y: number; z: number }[];
}

export interface Marker3D {
  id?: string;
  type: MarkerType;
  pathologyId: string;
  position: { x: number; y: number; z: number };
  rotation: number[];
  normal: { x: number; y: number; z: number };
  zone: string;
  radius?: number;
  scale?: { x: number; y: number };
  points?: { x: number; y: number; z: number }[];
}

export const getFacialZone = (point: THREE.Vector3, registeredZones: Zone[] = []) => {
  if (registeredZones.length > 0) {
    let closestZone = null;
    let minDist = Infinity;
    for (const zone of registeredZones) {
      const zoneCenter = new THREE.Vector3(zone.center.x, zone.center.y, zone.center.z);
      const dist = point.distanceTo(zoneCenter);
      if (dist <= zone.radius * 2.0 && dist < minDist) {
        minDist = dist;
        closestZone = zone;
      }
    }
    if (closestZone) return closestZone.name;
  }
  const { y } = point;
  if (y > 4) return "Frente";
  if (y > 1) return "Glabela y Cejas";
  if (y > -1) return "Ojeras y Región Orbital";
  if (y > -4) return "Nariz y Surco Nasogeniano";
  if (y > -7) return "Arco Cigomático y Mejillas";
  if (y > -10) return "Región Perioral y Labios";
  return "Mandíbula, Mentón y Cuello";
};

// ==========================================
// PROPS DEL COMPONENTE
// ==========================================

interface Clinical3DViewerProps {
  /** Marcadores a renderizar */
  markers: Marker3D[];
  /** Zonas registradas */
  zones?: Zone[];
  /** Patología activa para nuevas marcaciones */
  selectedPathology?: string;
  /** Callback cuando se hace click en la malla */
  onMarkerPlaced?: (data: any) => void;
  /** Altura CSS del contenedor (default: 400px) */
  height?: string;
  /** URL del modelo GLB (default: /models/clinical/male_head.glb) */
  modelUrl?: string;
  /** Modo solo lectura (sin clicks) */
  readOnly?: boolean;
  /** Saltar el diálogo interno de confirmación (el padre maneja su propio diálogo) */
  skipConfirmation?: boolean;
  // ── Líneas de referencia ─────────────────────────────────────────────────
  /** Líneas de referencia a renderizar sobre el modelo */
  referenceLines?: ReferenceLine[];
  /** Modo de dibujo de línea activo; si es null no se capturan clics para líneas */
  lineDrawingMode?: LineType | null;
  /** Callback al anclar un punto de superficie (para verticales/horizontales emite 1 punto; para two-points emite 'first' y 'second') */
  onLinePointAnchored?: (point: { x: number; y: number; z: number }, step: 'first' | 'second') => void;
}

// ==========================================
// MOTOR 3D (Three.js vanilla)
// ==========================================

const ThreeEngine: React.FC<{
  modelSource: { type: 'url' | 'buffer'; data: string | ArrayBuffer };
  markers: Marker3D[];
  zones: Zone[];
  onMeshClick: (data: any) => void;
  onLoaded: () => void;
  onError: (msg: string) => void;
  readOnly: boolean;
  // ── Líneas de referencia ──────────────────────────────────────────────
  referenceLines?: ReferenceLine[];
  lineDrawingMode?: LineType | null;
  onLinePointAnchored?: (point: { x: number; y: number; z: number }, step: 'first' | 'second') => void;
}> = ({ modelSource, markers, zones, onMeshClick, onLoaded, onError, readOnly, referenceLines = [], lineDrawingMode, onLinePointAnchored }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const faceMeshRef = useRef<THREE.Object3D | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const linesGroupRef = useRef<THREE.Group | null>(null);
  // Increments each time the model finishes loading so the markers effect re-runs
  const [modelVersion, setModelVersion] = useState(0);
  // Track two-point step inside engine for cursor feedback
  const twoPointStepRef = useRef<0 | 1>(0);

  const callbacks = useRef({ onMeshClick, onLoaded, onError, zones, readOnly, lineDrawingMode, onLinePointAnchored });
  useEffect(() => {
    callbacks.current = { onMeshClick, onLoaded, onError, zones, readOnly, lineDrawingMode, onLinePointAnchored };
  });

  // 1. Initialize scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#1e293b');

    const markersGroup = new THREE.Group();
    markersGroupRef.current = markersGroup;
    scene.add(markersGroup);

    const linesGroup = new THREE.Group();
    linesGroupRef.current = linesGroup;
    scene.add(linesGroup);

    const camera = new THREE.PerspectiveCamera(35, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 18);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.AmbientLight(0xf0f5ff, 0.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(15, 20, 15);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.9);
    fillLight.position.set(-15, 5, 10);
    scene.add(fillLight);

    // Raycasting
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
      const intersects = raycaster.intersectObject(faceMeshRef.current, true);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        const point = intersect.point;

        // ── Modo línea de referencia ─────────────────────────────────────
        const lineMode = callbacks.current.lineDrawingMode;
        if (lineMode) {
          const anchorPt = { x: point.x, y: point.y, z: point.z };
          if (lineMode === 'two-points') {
            const step = twoPointStepRef.current === 0 ? 'first' : 'second';
            callbacks.current.onLinePointAnchored?.(anchorPt, step);
            twoPointStepRef.current = twoPointStepRef.current === 0 ? 1 : 0;
          } else {
            callbacks.current.onLinePointAnchored?.(anchorPt, 'first');
          }
          return; // No procesar como marcación
        }

        // ── Modo marcación normal ────────────────────────────────────────
        if (callbacks.current.readOnly) return;
        const n = intersect.face ? intersect.face.normal.clone() : new THREE.Vector3(0, 1, 0);
        const nTransform = new THREE.Matrix3().getNormalMatrix(intersect.object.matrixWorld);
        n.applyMatrix3(nTransform).normalize();

        const dummy = new THREE.Object3D();
        dummy.position.copy(point);
        dummy.lookAt(point.clone().add(n));

        callbacks.current.onMeshClick({
          position: { x: point.x, y: point.y, z: point.z },
          rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
          normal: { x: n.x, y: n.y, z: n.z },
          zone: '',
          radius: 0.3,
        });
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

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
        try { mountRef.current.removeChild(rendererRef.current.domElement); } catch (_) {}
      }
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  // 2. Load model when source changes
  useEffect(() => {
    if (!sceneRef.current || !modelSource) return;

    if (faceMeshRef.current) {
      sceneRef.current.remove(faceMeshRef.current);
      faceMeshRef.current = null;
    }

    const loader = new GLTFLoader();

    const handleLoadedModel = (gltf: any) => {
      const model = gltf.scene;
      if (!model) {
        callbacks.current.onError("El archivo no contiene una malla 3D válida.");
        return;
      }

      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.x -= center.x;
      model.position.y -= center.y;
      model.position.z -= center.z;

      const pivotGroup = new THREE.Group();
      pivotGroup.add(model);
      sceneRef.current?.add(pivotGroup);
      faceMeshRef.current = pivotGroup;

      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0xfae3db,
            roughness: 0.45,
            metalness: 0.05,
            clearcoat: 0.15,
            clearcoatRoughness: 0.3,
            transmission: 0.05,
            thickness: 1.5,
            side: THREE.DoubleSide,
          });
        }
      });

      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 8 / (maxDim || 1);
      model.scale.setScalar(scaleFactor);

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }

      setModelVersion(v => v + 1);
      callbacks.current.onLoaded();
    };

    const handleLoadError = (_error: any) => {
      if (modelSource.type === 'buffer' && !modelSource.data) return;
      callbacks.current.onError("No se pudo cargar el modelo 3D.");
    };

    try {
      if (modelSource.type === 'buffer') {
        if (modelSource.data && (modelSource.data instanceof ArrayBuffer || typeof modelSource.data === 'string')) {
          loader.parse(modelSource.data, '', handleLoadedModel, handleLoadError);
        }
      } else if (modelSource.type === 'url') {
        if (!modelSource.data) return;
        loader.load(modelSource.data as string, handleLoadedModel, undefined, handleLoadError);
      }
    } catch (err) {
      handleLoadError(err);
    }
  }, [modelSource]);

  // 3. Render markers
  useEffect(() => {
    const group = markersGroupRef.current;
    const faceMesh = faceMeshRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      // @ts-ignore
      if (child.geometry) child.geometry.dispose();
      // @ts-ignore
      if (child.material) {
        // @ts-ignore
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        // @ts-ignore
        else child.material.dispose();
      }
    }

    markers.forEach((marker) => {
      const pathology = PATHOLOGIES.find(p => p.id === marker.pathologyId);
      const colorHex = pathology?.color || '#ffffff';
      const color = new THREE.Color(colorHex);
      const pos = new THREE.Vector3(marker.position.x, marker.position.y, marker.position.z);

      if (marker.type === 'Puntual') {
        const markerGroup = new THREE.Group();
        markerGroup.position.copy(pos);
        const coreGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        markerGroup.add(new THREE.Mesh(coreGeo, coreMat));

        const outerGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const outerMat = new THREE.MeshPhysicalMaterial({
          color, emissive: color, emissiveIntensity: 1.5,
          transparent: true, opacity: 0.8, roughness: 0, transmission: 0.9, thickness: 0.5,
        });
        markerGroup.add(new THREE.Mesh(outerGeo, outerMat));
        group.add(markerGroup);

      } else if (marker.type === 'Zonal' && faceMesh) {
        let targetMesh: THREE.Mesh | null = null;
        if (faceMesh.type === 'Group' || faceMesh.type === 'Scene') {
          faceMesh.traverse((child) => {
            if (child instanceof THREE.Mesh && !targetMesh) targetMesh = child;
          });
        } else if (faceMesh instanceof THREE.Mesh) {
          targetMesh = faceMesh;
        }
        if (!targetMesh) return;

        let width = marker.scale?.x || marker.radius || 0.3;
        let height = marker.scale?.y || marker.radius || 0.3;
        const euler = new THREE.Euler(marker.rotation[0], marker.rotation[1], marker.rotation[2]);
        const depth = Math.max(width, height) * 1.5;
        const size = new THREE.Vector3(width, height, depth);

        const decalGeo = new DecalGeometry(targetMesh, pos, euler, size);
        const decalMat = new THREE.MeshPhysicalMaterial({
          color, transparent: true, opacity: 0.6, roughness: 0.2, clearcoat: 1,
          polygonOffset: true, polygonOffsetFactor: -1,
        });
        const decalMesh = new THREE.Mesh(decalGeo, decalMat);
        group.add(decalMesh);
      }
    });
  }, [markers, modelVersion]);

  // 4. Renderizar líneas de referencia sobre la superficie del modelo
  useEffect(() => {
    const group = linesGroupRef.current;
    const faceMesh = faceMeshRef.current;
    if (!group || !faceMesh) return;

    // Limpiar líneas previas
    while (group.children.length > 0) {
      const child = group.children[0] as any;
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        else child.material.dispose();
      }
    }

    // Construir raycaster interno para muestreo de superficie
    const sweepRaycaster = new THREE.Raycaster();

    /**
     * Obtiene los puntos de intersección de la malla al barrer en una dirección.
     * origin se desplaza en pasos y se lanza rayo en -Z.
     */
    const sweepSurface = (
      axisFixed: 'x' | 'y',
      fixedValue: number,
      otherMin: number,
      otherMax: number,
      steps = 60
    ): THREE.Vector3[] => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const otherVal = otherMin + t * (otherMax - otherMin);
        const origin = axisFixed === 'x'
          ? new THREE.Vector3(fixedValue, otherVal, 50)
          : new THREE.Vector3(otherVal, fixedValue, 50);
        const dir = new THREE.Vector3(0, 0, -1);
        sweepRaycaster.set(origin, dir);
        const hits = sweepRaycaster.intersectObject(faceMesh, true);
        if (hits.length > 0) {
          const hit = hits[0];
          const pt = hit.point.clone();
          // Offset a lo largo de la normal de la superficie → funciona en lados curvos también
          if (hit.face) {
            const obj = hit.object as THREE.Mesh;
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(obj.matrixWorld);
            const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
            pt.addScaledVector(worldNormal, 0.1);
          } else {
            pt.z += 0.1;
          }
          points.push(pt);
        }
      }
      return points;
    };

    /**
     * Crea un label sprite en 3D para la línea.
     */
    const makeLabel = (text: string, position: THREE.Vector3, color: string): THREE.Sprite => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 48;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.roundRect(2, 2, canvas.width - 4, canvas.height - 4, 8);
      ctx.fill();
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(position);
      sprite.scale.set(2.5, 0.5, 1);
      return sprite;
    };

    /**
     * Crea un tubo 3D (Mesh con TubeGeometry) que sigue los puntos de superficie.
     * Al tener volumen real es visible desde cualquier ángulo, igual que las esferas
     * de los marcadores de inyección.
     */
    const makeSurfaceTube = (pts: THREE.Vector3[], color: THREE.Color): THREE.Mesh => {
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
      const tubeGeo = new THREE.TubeGeometry(curve, Math.max(pts.length * 2, 60), 0.07, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color,
        depthTest: false,
        depthWrite: false,
        // CLAVE: transparent:true lo mueve al transparent pass de Three.js,
        // que se renderiza DESPUÉS del face mesh (transmission:0.05).
        // Sin esto, el tubo (opaque pass) queda tapado por la cara.
        transparent: true,
        opacity: 1.0,
      });
      const mesh = new THREE.Mesh(tubeGeo, tubeMat);
      mesh.renderOrder = 999;
      return mesh;
    };

    /**
     * Sweep diagonal entre dos puntos sobre la superficie del mallado.
     * Evita que la línea quede "dentro" de la malla al cruzar superficies curvas.
     */
    const sweepDiagonal = (
      a: THREE.Vector3,
      b: THREE.Vector3,
      steps = 50
    ): THREE.Vector3[] => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = a.x + t * (b.x - a.x);
        const y = a.y + t * (b.y - a.y);
        const origin = new THREE.Vector3(x, y, 50);
        sweepRaycaster.set(origin, new THREE.Vector3(0, 0, -1));
        const hits = sweepRaycaster.intersectObject(faceMesh, true);
        if (hits.length > 0) {
          const hit = hits[0];
          const pt = hit.point.clone();
          if (hit.face) {
            const obj = hit.object as THREE.Mesh;
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(obj.matrixWorld);
            const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
            pt.addScaledVector(worldNormal, 0.1);
          } else {
            pt.z += 0.1;
          }
          points.push(pt);
        }
      }
      return points;
    };

    referenceLines.forEach(line => {
      if (!line.visible) return;

      const color = new THREE.Color(line.color);

      if (line.type === 'vertical') {
        const xVal = line.anchor.x + line.offset;
        const pts = sweepSurface('x', xVal, -12, 8, 50);
        if (pts.length < 2) return;
        group.add(makeSurfaceTube(pts, color));
        const labelPos = pts[pts.length - 1].clone();
        labelPos.z += 0.3;
        labelPos.y += 0.3;
        group.add(makeLabel(line.label, labelPos, line.color));

      } else if (line.type === 'horizontal') {
        const yVal = line.anchor.y + line.offset;
        const pts = sweepSurface('y', yVal, -5, 5, 50);
        if (pts.length < 2) return;
        group.add(makeSurfaceTube(pts, color));
        const labelPos = pts[pts.length - 1].clone();
        labelPos.z += 0.3;
        labelPos.x += 0.4;
        group.add(makeLabel(line.label, labelPos, line.color));

      } else if (line.type === 'two-points' && line.anchors && line.anchors.length === 2) {
        const a = new THREE.Vector3(line.anchors[0].x, line.anchors[0].y, line.anchors[0].z);
        const b = new THREE.Vector3(line.anchors[1].x, line.anchors[1].y, line.anchors[1].z);
        // Sweep sobre la superficie a lo largo de la diagonal (sigue la curvatura del mallado)
        const pts = sweepDiagonal(a, b, 40);
        if (pts.length >= 2) {
          group.add(makeSurfaceTube(pts, color));
        }
        // Label en el punto medio del sweep
        const midPts = pts.length >= 2 ? pts : [a, b];
        const midPos = midPts[Math.floor(midPts.length / 2)].clone();
        midPos.z += 0.3;
        group.add(makeLabel(line.label, midPos, line.color));

        // Esferas en los extremos (igual que los marcadores de inyección)
        const startPt = pts.length > 0 ? pts[0] : new THREE.Vector3(a.x, a.y, a.z + 0.1);
        const endPt = pts.length > 1 ? pts[pts.length - 1] : new THREE.Vector3(b.x, b.y, b.z + 0.1);
        [startPt, endPt].forEach(pt => {
          const sphereGeo = new THREE.SphereGeometry(0.1, 10, 10);
          const sphereMat = new THREE.MeshBasicMaterial({
            color,
            depthTest: false,
            depthWrite: false,
            transparent: true,
            opacity: 1.0,
          });
          const sphere = new THREE.Mesh(sphereGeo, sphereMat);
          sphere.position.copy(pt);
          sphere.renderOrder = 1000;
          group.add(sphere);
        });
      }
    });
  }, [referenceLines, modelVersion]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />;
};

// ==========================================
// COMPONENTE PÚBLICO: Clinical3DViewer
// ==========================================

export default function Clinical3DViewer({
  markers,
  zones = [],
  selectedPathology = 'botox',
  onMarkerPlaced,
  height = '400px',
  modelUrl = '/models/clinical/male_head.glb',
  readOnly = false,
  skipConfirmation = false,
  referenceLines = [],
  lineDrawingMode = null,
  onLinePointAnchored,
}: Clinical3DViewerProps) {
  const [modelSource, setModelSource] = useState<{ type: 'url' | 'buffer'; data: string | ArrayBuffer }>({
    type: 'url',
    data: modelUrl,
  });
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<any>(null);
  const [pendingZoneText, setPendingZoneText] = useState('');

  const handleMeshClick = (data: any) => {
    if (readOnly) return;
    if (skipConfirmation) {
      // Directly call onMarkerPlaced without internal dialog
      const marker: Marker3D = { ...data, pathologyId: selectedPathology, type: 'Puntual' as MarkerType, zone: '', id: Date.now().toString() };
      onMarkerPlaced?.(marker);
      return;
    }
    setPendingMarker({ ...data, pathologyId: selectedPathology });
    setPendingZoneText('');
  };

  const confirmMarker = (type: MarkerType) => {
    if (!pendingMarker) return;
    const marker: Marker3D = { ...pendingMarker, type, zone: pendingZoneText.trim() || 'Sin especificar', id: Date.now().toString() };
    onMarkerPlaced?.(marker);
    setPendingMarker(null);
    setPendingZoneText('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setModelError(false);
    setModelLoaded(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setModelSource({ type: 'buffer', data: e.target.result });
      }
    };
    reader.onerror = () => setModelError(true);
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleRotate = (direction: 'left' | 'right') => {
    // @ts-ignore
    const controls = window.clinical3d_controls_embed;
    if (!controls) return;
    const camera = controls.object;
    const r = camera.position.distanceTo(controls.target);
    let phi = Math.acos((camera.position.y - controls.target.y) / r);
    let theta = Math.atan2(camera.position.z - controls.target.z, camera.position.x - controls.target.x);
    theta += direction === 'left' ? 0.5 : -0.5;
    camera.position.set(
      r * Math.sin(phi) * Math.cos(theta) + controls.target.x,
      r * Math.cos(phi) + controls.target.y,
      r * Math.sin(phi) * Math.sin(theta) + controls.target.z
    );
    controls.update();
  };

  const isLoading = !modelLoaded && !modelError;

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        {!modelError && (
          <ThreeEngine
            modelSource={modelSource}
            markers={markers}
            zones={zones}
            readOnly={readOnly}
            onMeshClick={handleMeshClick}
            onLoaded={() => { setModelLoaded(true); setModelError(false); }}
            onError={() => setModelError(true)}
            referenceLines={referenceLines}
            lineDrawingMode={lineDrawingMode}
            onLinePointAnchored={onLinePointAnchored}
          />
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-800/90">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
          <span className="text-sm text-slate-300">Cargando modelo 3D...</span>
        </div>
      )}

      {/* Error / Upload fallback */}
      {modelError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-800/90 p-4">
          <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
          <p className="text-sm text-slate-300 mb-3 text-center">No se pudo cargar el modelo. Sube el archivo manualmente.</p>
          <label className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg cursor-pointer text-sm">
            <Upload className="w-4 h-4" />
            Subir .glb
            <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {/* Mini controls overlay */}
      {modelLoaded && !modelError && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <button onClick={() => handleRotate('left')} className="p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded text-white" title="Rotar izquierda">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleRotate('right')} className="p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded text-white" title="Rotar derecha">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending marker confirmation */}
      {pendingMarker && !readOnly && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-4 w-72 shadow-xl">
            <h4 className="font-semibold text-gray-800 mb-1 text-sm">Confirmar Marcación</h4>
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Zona (escribir):</label>
              <input
                type="text"
                className="w-full p-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#deb887] outline-none bg-gray-50"
                placeholder="Ej: Glabela, Frente, Labio superior..."
                value={pendingZoneText}
                onChange={e => setPendingZoneText(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => confirmMarker('Puntual')}
                className="p-2 rounded-lg border border-gray-200 hover:bg-cyan-50 hover:border-cyan-300 text-center text-xs font-medium"
              >
                <div className="w-4 h-4 mx-auto mb-1 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                Puntual
              </button>
              <button
                onClick={() => confirmMarker('Zonal')}
                className="p-2 rounded-lg border border-gray-200 hover:bg-violet-50 hover:border-violet-300 text-center text-xs font-medium"
              >
                <div className="w-4 h-4 mx-auto mb-1 rounded-full bg-gradient-to-br from-violet-300 to-violet-500" />
                Zonal
              </button>
            </div>
            <button onClick={() => setPendingMarker(null)} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
