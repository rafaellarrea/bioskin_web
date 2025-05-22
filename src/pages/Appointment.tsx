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

  // Manejador de cambios
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // useEffect 1: Prueba de fetch de eventos
  useEffect(() => {
    if (!formData.date) return; // solo si hay fecha
    console.log('Obteniendo eventos para fecha:', formData.date);
    fetch('/api/getEvents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: formData.date }),
    })
      .then((res) => {
        console.log('Respuesta HTTP:', res.status);
        return res.json();
      })
      .then((data) => {
        console.log('Datos recibidos de /api/getEvents:', data);
      })
      .catch((err) => {
        console.error('Error fetch /api/getEvents:', err);
      });
  }, [formData.date]);

  // Envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Datos enviados:', formData);
    alert('Datos en consola y fetch de eventos en la fecha ' + formData.date);
  };

  return (
    <section id="appointment" className="py-24">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Agenda tu Cita</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Segundo paso: fetch de eventos al cambiar fecha (revisa consola).
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
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Teléfono"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="service"
            placeholder="Servicio solicitado"
            value={formData.service}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="date"
            name="date"
            placeholder="Fecha"
            value={formData.date}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="time"
            name="time"
            placeholder="Hora"
            value={formData.time}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
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
