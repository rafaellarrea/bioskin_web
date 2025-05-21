import React, { useState } from 'react';

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
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  /*const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    // Simulate form submission
    setTimeout(() => {
      try {
        // In a real application, you would send the data to the server here
        console.log('Form data:', formData);
        setSubmitted(true);
        setSubmitting(false);
      } catch (err) {
        setError('Ocurrió un error al enviar el formulario. Por favor, intente nuevamente.');
        setSubmitting(false);
      }
    }, 1500);
  };*/

/*const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setError('');

  const dateISO = formData.date;
  let dateFormatted = formData.date;
  if (dateISO.includes('-')) {
    const [year, month, day] = dateISO.split('-');
    dateFormatted = `${day}-${month}-${year}`;
  }

  try {
    const res = await fetch('/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        message: `
          Teléfono: ${formData.phone}
          Servicio: ${formData.service}
          Fecha: ${dateISO}
          Hora: ${formData.time}
          Comentario adicional: ${formData.message}
          (Fecha visual: ${dateFormatted})
        `
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
  } catch (err) {
    console.error(err);
    setError('Ocurrió un error al enviar el formulario. Por favor, intente nuevamente.');
  } finally {
    setSubmitting(false);
  }
};*/

	const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setError('');

  const dateISO = formData.date;
  let dateFormatted = formData.date;
  if (dateISO.includes('-')) {
    const [year, month, day] = dateISO.split('-');
    dateFormatted = `${day}-${month}-${year}`;
  }

  try {
    const res = await fetch('/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        message: `
          Teléfono: ${formData.phone}
          Servicio: ${formData.service}
          Fecha: ${dateISO}
          Hora: ${formData.time}
          Comentario adicional: ${formData.message}
          (Fecha visual: ${dateFormatted})
        `
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
  } catch (err) {
    console.error(err);
    setError('Ocurrió un error al enviar el formulario. Por favor, intente nuevamente.');
  } finally {
    setSubmitting(false);
  }
};

  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      service: '',
      date: '',
      time: '',
      message: '',
    });
    setSubmitted(false);
  };

  return (
    <section id="appointment" className="py-24">
      <div className="container-custom">
        <div className="text-center mb-16 animate-fade-in" data-aos="fade-up">
          <h2 className="section-title">Agenda tu Cita</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Reserva tu consulta o tratamiento de forma rápida y sencilla. Nuestro equipo te atenderá con la mayor profesionalidad.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="animate-fade-in" data-aos="fade-right">
            <h3 className="text-2xl font-semibold mb-6">Formas de Contacto</h3>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                WhatsApp
              </h4>
              <p className="text-gray-600 mb-4">
                Contáctanos directamente por WhatsApp para una respuesta inmediata y agendar tu cita.
              </p>
              <a 
                href="https://wa.me/593969890689" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-md transition-all duration-300 inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Agendar por WhatsApp
              </a>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Horario de Atención
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex justify-between">
                  <span>Lunes - Viernes:</span>
                  <span className="font-medium">9:00 AM - 7:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Sábados:</span>
                  <span className="font-medium">9:00 AM - 4:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Domingos:</span>
                  <span className="font-medium">Cerrado</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Teléfono:</span> +593 969 890 689
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> salud.bioskin@gmail.com
                </p>
              </div>
            </div>
          </div>
          
          <div className="animate-fade-in" data-aos="fade-left">
            <div className="bg-white p-8 rounded-lg shadow-md">
              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <h3 className="text-xl font-semibold mb-6">Formulario de Contacto</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo*
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email*
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono*
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                        Servicio de Interés*
                      </label>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        <option value="limpieza_facial">Limpieza Facial Profunda</option>
                        <option value="antiaging">Tratamiento Antiaging</option>
                        <option value="antimanchas">Tratamiento Antimanchas</option>
                        <option value="remocion_tatuajes">Remoción de Tatuajes</option>
                        <option value="hidratacion">Hidratación Profunda</option>
                        <option value="hollywood_peel">Hollywood Peel</option>
			<option value="Exosomas + Mesoterapia">Exosomas + Mesoterapia</option>
			<option value="NCTF + Mesoterapia">NCTF + Mesoterapia</option>
			<option value="Lipopapada enzimática">Lipopapada enzimática</option>
                        <option value="diagnostico">Diagnóstico Facial</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Preferida*
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                        Hora Preferida*
                      </label>
                      <select
                        id="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">01:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                        <option value="18:00">06:00 PM</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje (opcional)
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                      placeholder="Describa su consulta o cualquier información adicional que considere relevante..."
                    ></textarea>
                  </div>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    className="w-full btn-primary py-3 flex justify-center items-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      'Enviar Solicitud'
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <h3 className="text-2xl font-semibold mb-2">¡Solicitud Enviada!</h3>
                  <p className="text-gray-600 mb-6">
                    Gracias por contactarnos. Hemos recibido tu solicitud y nos comunicaremos contigo a la brevedad para confirmar tu cita.
                  </p>
                  <button 
                    onClick={resetForm}
                    className="btn-primary"
                  >
                    Enviar Otra Solicitud
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Appointment;