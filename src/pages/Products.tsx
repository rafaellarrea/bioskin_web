import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'equipment' | 'cosmetic'>('all');

  const products = [
    {
      name: "Láser Nd:YAG Portátil",
      description: "Equipo profesional para tratamientos de rejuvenecimiento y eliminación de tatuajes.",
      price: 12000,
      image: "https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      category: "equipment" as const
    },
    {
      name: "IPL Profesional",
      description: "Sistema de luz pulsada intensa para tratamientos faciales y corporales.",
      price: 8500,
      image: "https://images.pexels.com/photos/8460361/pexels-photo-8460361.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      category: "equipment" as const
    },
    {
      name: "Sérum Hidratante",
      description: "Fórmula concentrada con ácido hialurónico y vitamina C.",
      price: 45,
      image: "https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      category: "cosmetic" as const
    },
    {
      name: "Crema Antiaging",
      description: "Tratamiento intensivo con retinol y péptidos para combatir arrugas.",
      price: 65,
      image: "https://images.pexels.com/photos/6621460/pexels-photo-6621460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      category: "cosmetic" as const
    }
  ];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(product => product.category === activeCategory);

  return (
    <section id="products" className="py-24 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Nuestros Productos</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Descubre nuestra selección de equipos profesionales y productos cosméticos de alta calidad.
          </p>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={index}
              name={product.name}
              description={product.description}
              price={product.price}
              image={product.image}
              category={product.category}
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
  );
};

export default Products;
