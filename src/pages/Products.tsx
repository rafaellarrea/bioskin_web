
import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const Products = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'equipment' | 'cosmetic'>('all');

  const products = [
    {
      name: "Láser Nd:YAG Portátil",
      description: "Equipo profesional para tratamientos de rejuvenecimiento y eliminación de tatuajes.",
      price: 12000,
      images: [
        "https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg",
        "https://images.pexels.com/photos/8460361/pexels-photo-8460361.jpeg"
      ],
      category: "equipment"
    },
    {
      name: "IPL Profesional",
      description: "Sistema de luz pulsada intensa para tratamientos faciales y corporales.",
      price: 8500,
      images: [
        "https://images.pexels.com/photos/8460361/pexels-photo-8460361.jpeg"
      ],
      category: "equipment"
    },
    {
      name: "MEDICUBE DEEP VITA C CAPSULE CREAM",
      description: "Cápsulas de liposomas con vitamina C, niacinamida, vitaminas y ácido 	ferúlico para una piel más brillante e hidratada. \n Contenido: 55g",
      price: 35,
      images: [
	"/images/productos/cosmeticos/medicubeCapsuleVitaC.jpg",
        "https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg"
      ],
      category: "cosmetic"
    },
	{
      name: "MEDICUBE PDRN PINK COLLAGEN CAPSULE CREAM",
      description: "PDRN y DNA de Salmón encapsulado en crema facial que ayuda a hidratar, 	unificar el tono, da firmeza, mejora el brillo natural y la resistencia de la piel.  \n Contenido: 55g",
      price: 35,
      images: [
	"/images/productos/cosmeticos/medicubeCapsulePDRN.jpg",
        "https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg"
      ],
      category: "cosmetic"
    },
	{
      name: "MEDICUBE KOJID ACID GEL MASK",
      description: "Mascarillas de gel con ácido kójico, niacinamida y cúrcuma que ayudan 	al brillo natural de la piel, dejando un efecto glass glow. Mejora la elasticidad y 	la hidratación. \n Contenido: 4 gel mask / 28g c/u",
      price: 35,
      images: [
	"/images/productos/cosmeticos/medicubeMask.jpg",
        "https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg"
      ],
      category: "cosmetic"
    },

	{
      name: "LA ROCHE POSAY HYALU B5 SERUM",
      	description: "Serum antiarrugas que hidrata, repara y rellena la piel al mismo 	tiempo 	que suaviza arrugas y líneas de expresión. Fórmula única a base de ácido 	hialurónico y Vitamina B5 que repara tu dermis desde el interior. \n Contenido: 204g",
      price: 38,
      images: [
	"/images/productos/cosmeticos/rocheHialuronico.jpg",
        "https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg"
      ],
      category: "cosmetic"
    },

    {
      name: "Crema Antiaging",
      description: "Tratamiento intensivo con retinol y péptidos para combatir arrugas.",
      price: 65,
      images: [
        "https://images.pexels.com/photos/6621460/pexels-photo-6621460.jpeg"
      ],
      category: "cosmetic"
    }
  ];

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
              images={product.images}
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
 <Footer />
    </>

  );
};

export default Products;
