
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed w-full bg-white shadow-md z-50">
      <ul className="flex space-x-6 p-4 justify-center">
        <li>
          <Link to="/" className={pathname === '/' ? 'font-bold' : 'opacity-70'}>
            Inicio
          </Link>
        </li>
        <li>
          <Link to="/services" className={pathname === '/services' ? 'font-bold' : 'opacity-70'}>
            Servicios
          </Link>
        </li>
        <li>
          <Link to="/results" className={pathname === '/results' ? 'font-bold' : 'opacity-70'}>
            Resultados
          </Link>
        </li>
        <li>
          <Link to="/diagnosis" className={pathname === '/diagnosis' ? 'font-bold' : 'opacity-70'}>
            Diagnóstico
          </Link>
        </li>
        <li>
          <Link to="/products" className={pathname === '/products' ? 'font-bold' : 'opacity-70'}>
            Productos
          </Link>
        </li>
        <li>
          <Link to="/appointment" className={pathname === '/appointment' ? 'font-bold' : 'opacity-70'}>
            Agenda tu cita
          </Link>
        </li>
        <li>
          <Link to="/about" className={pathname === '/about' ? 'font-bold' : 'opacity-70'}>
            Nosotros
          </Link>
        </li>
        <li>
          <Link to="/contact" className={pathname === '/contact' ? 'font-bold' : 'opacity-70'}>
            Contacto
          </Link>
        </li>
      </ul>
    </nav>
  );
}
