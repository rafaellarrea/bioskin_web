import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, MessageCircle } from 'lucide-react';
import Footer from '../components/Footer';
import { SEO } from '../components/SEO';

const Contact: React.FC = () => {
  return (
    <>
      <SEO 
        title="Contacto - BIOSKIN"
        description="Contáctanos para agendar tu cita en BIOSKIN Cuenca. Teléfono, dirección y horarios de atención."
        keywords="Contacto BIOSKIN, agendar cita, teléfono clínica estética Cuenca, dirección BIOSKIN"
      />
      
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Hero Section */}
        <section className="relative py-20 bg-black overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <img 
              src="/images/services/facial/facial-hero.jpg" 
              alt="Background" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-50"></div>
          
          <div className="container-custom relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-serif text-white mb-6"
            >
              Contáctanos
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-200 max-w-2xl mx-auto font-light"
            >
              Estamos aquí para responder tus preguntas y ayudarte a resaltar tu belleza natural.
            </motion.p>
          </div>
        </section>

        <section className="py-20 -mt-10 relative z-20">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Info Card */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-8 md:p-12">
                  <h2 className="text-3xl font-serif text-gray-900 mb-8">Información de Contacto</h2>
                  
                  <div className="space-y-8">
                    {/* Address */}
                    <motion.div 
                      whileHover={{ x: 10 }}
                      className="flex items-start group"
                    >
                      <div className="bg-[#deb887]/10 p-4 rounded-xl mr-6 group-hover:bg-[#deb887] transition-colors duration-300">
                        <MapPin className="w-6 h-6 text-[#deb887] group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Dirección</h3>
                        <p className="text-gray-600">Av. Ordoñez Lasso y calle del Culantro</p>
                        <p className="text-gray-500 text-sm mt-1">Edificio Torre Victoria, Planta Baja</p>
                        <p className="text-gray-500 text-sm">Cuenca, Ecuador</p>
                      </div>
                    </motion.div>

                    {/* Phone */}
                    <motion.div 
                      whileHover={{ x: 10 }}
                      className="flex items-start group"
                    >
                      <div className="bg-[#deb887]/10 p-4 rounded-xl mr-6 group-hover:bg-[#deb887] transition-colors duration-300">
                        <Phone className="w-6 h-6 text-[#deb887] group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Teléfono</h3>
                        <p className="text-gray-600">+593 969 890 689</p>
                        <p className="text-gray-500 text-sm mt-1">Lunes a Viernes 9am - 7pm</p>
                      </div>
                    </motion.div>

                    {/* Email */}
                    <motion.div 
                      whileHover={{ x: 10 }}
                      className="flex items-start group"
                    >
                      <div className="bg-[#deb887]/10 p-4 rounded-xl mr-6 group-hover:bg-[#deb887] transition-colors duration-300">
                        <Mail className="w-6 h-6 text-[#deb887] group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Email</h3>
                        <p className="text-gray-600">salud.bioskin@gmail.com</p>
                        <p className="text-gray-500 text-sm mt-1">Respuesta en 24-48 horas</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Social Media */}
                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Síguenos en Redes Sociales</h3>
                    <div className="flex space-x-4">
                      <motion.a 
                        whileHover={{ y: -5 }}
                        href="https://www.facebook.com/share/1BWcENMrip/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-blue-50 text-blue-600 p-4 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <Facebook className="w-6 h-6" />
                      </motion.a>
                      <motion.a 
                        whileHover={{ y: -5 }}
                        href="https://www.instagram.com/salud.bioskin?igsh=dnN2djR6dm94OGFq" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-pink-50 text-pink-600 p-4 rounded-full hover:bg-pink-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <Instagram className="w-6 h-6" />
                      </motion.a>
                      <motion.a 
                        whileHover={{ y: -5 }}
                        href="https://wa.me/593969890689" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-green-50 text-green-600 p-4 rounded-full hover:bg-green-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </motion.a>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Map & Hours Card */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
              >
                <div className="h-[400px] relative">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src="https://maps.google.com/maps?q=-2.878367,-79.068850&z=16&output=embed"
                    title="Ubicación Bio Skin Salud y Estética"
                    className="grayscale hover:grayscale-0 transition-all duration-500"
                  ></iframe>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-20 pointer-events-none"></div>
                </div>
                
                <div className="p-8 md:p-12 bg-gray-900 text-white flex-grow">
                  <div className="flex items-center mb-6">
                    <Clock className="w-6 h-6 text-[#deb887] mr-3" />
                    <h3 className="text-2xl font-serif">Horario de Atención</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                      <span className="text-gray-300">Lunes - Viernes</span>
                      <span className="font-semibold text-[#deb887]">9:00 AM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                      <span className="text-gray-300">Sábados</span>
                      <span className="font-semibold text-[#deb887]">9:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-300">Domingos</span>
                      <span className="text-red-400 font-medium">Cerrado</span>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <p className="text-sm text-gray-400 text-center">
                      * Atendemos previa cita para brindarte la mejor experiencia personalizada.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Contact;
