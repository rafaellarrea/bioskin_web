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
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const allTimes = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00'
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  // Fetch occupied times
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
      .catch(err => {
        console.error('Error in getEvents:', err);
        setOccupiedTimes([]);
      });
  }, [formData.date]);

  // Compute available times
  useEffect(() => {
    const libres = allTimes.filter(t => !occupiedTimes.includes(t));
    setAvailableTimes(libres);
    if (!libres.includes(formData.time)) {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [occupiedTimes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      // Create Google Calendar event
      const eventResponse = await fetch('/api/createEvent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let eventText = await eventResponse.text();
      let eventResult;
      try {
        eventResult = JSON.parse(eventText);
      } catch {
        console.warn('No JSON from createEvent, raw:', eventText);
        eventResult = { id: null };
      }
      console.log('Evento creado:', eventResult);

      // Send confirmation email
      const mailResponse = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let mailText = await mailResponse.text();
      let mailResult;
      try {
        mailResult = JSON.parse(mailText);
      } catch {
        console.warn('No JSON from sendEmail, raw:', mailText);
        mailResult = {};
      }
      console.log('Mail enviado:', mailResult);

      alert('¡Cita procesada con éxito! Verifica tu correo o calendario.');
    } catch (err: any) {
      console.error('Error al agendar cita:', err);
      const msg = err.message || JSON.stringify(err);
      setErrorMessage('Error al agendar la cita: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="appointment" className="py-24">
      <div className="container-custom">
        <div className="text-center mb-6">
          <h2 className="section-title">Agenda tu Cita</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Paso final: creamos el evento y enviamos correo.
          </p>
        </div>
        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
          <input type="text" name="name" placeholder="Nombre completo"
            value={formData.name} onChange={handleChange}
            className="w-full border p-2 rounded" required />
          <input type="email" name="email" placeholder="Correo electrónico"
            value={formData.email} onChange={handleChange}
            className="w-full border p-2 rounded" required />
          <input type="tel" name="phone" placeholder="Teléfono"
            value={formData.phone} onChange={handleChange}
            className="w-full border p-2 rounded" required />
          <input type="text" name="service" placeholder="Servicio solicitado"
            value={formData.service} onChange={handleChange}
            className="w-full border p-2 rounded" required />
          <input type="date" name="date" placeholder="Fecha"
            value={formData.date} onChange={handleChange}
            className="w-full border p-2 rounded" required />
          <select name="time" value={formData.time} onChange={handleChange}
            className="w-full border p-2 rounded" required>
            <option value="" disabled>Selecciona hora</option>
            {availableTimes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <textarea name="message" placeholder="Mensaje adicional (opcional)"
            value={formData.message} onChange={handleChange}
            className="w-full border p-2 rounded" />
          <button type="submit"
            className={`w-full p-3 rounded text-white ${loading ? 'bg-gray-500' : 'bg-black'}`}
            disabled={loading}>
            {loading ? 'Procesando...' : 'Enviar Solicitud'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-4">
          Si el error persiste, revisa la consola del navegador para detalles.
        </p>
      </div>
    </section>
  );
};

export default Appointment;
