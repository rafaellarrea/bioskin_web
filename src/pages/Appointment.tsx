import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import { CalendarDays, ShieldCheck, Smile, Clock, ChevronRight, Check, AlertCircle, User, Mail, Phone, FileText } from 'lucide-react';
import { SEO } from '../components/SEO';

// Helpers para español
const daysOfWeek = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function getNextDays(count = 8) {
  const days = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push({
      dayName: daysOfWeek[date.getDay()],
      dateNum: date.getDate(),
      month: months[date.getMonth()],
      iso: [
  date.getFullYear(),
  (date.getMonth() + 1).toString().padStart(2, '0'),
  date.getDate().toString().padStart(2, '0')
].join('-')

    });
  }
  return days;
}

const allTimes = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

type EventType = { start: string; end: string };

// Función para verificar si una hora ya pasó en el día actual
function isHourPast(selectedDay: string, hour: string): boolean {
  if (!selectedDay || !hour) return false;
  
  const today = new Date();
  
  // CORREGIDO: usar fechas locales en lugar de UTC para evitar problemas de zona horaria
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedDate = new Date(selectedDay);
  
  // Formatear fechas como strings locales YYYY-MM-DD
  const todayString = `${todayLocal.getFullYear()}-${(todayLocal.getMonth() + 1).toString().padStart(2, '0')}-${todayLocal.getDate().toString().padStart(2, '0')}`;
  const selectedString = selectedDay; // Ya está en formato YYYY-MM-DD
  
  // Si no es el día de hoy, no está en el pasado
  if (todayString !== selectedString) {
    return false;
  }
  
  // Si es hoy, verificar si la hora ya pasó
  const [hourNum, minuteNum] = hour.split(':').map(Number);
  
  // Crear tiempo de la cita
  const appointmentTime = new Date();
  appointmentTime.setHours(hourNum, minuteNum || 0, 0, 0);
  
  // Crear tiempo actual
  const currentTime = new Date();
  
  const isPast = appointmentTime <= currentTime;
  
  return isPast;
}

function isHourOccupied2h(selectedDay: string, hour: string, events: EventType[]): boolean {
  if (!selectedDay) return true;
  const startTime = new Date(selectedDay + 'T' + hour + ':00');
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
  return events.some(ev => {
    const evStart = new Date(ev.start);
    const evEnd = new Date(ev.end);
    return (startTime < evEnd && endTime > evStart);
  });
}

const formatTimeLabel = (time24: string) => {
  const parts = time24.split(':');
  const hour = parseInt(parts[0], 10);
  const minuteStr = parts[1];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const hourStr = hour12 < 10 ? '0' + hour12 : hour12.toString();
  return hourStr + ':' + minuteStr + ' ' + suffix;
};

const TIMEZONE = "-05:00"; // Ecuador

