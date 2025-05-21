import React from 'react';

const Contact = () => {
  return (
    <section id="contact" className="py-24 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16 animate-fade-in" data-aos="fade-up">
          <h2 className="section-title">Contacto</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Estamos aquí para responder tus preguntas y atender tus necesidades. No dudes en ponerte en contacto con nosotros.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="animate-fade-in" data-aos="fade-right">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-6">Información de Contacto</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-[#deb887]/10 p-3 rounded-lg mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#deb887]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Dirección</h4>
                      <p className="text-gray-600">Cuenca, Ecuador</p>
                      <p className="text-gray-500 text-sm mt-1">A dos cuadras del Parque de la Madre</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#deb887]/10 p-3 rounded-lg mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#deb887]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Teléfono</h4>
                      <p className="text-gray-600">+593 969 890 689</p>
                      <p className="text-gray-500 text-sm mt-1">Lunes a Viernes 9am - 7pm</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#deb887]/10 p-3 rounded-lg mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#deb887]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Email</h4>
                      <p className="text-gray-600">salud.bioskin@gmail.com</p>
                      <p className="text-gray-500 text-sm mt-1">Respuesta en 24-48 horas</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h4 className="font-semibold mb-4">Síguenos en Redes Sociales</h4>
                  <div className="flex space-x-4">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-600 p-3 rounded-full hover:bg-blue-600 hover:text-white transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-pink-100 text-pink-600 p-3 rounded-full hover:bg-pink-600 hover:text-white transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </a>
                    <a href="https://wa.me/593969890689" target="_blank" rel="noopener noreferrer" className="bg-green-100 text-green-600 p-3 rounded-full hover:bg-green-600 hover:text-white transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="animate-fade-in" data-aos="fade-left">
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
              <div className="h-[400px]">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15949.099667966528!2d-79.01075383022462!3d-2.9001466500000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91cd18095fc7e881%3A0xafd08fd090de6ff7!2sCuenca%2C%20Ecuador!5e0!3m2!1ses!2sus!4v1700328286320!5m2!1ses!2sus" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
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
  );
};

export default Contact;