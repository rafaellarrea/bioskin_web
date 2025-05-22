import React, { useState, useEffect } from 'react';

const Appointment = () => {
  // Estados del formulario
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

  // Todos los posibles horarios
  const allTimes = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00'
  ];

  // Función para cambiar estado de formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // useEffect: obtiene eventos cuando cambia la fecha
  useEffect(() => {
    if (!formData.date) return;
    fetch('/api/getEvents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: formData.date }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Extrae horas ocupadas en formato HH:mm
        const times = data.occupiedTimes.map((e: any) =>
          new Date(e.start).toTimeString().slice(0, 5)
        );
        setOccupiedTimes(times);
      })
      .catch(() => setOccupiedTimes([]));
  }, [formData.date]);

  // useEffect: calcula horarios disponibles
  useEffect(() => {
    const libres = allTimes.filter((t) => !occupiedTimes.includes(t));
    setAvailableTimes(libres);
    // Limpia time seleccionado si ya no es válido
    if (!libres.includes(formData.time)) {
      setFormData((prev) => ({ ...prev, time: '' }));
    }
  }, [occupiedTimes]);

  // Envío de formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Enviando:', formData);
    alert('Solicitud enviada: ' + JSON.stringify(formData));
  };

  return (
    <section id="appointment" className="py-24">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Agenda tu Cita</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tercer paso: selecciona hora según disponibilidad.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
          <input
            type="text"
            name="name"
            placeholder="Nombre completo"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Teléfono"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="text"
            name="service"
            placeholder="Servicio solicitado"
            value={formData.service}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="date"
            name="date"
            placeholder="Fecha"
            value={formData.date}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <select
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="" disabled>
              Selecciona hora
            </option>
            {availableTimes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <textarea
            name="message"
            placeholder="Mensaje adicional (opcional)"
            value={formData.message}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <button
            type="submit"
            className="w-full bg-black text-white p-3 rounded"
          >
            Enviar Solicitud
          </button>
        </form>
      </div>
    </section>
  );
};

export default Appointment;
