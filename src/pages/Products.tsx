import React, { useState } from 'react';

const Products = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'equipment' | 'cosmetic'>('all');

  const products = [
    {
      name: "Láser Nd:YAG Portátil",
      description: "Equipo profesional para tratamientos de rejuvenecimiento y eliminación de tatuajes.",
      price: 12000,
      image: "https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg",
      category: "equipment"
    },
    {
      name: "IPL Profesional",
      description: "Sistema de luz pulsada intensa para tratamientos faciales y corporales.",
      price: 8500,
      image: "https://images.pexels.com/photos/8460361/pexels-photo-8460361.jpeg",
      category: "equipment"
    },
    {
      name: "Sérum Hidratante",
      description: "Fórmula concentrada con ácido hialurónico y vitamina C.",
      price: 45,
      image: "https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg",
      category: "cosmetic"
    },
    {
      name: "Crema Antiaging",
      description: "Tratamiento intensivo con retinol y péptidos para combatir arrugas.",
      price: 65,
      image: "https://images.pexels.com/photos/6621460/pexels-photo-6621460.jpeg",
      category: "cosmetic"
    }
  ];

  const filtered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <section id="products" style={{ padding: '100px', textAlign: 'center' }}>
      <h2 className="text-3xl font-bold mb-6">Nuestros Productos</h2>
      <div className="mb-6">
        <button onClick={() => setActiveCategory('all')}>Todos</button>
        <button onClick={() => setActiveCategory('equipment')}>Aparatología</button>
        <button onClick={() => setActiveCategory('cosmetic')}>Cosméticos</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((product, i) => (
          <div key={i} className="border p-4 rounded shadow">
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover mb-4" />
            <h3 className="text-xl font-semibold">{product.name}</h3>
            <p className="text-gray-600">{product.description}</p>
            <p className="text-primary font-bold">${product.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Products;
