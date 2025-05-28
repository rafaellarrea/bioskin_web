import React from 'react';
import Footer from '../components/Footer';

const About = () => {
  const equipment = [
    {
      name: "Láser Nd:YAG",
      description: "Tecnología de precisión para tratamientos de rejuvenecimiento, remoción de tatuajes, micropigmentaciones (cejas, 	labios, delineados), y tratamiento de lesiones pigmentadas como manchas solares, lunares y marcas de nacimiento. Preciso, seguro y 	eficaz en diferentes fototipos de piel.",
      image: "/images/productos/dispositivos/ndyag/ndyag.jpg"
    },
    {
      name: "IPL (Luz Pulsada Intensa)",
      description: "Versátil y no invasiva, esta tecnología se utiliza para depilación permanente, tratamiento de manchas, 	rejuvenecimiento facial, acné, rosácea y mejora del tono de piel. Su acción selectiva permite tratar múltiples condiciones en una 	sola sesión.",
      image: "/images/productos/dispositivos/ipl/ipl.jpg"
    },
    {
      name: "Radiofrecuencia",
      description: "Ideal para tratamientos de rejuvenecimiento facial y corporal. Estimula la producción de colágeno, mejora la firmeza, 	reduce arrugas finas y redefine el contorno facial sin necesidad de cirugía ni tiempo de recuperación",
      image: "/images/productos/dispositivos/radiofrecuencia/radiofrecuencia.jpg"
    },
    {
      name: "Dermapen",
      description: "Dispositivo de microneedling que mejora la textura, tono e hidratación de la piel. Utilizado para tratar cicatrices, 	poros dilatados, arrugas finas y para favorecer la absorción de principios activos como exosomas, vitaminas, ácido 	hialurónico, entre otros.",
      image: "/images/productos/dispositivos/dermapen/dermapen.jpg"
    },
	{
      name: "Fototerapia LED",
      description: "Tratamiento no invasivo que utiliza luz de diferentes colores para regenerar la piel, reducir acné, calmar 	irritaciones, estimular colágeno y unificar el tono. Ideal para potenciar resultados en protocolos faciales. Sin dolor, sin 	efectos secundarios.",
      image: "/images/productos/dispositivos/dermapen/dermapen.jpg"
    },
  ];

  return (
<>
    <section id="about" className="py-24 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Nosotros</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Bio Skin es un espacio especializado en tratamientos faciales personalizados, donde combinamos tecnología de vanguardia con una atención profesional, cercana y enfocada en resultados visibles desde la primera sesión.
          </p>
        </div>

        <div className="mb-20">
          <h3 className="text-2xl font-semibold text-center mb-10">Nuestra Aparatología</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipment.map((item, index) => (
              <div key={index} className="card">
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
      </div>
    </section>
<Footer />
    </>

  );
};

export default About;
