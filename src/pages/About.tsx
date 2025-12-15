import React from 'react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import { SEO } from '../components/SEO';
import { Award, Users, Heart, Zap } from 'lucide-react';

const About = () => {
  const equipment = [
    {
      name: "Láser Nd:YAG",
      description: "Tecnología de precisión para tratamientos de rejuvenecimiento, remoción de tatuajes y lesiones pigmentadas.",
      image: "/images/productos/dispositivos/ndyag/ndyag.jpg"
    },
    {
      name: "IPL (Luz Pulsada)",
      description: "Versátil y no invasiva para depilación permanente, manchas, acné y rosácea.",
      image: "/images/productos/dispositivos/ipl/ipl.jpg"
    },
    {
      name: "Radiofrecuencia",
      description: "Estimula colágeno, mejora firmeza y reduce arrugas sin cirugía.",
      image: "/images/productos/dispositivos/radiofrecuencia/radiofrecuencia.jpg"
    },
    {
      name: "Dermapen",
      description: "Microneedling para mejorar textura, cicatrices y absorción de activos.",
      image: "/images/productos/dispositivos/dermapen/dermapen.jpg"
    },
    {
      name: "Fototerapia LED",
      description: "Luz regenerativa para acné, irritaciones y estimulación de colágeno.",
      image: "/images/productos/dispositivos/led/led1.jpg"
    },
    {
      name: "Alta Frecuencia",
      description: "Oxigena, elimina bacterias y estimula circulación. Ideal para acné.",
      image: "/images/productos/dispositivos/altaFrecuencia/altaFrecuencia1.jpg"
    }
  ];

  return (
    <>
      <SEO 
        title="Sobre Nosotros - BIOSKIN"
        description="Conoce BIOSKIN, tu clínica estética en Cuenca. Tecnología avanzada y atención personalizada por la Dra. Daniela Creamer."
        keywords="Sobre BIOSKIN, clínica estética Cuenca, Dra. Daniela Creamer, tecnología estética"
      />
      
      {/* Hero Section */}
      <section className="relative py-24 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
           <img src="/images/logo/logo1.jpg" className="w-full h-full object-cover" alt="Background" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        
        <div className="container-custom relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="text-[#deb887] font-medium tracking-widest uppercase mb-4 block">Nuestra Esencia</span>
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-8">
              Ciencia y Arte <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#deb887] to-[#f5d0a9]">en Armonía</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              En BIOSKIN, redefinimos la medicina estética combinando tecnología de vanguardia con una visión artística de la belleza natural.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             {[
               { icon: Heart, title: "Pasión por el Detalle", desc: "Cada tratamiento es una obra maestra personalizada." },
               { icon: Users, title: "Enfoque Humano", desc: "Tu bienestar y confianza son nuestra prioridad absoluta." },
               { icon: Award, title: "Excelencia Médica", desc: "Protocolos seguros respaldados por experiencia clínica." }
             ].map((item, idx) => (
               <motion.div 
                 key={idx}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.2 }}
                 className="text-center"
               >
                 <div className="w-16 h-16 mx-auto bg-[#deb887]/10 rounded-full flex items-center justify-center mb-6 text-[#deb887]">
                   <item.icon className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                 <p className="text-gray-600">{item.desc}</p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Equipment Section */}
      <section className="py-24 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Tecnología de Vanguardia</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Contamos con el equipamiento más avanzado del mercado para garantizar resultados seguros y efectivos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {equipment.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -10 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="h-56 overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="bg-[#deb887] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Tecnología
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-serif font-bold text-xl mb-3 text-gray-900">{item.name}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default About;
