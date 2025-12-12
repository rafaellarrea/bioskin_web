import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Search, 
  Menu,
  X,
  Facebook,
  Instagram,
  User,
  ShoppingCart
} from 'lucide-react';
import AISearch from './AISearch';

export default function Navbar() {
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detectar scroll para efectos
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Inicio' },
    { path: '/services', label: 'Servicios' },
    { path: '/products', label: 'Productos' },
    { path: '/blogs', label: 'Blog' },
    { path: '/about', label: 'Nosotros' },
    { path: '/contact', label: 'Contacto' },
    { path: '/appointment', label: 'Agenda' }
  ];

  const isActive = (path: string) => {
    if (path === '/blogs') return pathname.startsWith('/blogs');
    return pathname === path;
  };

  return (
    <>
      {/* Navegación Principal - Desktop & Mobile */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100' 
          : 'bg-white/90 backdrop-blur-md'
      }`}>
        <div className="container mx-auto px-6">
          {/* Main Row */}
          <div className="flex items-center justify-between h-20">
            
            {/* Logo - Clean & Minimalist */}
            <Link to="/" className="flex items-center group">
              <span className="text-2xl font-light tracking-[0.2em] text-gray-800 group-hover:text-[#deb887] transition-colors duration-300">
                BIOSKIN
              </span>
            </Link>

            {/* Desktop Navigation - Clean Center */}
            <div className="hidden lg:flex items-center justify-center space-x-8">
              {navItems.map((item) => {
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-xs uppercase tracking-[0.2em] transition-all duration-300 relative group ${
                      active 
                        ? 'text-[#deb887] font-medium' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                    <span className={`absolute -bottom-2 left-0 w-full h-0.5 bg-[#deb887] transform origin-left transition-transform duration-300 ${
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}></span>
                  </Link>
                );
              })}
            </div>

            {/* Right Section - Icons & Search */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Social Icons */}
              <div className="flex items-center space-x-4 border-r border-gray-200 pr-6">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#deb887] transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#deb887] transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>

              {/* Utility Icons */}
              <div className="flex items-center space-x-4">
                <button className="text-gray-400 hover:text-[#deb887] transition-colors">
                  <User className="w-4 h-4" />
                </button>
                <Link to="/products" className="text-gray-400 hover:text-[#deb887] transition-colors">
                  <ShoppingCart className="w-4 h-4" />
                </Link>
                {/* Search Component */}
                <div className="w-64">
                  <AISearch inline={true} variant="bar" className="scale-90 origin-right" />
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-4">
              <AISearch inline={true} variant="icon" />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 hover:text-[#deb887] transition-colors p-2"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
        isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`absolute top-0 right-0 w-[80%] max-w-sm h-full bg-white shadow-2xl transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full pt-24 pb-6 px-6">
            <div className="space-y-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block text-lg uppercase tracking-widest ${
                    isActive(item.path)
                      ? 'text-[#deb887] font-medium'
                      : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-gray-100">
              <div className="flex justify-center space-x-8">
                <a href="#" className="text-gray-400 hover:text-[#deb887]">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#deb887]">
                  <Instagram className="w-5 h-5" />
                </a>
                <Link to="/products" className="text-gray-400 hover:text-[#deb887]">
                  <ShoppingCart className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
