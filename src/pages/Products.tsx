import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import products from '../data/products';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { slugify } from '../utils/slugify';
import { Link, useLocation } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Filter, X, Tag, Zap, Sparkles } from 'lucide-react';

type ProductsProps = {
  initialCategory?: 'all' | 'equipment' | 'cosmetic';
};

const Products: React.FC<ProductsProps> = ({ initialCategory = 'all' }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'equipment' | 'cosmetic'>(initialCategory);
  const location = useLocation();

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
      <SEO {...seoData} />

      {/* Header Section */}
      <section className="relative py-24 bg-gray-900 overflow-hidden">
         <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
         </div>
         <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-gray-900/90 to-gray-50" />
         
         <div className="container-custom relative z-10 text-center mt-10">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-serif text-white mb-6"
            >
              Catálogo <span className="text-[#deb887] italic">Premium</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-300 max-w-2xl mx-auto text-lg font-light"
            >
              Equipamiento médico de última generación y cosmética profesional para resultados extraordinarios.
            </motion.p>
         </div>
      </section>

      <section id="products" className="py-12 bg-gray-50 min-h-screen -mt-10 relative z-20 rounded-t-[3rem]">
        <div className="container-custom">
          
          {/* Category Filter */}
          <div className="flex justify-center mb-12">
            <div className="bg-white p-1.5 rounded-full shadow-lg border border-gray-100 inline-flex relative">
              {[
                { id: 'all', label: 'Todos', icon: Filter },
                { id: 'equipment', label: 'Aparatología', icon: Zap },
                { id: 'cosmetic', label: 'Cosméticos', icon: Sparkles }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`relative px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 z-10 ${
                    activeCategory === cat.id ? 'text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {activeCategory === cat.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-[#deb887] rounded-full shadow-md"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <cat.icon className={`w-4 h-4 relative z-10 ${activeCategory === cat.id ? 'text-white' : ''}`} />
                  <span className="relative z-10">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence mode='popLayout'>
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  key={product.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard
                    name={product.name}
                    shortDescription={product.shortDescription}
                    price={product.price}
                    originalPrice={(product as any).originalPrice}
                    images={product.images}
                    category={product.category}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No se encontraron productos en esta categoría.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Products;
