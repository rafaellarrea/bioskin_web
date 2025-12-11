// src/pages/Products.tsx

import React, { useState, useEffect } from 'react';
import products from '../data/products';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { slugify } from '../utils/slugify';
import { Link, useLocation } from 'react-router-dom';
import { SEO } from '../components/SEO';

type ProductsProps = {
  initialCategory?: 'all' | 'equipment' | 'cosmetic';
};

const Products: React.FC<ProductsProps> = ({ initialCategory = 'all' }) => {
  // Soporta inicialización por props
  const [activeCategory, setActiveCategory] = useState<'all' | 'equipment' | 'cosmetic'>(initialCategory);
  const [showModal, setShowModal] = useState(true); // Modal oferta HIFU
  const location = useLocation();

  // Cambia el filtro automáticamente según la URL
  useEffect(() => {
    if (location.pathname === '/products/aparatologia') setActiveCategory('equipment');
    else if (location.pathname === '/products/cosmeticos') setActiveCategory('cosmetic');
    else setActiveCategory('all');
  }, [location.pathname]);

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(product => product.category === activeCategory);

  const getSEOMetadata = () => {
    if (activeCategory === 'equipment') {
      return {
        title: 'Aparatología Estética',
        description: 'Equipos médicos y estéticos de alta tecnología en Cuenca. HIFU, Láser, Radiofrecuencia y más.',
        keywords: 'Aparatología estética Cuenca, equipos médicos, HIFU, láser, radiofrecuencia'
      };
    } else if (activeCategory === 'cosmetic') {
      return {
        title: 'Cosméticos Profesionales',
        description: 'Productos cosméticos de alta calidad para el cuidado de la piel. Venta en Cuenca, Ecuador.',
        keywords: 'Cosméticos Cuenca, cuidado de la piel, productos dermatológicos, skincare'
      };
    }
    return {
      title: 'Productos y Equipos',
      description: 'Catálogo completo de equipos estéticos y productos cosméticos en BIOSKIN Cuenca.',
      keywords: 'Productos estéticos, equipos médicos, cosméticos, BIOSKIN Cuenca'
    };
  };

  const seoData = getSEOMetadata();

  return (
    <>
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
      />
      {/* Modal Oferta HIFU */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative text-center">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowModal(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2 className="text-3xl font-bold mb-2 text-[#ba9256]">¡30% de descuento!</h2>
            <p className="text-lg mb-4">Solo por tiempo limitado en nuestro <span className="font-semibold text-[#0d5c6c]">equipo HIFU profesional</span>.</p>
            <img src="/images/productos/dispositivos/hifu/hifu1.jpg" alt="HIFU" className="mx-auto rounded-xl mb-4 max-h-48 object-contain shadow" />
            <Link
              to="/products/hifu-7d-con-doble-manija"
              className="inline-block bg-[#deb887] text-white font-bold py-2 px-6 rounded-lg text-lg shadow hover:bg-[#ba9256] transition"
              onClick={() => setShowModal(false)}
            >
              Ver Oferta
            </Link>
            <div className="mt-3">
              <a
                href="https://wa.me/593969890689?text=Hola%2C%20vi%20el%20descuento%20de%2025%25%20en%20el%20equipo%20HIFU%2C%20quisiera%20más%20información."
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0d5c6c] underline text-sm"
              >
                Consultar disponibilidad por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <section id="products" className="py-24 bg-gray-50">
        <div className="container-custom">

          {/* Links directos para categorías */}
          <div className="flex justify-end mb-6">
            <Link
              to="/products/aparatologia"
              className="mr-3 px-3 py-1 rounded bg-[#deb887] text-white font-medium hover:bg-[#ba9256] transition"
            >
              Ver solo aparatología
            </Link>
            <Link
              to="/products/cosmeticos"
              className="px-3 py-1 rounded bg-[#deb887] text-white font-medium hover:bg-[#ba9256] transition"
            >
              Ver solo cosméticos
            </Link>
          </div>

          <div className="text-center mb-16">
            <h2 className="section-title">Nuestros Productos</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Descubre nuestra selección de equipos profesionales y productos cosméticos de alta calidad.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  activeCategory === 'all'
                    ? 'bg-[#deb887] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-200`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveCategory('equipment')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeCategory === 'equipment'
                    ? 'bg-[#deb887] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-200`}
              >
                Aparatología
              </button>
              <button
                onClick={() => setActiveCategory('cosmetic')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  activeCategory === 'cosmetic'
                    ? 'bg-[#deb887] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-200`}
              >
                Cosméticos
              </button>
            </div>
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={index}
                name={product.name}
                shortDescription={product.shortDescription}
                price={product.price}
                images={product.images}
                category={product.category}
                // Puedes pasar más props si los agregas (ficha, video, whatsapp, etc)
              />
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-8">
              ¿Interesado en nuestros productos? Contáctanos para más información sobre disponibilidad.
            </p>
            <a
              href="https://wa.me/593969890689"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Products;
