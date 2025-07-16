import React from 'react';
import Footer from '../components/Footer';
import Faq from '../pages/Faq';
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
      {/* Hero principal con fondo y superposición */}
      <section id="home" className="relative min-h-screen flex items-center">
        {/* Imagen de fondo + overlay oscuro */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/logo/logo1.jpg"
            alt="BIOSKIN BY DRA DANIELA CREAMER"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Contenido principal */}
        <div className="container-custom relative z-10 mt-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Descubre Tu Mejor Versión con Bio Skin
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Tratamientos faciales avanzados, personalizados y con resultados visibles.
            </p>
            {/* === BOTONES ACCIÓN PRINCIPALES === */}
            <div className="flex flex-col w-full max-w-lg mx-auto gap-3 px-4 mt-6">
              <a
                href="#services"
                className="btn-primary w-full text-center text-lg"
                style={{ minHeight: 48 }}
              >
                Nuestros Servicios
              </a>
              <a
                href="#appointment"
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-medium py-2 px-6 rounded-md transition-all duration-300 w-full text-center text-lg"
                style={{ minHeight: 48 }}
              >
                Agenda tu Cita
              </a>
              <Link
                to="/products/aparatologia"
                className="btn-primary w-full text-center text-lg"
                style={{ minHeight: 48 }}
              >
                Ver Aparatología
              </Link>
            </div>
            {/* === FIN BOTONES === */}
          </div>
        </div>
      </section>

      {/* SECCIÓN DE BENEFICIOS - Mover FUERA del hero para que no tape los botones */}
      <section className="bg-white py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Bloque: Tecnología */}
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
            {/* Bloque: Atención */}
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
            {/* Bloque: Resultados */}
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
      </section>

      {/* FAQs y Footer */}
      <Faq />
      <Footer />
    </>
  );
};

export default Home;
