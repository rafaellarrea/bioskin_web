import { HashRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './pages/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Services from './pages/Services';
import Results from './pages/Results';
import Diagnosis from './pages/Diagnosis';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import Appointment from './pages/Appointment';
import About from './pages/About';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import BlogAdminPage from './pages/BlogAdminPage';

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

          {/* RUTAS DE PRODUCTOS - el orden importa */}
          <Route path="/products/aparatologia" element={<Products initialCategory="equipment" />} />
          <Route path="/products/cosmeticos" element={<Products initialCategory="cosmetic" />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/products" element={<Products />} />

          {/* RUTAS DE BLOG */}
          <Route path="/blogs/admin" element={<BlogAdminPage />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/blogs" element={<Blogs />} />

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
