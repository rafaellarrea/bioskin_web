import React from 'react';
import Footer from '../components/Footer';

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
<>
    <section id="about" className="py-24 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Nosotros</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Bio Skin es una clínica especializada en tratamientos faciales personalizados, donde combinamos tecnología de vanguardia con atención profesional y humana.
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
