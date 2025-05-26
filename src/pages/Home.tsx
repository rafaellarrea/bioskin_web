import React from 'react';
import Footer from '../components/Footer';
import Faq from '../pages/Faq';
{/*
const faqItems = [
    {
      question: "¿Cuánto tiempo duran los resultados de los tratamientos?",
      answer: "La duración de los resultados varía según el tipo de tratamiento y factores individuales como el tipo de piel, edad y estilo de vida. En general, los tratamientos como el antiaging requieren mantenimiento periódico, mientras que procedimientos como la remoción de manchas pueden tener resultados más duraderos. En tu consulta inicial, te proporcionaremos información específica sobre la duración esperada y recomendaciones de mantenimiento para tu caso particular."
    },
    {
      question: "¿Los tratamientos son dolorosos?",
      answer: "La mayoría de nuestros tratamientos son mínimamente invasivos y causan poca o ninguna molestia. Para procedimientos que puedan generar alguna sensación, utilizamos técnicas de enfriamiento y, en caso necesario, anestésicos tópicos para garantizar tu comodidad. El nivel de sensibilidad varía según la persona y el tipo de tratamiento, pero nuestro equipo siempre prioriza tu bienestar durante todo el proceso."
    },
    {
      question: "¿Cuánto tiempo de recuperación necesito después de un tratamiento?",
      answer: "La mayoría de nuestros tratamientos faciales no requieren tiempo de inactividad, permitiéndote volver inmediatamente a tus actividades normales. Algunos procedimientos más intensivos como peelings profundos o tratamientos con dermapen pueden causar enrojecimiento temporal o descamación leve que generalmente se resuelve en 24-72 horas. Te proporcionaremos instrucciones detalladas de cuidado posterior para optimizar la recuperación y los resultados."
    },
    {
      question: "¿Cuántas sesiones necesitaré para ver resultados?",
      answer: "El número de sesiones varía según el tratamiento y tus objetivos específicos. Algunos procedimientos como la hidratación profunda muestran resultados inmediatos, mientras que tratamientos como antimanchas o remoción de tatuajes requieren múltiples sesiones para resultados óptimos. Durante tu consulta inicial, desarrollaremos un plan personalizado detallando el número recomendado de sesiones y la frecuencia para lograr tus objetivos."
    },
    {
      question: "¿Los productos que utilizan son hipoalergénicos?",
      answer: "Utilizamos productos de grado médico y formulaciones hipoalergénicas adecuadas para pieles sensibles. Nuestra selección de productos está cuidadosamente evaluada para minimizar riesgos de reacciones alérgicas. Siempre realizamos una evaluación detallada de tu historial de alergias y sensibilidades antes de recomendar cualquier tratamiento o producto."
    },
    {
      question: "¿Puedo combinar diferentes tratamientos?",
      answer: "Sí, de hecho, muchos de nuestros protocolos más efectivos combinan diferentes tecnologías y técnicas para potenciar resultados. Nuestro enfoque personalizado nos permite diseñar combinaciones seguras y eficaces según tus necesidades específicas. En la consulta inicial evaluaremos qué combinaciones son más beneficiosas para ti y crearemos un plan integral de tratamiento."
    },
    {
      question: "¿Es necesario realizar un diagnóstico facial antes de cualquier tratamiento?",
      answer: "Sí, recomendamos comenzar con un diagnóstico facial para todos nuestros pacientes. Esta evaluación nos permite identificar con precisión las condiciones específicas de tu piel, factores subyacentes que puedan estar afectándola, y determinar el protocolo de tratamiento más efectivo. El diagnóstico nos proporciona una línea base para medir el progreso y ajustar tratamientos según sea necesario."
    },
    {
      question: "¿Ofrecen planes o paquetes de tratamiento?",
      answer: "Sí, ofrecemos varios paquetes diseñados para optimizar resultados y proporcionar valor. Estos paquetes combinan tratamientos complementarios a un precio reducido en comparación con sesiones individuales. También creamos planes personalizados basados en tus objetivos específicos y presupuesto. Todos nuestros paquetes incluyen consultas de seguimiento para evaluar el progreso."
    }
  ];
*/}


const Home = () => {
  return (
    <>
      <section id="home" className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/logo/logo1.jpg"
            alt="BIOSKIN BY DRA DANIELA CREAMER"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        <div className="container-custom relative z-10 mt-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Descubre Tu Mejor Versión con Bio Skin
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Tratamientos faciales avanzados, personalizados y con resultados visibles.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <a href="#services" className="btn-primary">
                Nuestros Servicios
              </a>
              <a 
                href="#appointment"
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-medium py-2 px-6 rounded-md transition-all duration-300 inline-block text-center"
              >
                Agenda tu Cita
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white py-8 z-10">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start space-x-4">
                <div className="bg-[#deb887]/10 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#deb887]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Tecnología Avanzada</h3>
                  <p className="text-gray-600 text-sm">Equipos de última generación para tratamientos efectivos.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-[#deb887]/10 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#deb887]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Atención Personalizada</h3>
                  <p className="text-gray-600 text-sm">Cada tratamiento adaptado a tus necesidades específicas.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-[#deb887]/10 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#deb887]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Resultados Garantizados</h3>
                  <p className="text-gray-600 text-sm">Protocolos de tratamiento con eficacia comprobada.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    {/*
  <section className="bg-white py-24">
        <div className="container-custom text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Preguntas Frecuentes</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Resolvemos tus dudas sobre nuestros tratamientos y servicios.
          </p>
        </div>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="divide-y divide-gray-200">
            {faqItems.map((item, index) => (
              <FaqItem key={index} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>
*/}
<Faq />
      <Footer />
    </>
  );
};

export default Home;
