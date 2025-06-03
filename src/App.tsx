import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './pages/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Services from './pages/Services';
import Results from './pages/Results';
import Diagnosis from './pages/Diagnosis';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail'; // <--- Importante
import Appointment from './pages/Appointment';
import About from './pages/About';
import Contact from './pages/Contact';
import Faq from './pages/Faq';

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/results" element={<Results />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          {/* La ruta dinámica de detalle ANTES de la general */}
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
