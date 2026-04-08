import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, Plus, Save, Trash2, Printer,
  ChevronDown, ChevronUp, Box, Calendar,
  FlaskConical, Crosshair, Gauge, X, Check
} from 'lucide-react';
import injectablesCatalog from '../../data/injectables.json';
import Clinical3DViewer, { Marker3D } from '../Clinical3DViewer';

// ==========================================
// TYPES
// ==========================================

interface Injectable {
  id?: number;
  record_id?: number;
  treatment_id?: number;
  date: string;
  product_type: 'toxina' | 'relleno';
  product_name: string;
  brand: string;
  lot_number: string;
  expiration_date: string;
  volume_used: number | string;
  units_used: number | string;
  areas_treated: any;
  technique: string;
  injection_plane: string;
  needle_type: string;
  mapping_data: any;
  notes: string;
}

interface InjectionPoint extends Marker3D {
  tercio: 'superior' | 'medio' | 'inferior' | '';
  units: number;
  label: string;
}

interface InjectablesTabProps {
  recordId: number;
  injectables: Injectable[];
  patientName?: string;
  onSave: () => void;
}

// ==========================================
// HELPERS — catalog lookups
// ==========================================

const getCatalogItems = (category: string): string[] => {
  return injectablesCatalog
    .filter((item: any) => item.categoria === category && item.activo === 1)
    .map((item: any) => item.elemento);
};

const toxinaBrands = getCatalogItems('marca_toxina');
const rellenoBrands = getCatalogItems('marca_relleno');
const techniques = getCatalogItems('tecnica_inyectable');
const needles = getCatalogItems('aguja_inyectable');
const planesInyeccion = getCatalogItems('planos_inyeccion');
const zonasSuperior = getCatalogItems('tercio_superior');
const zonasMedia = getCatalogItems('tercio_medio');
const zonasInferior = getCatalogItems('tercio_inferior');

const TERCIO_ZONES: Record<string, string[]> = {
  superior: zonasSuperior,
  medio: zonasMedia,
  inferior: zonasInferior,
};

const TERCIO_COLORS: Record<string, { bg: string; border: string; text: string; badge: string; header: string }> = {
  superior: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800', header: 'bg-cyan-100 border-cyan-300' },
  medio: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800', header: 'bg-violet-100 border-violet-300' },
  inferior: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', header: 'bg-amber-100 border-amber-300' },
};

const TERCIO_LABELS: Record<string, string> = {
  superior: 'Tercio Superior',
  medio: 'Tercio Medio',
  inferior: 'Tercio Inferior',
};

const EMPTY_INJECTABLE: Injectable = {
  date: new Date().toISOString().split('T')[0],
  product_type: 'toxina',
  product_name: '',
  brand: '',
  lot_number: '',
  expiration_date: '',
  volume_used: '',
  units_used: '',
  areas_treated: [],
  technique: '',
  injection_plane: '',
  needle_type: '',
  mapping_data: null,
  notes: '',
};

// ==========================================
// COMPONENT
// ==========================================

