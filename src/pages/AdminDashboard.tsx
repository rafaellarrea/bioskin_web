import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, User, Calendar, Clock, Ban, Bell, X, AlertCircle, Brain, Zap,
  ClipboardList, Bot, Package, Activity, DollarSign, Cuboid, Wrench,
  Users, Shield, Database
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface UpcomingAppointment {
  id: string; summary: string; start: string; end: string;
  description?: string; daysUntil: number; isToday: boolean; isTomorrow: boolean;
}

// Mapa feature â†’ configuraciÃ³n del tile
const MODULE_CONFIG: Record<string, { title: string; description: string; icon: any; path: string; color: string }> = {
  technical:        { title: 'Servicio TÃ©cnico',        description: 'GestiÃ³n de reparaciones, informes BioskinTech',          icon: Wrench,        path: '/admin/technical',        color: 'from-slate-700 to-slate-800' },
  calendar:         { title: 'GestiÃ³n de Agenda',        description: 'Visualiza y administra citas del calendario',            icon: Calendar,      path: '/admin/calendar',         color: 'from-indigo-500 to-indigo-600' },
  block_schedule:   { title: 'Bloqueo de Horarios',      description: 'Bloquea horarios no disponibles en el calendario',       icon: Ban,           path: '/admin/block-schedule',   color: 'from-red-500 to-red-600' },
  appointment:      { title: 'Agendar Cita Manual',      description: 'Crea citas manualmente en el sistema',                   icon: Clock,         path: '/admin/appointment',      color: 'from-orange-500 to-orange-600' },
  diagnosis:        { title: 'DiagnÃ³stico IA',           description: 'Herramienta de anÃ¡lisis dermatolÃ³gico asistido por IA',  icon: Brain,         path: '/admin/diagnosis',        color: 'from-teal-500 to-teal-600' },
  protocols:        { title: 'Protocolos ClÃ­nicos',      description: 'Asistente IA para protocolos de aparatologÃ­a mÃ©dica',    icon: Zap,           path: '/admin/protocols',        color: 'from-yellow-500 to-yellow-600' },
  chat_assistant:   { title: 'Asistente de Respuestas',  description: 'IA Gema para redactar respuestas a pacientes',           icon: Bot,           path: '/admin/chat-assistant',   color: 'from-pink-500 to-rose-500' },
  clinical_records: { title: 'Fichas ClÃ­nicas',          description: 'GestiÃ³n de pacientes, antecedentes y tratamientos',      icon: ClipboardList, path: '/admin/clinical-records', color: 'from-pink-500 to-pink-600' },
  finance:          { title: 'Finanzas',                 description: 'GestiÃ³n de ingresos y egresos',                          icon: DollarSign,    path: '/admin/finance',          color: 'from-amber-500 to-amber-600' },
  inventory:        { title: 'Inventario',               description: 'Control de stock, lotes y vencimientos',                 icon: Package,       path: '/admin/inventory',        color: 'from-cyan-500 to-cyan-600' },
  clinical_3d:      { title: 'VisualizaciÃ³n 3D',         description: 'Entorno de pruebas para visualizaciÃ³n 3D',               icon: Cuboid,        path: '/admin/clinical-3d',      color: 'from-violet-500 to-violet-600' },
  blog:             { title: 'Blog Admin',               description: 'GestiÃ³n de artÃ­culos del blog',                          icon: Database,      path: '/blog-admin',             color: 'from-lime-500 to-lime-600' },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, features, hasFeature, logout, checkAuth } = useAuth();
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
        setHealthLogs(prev => [...prev, '> âœ… PRUEBA EXITOSA']);
      } else {
        setStatus('error');
        setHealthLogs(prev => [...prev, `> âŒ ERROR: ${data.message}`]);
      }
    } catch (e: any) {
      setStatus('error');
      setHealthLogs(prev => [...prev, `> âŒ Error de comunicaciÃ³n: ${e.message}`]);
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
      if (!selected) { alert('Selecciona al menos un mÃ³dulo'); return; }
      const res = await fetch(`/api/backup?modules=${selected}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: 'bioskin-backup.json' });
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
      setShowBackupModal(false);
    } catch (e: any) { alert('âŒ Error: ' + e.message); }
    finally { setDownloadingBackup(false); }
  };

  if (!isAuthenticated || !user || user.role === 'master_admin') return null;

  // Tiles del menÃº â€” solo features habilitados para esta clÃ­nica
  const tiles = Object.entries(MODULE_CONFIG).filter(([feat]) => hasFeature(feat));

  const roleBadge: Record<string, string> = {
    clinic_admin: 'Administrador de ClÃ­nica',
    clinic_user:  'Usuario',
  };

  const formatApt = (d: string) => ({
    time: new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
    day:  new Date(d).toLocaleDateString('es-ES',  { weekday: 'long', day: 'numeric', month: 'long' }),
  });
  const urgency = (a: UpcomingAppointment) =>
    a.isToday    ? { text: 'HOY',       color: 'bg-red-500 text-white' }    :
    a.isTomorrow ? { text: 'MAÃ‘ANA',    color: 'bg-orange-500 text-white' } :
    a.daysUntil <= 3 ? { text: `${a.daysUntil} dÃ­as`, color: 'bg-yellow-500 text-white' } :
                  { text: `${a.daysUntil} dÃ­as`, color: 'bg-gray-500 text-white' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel Administrativo</h1>
              <p className="text-gray-500 text-sm">{roleBadge[user.role] || 'Usuario'} â€” BIOSKIN</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notificaciones */}
              <div className="relative notifications-panel">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="w-6 h-6" />
                  {upcomingAppointments.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">{upcomingAppointments.length}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Bell className="w-4 h-4 text-[#deb887]" />PrÃ³ximas Citas</h3>
                      <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-8 text-center text-gray-500"><div className="animate-spin w-6 h-6 border-2 border-[#deb887] border-t-transparent rounded-full mx-auto mb-2" />Cargando...</div>
                      ) : upcomingAppointments.length > 0 ? (
                        <div className="divide-y">{upcomingAppointments.map(apt => {
                          const { time, day } = formatApt(apt.start); const u = urgency(apt);
                          return (
                            <div key={apt.id} className="p-4 hover:bg-gray-50">
                              <div className="flex justify-between mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.color}`}>{u.text}</span>
                                <span className="text-xs text-gray-500">{time}</span>
                              </div>
                              <p className="font-medium text-gray-900">{apt.summary}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1"><Calendar className="w-3 h-3" /><span className="capitalize">{day}</span></div>
                            </div>
                          );
                        })}</div>
                      ) : (
                        <div className="p-8 text-center text-gray-400"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No hay citas prÃ³ximas</p></div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 border-t text-center">
                      <button onClick={() => navigate('/admin/calendar')} className="text-sm text-[#deb887] font-medium hover:underline">Ver calendario completo</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Usuario */}
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="font-medium text-sm">{user.full_name || user.username}</span>
              </div>

              {/* GestiÃ³n usuarios (clinic_admin) */}
              {user.role === 'clinic_admin' && (
                <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                  <Users className="w-4 h-4" />Usuarios
                </button>
              )}

              <button onClick={() => { logout(); navigate('/admin/login'); }} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">
                <LogOut className="w-4 h-4" />Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de mÃ³dulos */}
      <div className="container-custom py-10">
        {tiles.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl">No hay mÃ³dulos habilitados para tu cuenta.</p>
            <p className="text-sm mt-2">Contacta al administrador de tu clÃ­nica.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiles.map(([feat, item]) => {
            const Icon = item.icon;
            return (
              <button key={feat} onClick={() => navigate(item.path)}
                className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative p-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#deb887] transition-colors">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                  <div className="mt-4 flex items-center text-[#deb887] font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Acceder</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Estado del Sistema */}
          {hasFeature('backup') && (
            <button onClick={() => setShowHealthModal(true)}
              className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6"><Activity className="w-8 h-8 text-white" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">Estado del Sistema</h3>
                <p className="text-gray-500 text-sm">DiagnÃ³stico de API, Calendar y SMTP</p>
              </div>
            </button>
          )}

          {/* Backup */}
          {hasFeature('backup') && (
            <button onClick={() => setShowBackupModal(true)}
              className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 mb-6"><Database className="w-8 h-8 text-white" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">GestiÃ³n de Base de Datos</h3>
                <p className="text-gray-500 text-sm">Descargar respaldo completo</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Modal Backup */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-600" />GestiÃ³n de Respaldo</h3>
              <button onClick={() => setShowBackupModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              {[['patients','Fichas ClÃ­nicas'],['finance','Finanzas'],['chats','Chats'],['inventory','Inventario']].map(([k,label]) => (
                <label key={k} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={(backupModules as any)[k]} onChange={e => setBackupModules(p => ({...p,[k]:e.target.checked}))} className="w-4 h-4 text-indigo-600" />
                  <span className="ml-3 font-medium text-gray-900 text-sm">{label}</span>
                </label>
              ))}
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setShowBackupModal(false)} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
              <button onClick={handleDownloadBackup} disabled={downloadingBackup} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50">
                {downloadingBackup ? 'Descargandoâ€¦' : 'Descargar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Health */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-600" />Estado del Sistema</h3>
              <button onClick={() => setShowHealthModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              {(['calendar','email'] as const).map(type => {
                const status = type === 'calendar' ? calStatus : emailStatus;
                return (
                  <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium text-gray-900 capitalize text-sm">{type === 'calendar' ? 'Google Calendar' : 'Email SMTP'}</span>
                    <div className="flex items-center gap-2">
                      {status !== 'pending' && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === 'success' ? 'bg-green-100 text-green-700' : status === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{status === 'loading' ? 'Probandoâ€¦' : status === 'success' ? 'âœ… OK' : 'âŒ Error'}</span>}
                      <button onClick={() => runTest(type)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs">Probar</button>
                    </div>
                  </div>
                );
              })}
              {healthLogs.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 max-h-40 overflow-y-auto">
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
