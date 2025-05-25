import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  const baseLink = "whitespace-nowrap text-sm font-medium px-3 py-2 rounded-md transition-colors duration-200";
  const active = "bg-[#deb887] text-white";
  const inactive = "text-gray-600 hover:text-[#deb887]";

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="overflow-x-auto">
        <ul className="flex space-x-3 p-4 min-w-max w-full justify-start">
          <li><Link to="/" className={`${baseLink} ${pathname === '/' ? active : inactive}`}>Inicio</Link></li>
          <li><Link to="/services" className={`${baseLink} ${pathname === '/services' ? active : inactive}`}>Servicios</Link></li>
          <li><Link to="/results" className={`${baseLink} ${pathname === '/results' ? active : inactive}`}>Resultados</Link></li>
          <li><Link to="/diagnosis" className={`${baseLink} ${pathname === '/diagnosis' ? active : inactive}`}>Diagnóstico</Link></li>
          <li><Link to="/products" className={`${baseLink} ${pathname === '/products' ? active : inactive}`}>Productos</Link></li>
          <li><Link to="/appointment" className={`${baseLink} ${pathname === '/appointment' ? active : inactive}`}>Agenda tu cita</Link></li>
          <li><Link to="/about" className={`${baseLink} ${pathname === '/about' ? active : inactive}`}>Nosotros</Link></li>
          <li><Link to="/faq" className={`${baseLink} ${pathname === '/faq' ? active : inactive}`}>Preguntas</Link></li>
          <li><Link to="/contact" className={`${baseLink} ${pathname === '/contact' ? active : inactive}`}>Contacto</Link></li>
        </ul>
      </div>
    </nav>
  );
}
