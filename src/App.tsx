import { useState, useEffect } from 'react';
import { Menu, X, ChevronUp } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import Results from './pages/Results';
import Diagnosis from './pages/Diagnosis';
import Appointment from './pages/Appointment';
import About from './pages/About';
import Faq from './pages/Faq';
import Contact from './pages/Contact';
import Products from './pages/Products';
import WhatsAppButton from './components/WhatsAppButton';

function App() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY;

    sections.forEach((section) => {
      const sectionTop = (section as HTMLElement).offsetTop - 100;
      const sectionHeight = (section as HTMLElement).offsetHeight;
      const sectionId = section.getAttribute('id') || '';

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        setActiveSection(sectionId);
      }
    });

    if (window.scrollY > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      <Navbar activeSection={activeSection} />
      <main>
        <Home />
        <Services />
        <Results />
        <Diagnosis />
        <Products />
        <Appointment />
        <About />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
      
      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-8 z-40 bg-[#deb887] text-white p-3 rounded-full shadow-lg transition-all duration-300 ${
          showScrollTop ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        aria-label="Scroll to top"
      >
        <ChevronUp size={24} />
      </button>
    </div>
  );
}

export default App;