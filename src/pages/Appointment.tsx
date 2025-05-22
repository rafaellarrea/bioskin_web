import React, { useState, useEffect } from 'react';

const Appointment = () => {
  // Estado para el formulario (comentado para prueba inicial)
  // const [formData, setFormData] = useState({
  //   name: '',
  //   email: '',
  //   phone: '',
  //   service: '',
  //   date: '',
  //   time: '',
  //   message: '',
  // });
  // const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  // const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  // const [submitting, setSubmitting] = useState(false);
  // const [submitted, setSubmitted] = useState(false);
  // const [error, setError] = useState('');

  // Horarios predefinidos (comentado)
  // const allTimes = [
  //   '09:00', '10:00', '11:00', '12:00',
  //   '13:00', '14:00', '15:00', '16:00',
  //   '17:00', '18:00'
  // ];

  // Función para formatear horas (comentado)
  // const formatTimeLabel = (time24: string) => {
  //   const [hourStr, minuteStr] = time24.split(':');
  //   const hour = parseInt(hourStr, 10);
  //   const suffix = hour >= 12 ? 'PM' : 'AM';
  //   const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  //   return `${hour12.toString().padStart(2, '0')}:${minuteStr} ${suffix}`;
  // };

  // useEffect para obtener eventos de Google Calendar (comentado)
  // useEffect(() => {
  //   if (!formData.date) return;
  //   fetch('/api/getEvents', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ date: formData.date }),
  //   })
  //     .then((res) => res.json())
  //     .then((data) => {
  //       const times = data.occupiedTimes.map((e: any) =>
  //         new Date(e.start).toTimeString().slice(0, 5)
  //       );
  //       setOccupiedTimes(times);
  //     })
  //     .catch(() => setOccupiedTimes([]));
  // }, [formData.date]);

  // useEffect para calcular horarios disponibles (comentado)
  // useEffect(() => {
  //   const libres = allTimes.filter((t) => !occupiedTimes.includes(t));
  //   setAvailableTimes(libres);
  // }, [occupiedTimes]);

  // Manejadores de cambio y envío (comentado)
  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // };
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setSubmitting(true);
  //   // lógica de envío...
  // };

  // Contenido básico para prueba de render
  return (
    <section id="appointment" className="py-24">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Agenda tu Cita</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Este es un render de prueba sin lógica avanzada.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            {/* Panel informativo o enlace a WhatsApp */}
            <p>Información de contacto.</p>
          </div>
          <div>
            {/* Aquí iría el formulario cuando la lógica funcione */}
            <p>Formulario cargará aquí luego de habilitar la lógica.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Appointment;
