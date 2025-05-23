import React, { useState, useEffect } from 'react';

const Appointment = () => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    message: '',
  });

  // Estados para manejo de horarios
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Todos los posibles horarios
  const allTimes = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00'
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  // Fetch ocupados
  useEffect(() => {
    if (!formData.date) return;
    fetch('/api/getEvents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: formData.date }),
    })
      .then((res) => res.json())
      .then((data) => {
        const times = data.occupiedTimes.map((e: any) =>
          new Date(e.start).toTimeString().slice(0, 5)
        );
        setOccupiedTimes(times);
      })
      .catch((err) => {
        console.error('Error en getEvents:', err);
        setOccupiedTimes([]);
      });
  }, [formData.date]);

  // Calcular disponibles
  useEffect(() => {
    const libres = allTimes.filter((t) => !occupiedTimes.includes(t));
    setAvailableTimes(libres);
    if (!libres.includes(formData.time)) {
      setFormData((prev) => ({ ...prev, time: '' }));
    }
  }, [occupiedTimes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const eventResponse = await fetch('/api/createEvent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const eventResult = await eventResponse.json();
      console.log('Evento creado:', eventResult);

      const mailResponse = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const mailResult = await mailResponse.json();
      console.log('Mail enviado:', mailResult);

      alert('¡Cita agendada con éxito! Revisa tu correo.');
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
          {/* Campos del formulario */}
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
            {availableTimes.map((t) => (
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
