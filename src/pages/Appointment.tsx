import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
// Puedes usar estos iconos o los de tu preferencia
import { CalendarDays, ShieldCheck, Smile } from 'lucide-react';

const Appointment = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    message: '',
  });
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const allTimes = ['09:00','11:00','13:00','15:00','17:00','19:00'];

  const formatTimeLabel = (time24: string) => {
    const parts = time24.split(':');
    const hour = parseInt(parts[0], 10);
    const minuteStr = parts[1];
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const hourStr = hour12 < 10 ? '0' + hour12 : hour12.toString();
    return hourStr + ':' + minuteStr + ' ' + suffix;
  };

  useEffect(() => {
    if (!formData.date) return;
    fetch('/api/getEvents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: formData.date }),
    })
      .then(res => res.json())
      .then(data => {
        const times = data.occupiedTimes.map((e: any) =>
          new Date(e.start).toTimeString().slice(0, 5)
        );
        setOccupiedTimes(times);
      })
      .catch(() => setOccupiedTimes([]));
  }, [formData.date]);

  useEffect(() => {
    const libres = allTimes.filter(t => !occupiedTimes.includes(t));
    setAvailableTimes(libres);
  }, [occupiedTimes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message:
            'Teléfono: ' + formData.phone + '\n' +
            'Servicio: ' + formData.service + '\n' +
            'Fecha: ' + formData.date + '\n' +
            'Hora: ' + formData.time + '\n' +
            'Comentario adicional: ' + formData.message,
        }),
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', service: '', date: '', time: '', message: '' });
    } catch (e) {
      setError('Error al enviar');
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', service: '', date: '', time: '', message: '' });
    setSubmitting(false);
    setSubmitted(false);
    setError('');
  };

  return (
<>
  <section id="appointment" className="py-24 bg-gray-50 min-h-screen">
    <div className="container-custom">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Panel izquierdo informativo */}
        <div className="bg-[#fcf6ef] p-10 flex flex-col justify-center border-r border-gray-100">
          <h3 className="text-2xl font-bold mb-5 text-[#99652f]">¿Por qué agendar con BIOSKIN?</h3>
          <ul className="space-y-6 text-gray-700 mb-10">
            <li className="flex items-center">
              <CalendarDays className="w-7 h-7 text-[#deb887] mr-3" />
              <span>Horarios flexibles y atención personalizada</span>
            </li>
            <li className="flex items-center">
              <ShieldCheck className="w-7 h-7 text-[#deb887] mr-3" />
              <span>100% confidencialidad y seguridad de tus datos</span>
            </li>
            <li className="flex items-center">
              <Smile className="w-7 h-7 text-[#deb887] mr-3" />
              <span>Resultados reales, profesionales certificados</span>
            </li>
          </ul>
          <img
            src="/images/ilustracion-agenda.png"
            alt="Agendar cita"
            className="rounded-xl shadow-lg mt-auto object-cover w-full max-h-52"
            style={{ background: "#eae7df" }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        {/* Formulario derecho */}
        <div className="p-8 flex flex-col justify-center">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow space-y-4 border border-gray-100">
              <input
                name="name"
                type="text"
                required
                placeholder="Nombre completo"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#deb887] transition"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#deb887] transition"
              />
              <input
                name="phone"
                type="tel"
                required
                placeholder="Teléfono"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#deb887] transition"
              />
              <select
                name="service"
                required
                value={formData.service}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-[#deb887] transition"
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
              <p className="text-gray-600 text-sm">Selecciona fecha y hora disponibles.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#deb887] transition"
                />
                <select
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-[#deb887] transition"
                >
                  <option value="">Selecciona una hora</option>
                  {allTimes.map((time) => {
                    const isOccupied = occupiedTimes.includes(time);
                    return (
                      <option
                        key={time}
                        value={isOccupied ? '' : time}
                        disabled={isOccupied}
                        className={isOccupied ? 'bg-gray-200 text-gray-500' : ''}
                      >
                        {formatTimeLabel(time)} {isOccupied ? ' (No disponible)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <textarea
                name="message"
                rows={4}
                placeholder="Mensaje adicional (opcional)"
                value={formData.message}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-[#deb887] transition"
              />
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 text-lg rounded-xl transition-all duration-200"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
              {error && <div className="text-red-600">{error}</div>}
            </form>
          ) : (
            <div className="text-center py-10">
              <svg className="mx-auto mb-4 text-[#deb887]" width={48} height={48} fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="24" cy="24" r="22" stroke="#deb887" strokeWidth="4" />
                <path d="M16 24l6 6 10-10" stroke="#deb887" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="text-2xl font-semibold mb-2">¡Solicitud enviada!</h3>
              <p className="mb-6 text-gray-700">Pronto nos contactaremos contigo para confirmar tu cita.</p>
              <button onClick={resetForm} className="btn-primary py-2 px-6 rounded-lg">Enviar otra solicitud</button>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp section */}
      <div className="mt-10 pt-6 border-t border-gray-200 text-center">
        <p className="text-gray-600 mb-4">¿Prefieres agendar directo por WhatsApp?</p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <a
            href="https://wa.me/593969890689"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  </section>
  <Footer />
</>
  );
};

export default Appointment;
