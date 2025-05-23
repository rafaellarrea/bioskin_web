import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Services from './pages/Services';
import Results from './pages/Results';
import Diagnosis from './pages/Diagnosis';
import Products from './pages/Products';
import Appointment from './pages/Appointment';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/servicios" element={<Services />} />
        <Route path="/resultados" element={<Results />} />
        <Route path="/diagnostico" element={<Diagnosis />} />
        <Route path="/productos" element={<Products />} />
        <Route path="/agenda-tu-cita" element={<Appointment />} />
        <Route path="/nosotros" element={<About />} />
        <Route path="/contacto" element={<Contact />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
