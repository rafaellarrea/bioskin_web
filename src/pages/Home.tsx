import React from 'react';
import Footer from '../components/Footer';
import FaqItem from '../components/FaqItem';

const faqItems = [
  {
    question: "¿Cuánto tiempo duran los resultados de los tratamientos?",
    answer: "La duración de los resultados varía según el tipo de tratamiento y factores individuales como el tipo de piel, edad y estilo de vida..."
  },
  {
    question: "¿Los tratamientos son dolorosos?",
    answer: "La mayoría de nuestros tratamientos son mínimamente invasivos y causan poca o ninguna molestia..."
  },
  {
    question: "¿Cuánto tiempo de recuperación necesito después de un tratamiento?",
    answer: "La mayoría de nuestros tratamientos faciales no requieren tiempo de inactividad..."
  }
];

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
              <a href="#services" className="btn-primary">Nuestros Servicios</a>
              <a href="#appointment" className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-medium py-2 px-6 rounded-md transition-all duration-300 inline-block text-center">
                Agenda tu Cita
              </a>
            </div>
          </div>
        </div>
      </section>

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

      <Footer />
    </>
  );
};

export default Home;
