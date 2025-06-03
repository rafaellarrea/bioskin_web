// src/pages/Products.tsx

import React, { useState } from 'react';
import products from '../data/products';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { slugify } from '../utils/slugify';

const Products = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'equipment' | 'cosmetic'>('all');

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(product => product.category === activeCategory);

  return (
    <>
      <section id="products" className="py-24 bg-gray-50">
        <div className="container-custom">
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
                description={product.description}
                price={product.price}
                images={product.images}
                category={product.category}
                // Puedes pasar más props si los agregas (ficha, video, whatsapp, etc)
              />
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-8">
              ¿Interesado en nuestros productos? Contáctanos para más información sobre disponibilidad y opciones de financiamiento.
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
