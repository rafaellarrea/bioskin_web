import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

type NavbarProps = {
  activeSection: string;
};

const Navbar = ({ activeSection }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { id: 'home', label: 'Inicio' },
    { id: 'services', label: 'Servicios' },
    { id: 'results', label: 'Resultados' },
    { id: 'diagnosis', label: 'Diagnóstico Facial' },
    { id: 'products', label: 'Productos' },
    { id: 'appointment', label: 'Agenda tu Cita' },
    { id: 'about', label: 'Nosotros' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contacto' },
  ];

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container-custom flex justify-between items-center">
      
	<a href="#home" className="flex items-center space-x-2">
  <img 
    src="/images/logo/logo.png" 
    alt="Logo Bio Skin" 
    className="h-10 w-auto"
  />
  <span className="text-xl md:text-2xl font-bold">
    <span className="text-[#deb887]">BIO SKIN</span>{' '}
    <span className={isScrolled ? 'text-gray-800' : 'text-white'}>SALUD Y ESTÉTICA</span>
  </span>
</a>


        <nav className="hidden lg:block">
          <ul className="flex space-x-6">
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => scrollToSection(link.id)}
                  className={`relative px-1 py-2 text-sm font-medium ${
                    activeSection === link.id
                      ? 'text-[#deb887]'
                      : isScrolled
                      ? 'text-gray-800 hover:text-[#deb887]'
                      : 'text-white hover:text-[#deb887]'
                  } transition-colors duration-300`}
                >
                  {link.label}
                  {activeSection === link.id && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#deb887] rounded-full"></span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <button
          className="lg:hidden text-[#deb887] p-2"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={`fixed top-[60px] left-0 w-full h-[calc(100vh-60px)] bg-white z-40 transform transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="container-custom py-6">
          <ul className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => scrollToSection(link.id)}
                  className={`block w-full text-left py-2 px-4 rounded-md ${
                    activeSection === link.id
                      ? 'bg-[#deb887]/10 text-[#deb887]'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;