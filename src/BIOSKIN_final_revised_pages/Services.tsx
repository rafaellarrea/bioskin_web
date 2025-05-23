import React from 'react';

const Services = () => {
  const services = [
    {
      title: "Limpieza Facial Profunda",
      description: "Elimina impurezas, puntos negros y células muertas.",
      price: 25
    },
    {
      title: "Tratamiento Antiaging",
      description: "Combate los signos del envejecimiento con radiofrecuencia.",
      price: 25
    },
    {
      title: "Tratamiento Antimanchas",
      description: "Unifica el tono de tu piel con protocolo profesional.",
      price: 25
    },
    {
      title: "Remoción de Tatuajes",
      description: "Eliminación profesional de tatuajes con tecnología láser.",
      price: 25
    }
  ];

  return (
    <section id="services" style={{ padding: '100px', textAlign: 'center' }}>
      <h1>Servicios - Render corregido</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {services.map((service, index) => (
          <div key={index} className="p-6 border rounded-lg shadow">
            <div className="bg-gray-300 h-40 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
            <p className="text-gray-600 mb-2">{service.description}</p>
            <p className="font-bold text-primary">${service.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;
