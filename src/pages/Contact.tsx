import React from 'react';
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
<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#deb887]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
  <circle cx="12" cy="10" r="3"></circle>
</svg>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Dirección</h4>
                        <p className="text-gray-600">Cuenca, Ecuador</p>
                        <p className="text-gray-500 text-sm mt-1">Av. Ordoñez Lasso y calle de la Menta, Centro Médico Santa María, 2do piso, Cons. 203</p>
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
<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
                      </a>
                      {/* Instagram */}
                      <a href="https://www.instagram.com/salud.bioskin?igsh=dnN2djR6dm94OGFq" target="_blank" rel="noopener noreferrer" className="bg-pink-100 text-pink-600 p-3 rounded-full hover:bg-pink-600 hover:text-white transition-colors duration-300">
                        {/* Icono Instagram */}
<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
                      </a>
                      {/* WhatsApp */}
                      <a href="https://wa.me/593969890689" target="_blank" rel="noopener noreferrer" className="bg-green-100 text-green-600 p-3 rounded-full hover:bg-green-600 hover:text-white transition-colors duration-300">
                        {/* Icono WhatsApp */}
<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
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
