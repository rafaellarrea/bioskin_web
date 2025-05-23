import React from 'react';

const About = () => {
  const equipment = [
    {
      name: "Láser Nd:YAG",
      description: "Tecnología de precisión para tratamientos de rejuvenecimiento y remoción de tatuajes.",
      image: "https://images.pexels.com/photos/6476071/pexels-photo-6476071.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      name: "IPL (Luz Pulsada Intensa)",
      description: "Efectiva para manchas, rojeces y fotoenvejecimiento con resultados visibles.",
      image: "https://images.pexels.com/photos/6476574/pexels-photo-6476574.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      name: "Radiofrecuencia",
      description: "Estimula la producción de colágeno para una piel más firme y rejuvenecida.",
      image: "https://images.pexels.com/photos/6476078/pexels-photo-6476078.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      name: "Dermapen",
      description: "Microagujas que mejoran la textura de la piel y reducen cicatrices y líneas finas.",
      image: "https://images.pexels.com/photos/5069435/pexels-photo-5069435.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    }
  ];

  return (
    <section id="about" className="py-24 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16 animate-fade-in" data-aos="fade-up">
          <h2 className="section-title">Nosotros</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Bio Skin es una clínica especializada en tratamientos faciales personalizados, donde combinamos tecnología de vanguardia con atención profesional y humana.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="order-2 lg:order-1 flex flex-col justify-center animate-fade-in" data-aos="fade-right">
            <h3 className="text-2xl font-semibold mb-6">Nuestra Misión</h3>
            <p className="text-gray-600 mb-4">
              En Bio Skin nos dedicamos a mejorar la salud y apariencia de la piel de nuestros pacientes mediante tratamientos personalizados y de alta tecnología.
            </p>
            <p className="text-gray-600 mb-6">
              Creemos firmemente que cada piel es única y por ello diseñamos protocolos a medida, combinando las más avanzadas tecnologías con productos de calidad farmacéutica para resultados óptimos y duraderos.
            </p>
            
            <h3 className="text-2xl font-semibold mb-6">Valores que nos Definen</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-2 text-[#deb887]">Excelencia</h4>
                <p className="text-gray-600 text-sm">Buscamos la perfección en cada tratamiento para superar expectativas.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-2 text-[#deb887]">Personalización</h4>
                <p className="text-gray-600 text-sm">Adaptamos cada servicio a las necesidades específicas de tu piel.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-2 text-[#deb887]">Innovación</h4>
                <p className="text-gray-600 text-sm">Actualización constante con las últimas tecnologías y protocolos.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-2 text-[#deb887]">Profesionalismo</h4>
                <p className="text-gray-600 text-sm">Equipo altamente calificado y comprometido con tu bienestar.</p>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 animate-fade-in" data-aos="fade-left">
            <div className="relative h-[500px]">
              <img
                src="https://images.pexels.com/photos/4047185/pexels-photo-4047185.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Equipo Bio Skin"
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#deb887] rounded-lg p-4 flex flex-col justify-center shadow-lg animate-fade-in">
                <p className="text-white text-lg font-semibold mb-2">+5 años</p>
                <p className="text-white/80 text-sm">De experiencia brindando atención especializada</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-20">
          <h3 className="text-2xl font-semibold text-center mb-10 animate-fade-in" data-aos="fade-up">Nuestra Aparatología</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipment.map((item, index) => (
              <div key={index} className="card animate-fade-in" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="h-48 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-lg mb-2">{item.name}</h4>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md animate-fade-in" data-aos="fade-up">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold mb-4">Nuestro Proceso de Atención</h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Te acompañamos en cada paso para asegurar resultados óptimos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <div className="bg-[#deb887]/10 rounded-lg p-6 relative">
                <div className="absolute -top-5 left-6 w-10 h-10 bg-[#deb887] text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <h4 className="font-semibold text-lg mt-2 mb-3">Diagnóstico Inicial</h4>
                <p className="text-gray-600 text-sm">Evaluación completa de tu piel para identificar necesidades específicas.</p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-[#deb887]/10 rounded-lg p-6 relative">
                <div className="absolute -top-5 left-6 w-10 h-10 bg-[#deb887] text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <h4 className="font-semibold text-lg mt-2 mb-3">Plan Personalizado</h4>
                <p className="text-gray-600 text-sm">Diseño de protocolo de tratamiento adaptado a tus objetivos y tipo de piel.</p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-[#deb887]/10 rounded-lg p-6 relative">
                <div className="absolute -top-5 left-6 w-10 h-10 bg-[#deb887] text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <h4 className="font-semibold text-lg mt-2 mb-3">Seguimiento Continuo</h4>
                <p className="text-gray-600 text-sm">Monitoreo constante y ajuste de tratamientos para maximizar resultados.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;