
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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

console.log('Debug App.tsx loaded');

const App = () => {
  useEffect(() => {
    console.log('App component mounted');
  }, []);
  return (
    <HashRouter>
      <Navbar />
      <main className="mt-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/results" element={<Results />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/products" element={<Products />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </HashRouter>
  );
};

export default App;
