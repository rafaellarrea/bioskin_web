import React, { useState, useEffect } from 'react';

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

  const allTimes = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00'
  ];

  const formatTimeLabel = (time24: string) => {
    const [hourStr, minuteStr] = time24.split(':');
    const hour = parseInt(hourStr, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return \`\${hour12.toString().padStart(2, '0')}:\${minuteStr} \${suffix}\`;
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
    const libres = allTimes.filter((t) => !occupiedTimes.includes(t));
    setAvailableTimes(libres);
  }, [occupiedTimes]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: \`Teléfono: \${formData.phone}
Servicio: \${formData.service}
Fecha: \${formData.date}
Hora: \${formData.time}
Comentario adicional: \${formData.message}\`,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          service: '',
          date: '',
          time: '',
          message: '',
        });
      } else {
        const data = await res.json();
        setError(data.message || 'Error al enviar el formulario.');
      }
    } catch {
      setError('Error de conexión.');
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
    <section id="appointment" className="py-24">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Agenda tu Cita</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Reserva tu consulta o tratamiento de forma rápida y sencilla.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>{/* Panel de información o enlace a WhatsApp */}</div>
          <div>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-4">
                <input name="name" type="text" required placeholder="Nombre completo" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-md" />
                <input name="email" type="email" required placeholder="Correo electrónico" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-md" />
                <input name="phone" type="tel" required placeholder="Teléfono" value={formData.phone} onChange={handleChange} className="w-full p-3 border rounded-md" />
                <input name="service" type="text" required placeholder="Servicio solicitado" value={formData.service} onChange={handleChange} className="w-full p-3 border rounded-md" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input name="date" type="date" required value={formData.date} onChange={handleChange} className="w-full p-3 border rounded-md" />
                  <select name="time" required value={formData.time} onChange={handleChange} className="w-full p-3 border rounded-md">
                    <option value="">Hora Disponible</option>
                    {availableTimes.map(time => (
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
                <button onClick={resetForm} className="btn-primary">
                  Enviar Otra Solicitud
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Appointment;
