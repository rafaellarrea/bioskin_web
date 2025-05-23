import React from 'react';
// import ServiceCard from '../components/ServiceCard'; // Comentado para pruebas

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
    <section id="services" className="py-24">
      <div className="container-custom text-center">
        <h2 className="section-title mb-8">Nuestros Servicios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <div key={index} className="p-6 border rounded-lg shadow">
              <div className="bg-gray-300 h-40 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-600 mb-2">{service.description}</p>
              <p className="font-bold text-primary">${service.price}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
