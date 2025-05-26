import React from 'react';
import FaqItem from '../components/FaqItem';
import Footer from '../components/Footer';

const Faq = () => {
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

  return (
<>
    <section id="faq" className="py-24">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Preguntas Frecuentes</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Resolvemos tus dudas sobre nuestros tratamientos y servicios.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="divide-y divide-gray-200">
            {faqItems.map((item, index) => (
              <FaqItem
                key={index}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">
              ¿No encuentras la respuesta que buscas? Contáctanos directamente.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
              <a
                href="https://wa.me/593969890689"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                WhatsApp
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center border border-[#deb887] text-[#deb887] hover:bg-[#deb887] hover:text-white font-medium py-2 px-4 rounded-md transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Contacto
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
 <Footer />
    </>

  );
};

export default Faq;
