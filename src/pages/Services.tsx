import React from 'react';
import ServiceCard from '../components/ServiceCard';
import Footer from '../components/Footer';

const Services = () => {
  const services = [
    {
      title: "Limpieza Facial Profunda",
      description: "Elimina impurezas, puntos negros y células muertas. Incluye extracción, hidratación y mascarilla personalizada.",
      price: 25,
      image: "/images/services/limpiezaProf/limpiezaProf2.jpg"
    },
    {
      title: "Tratamiento Antiaging",
      description: "Combate los signos del envejecimiento con radiofrecuencia y activos regeneradores para reafirmar la piel.",
      price: 25,
      image: "/images/services/antiaging/antiaging.jpeg"
    },
    {
      title: "Tratamiento Antimanchas",
      description: "Unifica el tono de tu piel con un protocolo profesional que combina ácidos despigmentantes y aparatología avanzada. Resultados visibles desde la primera sesión.",
      price: 25,
      image: "/images/services/manchas/antimanchas.jpg"
    },
    {
      title: "Remoción de Tatuajes",
      description: "Eliminación progresiva de tatuajes mediante láser Nd:YAG de última generación. Sesiones personalizadas.",
      price: 15,
      image: "/images/services/hollywoodPeel/hollywood.jpg"
    },
    {
      title: "Hidratación Profunda",
      description: "Restaura la barrera cutánea con ácido hialurónico, péptidos y vitaminas para una piel radiante e hidratada.",
      price: 35,
      image: "/images/services/hidratacionProfunda/hidraProf.jpg"
    },
    {
      title: "Hollywood Peel",
      description: "Peeling de carbón con láser para rejuvenecer, eliminar impurezas y dar luminosidad inmediata a la piel.",
      price: 30,
      image: "/images/services/remocionTatuajes/remocionTatuajes.jpg"
    },
    {
      title: "Exosomas + Mesoterapia",
      description: "Biotecnología de última generación para regenerar, reparar y revitalizar la piel desde el interior. Ideal para pieles desvitalizadas o con signos de envejecimiento.",
      price: 150,
      image: "/images/services/exosomas/exosomas.jpg"
    },
    {
      title: "NCTF + Mesoterapia",
      description: "Rejuvenecimiento celular con complejo polirevitalizante: ácido hialurónico, vitaminas, minerales y antioxidantes para una piel firme, hidratada y luminosa.",
      price: 150,
      image: "/images/services/nctf/nctf.jpg"
    },
    {
      title: "Lipopapada enzimática",
      description: "Moldea zonas localizadas sin cirugía mediante enzimas que disuelven grasa de forma segura y eficaz. Ideal para redefinir contorno facial.",
      price: 30,
      image: "/images/services/lipopapada/lipopapada.jpg"
    }
  ];

  return (
<>
    <section id="services" className="py-24 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-title">Nuestros Servicios</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ofrecemos tratamientos personalizados con tecnología de vanguardia para resolver tus necesidades específicas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              description={service.description}
              price={service.price}
              image={service.image}
              index={index}
            />
          ))}
        </div>

        {/* PROMOCION DEL MES */}       
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Promoción del Mes</h3>
          <div className="card mx-auto max-w-md p-6 border-2 border-[#deb887] mb-12">
            <h4 className="text-xl font-semibold mb-2">Hollywood Peel + Hidratación Profunda</h4>
            <p className="text-gray-500 text-sm mb-4">Unifica tono, revitaliza y nutre tu piel profundamente en una sola sesión.</p>
            <p className="text-3xl font-bold text-[#deb887] mb-4">$55 USD</p>
            <p className="text-green-600 font-medium mb-4">Precio especial solo por mayo</p>
            <a href="#appointment" className="btn-primary block text-center">Agendar Promo</a>
          </div>
        </div>

        {/* PACKS PROMOS */}    
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Packs Promocionales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            <div className="card p-6 border-2 border-[#deb887]">
              <h4 className="text-xl font-semibold mb-2">Pack Rejuvenecimiento</h4>
              <p className="text-gray-500 text-sm mb-4">3 sesiones de Antiaging + 1 Hollywood Peel</p>
              <p className="text-3xl font-bold text-[#deb887] mb-4">$220 USD</p>
              <p className="text-green-600 font-medium mb-4">Ahorra $65 USD</p>
              <a href="#appointment" className="btn-primary block text-center">Agendar Ahora</a>
            </div>

            <div className="card p-6 border-2 border-[#deb887]">
              <h4 className="text-xl font-semibold mb-2">Pack Luminosidad</h4>
              <p className="text-gray-500 text-sm mb-4">3 sesiones Antimanchas + 2 Hidrataciones</p>
              <p className="text-3xl font-bold text-[#deb887] mb-4">$260 USD</p>
              <p className="text-green-600 font-medium mb-4">Ahorra $50 USD</p>
              <a href="#appointment" className="btn-primary block text-center">Agendar Ahora</a>
            </div>

            <div className="card p-6 border-2 border-[#deb887]">
              <h4 className="text-xl font-semibold mb-2">Pack Completo</h4>
              <p className="text-gray-500 text-sm mb-4">Diagnóstico + Limpieza + 2 sesiones personalizadas</p>
              <p className="text-3xl font-bold text-[#deb887] mb-4">$180 USD</p>
              <p className="text-green-600 font-medium mb-4">Ahorra $40 USD</p>
              <a href="#appointment" className="btn-primary block text-center">Agendar Ahora</a>
            </div>
          </div>
        </div>
      </div>
    </section>

 <Footer />
    </>

  );
};

export default Services;
