
import React from 'react';

const Diagnosis = () => {
  const items = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-12 h-12 text-primary mb-4 mx-auto"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75M9 6.75h9.75M3 3v18h18V3H3z"
          />
        </svg>
      ),
      title: "Diagnóstico Avanzado",
      text: "Contamos con un sistema de análisis facial computarizado que permite detectar con precisión las condiciones de tu piel.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-12 h-12 text-primary mb-4 mx-auto"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v18m10.5-18v18M3 9h18M3 15h18"
          />
        </svg>
      ),
      title: "Tratamientos Personalizados",
      text: "Una vez detectado el problema, diseñamos un tratamiento estético adecuado a tus necesidades, sin soluciones genéricas.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-12 h-12 text-primary mb-4 mx-auto"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75M9 6.75h9.75M3 3v18h18V3H3z"
          />
        </svg>
      ),
      title: "Seguimiento y Resultados",
      text: "Realizamos controles fotográficos con nuestra cámara profesional para comparar los resultados a lo largo del tratamiento.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Diagnóstico</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            En BIOSKIN entendemos que cada piel es única. Por eso, realizamos un diagnóstico preciso antes de iniciar cualquier tratamiento.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <div
              key={index}
              className="text-center p-6 border rounded-lg shadow hover:shadow-lg transition-all duration-300"
              data-aos="fade-up"
              data-aos-delay={(index * 100).toString()}
              style={{ position: 'relative' }}
            >
              {item.icon}
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Diagnosis;
