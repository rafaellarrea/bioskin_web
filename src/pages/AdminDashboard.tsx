import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, User, Calendar, Clock, Ban, Bell, X, AlertCircle, Brain, Zap,
  ClipboardList, Bot, Package, Activity, DollarSign, Cuboid, Wrench,
  Users, Shield, Database, ChevronRight, Sparkles, CheckCircle2,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface UpcomingAppointment {
  id: string; summary: string; start: string; end: string;
  description?: string; daysUntil: number; isToday: boolean; isTomorrow: boolean;
}

// ── Mapa feature → tile ────────────────────────────────────────────────────────
const MODULE_CONFIG: Record<string, {
  title: string; description: string; icon: any; path: string;
  iconColor: string; bgColor: string;
}> = {
  clinical_records: { title: 'Fichas Clínicas',        description: 'Pacientes, antecedentes y tratamientos',         icon: ClipboardList, path: '/admin/clinical-records', iconColor: 'text-[#deb887]',   bgColor: 'bg-[#deb887]/10' },
  calendar:         { title: 'Gestión de Agenda',       description: 'Visualiza y administra citas del calendario',    icon: Calendar,      path: '/admin/calendar',         iconColor: 'text-indigo-500',  bgColor: 'bg-indigo-50'    },
  appointment:      { title: 'Agendar Cita',            description: 'Crea citas manualmente en el sistema',           icon: Clock,         path: '/admin/appointment',      iconColor: 'text-orange-500',  bgColor: 'bg-orange-50'    },
  block_schedule:   { title: 'Bloqueo de Horarios',     description: 'Bloquea horarios no disponibles',                icon: Ban,           path: '/admin/block-schedule',   iconColor: 'text-red-500',     bgColor: 'bg-red-50'       },
  diagnosis:        { title: 'Diagnóstico IA',           description: 'Análisis dermatológico asistido por IA',         icon: Brain,         path: '/admin/diagnosis',        iconColor: 'text-teal-500',    bgColor: 'bg-teal-50'      },
  protocols:        { title: 'Protocolos Clínicos',     description: 'Protocolos de aparatología médica con IA',       icon: Zap,           path: '/admin/protocols',        iconColor: 'text-yellow-500',  bgColor: 'bg-yellow-50'    },
  chat_assistant:   { title: 'Asistente de Respuestas', description: 'IA Gema para redactar respuestas a pacientes',   icon: Bot,           path: '/admin/chat-assistant',   iconColor: 'text-pink-500',    bgColor: 'bg-pink-50'      },
  finance:          { title: 'Finanzas',                description: 'Gestión de ingresos y egresos',                  icon: DollarSign,    path: '/admin/finance',          iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50'   },
  inventory:        { title: 'Inventario',              description: 'Control de stock, lotes y vencimientos',         icon: Package,       path: '/admin/inventory',        iconColor: 'text-cyan-500',    bgColor: 'bg-cyan-50'      },
  clinical_3d:      { title: 'Visualización 3D',         description: 'Entorno de visualización clínica en 3D',         icon: Cuboid,        path: '/admin/clinical-3d',      iconColor: 'text-violet-500',  bgColor: 'bg-violet-50'    },
  technical:        { title: 'Servicio Técnico',         description: 'Gestión de reparaciones e informes BioskinTech', icon: Wrench,        path: '/admin/technical',        iconColor: 'text-slate-500',   bgColor: 'bg-slate-50'     },
  blog:             { title: 'Blog Admin',              description: 'Gestión de artículos del blog',                  icon: Database,      path: '/blog-admin',             iconColor: 'text-lime-500',    bgColor: 'bg-lime-50'      },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, hasFeature, logout, checkAuth } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupModules, setBackupModules] = useState({ patients: true, finance: true, chats: false, inventory: false });
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthLogs, setHealthLogs] = useState<string[]>([]);
  const [calStatus, setCalStatus]     = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
  const [emailStatus, setEmailStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
  const healthLogsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { healthLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [healthLogs]);

  useEffect(() => {
    checkAuth().then(ok => { if (!ok) navigate('/admin/login'); });
  }, []);

  // Redirigir master_admin a su panel
  useEffect(() => {
    if (user?.role === 'master_admin') navigate('/admin/master', { replace: true });
  }, [user]);

  useEffect(() => { if (isAuthenticated) fetchUpcomingAppointments(); }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showNotifications && !(e.target as Element).closest('.notifications-panel'))
        setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const runTest = async (type: 'calendar' | 'email') => {
    const setStatus = type === 'calendar' ? setCalStatus : setEmailStatus;
    setStatus('loading');
    setHealthLogs(prev => [...prev, `\n> Iniciando prueba de ${type}...`]);
    try {
      const res  = await fetch(`/api/system-status?type=${type}`);
      const data = await res.json();
      if (data.logs) setHealthLogs(prev => [...prev, ...data.logs.map((l: string) => `> ${l}`)]);
      if (data.success) {
        setStatus('success');
        setHealthLogs(prev => [...prev, '> ✅ PRUEBA EXITOSA']);
      } else {
        setStatus('error');
        setHealthLogs(prev => [...prev, `> ❌ ERROR: ${data.message}`]);
      }
    } catch (e: any) {
      setStatus('error');
      setHealthLogs(prev => [...prev, `> ❌ Error de comunicación: ${e.message}`]);
    }
  };

  const fetchUpcomingAppointments = async () => {
    setLoadingNotifications(true);
    try {
      const appointments: UpcomingAppointment[] = [];
      const today = new Date();
      for (let i = 0; i <= 15; i++) {
        const d = new Date(today); d.setDate(today.getDate() + i);
        try {
          const res  = await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getEvents', date: d.toISOString().split('T')[0] }) });
          const data = await res.json();
          if (data.events) data.events.forEach((ev: any) => appointments.push({ ...ev, daysUntil: i, isToday: i === 0, isTomorrow: i === 1 }));
        } catch {}
      }
      appointments.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      setUpcomingAppointments(appointments);
    } finally { setLoadingNotifications(false); }
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const token    = localStorage.getItem('adminSessionToken');
      const selected = Object.entries(backupModules).filter(([, v]) => v).map(([k]) => k).join(',');
      if (!selected) { alert('Selecciona al menos un módulo'); return; }
      const res = await fetch(`/api/backup?modules=${selected}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: 'bioskin-backup.json' });
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
      setShowBackupModal(false);
    } catch (e: any) { alert('❌ Error: ' + e.message); }
    finally { setDownloadingBackup(false); }
  };

  if (!isAuthenticated || !user || user.role === 'master_admin') return null;

  const tiles = Object.entries(MODULE_CONFIG).filter(([feat]) => hasFeature(feat));

  const roleBadge: Record<string, string> = {
    clinic_admin: 'Administrador de Clínica',
    clinic_user:  'Usuario',
  };

  const formatApt = (d: string) => ({
    time: new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
    day:  new Date(d).toLocaleDateString('es-ES',  { weekday: 'long', day: 'numeric', month: 'long' }),
  });
  const urgency = (a: UpcomingAppointment) =>
    a.isToday    ? { text: 'HOY',    color: 'bg-red-500 text-white' }       :
    a.isTomorrow ? { text: 'MAÑANA', color: 'bg-orange-400 text-white' }    :
    a.daysUntil <= 3 ? { text: `${a.daysUntil} días`, color: 'bg-yellow-400 text-white' } :
                  { text: `${a.daysUntil} días`, color: 'bg-gray-200 text-gray-600' };

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="container-custom py-3.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-2 h-9 bg-[#deb887] rounded-full" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight"
                    style={{ fontFamily: 'Playfair Display, serif' }}>
                  BIOSKIN
                </h1>
                <p className="text-xs text-gray-400 leading-tight">
                  {roleBadge[user.role] || 'Usuario'} · {user.full_name || user.username}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2">

              {/* Notificaciones */}
              <div className="relative notifications-panel">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-[#deb887] hover:bg-[#deb887]/10 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {upcomingAppointments.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                      {upcomingAppointments.length > 9 ? '9+' : upcomingAppointments.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="h-0.5 bg-gradient-to-r from-[#deb887] via-[#e8c98a] to-[#deb887]" />
                    <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                        <Bell className="w-4 h-4 text-[#deb887]" /> Próximas Citas
                      </h3>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-300 hover:text-gray-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-8 text-center text-gray-400">
                          <div className="w-6 h-6 border-2 border-[#deb887] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm">Cargando...</p>
                        </div>
                      ) : upcomingAppointments.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {upcomingAppointments.map(apt => {
                            const { time, day } = formatApt(apt.start);
                            const u = urgency(apt);
                            return (
                              <div key={apt.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${u.color}`}>{u.text}</span>
                                  <span className="text-xs text-gray-400 font-mono">{time}</span>
                                </div>
                                <p className="font-medium text-gray-900 text-sm leading-snug">{apt.summary}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                  <Calendar className="w-3 h-3" />
                                  <span className="capitalize">{day}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-300">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">Sin citas próximas</p>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
                      <button
                        onClick={() => navigate('/admin/calendar')}
                        className="text-sm text-[#deb887] font-medium hover:text-[#c5a075] transition-colors"
                      >
                        Ver calendario completo →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {user.role === 'clinic_admin' && (
                <button
                  onClick={() => navigate('/admin/users')}
                  className="flex items-center gap-1.5 px-3 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-sm font-medium"
                >
                  <Users className="w-4 h-4" /> Usuarios
                </button>
              )}

              <button
                onClick={() => { logout(); navigate('/admin/login'); }}
                className="flex items-center gap-1.5 px-3 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      <div className="container-custom py-8">

        {/* Saludo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#deb887] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Bienvenido, {user.full_name?.split(' ')[0] || user.username}
            </h2>
            <p className="text-sm text-gray-400">Selecciona un módulo para continuar</p>
          </div>
        </div>

        {tiles.length === 0 && (
          <div className="text-center py-24 text-gray-300">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-500">Sin módulos habilitados</p>
            <p className="text-sm mt-1">Contacta al administrador de tu clínica.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tiles.map(([feat, item]) => {
            const Icon = item.icon;
            return (
              <button
                key={feat}
                onClick={() => navigate(item.path)}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#deb887]/40 hover:-translate-y-0.5 transition-all duration-200 text-left p-5 flex flex-col"
              >
                <div className={`w-11 h-11 rounded-xl ${item.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 group-hover:text-[#deb887] transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed flex-1">{item.description}</p>
                <div className="flex items-center gap-1 mt-3 text-[#deb887] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Acceder</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}

          {/* Estado del Sistema */}
          {hasFeature('backup') && (
            <button
              onClick={() => setShowHealthModal(true)}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-200 text-left p-5 flex flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-emerald-600 transition-colors">
                Estado del Sistema
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed flex-1">
                Diagnóstico de API, Calendar y SMTP
              </p>
              <div className="flex items-center gap-1 mt-3 text-emerald-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Verificar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}

          {/* Base de Datos */}
          {hasFeature('backup') && (
            <button
              onClick={() => setShowBackupModal(true)}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 text-left p-5 flex flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <Database className="w-5 h-5 text-indigo-500" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                Base de Datos
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed flex-1">
                Descargar respaldo completo de datos
              </p>
              <div className="flex items-center gap-1 mt-3 text-indigo-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Descargar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ── Modal Backup ─────────────────────────────────────────────────── */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-indigo-400 to-indigo-600" />
            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-indigo-500" /> Gestión de Respaldo
              </h3>
              <button onClick={() => setShowBackupModal(false)} className="text-gray-300 hover:text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              <p className="text-xs text-gray-400 mb-3">Selecciona los módulos a incluir en el respaldo:</p>
              {[['patients','Fichas Clínicas'],['finance','Finanzas'],['chats','Chats'],['inventory','Inventario']].map(([k, label]) => (
                <label key={k} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={(backupModules as any)[k]}
                    onChange={e => setBackupModules(p => ({ ...p, [k]: e.target.checked }))}
                    className="w-4 h-4 accent-[#deb887]"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-50 flex justify-end gap-2">
              <button onClick={() => setShowBackupModal(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleDownloadBackup}
                disabled={downloadingBackup}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50 transition-colors"
              >
                {downloadingBackup ? 'Descargando...' : 'Descargar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Estado del Sistema ─────────────────────────────────────── */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-emerald-500" /> Estado del Sistema
              </h3>
              <button onClick={() => setShowHealthModal(false)} className="text-gray-300 hover:text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {(['calendar', 'email'] as const).map(type => {
                const status = type === 'calendar' ? calStatus : emailStatus;
                const label  = type === 'calendar' ? 'Google Calendar' : 'Email SMTP';
                return (
                  <div key={type} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-2">
                      {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {status === 'error'   && <AlertCircle  className="w-4 h-4 text-red-400" />}
                      {(status === 'pending' || status === 'loading') && (
                        <div className={`w-4 h-4 rounded-full border-2 ${status === 'loading' ? 'border-[#deb887] border-t-transparent animate-spin' : 'border-gray-200'}`} />
                      )}
                      <span className="font-medium text-gray-800 text-sm">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {status !== 'pending' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                          status === 'error'   ? 'bg-red-50 text-red-500' :
                          'bg-yellow-50 text-yellow-600'
                        }`}>
                          {status === 'loading' ? 'Probando...' : status === 'success' ? 'OK' : 'Error'}
                        </span>
                      )}
                      <button
                        onClick={() => runTest(type)}
                        className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        Probar
                      </button>
                    </div>
                  </div>
                );
              })}
              {healthLogs.length > 0 && (
                <div className="bg-gray-950 rounded-xl p-3 font-mono text-xs text-green-400 max-h-40 overflow-y-auto mt-3">
                  {healthLogs.map((l, i) => <div key={i}>{l}</div>)}
                  <div ref={healthLogsEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
