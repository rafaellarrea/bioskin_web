import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';

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

  // Modificado para agendar en intervalos de 2 horas
  const allTimes = ['09:00','11:00','13:00','15:00','17:00','19:00'];  // cada cita dura 2 horas

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
    <section id="appointment" className="py-24">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Agenda tu Cita</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Reserva tu consulta rápidamente.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>{/* info panel */}</div>
          <div>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-4">
                <input name="name" type="text" required placeholder="Nombre completo" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-md" />
                <input name="email" type="email" required placeholder="Correo electrónico" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-md" />
                <input name="phone" type="tel" required placeholder="Teléfono" value={formData.phone} onChange={handleChange} className="w-full p-3 border rounded-md" />
              
 {/* 
<input name="service" type="text" required placeholder="Servicio solicitado" value={formData.service} onChange={handleChange} className="w-full p-3 border rounded-md" /> 
*/}

<select
  name="service"
  required
  value={formData.service}
  onChange={handleChange}
  className="w-full p-3 border rounded-md"
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
<p className="text-gray-600 max-w-2xl mx-auto">Selecciona fecha y hora disponibles.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input name="date" type="date" required value={formData.date} onChange={handleChange} className="w-full p-3 border rounded-md" />
                  <select name="time" required value={formData.time} onChange={handleChange} className="w-full p-3 border rounded-md">
                    <option value="">Hora Disponible</option>
                    {availableTimes.map((time) => (
                      <option key={time} value={time}>{formatTimeLabel(time)}</option>
                    ))}
                  </select>
                </div>
                <textarea name="message" rows={4} placeholder="Mensaje adicional (opcional)" value={formData.message} onChange={handleChange} className="w-full p-3 border rounded-md" />
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                  {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
                {error && <div className="text-red-600">{error}</div>}
              </form>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-2xl font-semibold mb-2">¡Solicitud Enviada!</h3>
                <button onClick={resetForm} className="btn-primary">Enviar Otra Solicitud</button>
              </div>
            )}
          </div>
        </div>
      </div>


<div className="mt-10 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">
              O escríbenos a Whatsapp directamente.
            </p>
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



    </section>
 <Footer />
    </>
  );
};

export default Appointment;
