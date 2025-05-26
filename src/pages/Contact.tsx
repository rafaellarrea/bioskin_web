import React from 'react';
import Footer from '../components/Footer';

const Contact: React.FC = () => {
  return (
    <>
      <section id="contact" className="py-24 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="section-title">Contacto</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Estamos aquí para responder tus preguntas y atender tus necesidades. No dudes en ponerte en contacto con nosotros.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Información de Contacto */}
            <div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-2xl font-semibold mb-6">Información de Contacto</h3>
                  <div className="space-y-6">
                    {/* Dirección */}
                    <div className="flex items-start">
                      <div className="bg-[#deb887]/10 p-3 rounded-lg mr-4">
                        {/* Icono de ubicación */}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Dirección</h4>
                        <p className="text-gray-600">Cuenca, Ecuador</p>
                        <p className="text-gray-500 text-sm mt-1">A dos cuadras del Parque de la Madre</p>
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div className="flex items-start">
                      <div className="bg-[#deb887]/10 p-3 rounded-lg mr-4">
                        {/* Icono de teléfono */}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Teléfono</h4>
                        <p className="text-gray-600">+593 969 890 689</p>
                        <p className="text-gray-500 text-sm mt-1">Lunes a Viernes 9am - 7pm</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start">
                      <div className="bg-[#deb887]/10 p-3 rounded-lg mr-4">
                        {/* Icono de email */}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Email</h4>
                        <p className="text-gray-600">salud.bioskin@gmail.com</p>
                        <p className="text-gray-500 text-sm mt-1">Respuesta en 24-48 horas</p>
                      </div>
                    </div>
                  </div>

                  {/* Redes Sociales */}
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h4 className="font-semibold mb-4">Síguenos en Redes Sociales</h4>
                    <div className="flex space-x-4">
                      {/* Facebook */}
                      <a href="https://www.facebook.com/share/1BWcENMrip/" target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-600 p-3 rounded-full hover:bg-blue-600 hover:text-white transition-colors duration-300">
                        {/* Icono Facebook */}
                      </a>
                      {/* Instagram */}
                      <a href="https://www.instagram.com/salud.bioskin?igsh=dnN2djR6dm94OGFq" target="_blank" rel="noopener noreferrer" className="bg-pink-100 text-pink-600 p-3 rounded-full hover:bg-pink-600 hover:text-white transition-colors duration-300">
                        {/* Icono Instagram */}
                      </a>
                      {/* WhatsApp */}
                      <a href="https://wa.me/593969890689" target="_blank" rel="noopener noreferrer" className="bg-green-100 text-green-600 p-3 rounded-full hover:bg-green-600 hover:text-white transition-colors duration-300">
                        {/* Icono WhatsApp */}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mapa y Horario */}
            <div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
                <div className="h-[400px]">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src="https://maps.google.com/maps?q=-2.881413,-79.061966&z=16&output=embed"
                    title="Ubicación Bio Skin Salud y Estética"
                  ></iframe>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold mb-4">Horario de Atención</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-600 font-medium">Lunes - Viernes:</p>
                      <p className="text-gray-500 text-sm">9:00 AM - 7:00 PM</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Sábados:</p>
                      <p className="text-gray-500 text-sm">9:00 AM - 4:00 PM</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Domingos:</p>
                      <p className="text-gray-500 text-sm">Cerrado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Contact;