const Appointment = () => {
  // Pasos: 1=día, 2=hora, 3=datos
  const [step, setStep] = useState(1);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [events, setEvents] = useState<{ start: string, end: string }[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false); // <-- el flag de confirmación

  const days = getNextDays(8);

  // Trae los eventos ocupados del backend cuando se selecciona un día
  useEffect(() => {
    if (!selectedDay) {
      setEvents([]);
      return;
    }
    setLoadingHours(true);
    fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getEvents', date: selectedDay }),
    })
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data.occupiedTimes) ? data.occupiedTimes : []);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingHours(false));
  }, [selectedDay]);

  useEffect(() => { setSelectedHour(''); }, [selectedDay]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setError('');
  try {
    const start = `${selectedDay}T${selectedHour}:00${TIMEZONE}`;
const [h, m] = selectedHour.split(':').map(Number);
let endHour = h + 2;
let endDay = selectedDay;
if (endHour >= 24) {
  endHour -= 24;
  // Sumar un día sin .toISOString()
  const [year, month, day] = selectedDay.split('-').map(Number);
  const nextDate = new Date(year, month - 1, day + 1);
  endDay = [
    nextDate.getFullYear(),
    (nextDate.getMonth() + 1).toString().padStart(2, '0'),
    nextDate.getDate().toString().padStart(2, '0')
  ].join('-');
}
const pad = (n: number) => n.toString().padStart(2, '0');
const end = `${endDay}T${pad(endHour)}:${pad(m)}:00${TIMEZONE}`;

    await fetch('/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        message:
          'Teléfono: ' + formData.phone + '\n' +
          'Servicio: ' + formData.service + '\n' +
          'Fecha: ' + selectedDay + '\n' +
          'Hora: ' + selectedHour + ' (2 horas)' + '\n' +
          'Comentario adicional: ' + formData.message,
        start,
        end,
      }),
    });
    setSubmitted(true);
    setFormData({ name: '', email: '', phone: '', service: '', message: '' });
  } catch (e) {
    setError('Error al enviar');
  }
  setSubmitting(false);
};

  const handleNextStep = () => {
    if (step === 1 && selectedDay) setStep(2);
    else if (step === 2 && selectedHour) setStep(3);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <>
      <SEO 
        title="Agendar Cita - BIOSKIN"
        description="Reserva tu cita en línea para tratamientos faciales y corporales en BIOSKIN Cuenca."
        keywords="agendar cita, reserva online, clínica estética Cuenca, tratamientos faciales"
      />
      
      <div className="min-h-screen bg-gray-50 pt-20 pb-20">
        {/* Hero Section */}
        <section className="relative py-16 bg-black overflow-hidden mb-12">
          <div className="absolute inset-0 opacity-40">
            <img 
              src="/images/services/facial/facial-hero.jpg" 
              alt="Background" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-50"></div>
          
          <div className="container-custom relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-serif text-white mb-4"
            >
              Agenda tu Cita
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-200 max-w-2xl mx-auto font-light"
            >
              Reserva tu espacio para una experiencia de belleza y bienestar personalizada.
            </motion.p>
          </div>
        </section>

        <div className="container-custom max-w-4xl">
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-12 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-serif text-gray-900 mb-4">¡Cita Solicitada!</h2>
              <p className="text-gray-600 text-lg mb-8 max-w-lg mx-auto">
                Hemos recibido tu solicitud. Te enviaremos un correo de confirmación en breve.
                ¡Gracias por confiar en BIOSKIN!
              </p>
              <button 
                onClick={() => {
                  setSubmitted(false);
                  setStep(1);
                  setSelectedDay('');
                  setSelectedHour('');
                }}
                className="bg-[#deb887] text-white px-8 py-3 rounded-full font-medium hover:bg-[#c9a677] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Agendar otra cita
              </button>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
              {/* Sidebar de Pasos */}
              <div className="bg-gray-900 text-white p-8 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <img src="/images/logo/logo1.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-serif mb-8 text-[#deb887]">Pasos para agendar</h3>
                  <div className="space-y-8">
                    <div className={`flex items-center gap-4 transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step >= 1 ? 'bg-[#deb887] border-[#deb887] text-white' : 'border-gray-600 text-gray-400'}`}>
                        1
                      </div>
                      <div>
                        <p className="font-medium">Selecciona el día</p>
                        <p className="text-xs text-gray-400">Elige tu fecha ideal</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-4 transition-opacity duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step >= 2 ? 'bg-[#deb887] border-[#deb887] text-white' : 'border-gray-600 text-gray-400'}`}>
                        2
                      </div>
                      <div>
                        <p className="font-medium">Elige la hora</p>
                        <p className="text-xs text-gray-400">Horarios disponibles</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-4 transition-opacity duration-300 ${step >= 3 ? 'opacity-100' : 'opacity-50'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step >= 3 ? 'bg-[#deb887] border-[#deb887] text-white' : 'border-gray-600 text-gray-400'}`}>
                        3
                      </div>
                      <div>
                        <p className="font-medium">Tus datos</p>
                        <p className="text-xs text-gray-400">Información de contacto</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10 mt-8 pt-8 border-t border-gray-800">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <ShieldCheck className="w-5 h-5 text-[#deb887]" />
                    <p>Tus datos están protegidos</p>
                  </div>
                </div>
              </div>

              {/* Contenido Principal */}
              <div className="p-8 md:w-2/3 bg-white relative">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="h-full flex flex-col"
                    >
                      <h3 className="text-2xl font-serif text-gray-900 mb-6 flex items-center gap-3">
                        <CalendarDays className="text-[#deb887]" />
                        Selecciona una fecha
                      </h3>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                        {days.map((d) => (
                          <button
                            key={d.iso}
                            onClick={() => setSelectedDay(d.iso)}
                            className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                              selectedDay === d.iso
                                ? 'border-[#deb887] bg-[#deb887]/10 text-[#deb887] shadow-md transform scale-105'
                                : 'border-gray-200 hover:border-[#deb887] hover:bg-gray-50 text-gray-600'
                            }`}
                          >
                            <span className="text-xs uppercase font-medium tracking-wider">{d.dayName}</span>
                            <span className="text-2xl font-bold">{d.dateNum}</span>
                            <span className="text-xs text-gray-500">{d.month}</span>
                          </button>
                        ))}
                      </div>

                      <div className="mt-auto flex justify-end">
                        <button
                          onClick={handleNextStep}
                          disabled={!selectedDay}
                          className={`flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-all duration-300 ${
                            selectedDay
                              ? 'bg-[#deb887] text-white shadow-lg hover:bg-[#c9a677] transform hover:-translate-y-1'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Siguiente
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="h-full flex flex-col"
                    >
                      <h3 className="text-2xl font-serif text-gray-900 mb-6 flex items-center gap-3">
                        <Clock className="text-[#deb887]" />
                        Selecciona una hora
                      </h3>
                      
                      {loadingHours ? (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#deb887]"></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
                          {allTimes.map((time) => {
                            const isPast = isHourPast(selectedDay, time);
                            const isOccupied = isHourOccupied2h(selectedDay, time, events);
                            const isAvailable = !isPast && !isOccupied;
                            
                            return (
                              <button
                                key={time}
                                disabled={!isAvailable}
                                onClick={() => setSelectedHour(time)}
                                className={`py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  selectedHour === time
                                    ? 'bg-[#deb887] text-white shadow-md transform scale-105'
                                    : isAvailable
                                    ? 'bg-white border border-gray-200 text-gray-700 hover:border-[#deb887] hover:bg-[#deb887]/5'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent'
                                }`}
                              >
                                {formatTimeLabel(time)}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-auto flex justify-between items-center">
                        <button
                          onClick={handlePrevStep}
                          className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2"
                        >
                          Atrás
                        </button>
                        <button
                          onClick={handleNextStep}
                          disabled={!selectedHour}
                          className={`flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-all duration-300 ${
                            selectedHour
                              ? 'bg-[#deb887] text-white shadow-lg hover:bg-[#c9a677] transform hover:-translate-y-1'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Siguiente
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="h-full flex flex-col"
                    >
                      <h3 className="text-2xl font-serif text-gray-900 mb-6 flex items-center gap-3">
                        <Smile className="text-[#deb887]" />
                        Tus Datos
                      </h3>
                      
                      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="Nombre completo"
                            required
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#deb887] focus:border-transparent transition-all"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="email"
                              placeholder="Email"
                              required
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#deb887] focus:border-transparent transition-all"
                            />
                          </div>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="tel"
                              placeholder="Teléfono"
                              required
                              value={formData.phone}
                              onChange={e => setFormData({...formData, phone: e.target.value})}
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#deb887] focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <select
                            required
                            value={formData.service}
                            onChange={e => setFormData({...formData, service: e.target.value})}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#deb887] focus:border-transparent transition-all appearance-none"
                          >
                            <option value="">Selecciona un servicio</option>
                            <option value="Limpieza Facial">Limpieza Facial</option>
                            <option value="Tratamiento Anti-acné">Tratamiento Anti-acné</option>
                            <option value="Rejuvenecimiento">Rejuvenecimiento</option>
                            <option value="Hidratación Profunda">Hidratación Profunda</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>

                        <textarea
                          placeholder="Mensaje o consulta adicional (opcional)"
                          rows={3}
                          value={formData.message}
                          onChange={e => setFormData({...formData, message: e.target.value})}
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#deb887] focus:border-transparent transition-all"
                        ></textarea>

                        {error && (
                          <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg text-sm">
                            <AlertCircle size={16} />
                            {error}
                          </div>
                        )}
                      </form>

                      <div className="mt-auto flex justify-between items-center">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2"
                        >
                          Atrás
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className={`flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-all duration-300 ${
                            submitting
                              ? 'bg-gray-400 cursor-wait'
                              : 'bg-[#deb887] text-white shadow-lg hover:bg-[#c9a677] transform hover:-translate-y-1'
                          }`}
                        >
                          {submitting ? 'Enviando...' : 'Confirmar Cita'}
                          {!submitting && <Check size={18} />}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Appointment;

  const resetAll = () => {
    setStep(1);
    setSelectedDay('');
    setSelectedHour('');
    setFormData({ name: '', email: '', phone: '', service: '', message: '' });
    setSubmitted(false);
    setError('');
    setConfirming(false);
  };

  return (
    <>
    <section id="appointment" className="py-16 bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-10">
        {/* Panel superior informativo */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-3 text-[#99652f]">Agenda tu cita</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-center">
                <CalendarDays className="w-5 h-5 text-[#deb887] mr-2" />
                Horarios flexibles y atención personalizada
              </li>
              <li className="flex items-center">
                <ShieldCheck className="w-5 h-5 text-[#deb887] mr-2" />
                100% confidencialidad y seguridad de tus datos
              </li>
              <li className="flex items-center">
                <Smile className="w-5 h-5 text-[#deb887] mr-2" />
                Resultados visibles, profesional certificado.
              </li>
            </ul>
          </div>
          <div className="w-40 flex-shrink-0 hidden md:block">
            <img
              src="/images/ilustracion-agenda.png"
              alt="Agendar cita"
              className="rounded-xl shadow-lg object-cover w-full"
              style={{ background: "#eae7df" }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Wizard paso a paso */}
        {step === 1 && (
          <>
            <h4 className="text-lg font-semibold mb-5 text-[#0d5c6c] text-center">1. Selecciona el día</h4>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              {days.map(d => (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDay(d.iso)}
                  className={`text-center rounded-xl border-2 p-5 w-28 md:w-32 transition-all duration-200
                    ${selectedDay === d.iso ? 'bg-[#ffcfc4] text-[#0d5c6c] border-[#fa9271] shadow-lg scale-105' : 'bg-white text-[#0d5c6c] border-[#dde7eb] hover:bg-[#ffe2db]'}
                  `}
                  style={{ minHeight: 100 }}
                >
                  <span className="block font-semibold italic text-base">{d.dayName}</span>
                  <span className="block text-3xl font-bold mt-1">{d.dateNum}</span>
                  <span className="block text-base">{d.month}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                disabled={!selectedDay}
                onClick={() => setStep(2)}
                className={`px-7 py-2 rounded-lg bg-[#deb887] text-white font-bold shadow transition ${!selectedDay ? 'opacity-50' : ''}`}
              >
                Siguiente
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h4 className="text-lg font-semibold mb-5 text-[#0d5c6c] text-center">2. Selecciona la hora (2 horas de cita)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-8">
              {loadingHours ? (
                <div className="text-center col-span-3 w-full">Cargando horarios...</div>
              ) : (
                allTimes.map(h => {
                  const isOccupied = isHourOccupied2h(selectedDay, h, events);
                  const isPast = isHourPast(selectedDay, h);
                  const isDisabled = isOccupied || isPast;
                  
                  // Debug del renderizado
                  console.log(`🔄 Renderizando hora ${h}:`, {
                    ocupado: isOccupied,
                    pasado: isPast,
                    deshabilitado: isDisabled,
                    diaSeleccionado: selectedDay
                  });
                  
                  return (
                    <button
                      key={h}
                      disabled={isDisabled}
                      onClick={() => {
                        console.log(`🖱️ Click en hora ${h} - ¿Debería estar deshabilitado?`, { isDisabled, isPast, isOccupied });
                        if (!isDisabled) {
                          setSelectedHour(h);
                        }
                      }}
                      className={`w-full rounded-xl p-3 border-2 text-[#0d5c6c] flex flex-col items-center transition-all duration-150 min-h-[90px]
                        ${selectedHour === h ? 'bg-[#ffcfc4] border-[#fa9271] font-bold shadow-lg scale-105' : 'bg-white border-[#dde7eb] hover:bg-[#ffe2db]'}
                        ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
                      `}
                    >
                      <span className="text-lg font-semibold mb-1">Turno</span>
                      <span className="text-2xl font-bold">{formatTimeLabel(h)}</span>
                      {isOccupied && <span className="text-xs text-red-500 mt-1">Ocupado</span>}
                      {isPast && !isOccupied && <span className="text-xs text-gray-500 mt-1">Pasado</span>}
                      {/* Debug visual */}
                      {isPast && <span className="text-xs text-orange-500 mt-1">🚫 PASADO</span>}
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 rounded-lg bg-[#fa9271] text-white font-bold shadow"
              >Volver</button>
              <button
                disabled={!selectedHour}
                onClick={() => setStep(3)}
                className={`px-6 py-2 rounded-lg bg-[#deb887] text-white font-bold shadow ${!selectedHour ? 'opacity-50' : ''}`}
              >
                Siguiente
              </button>
            </div>
          </>
        )}

        {/* Paso 3 */}
        {step === 3 && !submitted && (
          <>
            {!confirming ? (
              <>
                <h4 className="text-lg font-semibold mb-5 text-[#0d5c6c] text-center">3. Completa tus datos</h4>
                <form onSubmit={e => {
                  e.preventDefault();
                  setConfirming(true); // Va al resumen de confirmación
                }} className="space-y-4">
                  <input
                    name="name" placeholder="Nombre completo" required
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className="w-full p-3 rounded border border-gray-200"
                  />
                  <input
                    name="email" type="email" placeholder="Correo electrónico" required
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    className="w-full p-3 rounded border border-gray-200"
                  />
                  <input
                    name="phone" type="tel" placeholder="Teléfono" required
                    value={formData.phone}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                    className="w-full p-3 rounded border border-gray-200"
                  />
                  <select
                    name="service"
                    required
                    value={formData.service}
                    onChange={e => setFormData(f => ({ ...f, service: e.target.value }))}
                    className="w-full p-3 rounded border border-gray-200 bg-white"
                  >
                    <option value="">Selecciona un servicio</option>
                    <option value="OTRO">OTRO</option>
                    <option value="Consulta + Escáner Facial">Consulta + Escáner Facial</option>
                    <option value="Tratamiento con Microneedling">Tratamiento con Microneedling</option>
                    <option value="HIFU 7D">HIFU 7D</option>
                    <option value="Laser CO2">Laser CO2</option>
                    <option value="Tratamiento para Acné">Tratamiento para Acné</option>
                    <option value="Limpieza Facial Profunda">Limpieza Facial Profunda</option>
                    <option value="Tratamiento Antiaging">Tratamiento Antiaging</option>
                    <option value="Tratamiento Antimanchas">Tratamiento Antimanchas</option>
                    <option value="Remoción de Tatuajes">Remoción de Tatuajes</option>
                    <option value="Hidratación Profunda">Hidratación Profunda</option>
                    <option value="Hollywood Peel">Hollywood Peel</option>
                    <option value="Exosomas + Mesoterapia">Exosomas + Mesoterapia</option>
                    <option value="Lipopapada sin cirugía">Lipopapada sin cirugía</option>
                  </select>
                  <textarea
                    name="message" placeholder="Mensaje adicional (opcional)" rows={3}
                    value={formData.message}
                    onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
                    className="w-full p-3 rounded border border-gray-200"
                  />
                  {error && <div className="text-red-600 mb-2">{error}</div>}
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-2 rounded-lg bg-[#fa9271] text-white font-bold shadow"
                      type="button"
                    >Volver</button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 rounded-lg bg-[#deb887] text-white font-bold shadow"
                    >
                      {submitting ? 'Enviando...' : 'Agendar cita'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="py-10 px-6 text-center bg-gray-50 rounded-2xl shadow mt-6">
                <h4 className="text-xl font-semibold mb-4 text-[#ba9256]">¿Confirmar tu cita?</h4>
                <div className="mb-6 text-gray-700">
                  <div><b>Día:</b> {selectedDay && (() => {
                  // Descompón el string YYYY-MM-DD
                  const [year, month, day] = selectedDay.split('-').map(Number);
                  // Obtén el índice del día usando un objeto Date local
                  const dateObj = new Date(year, month - 1, day);
                  return `${daysOfWeek[dateObj.getDay()]} ${day} de ${months[month - 1]}`;
                  })()}</div>

                  <div><b>Hora:</b> {selectedHour && formatTimeLabel(selectedHour)} (2 horas)</div>
                  <div><b>Tratamiento:</b> {formData.service}</div>
                  <div><b>Nombre:</b> {formData.name}</div>
                  <div><b>Email:</b> {formData.email}</div>
                  <div><b>Teléfono:</b> {formData.phone}</div>
                  {formData.message && <div className="mt-2"><b>Comentario:</b> {formData.message}</div>}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    className="px-8 py-2 rounded-lg bg-[#deb887] text-white font-bold shadow"
                    onClick={async e => {
                      e.preventDefault();
                      await handleSubmit(e);
                      setConfirming(false);
                    }}
                  >
                  {submitting ? 'Agendando...' : 'Sí, agendar'}
                  </button>
                  <button
                    className="px-8 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold shadow"
                    onClick={e => {
                      e.preventDefault();
                      setConfirming(false);
                    }}
                  >
                    No, volver a editar
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {step === 3 && submitted && (
          <div className="text-center py-12">
            <svg className="mx-auto mb-5 text-[#deb887]" width={60} height={60} fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="30" cy="30" r="28" stroke="#deb887" strokeWidth="4" />
              <path d="M18 30l8 8 16-16" stroke="#deb887" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="text-2xl font-semibold mb-2 text-[#0d5c6c]">¡Cita agendada!</h3>
            <p className="mb-6 text-gray-700">Gracias por reservar. Te confirmaremos pronto por WhatsApp o correo.</p>
            <button onClick={resetAll} className="btn-primary py-2 px-6 rounded-lg mt-2 bg-[#deb887] text-white">Agendar otra cita</button>
            <div className="mt-8">
              <a
                href="https://wa.me/593969890689"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Contactar por WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* WhatsApp visible siempre */}
        <div className="mt-8 pt-5 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-2">¿Prefieres agendar directo por WhatsApp?</p>
          <a
            href="https://wa.me/593969890689"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </section>
    <Footer />
    </>
  );
};

export default Appointment;