export default function InjectablesTab({ recordId, injectables: initialInjectables, patientName, onSave }: InjectablesTabProps) {
  const [injectables, setInjectables] = useState<Injectable[]>([]);
  const [current, setCurrent] = useState<Injectable>({ ...EMPTY_INJECTABLE });
  const [saving, setSaving] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [markers3D, setMarkers3D] = useState<Marker3D[]>([]);
  const [injectionPoints, setInjectionPoints] = useState<InjectionPoint[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [pendingPoint, setPendingPoint] = useState<Marker3D | null>(null);
  const [dialogStep, setDialogStep] = useState<0 | 1 | 2 | 3>(0);
  const [dialogTercio, setDialogTercio] = useState<'superior' | 'medio' | 'inferior' | ''>('');
  const [dialogZone, setDialogZone] = useState('');
  const [dialogUnits, setDialogUnits] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');

  // Sync from parent props
  useEffect(() => {
    const sorted = [...initialInjectables].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setInjectables(sorted);
  }, [initialInjectables]);

  // Load mapping data when selecting an existing injectable
  useEffect(() => {
    if (current.mapping_data) {
      try {
        const parsed = typeof current.mapping_data === 'string'
          ? JSON.parse(current.mapping_data)
          : current.mapping_data;
        if (Array.isArray(parsed)) {
          const points: InjectionPoint[] = parsed.map((item: any) => ({
            ...item,
            tercio: item.tercio || '',
            units: item.units || 0,
            label: item.label || item.zone || '',
          }));
          setInjectionPoints(points);
          setMarkers3D(parsed);
          if (points.length > 0) setShow3D(true);
        }
      } catch {
        setInjectionPoints([]);
        setMarkers3D([]);
      }
    } else {
      setInjectionPoints([]);
      setMarkers3D([]);
    }
  }, [current.id]);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // Computed values
  const totalVial = Number(current.product_type === 'toxina' ? current.units_used : current.volume_used) || 0;
  const totalUsed = injectionPoints.reduce((sum, p) => sum + p.units, 0);
  const remaining = totalVial - totalUsed;
  const unitLabel = current.product_type === 'toxina' ? 'UI' : 'ml';

  // Validation: require product name + units before 3D marking
  const hasUnits = current.product_type === 'toxina'
    ? Number(current.units_used) > 0
    : Number(current.volume_used) > 0;
  const canMark = current.product_name.trim() !== '' && hasUnits;

  // Group points by tercio
  const pointsByTercio = injectionPoints.reduce((acc, p) => {
    const key = p.tercio || 'sin_tercio';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, InjectionPoint[]>);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleSave = async () => {
    if (!current.product_name.trim()) {
      setMessage({ type: 'error', text: 'El nombre del producto es obligatorio' });
      return;
    }
    setSaving(true);
    try {
      const action = current.id ? 'updateInjectable' : 'addInjectable';
      const derivedAreas = [...new Set(injectionPoints.map(p => p.label).filter(Boolean))];
      const payload = {
        ...current,
        record_id: recordId,
        treatment_id: current.treatment_id || null,
        mapping_data: injectionPoints.length > 0 ? injectionPoints : null,
        areas_treated: derivedAreas.length > 0 ? derivedAreas : null,
      };

      const res = await fetch(`/api/records?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: current.id ? 'Inyectable actualizado' : 'Inyectable registrado correctamente' });
        onSave();
        if (!current.id) handleNew();
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving injectable:', error);
      setMessage({ type: 'error', text: 'Error al guardar el inyectable' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!current.id || !confirm('¿Eliminar este registro de inyectable?')) return;
    try {
      const res = await fetch(`/api/records?action=deleteInjectable&id=${current.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Inyectable eliminado' });
        onSave();
        handleNew();
      }
    } catch (error) {
      console.error('Error deleting injectable:', error);
      setMessage({ type: 'error', text: 'Error al eliminar' });
    }
  };

  const handleNew = () => {
    setCurrent({ ...EMPTY_INJECTABLE });
    setMarkers3D([]);
    setInjectionPoints([]);
  };

  const handleSelect = (inj: Injectable) => {
    setCurrent({ ...inj });
  };

  // 3D click → validate then open dialog
  const handleMarkerPlaced = (marker: Marker3D) => {
    if (!canMark) {
      setMessage({ type: 'error', text: `Complete el nombre del producto y las ${unitLabel} antes de marcar puntos` });
      return;
    }
    setPendingPoint(marker);
    setDialogStep(1);
    setDialogTercio('');
    setDialogZone('');
    setDialogUnits('');
    setZoneFilter('');
  };

  const handleDialogConfirm = () => {
    if (!pendingPoint || !dialogTercio || !dialogZone || !dialogUnits) return;
    const newPoint: InjectionPoint = {
      ...pendingPoint,
      zone: dialogZone,
      tercio: dialogTercio,
      units: Number(dialogUnits) || 0,
      label: dialogZone,
    };
    setInjectionPoints(prev => [...prev, newPoint]);
    setMarkers3D(prev => [...prev, { ...pendingPoint, zone: dialogZone }]);
    setPendingPoint(null);
    setDialogStep(0);
  };

  const handleDialogCancel = () => {
    setPendingPoint(null);
    setDialogStep(0);
  };

  const handleRemovePoint = (index: number) => {
    setInjectionPoints(prev => prev.filter((_, i) => i !== index));
    setMarkers3D(prev => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // PRINT
  // ==========================================

  const handlePrint = () => {
    if (!current.product_name) {
      setMessage({ type: 'error', text: 'Seleccione o registre un inyectable primero' });
      return;
    }

    // Try to capture the 3D canvas as image
    let canvasImage = '';
    if (show3D && viewerRef.current) {
      const canvas = viewerRef.current.querySelector('canvas');
      if (canvas) {
        try { canvasImage = canvas.toDataURL('image/png'); } catch { /* CORS */ }
      }
    }

    // Build tercio breakdown for print
    const tercioCSS: Record<string, { bg: string; border: string; text: string }> = {
      superior: { bg: '#e0f7fa', border: '#00bcd4', text: '#006064' },
      medio: { bg: '#ede7f6', border: '#7c4dff', text: '#4527a0' },
      inferior: { bg: '#fff8e1', border: '#ffc107', text: '#e65100' },
    };
    const tercioNames: Record<string, string> = { superior: 'Tercio Superior', medio: 'Tercio Medio', inferior: 'Tercio Inferior' };
    let tercioBreakdownHtml = '';
    for (const t of ['superior', 'medio', 'inferior'] as const) {
      const pts = pointsByTercio[t];
      if (!pts || pts.length === 0) continue;
      const totalT = pts.reduce((s, p) => s + p.units, 0);
      const css = tercioCSS[t];
      tercioBreakdownHtml += `<div style="margin-bottom:12px;"><div style="background:${css.bg};border:1px solid ${css.border};border-radius:6px;padding:8px 12px;margin-bottom:4px;"><strong style="color:${css.text};font-size:12px;">${tercioNames[t]}</strong><span style="float:right;font-size:11px;color:${css.text};">${pts.length} punto(s) · ${totalT} ${unitLabel}</span></div><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#faf6f0;"><th style="font-size:10px;text-transform:uppercase;color:#b8944d;padding:4px 8px;text-align:left;border-bottom:1px solid #e8dcc8;">#</th><th style="font-size:10px;text-transform:uppercase;color:#b8944d;padding:4px 8px;text-align:left;border-bottom:1px solid #e8dcc8;">Zona</th><th style="font-size:10px;text-transform:uppercase;color:#b8944d;padding:4px 8px;text-align:right;border-bottom:1px solid #e8dcc8;">${unitLabel}</th><th style="font-size:10px;text-transform:uppercase;color:#b8944d;padding:4px 8px;text-align:right;border-bottom:1px solid #e8dcc8;">%</th></tr></thead><tbody>${pts.map((p, i) => `<tr><td style="font-size:11px;padding:4px 8px;border-bottom:1px solid #f0f0f0;">${i + 1}</td><td style="font-size:11px;padding:4px 8px;border-bottom:1px solid #f0f0f0;">${p.label || '—'}</td><td style="font-size:11px;padding:4px 8px;text-align:right;border-bottom:1px solid #f0f0f0;">${p.units}</td><td style="font-size:11px;padding:4px 8px;text-align:right;border-bottom:1px solid #f0f0f0;">${totalUsed > 0 ? Math.round((p.units / totalUsed) * 100) : 0}%</td></tr>`).join('')}</tbody></table></div>`;
    }

    // Zone summary
    const zoneMap = new Map<string, { units: number; count: number }>();
    injectionPoints.forEach(p => {
      const existing = zoneMap.get(p.label) || { units: 0, count: 0 };
      zoneMap.set(p.label, { units: existing.units + p.units, count: existing.count + 1 });
    });
    let zoneSummaryHtml = '';
    if (zoneMap.size > 0) {
      zoneSummaryHtml = `<div style="margin-top:12px;"><div style="font-size:12px;font-weight:700;color:#b8944d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;border-bottom:1px solid #f0e6d6;padding-bottom:4px;">Resumen por Zona</div><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#faf6f0;"><th style="font-size:10px;text-transform:uppercase;color:#b8944d;padding:4px 8px;text-align:left;border-bottom:1px solid #e8dcc8;">Zona</th><th style="font-size:10px;text-transform:uppercase;color:#b8944d;padding:4px 8px;text-align:right;border-bottom:1px solid #e8dcc8;">Puntos</th><th style="font-size:10px;text-transform:uppercase;color:#b8944d;padding:4px 8px;text-align:right;border-bottom:1px solid #e8dcc8;">Total ${unitLabel}</th></tr></thead><tbody>${Array.from(zoneMap.entries()).map(([zone, data]) => `<tr><td style="font-size:11px;padding:4px 8px;border-bottom:1px solid #f0f0f0;">${zone}</td><td style="font-size:11px;padding:4px 8px;text-align:right;border-bottom:1px solid #f0f0f0;">${data.count}</td><td style="font-size:11px;padding:4px 8px;text-align:right;border-bottom:1px solid #f0f0f0;">${data.units}</td></tr>`).join('')}</tbody></table></div>`;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ficha de Inyectable — BIOSKIN</title>
  <style>
    @page { margin: 1.5cm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.5; padding: 30px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #deb887; padding-bottom: 16px; margin-bottom: 24px; }
    .header-left h1 { font-size: 22px; color: #deb887; font-weight: 700; letter-spacing: 1px; }
    .header-left p { font-size: 11px; color: #999; margin-top: 2px; }
    .header-right { text-align: right; font-size: 12px; color: #666; }
    .patient-bar { background: #faf6f0; border: 1px solid #e8dcc8; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .patient-bar span { font-size: 13px; }
    .patient-bar strong { color: #b8944d; }
    .section { margin-bottom: 18px; }
    .section-title { font-size: 13px; font-weight: 700; color: #deb887; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #f0e6d6; padding-bottom: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 16px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
    .field { margin-bottom: 6px; }
    .field .label { font-size: 10px; text-transform: uppercase; color: #999; letter-spacing: 0.3px; }
    .field .value { font-size: 13px; font-weight: 500; color: #333; padding: 4px 0; }
    .type-badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .type-toxina { background: #e0f2fe; color: #0369a1; }
    .type-relleno { background: #f3e8ff; color: #7c3aed; }
    .zones-container { display: flex; flex-wrap: wrap; gap: 4px; }
    .zone-tag { display: inline-block; padding: 2px 8px; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .empty { color: #ccc; font-style: italic; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    table th { background: #faf6f0; font-size: 11px; text-transform: uppercase; color: #b8944d; padding: 6px 8px; text-align: left; border-bottom: 2px solid #e8dcc8; }
    table td { font-size: 12px; padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
    .notes-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; font-size: 12px; white-space: pre-wrap; min-height: 30px; }
    .summary-bar { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .summary-card { background: #faf6f0; border: 1px solid #e8dcc8; border-radius: 8px; padding: 10px 14px; text-align: center; }
    .summary-card .sc-label { font-size: 10px; text-transform: uppercase; color: #999; letter-spacing: 0.3px; }
    .summary-card .sc-value { font-size: 18px; font-weight: 700; color: #333; margin-top: 2px; }
    .summary-card.danger .sc-value { color: #dc2626; }
    .mapping-img { max-width: 320px; margin: 8px auto; display: block; border-radius: 8px; border: 1px solid #e5e7eb; }
    .signature { margin-top: 50px; display: flex; justify-content: space-between; }
    .signature-block { text-align: center; width: 40%; }
    .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 6px; font-size: 11px; color: #666; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #bbb; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>BIOSKIN</h1>
      <p>Centro de Medicina Estética</p>
    </div>
    <div class="header-right">
      <div>Ficha de Procedimiento Inyectable</div>
      <div style="font-size:11px; color:#999;">Fecha de impresión: ${new Date().toLocaleDateString('es-EC')}</div>
    </div>
  </div>

  <div class="patient-bar">
    <span><strong>Paciente:</strong> ${patientName || '—'}</span>
    <span><strong>Fecha del procedimiento:</strong> ${current.date ? new Date(current.date + 'T12:00:00').toLocaleDateString('es-EC') : '—'}</span>
  </div>

  <div class="section">
    <div class="section-title">Información del Producto</div>
    <div class="grid">
      <div class="field">
        <div class="label">Tipo</div>
        <div class="value"><span class="type-badge ${current.product_type === 'toxina' ? 'type-toxina' : 'type-relleno'}">${current.product_type === 'toxina' ? 'Toxina Botulínica' : 'Relleno (Ácido Hialurónico)'}</span></div>
      </div>
      <div class="field">
        <div class="label">Producto</div>
        <div class="value">${current.product_name || '—'}</div>
      </div>
      <div class="field">
        <div class="label">Marca</div>
        <div class="value">${current.brand || '—'}</div>
      </div>
    </div>
    <div class="grid">
      <div class="field">
        <div class="label">Lote</div>
        <div class="value">${current.lot_number || '—'}</div>
      </div>
      <div class="field">
        <div class="label">Vencimiento</div>
        <div class="value">${current.expiration_date ? new Date(current.expiration_date + 'T12:00:00').toLocaleDateString('es-EC') : '—'}</div>
      </div>
      <div class="field">
        <div class="label">${current.product_type === 'toxina' ? 'Unidades (UI)' : 'Volumen (ml)'}</div>
        <div class="value">${current.product_type === 'toxina' ? (current.units_used || '—') : (current.volume_used || '—')}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Técnica de Aplicación</div>
    <div class="grid">
      <div class="field">
        <div class="label">Técnica</div>
        <div class="value">${current.technique || '—'}</div>
      </div>
      <div class="field">
        <div class="label">Plano de Inyección</div>
        <div class="value">${current.injection_plane || '—'}</div>
      </div>
      <div class="field">
        <div class="label">Aguja / Cánula</div>
        <div class="value">${current.needle_type || '—'}</div>
      </div>
    </div>
  </div>

  ${injectionPoints.length > 0 ? `
  <div class="section">
    <div class="section-title">Distribución del Vial</div>
    <div class="summary-bar">
      <div class="summary-card"><div class="sc-label">Total Vial</div><div class="sc-value">${totalVial} ${unitLabel}</div></div>
      <div class="summary-card"><div class="sc-label">Utilizadas</div><div class="sc-value">${totalUsed} ${unitLabel}</div></div>
      <div class="summary-card ${remaining < 0 ? 'danger' : ''}"><div class="sc-label">Restantes</div><div class="sc-value">${remaining} ${unitLabel}</div></div>
      <div class="summary-card"><div class="sc-label">Puntos</div><div class="sc-value">${injectionPoints.length}</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Desglose por Tercio</div>
    ${tercioBreakdownHtml}
    ${zoneSummaryHtml}
  </div>` : ''}

  ${canvasImage ? `
  <div class="section">
    <div class="section-title">Mapeo Facial 3D</div>
    <img src="${canvasImage}" alt="Mapeo facial" class="mapping-img" />
  </div>` : ''}

  <div class="section">
    <div class="section-title">Observaciones Clínicas</div>
    <div class="notes-box">${current.notes || 'Sin observaciones'}</div>
  </div>

  <div class="signature">
    <div class="signature-block">
      <div class="signature-line">Firma del Profesional</div>
    </div>
    <div class="signature-block">
      <div class="signature-line">Firma del Paciente</div>
    </div>
  </div>

  <div class="footer">
    BIOSKIN — Centro de Medicina Estética · Documento generado el ${new Date().toLocaleString('es-EC')}
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const brands = current.product_type === 'toxina' ? toxinaBrands : rellenoBrands;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
              </div>
            ) : (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
              </div>
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-violet-100 to-cyan-50 rounded-xl shadow-sm">
            <Droplets className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Registro de Inyectables</h2>
            <p className="text-xs text-gray-500">Toxina botulínica, ácido hialurónico y mapeo facial 3D</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg border border-gray-200 transition-all"
            title="Imprimir ficha"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all"
            title="Nuevo inyectable"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-gradient-to-r from-violet-500 to-violet-600 rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
            title="Guardar"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar'}</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={!current.id}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-100 disabled:opacity-30 transition-all"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Session History Chips */}
      {injectables.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sesiones registradas ({injectables.length})</p>
          <div className="flex flex-wrap gap-2">
            {injectables.map((inj, idx) => {
              const isActive = current.id === inj.id;
              const isToxina = inj.product_type === 'toxina';
              return (
                <motion.button
                  key={inj.id || idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(inj)}
                  className={`group relative px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    isActive
                      ? isToxina
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-800 shadow-sm ring-2 ring-cyan-200'
                        : 'bg-violet-50 border-violet-300 text-violet-800 shadow-sm ring-2 ring-violet-200'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isToxina ? 'bg-cyan-400' : 'bg-violet-400'}`} />
                    <span className="font-semibold">{inj.product_name || 'Sin nombre'}</span>
                    <span className="text-[10px] opacity-60">
                      {inj.date ? new Date(inj.date + 'T12:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: '2-digit' }) : ''}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Type Toggle - Full Width Header */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-50/30 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de producto</span>
            <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => setCurrent({ ...current, product_type: 'toxina', brand: '' })}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  current.product_type === 'toxina'
                    ? 'bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                Toxina Botulínica
              </button>
              <button
                onClick={() => setCurrent({ ...current, product_type: 'relleno', brand: '' })}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  current.product_type === 'relleno'
                    ? 'bg-white text-violet-700 shadow-sm ring-1 ring-violet-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Droplets className="w-4 h-4" />
                Relleno (HA)
              </button>
            </div>
            {current.id && (
              <span className="ml-auto text-xs text-gray-400">
                ID: {current.id}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Row 1: Date + Brand + Product Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Fecha
              </label>
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-gray-50/50 transition-all"
                value={current.date}
                onChange={e => setCurrent({ ...current, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Marca / Producto</label>
              <input
                type="text"
                list="inj-tab-brands"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-gray-50/50 transition-all"
                value={current.brand}
                onChange={e => setCurrent({ ...current, brand: e.target.value })}
                placeholder={current.product_type === 'toxina' ? 'Ej: BOTOX® 100UI' : 'Ej: Juvederm Ultra'}
              />
              <datalist id="inj-tab-brands">
                {brands.map((b, i) => <option key={i} value={b} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nombre del Producto *</label>
              <input
                type="text"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-gray-50/50 transition-all"
                value={current.product_name}
                onChange={e => setCurrent({ ...current, product_name: e.target.value })}
                placeholder="Nombre comercial"
              />
            </div>
          </div>

          {/* Row 2: Lot + Expiration + Units/Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Lote</label>
              <input
                type="text"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-gray-50/50 transition-all"
                value={current.lot_number}
                onChange={e => setCurrent({ ...current, lot_number: e.target.value })}
                placeholder="Nro. de lote"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Vencimiento</label>
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-gray-50/50 transition-all"
                value={current.expiration_date}
                onChange={e => setCurrent({ ...current, expiration_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <Gauge className="w-3.5 h-3.5 text-gray-400" />
                {current.product_type === 'toxina' ? 'Unidades (UI)' : 'Volumen (ml)'}
              </label>
              {current.product_type === 'toxina' ? (
                <input
                  type="number"
                  step="0.5"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-gray-50/50 transition-all"
                  value={current.units_used}
                  onChange={e => setCurrent({ ...current, units_used: e.target.value })}
                  placeholder="Ej: 20"
                />
              ) : (
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-gray-50/50 transition-all"
                  value={current.volume_used}
                  onChange={e => setCurrent({ ...current, volume_used: e.target.value })}
                  placeholder="Ej: 1.0"
                />
              )}
            </div>
          </div>

          {/* Row 3: Technique + Plane + Needle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <Crosshair className="w-3.5 h-3.5 text-gray-400" />
                Técnica
              </label>
              <input
                type="text"
                list="inj-tab-techniques"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-gray-50/50 transition-all"
                value={current.technique}
                onChange={e => setCurrent({ ...current, technique: e.target.value })}
                placeholder="Técnica de inyección"
              />
              <datalist id="inj-tab-techniques">
                {techniques.map((t, i) => <option key={i} value={t} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Plano de Inyección</label>
              <input
                type="text"
                list="inj-tab-planes"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-gray-50/50 transition-all"
                value={current.injection_plane}
                onChange={e => setCurrent({ ...current, injection_plane: e.target.value })}
                placeholder="Plano de inyección"
              />
              <datalist id="inj-tab-planes">
                {planesInyeccion.map((p, i) => <option key={i} value={p} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Aguja / Cánula</label>
              <input
                type="text"
                list="inj-tab-needles"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-gray-50/50 transition-all"
                value={current.needle_type}
                onChange={e => setCurrent({ ...current, needle_type: e.target.value })}
                placeholder="Tipo de aguja"
              />
              <datalist id="inj-tab-needles">
                {needles.map((n, i) => <option key={i} value={n} />)}
              </datalist>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Observaciones Clínicas</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none resize-none bg-gray-50/50 transition-all"
              value={current.notes}
              onChange={e => setCurrent({ ...current, notes: e.target.value })}
              placeholder="Notas clínicas, reacciones adversas, seguimiento..."
            />
          </div>
        </div>
      </div>

      {/* Vial Summary Bar */}
      {injectionPoints.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total Vial</p>
            <p className="text-lg font-bold text-gray-800">{totalVial} <span className="text-xs font-normal text-gray-400">{unitLabel}</span></p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Utilizadas</p>
            <p className="text-lg font-bold text-violet-600">{totalUsed} <span className="text-xs font-normal text-gray-400">{unitLabel}</span></p>
          </div>
          <div className={`rounded-xl p-3 text-center border shadow-sm ${remaining < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Restantes</p>
            <p className={`text-lg font-bold ${remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{remaining} <span className="text-xs font-normal text-gray-400">{unitLabel}</span></p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Puntos</p>
            <p className="text-lg font-bold text-gray-800">{injectionPoints.length}</p>
          </div>
        </div>
      )}

      {/* 3D Mapping Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => {
            if (!canMark && !show3D) {
              setMessage({ type: 'error', text: `Complete el nombre del producto y las ${unitLabel} antes de abrir el mapeo 3D` });
              return;
            }
            setShow3D(!show3D);
          }}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${show3D ? 'bg-violet-100' : 'bg-gray-100'}`}>
              <Box className={`w-4 h-4 transition-colors ${show3D ? 'text-violet-600' : 'text-gray-500'}`} />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-gray-800">Mapeo Facial 3D</span>
              <p className="text-xs text-gray-500">Haz clic en el rostro para registrar puntos de inyección</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {injectionPoints.length > 0 && (
              <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {injectionPoints.length} punto{injectionPoints.length !== 1 ? 's' : ''}
              </span>
            )}
            {show3D ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {show3D && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="border-t border-gray-100"
            >
              <div ref={viewerRef} className="p-4">
                {/* Two-column layout: 3D viewer left, breakdown right */}
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left: 3D Viewer */}
                  <div className="flex-1 min-w-0">
                    <div className="relative">
                      <Clinical3DViewer
                        markers={markers3D}
                        selectedPathology={current.product_type === 'toxina' ? 'botox' : 'filler'}
                        onMarkerPlaced={handleMarkerPlaced}
                        skipConfirmation
                        height="400px"
                      />

                  {/* Dialog Overlay — Step 1: Tercio */}
                  {dialogStep === 1 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                      <div className="bg-white rounded-xl shadow-2xl p-5 m-4 max-w-xs w-full">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-gray-800">Paso 1/3 — Tercio Facial</h3>
                          <button onClick={handleDialogCancel} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(['superior', 'medio', 'inferior'] as const).map(t => (
                            <button
                              key={t}
                              onClick={() => { setDialogTercio(t); setDialogStep(2); setZoneFilter(''); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm font-semibold transition-all hover:shadow-md ${TERCIO_COLORS[t].bg} ${TERCIO_COLORS[t].border} ${TERCIO_COLORS[t].text}`}
                            >
                              <div className={`w-3 h-3 rounded-full ${t === 'superior' ? 'bg-cyan-400' : t === 'medio' ? 'bg-violet-400' : 'bg-amber-400'}`} />
                              {TERCIO_LABELS[t]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dialog Overlay — Step 2: Zona */}
                  {dialogStep === 2 && dialogTercio && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                      <div className="bg-white rounded-xl shadow-2xl p-5 m-4 max-w-xs w-full">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-gray-800">Paso 2/3 — Zona</h3>
                          <button onClick={handleDialogCancel} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${TERCIO_COLORS[dialogTercio].text}`}>
                          {TERCIO_LABELS[dialogTercio]}
                        </p>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none mb-2"
                          placeholder="Buscar o escribir zona..."
                          value={zoneFilter}
                          onChange={e => setZoneFilter(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && zoneFilter.trim()) {
                              setDialogZone(zoneFilter.trim());
                              setDialogStep(3);
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                          {(TERCIO_ZONES[dialogTercio] || [])
                            .filter(z => !zoneFilter || z.toLowerCase().includes(zoneFilter.toLowerCase()))
                            .map(z => (
                              <button
                                key={z}
                                onClick={() => { setDialogZone(z); setDialogStep(3); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 hover:shadow-sm ${TERCIO_COLORS[dialogTercio].bg} ${TERCIO_COLORS[dialogTercio].border} ${TERCIO_COLORS[dialogTercio].text}`}
                              >
                                {z}
                              </button>
                            ))}
                        </div>
                        <button
                          onClick={() => setDialogStep(1)}
                          className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          ← Volver a tercios
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dialog Overlay — Step 3: Units */}
                  {dialogStep === 3 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                      <div className="bg-white rounded-xl shadow-2xl p-5 m-4 max-w-xs w-full">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-gray-800">Paso 3/3 — {unitLabel}</h3>
                          <button onClick={handleDialogCancel} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mb-3 space-y-1 bg-gray-50 rounded-lg p-2.5">
                          <p><strong className={TERCIO_COLORS[dialogTercio as keyof typeof TERCIO_COLORS]?.text || ''}>Tercio:</strong> {TERCIO_LABELS[dialogTercio as keyof typeof TERCIO_LABELS] || dialogTercio}</p>
                          <p><strong className="text-gray-700">Zona:</strong> {dialogZone}</p>
                        </div>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none mb-3"
                          placeholder={`Cantidad de ${unitLabel} en este punto`}
                          value={dialogUnits}
                          onChange={e => setDialogUnits(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleDialogConfirm(); }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDialogStep(2)}
                            className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            ← Volver
                          </button>
                          <button
                            onClick={handleDialogConfirm}
                            disabled={!dialogUnits || Number(dialogUnits) <= 0}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-violet-500 rounded-lg hover:bg-violet-600 disabled:opacity-40 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Confirmar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom bar */}
                {injectionPoints.length > 0 && (
                  <div className="mt-3 flex items-center justify-between px-1">
                    <span className="text-xs text-gray-500">
                      {injectionPoints.length} punto(s) · {totalUsed} {unitLabel} aplicadas
                    </span>
                    <button
                      onClick={() => { setMarkers3D([]); setInjectionPoints([]); }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Limpiar todos
                    </button>
                  </div>
                )}
                  </div>

                  {/* Right: Points Breakdown by Tercio */}
                  <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                    {injectionPoints.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Desglose de Puntos</p>
                        {(['superior', 'medio', 'inferior'] as const).map(tercio => {
                          const pts = pointsByTercio[tercio];
                          if (!pts || pts.length === 0) return null;
                          const colors = TERCIO_COLORS[tercio];
                          const tercioTotal = pts.reduce((s, p) => s + p.units, 0);
                          return (
                            <div key={tercio} className={`rounded-xl border overflow-hidden ${colors.border}`}>
                              <div className={`flex items-center justify-between px-3 py-2 ${colors.header}`}>
                                <span className={`text-xs font-bold ${colors.text}`}>{TERCIO_LABELS[tercio]}</span>
                                <span className={`text-[10px] font-semibold ${colors.text}`}>
                                  {pts.length} pto(s) · {tercioTotal} {unitLabel}
                                </span>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {pts.map((p, i) => {
                                  const globalIndex = injectionPoints.indexOf(p);
                                  return (
                                    <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-gray-400 font-mono w-4 flex-shrink-0">{globalIndex + 1}</span>
                                        <span className="font-medium text-gray-700 truncate">{p.label || '—'}</span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="font-semibold text-gray-800">{p.units} {unitLabel}</span>
                                        <span className="text-gray-400 w-7 text-right">{totalUsed > 0 ? Math.round((p.units / totalUsed) * 100) : 0}%</span>
                                        <button
                                          onClick={() => handleRemovePoint(globalIndex)}
                                          className="p-0.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                          title="Eliminar punto"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                        <Crosshair className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400 font-medium">Sin marcaciones</p>
                        <p className="text-xs text-gray-300 mt-1">Haz clic en el rostro 3D para registrar puntos</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
