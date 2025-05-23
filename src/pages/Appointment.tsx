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
    '09:00','10:00','11:00','12:00',
    '13:00','14:00','15:00','16:00',
    '17:00','18:00'
  ];

  const formatTimeLabel = function(time24: string) {
    var parts = time24.split(':');
    var hour = parseInt(parts[0], 10);
    var minuteStr = parts[1];
    var suffix = hour >= 12 ? 'PM' : 'AM';
    var hour12 = hour % 12 === 0 ? 12 : hour % 12;
    var hourStr = hour12.toString().length === 1 ? '0' + hour12.toString() : hour12.toString();
    return hourStr + ':' + minuteStr + ' ' + suffix;
  };

  useEffect(function() {
    if (!formData.date) return;
    fetch('/api/getEvents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: formData.date }),
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var times = data.occupiedTimes.map(function(e: any) {
          return new Date(e.start).toTimeString().slice(0,5);
        });
        setOccupiedTimes(times);
      })
      .catch(function() { setOccupiedTimes([]); });
  }, [formData.date]);

  useEffect(function() {
    var libres = allTimes.filter(function(t) { return occupiedTimes.indexOf(t) === -1; });
    setAvailableTimes(libres);
  }, [occupiedTimes]);

  var handleChange = function(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) {
    var name = e.target.name;
    var value = e.target.value;
    setFormData(function(prev) { return Object.assign({}, prev, {[name]: value}); });
  };

  var handleSubmit = async function(e: React.FormEvent) {
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
          message: 'Teléfono: ' + formData.phone + '\n' +
                   'Servicio: ' + formData.service + '\n' +
                   'Fecha: ' + formData.date + '\n' +
                   'Hora: ' + formData.time + '\n' +
                   'Comentario adicional: ' + formData.message,
        }),
      });
      setSubmitted(true);
      setFormData({name:'',email:'',phone:'',service:'',date:'',time:'',message:''});
    } catch (e) {
      setError('Error al enviar');
    }
    setSubmitting(false);
  };

  var resetForm = function() {
    setFormData({name:'',email:'',phone:'',service:'',date:'',time:'',message:''});
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
            Reserva tu consulta rápidamente.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>{/* info panel */}</div>
          <div>
            {!submitted ? (
              React.createElement('form',
                { onSubmit: handleSubmit, className: 'bg-white p-8 rounded-lg shadow-md space-y-4' },
                React.createElement('input', { name: 'name', type: 'text', required: true, placeholder: 'Nombre completo', value: formData.name, onChange: handleChange, className: 'w-full p-3 border rounded-md' }),
                React.createElement('input', { name: 'email', type: 'email', required: true, placeholder: 'Correo electrónico', value: formData.email, onChange: handleChange, className: 'w-full p-3 border rounded-md' }),
                React.createElement('input', { name: 'phone', type: 'tel', required: true, placeholder: 'Teléfono', value: formData.phone, onChange: handleChange, className: 'w-full p-3 border rounded-md' }),
                React.createElement('input', { name: 'service', type: 'text', required: true, placeholder: 'Servicio solicitado', value: formData.service, onChange: handleChange, className: 'w-full p-3 border rounded-md' }),
                React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
                  React.createElement('input', { name: 'date', type: 'date', required: true, value: formData.date, onChange: handleChange, className: 'w-full p-3 border rounded-md' }),
                  React.createElement('select', { name: 'time', required: true, value: formData.time, onChange: handleChange, className: 'w-full p-3 border rounded-md' },
                    React.createElement('option', { value: '' }, 'Hora Disponible'),
                    availableTimes.map(function(time) {
                      return React.createElement('option', { key: time, value: time }, formatTimeLabel(time));
                    })
                  )
                ),
                React.createElement('textarea', { name: 'message', rows: 4, placeholder: 'Mensaje adicional (opcional)', value: formData.message, onChange: handleChange, className: 'w-full p-3 border rounded-md' }),
                React.createElement('button', { type: 'submit', disabled: submitting, className: 'btn-primary w-full py-3' }, submitting ? 'Enviando...' : 'Enviar Solicitud'),
                error && React.createElement('div', { className: 'text-red-600' }, error)
              )
            ) : (
              React.createElement('div', { className: 'text-center py-8' },
                React.createElement('h3', { className: 'text-2xl font-semibold mb-2' }, '¡Solicitud Enviada!'),
                React.createElement('button', { onClick: resetForm, className: 'btn-primary' }, 'Enviar Otra Solicitud')
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Appointment;
