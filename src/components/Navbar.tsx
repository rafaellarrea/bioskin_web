import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Home, 
  Scissors, 
  Trophy, 
  Search, 
  Package, 
  BookOpen, 
  Calendar, 
  Users, 
  HelpCircle, 
  MessageCircle,
  Menu,
  X,
  Sparkles,
  Star
} from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);

  // Detectar scroll para efectos
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home, color: 'from-pink-500 to-rose-500' },
    { path: '/services', label: 'Servicios', icon: Scissors, color: 'from-purple-500 to-indigo-500' },
    { path: '/results', label: 'Resultados', icon: Trophy, color: 'from-amber-500 to-orange-500' },
    { path: '/diagnosis', label: 'Diagnóstico', icon: Search, color: 'from-emerald-500 to-teal-500' },
    { path: '/products', label: 'Productos', icon: Package, color: 'from-blue-500 to-cyan-500' },
    { path: '/blogs', label: 'Blog', icon: BookOpen, color: 'from-violet-500 to-purple-500' },
    { path: '/appointment', label: 'Agenda', icon: Calendar, color: 'from-red-500 to-pink-500' },
    { path: '/about', label: 'Nosotros', icon: Users, color: 'from-green-500 to-emerald-500' },
    { path: '/faq', label: 'FAQ', icon: HelpCircle, color: 'from-yellow-500 to-amber-500' },
    { path: '/contact', label: 'Contacto', icon: MessageCircle, color: 'from-indigo-500 to-blue-500' }
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
          ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-[#deb887]/20' 
          : 'bg-white/90 backdrop-blur-md shadow-lg'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo con efecto brillante */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-[#deb887] group-hover:animate-spin transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#deb887] to-amber-400 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#deb887] to-amber-600 bg-clip-text text-transparent">
                BIOSKIN
              </span>
            </Link>

            {/* Desktop Navigation - Diseño futurista */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative group px-4 py-2 rounded-xl transition-all duration-300 ${
                      active 
                        ? 'text-white' 
                        : 'text-gray-600 hover:text-white'
                    }`}
                    onMouseEnter={() => setActiveHover(item.path)}
                    onMouseLeave={() => setActiveHover(null)}
                  >
                    {/* Fondo dinámico con gradiente */}
                    <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                      active 
                        ? `bg-gradient-to-r ${item.color} opacity-100 shadow-lg` 
                        : activeHover === item.path
                          ? `bg-gradient-to-r ${item.color} opacity-90 shadow-md`
                          : 'bg-transparent group-hover:bg-gradient-to-r group-hover:from-[#deb887]/20 group-hover:to-amber-200/20'
                    }`}></div>
                    
                    {/* Contenido del enlace */}
                    <div className="relative flex items-center space-x-2">
                      <Icon className={`w-4 h-4 transition-transform duration-300 ${
                        active || activeHover === item.path ? 'scale-110' : 'group-hover:scale-105'
                      }`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>

                    {/* Efecto de brillo */}
                    {(active || activeHover === item.path) && (
                      <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
                    )}

                    {/* Indicador activo */}
                    {active && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-white rounded-full shadow-lg"></div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Botón CTA especial */}
            <div className="hidden lg:flex">
              <Link
                to="/appointment"
                className="relative group bg-gradient-to-r from-[#deb887] to-amber-500 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Reserva Ahora</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-gradient-to-r from-[#deb887] to-amber-500 text-white transition-all duration-300 hover:shadow-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          
          <div className="fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-2xl border-b border-[#deb887]/20 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 p-4 rounded-xl transition-all duration-300 ${
                      active 
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-[1.02]` 
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-[#deb887]/10 hover:to-amber-200/10'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'animate-pulse' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                    {active && <Star className="w-4 h-4 ml-auto" />}
                  </Link>
                );
              })}
              
              {/* CTA especial en mobile */}
              <div className="pt-4 border-t border-[#deb887]/20">
                <Link
                  to="/appointment"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-[#deb887] to-amber-500 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Star className="w-5 h-5" />
                  <span>Reserva tu Cita</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Espaciador para el contenido */}
      <div className="h-16"></div>
    </>
  );
}
