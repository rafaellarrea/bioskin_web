import React from 'react';
import { motion } from 'framer-motion';
import ServiceCard from '../components/ServiceCard';
import Footer from '../components/Footer';
import { services as servicesData } from '../data/services';
import { SEO } from '../components/SEO';
import { Sparkles, Gift, Clock, Check } from 'lucide-react';

const Services = () => {
  // Mapear servicios desde la fuente centralizada
  const services = servicesData.map(service => ({
    id: service.id,
    title: service.title,
    description: service.description,
    price: service.price,
    image: service.image
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <>
      <SEO 
        title="Servicios Estéticos"
        description="Conoce nuestros tratamientos faciales y corporales en BIOSKIN Cuenca. Tecnología avanzada para el cuidado de tu piel."
        keywords="Servicios estéticos Cuenca, tratamientos faciales, corporales, láser, BIOSKIN"
      />
      
      {/* Header Section */}
      <section className="relative py-24 bg-gray-900 overflow-hidden">
         <div className="absolute inset-0 opacity-30">
            <img src="/images/logo/logo1.jpg" className="w-full h-full object-cover" alt="Background" />
         </div>
         <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-gray-50" />
         
         <div className="container-custom relative z-10 text-center mt-10">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-serif text-white mb-6"
            >
              Nuestros <span className="text-[#deb887] italic">Servicios</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-gray-300 max-w-2xl mx-auto text-lg font-light"
            >
              Tecnología de vanguardia y protocolos personalizados para revelar tu mejor versión en nuestra clínica en Cuenca.
            </motion.p>
         </div>
      </section>

      <section id="services" className="py-20 bg-gray-50 -mt-10 relative z-20 rounded-t-[3rem]">
        <div className="container-custom">
          
          {/* Services Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service, index) => (
              <motion.div key={index} variants={itemVariants}>
                <ServiceCard
                  id={service.id}
                  title={service.title}
                  description={service.description}
                  price={service.price}
                  image={service.image}
                  index={index}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Promotions Section - Redesigned */}
          <div className="mt-32">
            <div className="text-center mb-16">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#deb887]/10 rounded-full text-[#deb887] font-medium mb-4"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ofertas Exclusivas</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Packs & Promociones</h2>
            </div>

            {/* Featured Promo */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden bg-gray-900 text-white shadow-2xl mb-20"
            >
              <div className="absolute inset-0 bg-[url('/images/logo/logo1.jpg')] bg-cover bg-center opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
              
              <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                  <div className="inline-block px-4 py-1 bg-[#deb887] text-white text-sm font-bold rounded-full mb-6">
                    PROMOCIÓN DEL MES
                  </div>
                  <h3 className="text-3xl md:text-5xl font-serif mb-4 leading-tight">Hollywood Peel + <br/>Hidratación Profunda</h3>
                  <p className="text-gray-300 text-lg mb-8 max-w-xl">
                    El tratamiento favorito de las celebridades. Unifica el tono, cierra poros y revitaliza tu piel en una sola sesión con resultados inmediatos.
                  </p>
                  <div className="flex items-end gap-4 mb-8">
                    <span className="text-5xl font-bold text-[#deb887]">$50</span>
                    <span className="text-xl text-gray-400 line-through mb-2">$80</span>
                  </div>
                  <motion.a 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="#appointment" 
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition-colors"
                  >
                    Reservar Ahora <Gift className="w-5 h-5" />
                  </motion.a>
                </div>
                
                {/* Visual Element for Promo */}
                <div className="hidden md:block w-1/3">
                   <div className="w-full aspect-square rounded-full border-2 border-[#deb887]/30 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border border-[#deb887]/10 animate-ping" />
                      <div className="text-center">
                        <Clock className="w-12 h-12 text-[#deb887] mx-auto mb-2" />
                        <span className="text-sm text-[#deb887] font-medium">Tiempo Limitado</span>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Other Packs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Pack 1 */}
               <motion.div 
                 whileHover={{ y: -10 }}
                 className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:border-[#deb887]/50 transition-all"
               >
                 <h4 className="text-xl font-bold mb-2">Pack Rejuvenecimiento</h4>
                 <div className="h-1 w-12 bg-[#deb887] mb-6" />
                 <ul className="space-y-3 mb-8 text-gray-600 text-sm">
                   <li className="flex gap-2"><Check className="w-4 h-4 text-[#deb887]" /> Diagnóstico Facial</li>
                   <li className="flex gap-2"><Check className="w-4 h-4 text-[#deb887]" /> HIFU 7D (Lifting)</li>
                   <li className="flex gap-2"><Check className="w-4 h-4 text-[#deb887]" /> Limpieza Profunda</li>
                 </ul>
                 <div className="flex justify-between items-center border-t pt-6">
                   <div>
                     <span className="block text-xs text-gray-400">Precio Pack</span>
                     <span className="text-2xl font-bold text-[#deb887]">$100</span>
                     <span className="text-xs text-green-600 ml-2 font-medium">Ahorra $20</span>
                   </div>
                   <a href="#appointment" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors">Agendar</a>
                 </div>
               </motion.div>

               {/* Pack 2 */}
               <motion.div 
                 whileHover={{ y: -10 }}
                 className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:border-[#deb887]/50 transition-all relative overflow-hidden"
               >
                 <div className="absolute top-0 right-0 bg-[#deb887] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                 <h4 className="text-xl font-bold mb-2">Pack Luminosidad</h4>
                 <div className="h-1 w-12 bg-[#deb887] mb-6" />
                 <ul className="space-y-3 mb-8 text-gray-600 text-sm">
                   <li className="flex gap-2"><Check className="w-4 h-4 text-[#deb887]" /> Hollywood Peel</li>
                   <li className="flex gap-2"><Check className="w-4 h-4 text-[#deb887]" /> Dermapen + Vitaminas</li>
                   <li className="flex gap-2"><Check className="w-4 h-4 text-[#deb887]" /> Sesión Exosomas</li>
                 </ul>
                 <div className="flex justify-between items-center border-t pt-6">
                   <div>
                     <span className="block text-xs text-gray-400">Precio Pack</span>
                     <span className="text-2xl font-bold text-[#deb887]">$170</span>
                     <span className="text-xs text-green-600 ml-2 font-medium">Ahorra $20</span>
                   </div>
                   <a href="#appointment" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors">Agendar</a>
                 </div>
               </motion.div>

               {/* Pack 3 */}
               <motion.div 
                 whileHover={{ y: -10 }}
                 className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:border-[#deb887]/50 transition-all"
               >
                 <h4 className="text-xl font-bold mb-2">Pack Completo</h4>
                 <div className="h-1 w-12 bg-[#deb887] mb-6" />
                 <ul className="space-y-3 mb-8 text-gray-600 text-sm">
                   <li className="flex gap-2"><Check className="w-4 h-4 text-[#deb887]" /> Diagnóstico IA</li>
                   <li className="flex gap-2"><Check className="w-4 h-4 text-[#deb887]" /> Limpieza Premium</li>
                   <li className="flex gap-2"><Check className="w-4 h-4 text-[#deb887]" /> 2 Sesiones Personalizadas</li>
                 </ul>
                 <div className="flex justify-between items-center border-t pt-6">
                   <div>
                     <span className="block text-xs text-gray-400">Precio Pack</span>
                     <span className="text-2xl font-bold text-[#deb887]">$90</span>
                     <span className="text-xs text-green-600 ml-2 font-medium">Ahorra $15</span>
                   </div>
                   <a href="#appointment" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors">Agendar</a>
                 </div>
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* QR Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container-custom px-6 text-center">
          <h2 className="text-xl md:text-2xl font-serif text-[#deb887] mb-8">Guarda nuestro Catálogo</h2>
          <div className="flex flex-col items-center">
             <div className="p-4 bg-white shadow-xl rounded-2xl border border-gray-100 transform hover:scale-105 transition-transform duration-300">
                <img src="/images/qr/services.png" alt="QR Servicios" className="w-40 h-40 object-contain mix-blend-multiply" />
             </div>
             <p className="mt-4 text-sm text-gray-500 font-light">Escanea para acceder rápidamente a nuestros servicios</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Services;
