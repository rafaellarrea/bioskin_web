import React from 'react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import Faq from '../pages/Faq';
import { Link } from "react-router-dom";
import { SEO } from '../components/SEO';
import { Activity, Star, Shield, ArrowRight, ChevronDown } from 'lucide-react';

const Home = () => {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": "BIOSKIN - Clínica Estética",
    "image": "https://bioskin.ec/images/logo/logo1.jpg",
    "@id": "https://bioskin.ec",
    "url": "https://bioskin.ec",
    "telephone": "+593969890689",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. Ordoñez Lasso y calle de la Menta, Centro Médico Santa María, 2do piso, Cons. 203",
      "addressLocality": "Cuenca",
      "addressRegion": "Azuay",
      "postalCode": "010107",
      "addressCountry": "EC"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -2.900128,
      "longitude": -79.005896
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "19:00"
    },
    "sameAs": [
      "https://www.facebook.com/share/1BWcENMrip/",
      "https://www.instagram.com/salud.bioskin?igsh=dnN2djR6dm94OGFq"
    ],
    "priceRange": "$$"
  };

  return (
    <>
      <SEO 
        title="BIOSKIN - Clínica Estética en Cuenca"
        description="Descubre tu mejor versión en BIOSKIN. Tratamientos faciales y corporales avanzados en Cuenca, Ecuador. Dra. Daniela Creamer. Agenda tu cita hoy."
        keywords="Clínica estética Cuenca, tratamientos faciales Cuenca, dermatología estética, rejuvenecimiento facial, BIOSKIN, Dra. Daniela Creamer"
        schema={localBusinessSchema}
      />
      
      {/* HERO SECTION FUTURISTA */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Dinámico */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            className="w-full h-full"
          >
            <img
              src="/images/logo/logo1.jpg"
              alt="BIOSKIN Background"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
          
          {/* Efecto de partículas o textura sutil (opcional) */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        </div>

        {/* Contenido Hero */}
        <div className="container-custom relative z-10 px-6 text-center mt-16">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-5xl mx-auto"
          >
            <motion.span 
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.2em" }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="block text-[#deb887] text-sm md:text-base uppercase tracking-[0.2em] mb-6 font-medium"
            >
              Medicina Estética Avanzada
            </motion.span>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-white mb-8 leading-tight">
              Descubre tu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#deb887] via-[#f5d0a9] to-[#deb887] italic">
                Mejor Versión
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-gray-300 mb-12 font-light max-w-3xl mx-auto leading-relaxed">
              Fusionamos ciencia, tecnología y arte para revelar tu belleza natural en Cuenca, Ecuador.
            </p>

            {/* Botones Interactivos */}
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center w-full max-w-2xl mx-auto">
              <motion.a
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(222, 184, 135, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                href="#appointment"
                className="w-full md:w-auto px-8 py-4 bg-[#deb887] text-white rounded-full font-medium text-lg transition-all flex items-center justify-center gap-2 group"
              >
                Agendar Cita
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              
              <motion.div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <Link to="/services" className="w-full md:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-8 py-4 bg-transparent border border-white/30 backdrop-blur-sm text-white rounded-full font-medium text-lg transition-all"
                  >
                    Servicios
                  </motion.button>
                </Link>
                <Link to="/products/aparatologia" className="w-full md:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-8 py-4 bg-transparent border border-white/30 backdrop-blur-sm text-white rounded-full font-medium text-lg transition-all"
                  >
                    Aparatología
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest">Descubre más</span>
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* SECCIÓN DE BENEFICIOS FUTURISTA */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-gray-50 to-transparent opacity-50 pointer-events-none" />
        
        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { 
                icon: Activity, 
                title: "Tecnología Avanzada", 
                desc: "Equipos de última generación con IA para diagnósticos precisos y resultados superiores.",
                delay: 0
              },
              { 
                icon: Star, 
                title: "Atención Premium", 
                desc: "Experiencia personalizada centrada en tu bienestar, desde la consulta hasta el post-tratamiento.",
                delay: 0.2
              },
              { 
                icon: Shield, 
                title: "Resultados Garantizados", 
                desc: "Protocolos médicos probados y seguros, respaldados por la experiencia de la Dra. Daniela Creamer.",
                delay: 0.4
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: item.delay }}
                whileHover={{ y: -10 }}
                className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl hover:border-[#deb887]/30 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#deb887]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#deb887] transition-colors duration-500 shadow-inner">
                    <item.icon className="w-8 h-8 text-[#deb887] group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold mb-4 text-gray-900 group-hover:text-[#deb887] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs y Footer */}
      <Faq />
      {/*<Footer />*/}
    </>
  );
};

export default Home;
