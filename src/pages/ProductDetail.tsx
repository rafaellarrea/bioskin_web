// src/pages/ProductDetail.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import products from '../data/products';
import { slugify } from '../utils/slugify';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = products.find(p => slugify(p.name) === slug);

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
        <Link to="/products" className="text-blue-500 underline">Volver a productos</Link>
      </div>
    );
  }

  return (
    <section className="py-16 bg-white min-h-screen">
      <div className="container-custom max-w-3xl mx-auto">
        <Link to="/products" className="text-blue-500 underline mb-6 inline-block">&larr; Volver</Link>
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <img src={product.images[0]} alt={product.name} className="rounded-xl w-full md:w-1/2 object-cover" />
          <div>
            <p className="mb-2 whitespace-pre-line">{product.description}</p>
            <p className="font-semibold text-lg mb-2">Precio: ${product.price}</p>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          {product.images.slice(1).map((img, i) => (
            <img key={i} src={img} alt={product.name + ' ' + (i + 2)} className="h-24 rounded shadow" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductDetail;
