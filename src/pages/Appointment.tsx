import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import { CalendarDays, ShieldCheck, Smile } from 'lucide-react';

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
      iso: date.toISOString().slice(0,10)
    });
  }
  return days;
}

// Horarios posibles (intervalos de 2 horas)
const allTimes = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

// Defínela arriba del componente principal o dentro de él antes del render
type EventType = { start: string; end: string };

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


// Devuelve true si la hora seleccionada (de 2h) colisiona con algún evento ocupado
{/*function isHourOccupied2h(selectedDay, hour, events) {
  if (!selectedDay) return true;
  const startTime = new Date(selectedDay + 'T' + hour + ':00');
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
  return events.some(ev => {
    const evStart = new Date(ev.start);
    const evEnd = new Date(ev.end);
    return (startTime < evEnd && endTime > evStart);
  });
}
  */}

const formatTimeLabel = (time24: string) => {
  const parts = time24.split(':');
  const hour = parseInt(parts[0], 10);
  const minuteStr = parts[1];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const hourStr = hour12 < 10 ? '0' + hour12 : hour12.toString();
  return hourStr + ':' + minuteStr + ' ' + suffix;
};

const Appointment = () => {
  // Pasos: 1=día, 2=hora, 3=datos
  const [step, setStep] = useState(1);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedHour, setSelectedHour] = useState('');

  // Eventos ocupados del backend para el día seleccionado
  const [events, setEvents] = useState<{ start: string, end: string }[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);

  // Formulario
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

  const days = getNextDays(8);

  // Trae los eventos ocupados del backend cuando se selecciona un día
  useEffect(() => {
    if (!selectedDay) {
      setEvents([]);
      return;
    }
    setLoadingHours(true);
    fetch('/api/getEvents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDay }),
    })
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data.occupiedTimes) ? data.occupiedTimes : []);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingHours(false));
  }, [selectedDay]);

  // Cambia de día => resetea hora
  useEffect(() => { setSelectedHour(''); }, [selectedDay]);

  // Envía datos a tu API (con hora de fin +2h)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // Calcula hora de inicio y fin (2h)
      const start = `${selectedDay}T${selectedHour}:00`;
      const endDate = new Date(new Date(start).getTime() + 2 * 60 * 60 * 1000);
      const end = endDate.toISOString().slice(0, 16);

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
          start, // Para el evento
          end,   // Para el evento
        }),
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', service: '', message: '' });
    } catch (e) {
      setError('Error al enviar');
    }
    setSubmitting(false);
  };

  // Reinicia todo
  const resetAll = () => {
    setStep(1);
    setSelectedDay('');
    setSelectedHour('');
    setFormData({ name: '', email: '', phone: '', service: '', message: '' });
    setSubmitted(false);
    setError('');
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
                Resultados reales, profesionales certificados
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
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              {loadingHours ? (
                <div className="text-center col-span-3 w-full">Cargando horarios...</div>
              ) : (
                allTimes.map(h => (
                  <button
                    key={h}
                    disabled={isHourOccupied2h(selectedDay, h, events)}
                    onClick={() => setSelectedHour(h)}
                    className={`w-28 rounded-xl p-4 border-2 text-[#0d5c6c] flex flex-col items-center transition-all duration-150
                      ${selectedHour === h ? 'bg-[#ffcfc4] border-[#fa9271] font-bold shadow-lg scale-105' : 'bg-white border-[#dde7eb] hover:bg-[#ffe2db]'}
                      ${isHourOccupied2h(selectedDay, h, events) ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="text-lg font-semibold mb-1">Turno</span>
                    <span className="text-2xl font-bold">{formatTimeLabel(h)}</span>
                  </button>
                ))
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

        {step === 3 && !submitted && (
          <>
            <h4 className="text-lg font-semibold mb-5 text-[#0d5c6c] text-center">3. Completa tus datos</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <option value="Limpieza Facial Profunda">Limpieza Facial Profunda</option>
                <option value="Tratamiento Antiaging">Tratamiento Antiaging</option>
                <option value="Tratamiento Antimanchas">Tratamiento Antimanchas</option>
                <option value="Remoción de Tatuajes">Remoción de Tatuajes</option>
                <option value="Hidratación Profunda">Hidratación Profunda</option>
                <option value="Hollywood Peel">Hollywood Peel</option>
                <option value="Exosomas + Mesoterapia">Exosomas + Mesoterapia</option>
                <option value="NCTF + Mesoterapia">NCTF + Mesoterapia</option>
                <option value="Lipopapada enzimática">Lipopapada enzimática</option>
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
