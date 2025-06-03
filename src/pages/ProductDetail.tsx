import React from 'react';
import { useParams, Link } from 'react-router-dom';
import products from '../data/products';
import { slugify } from '../utils/slugify';

const ProductDetail = () => {
  // Obtenemos el slug de la URL
  const { slug } = useParams<{ slug: string }>();

  // Buscamos el producto usando el slug
  const product = products.find(p => slugify(p.name) === slug);

  // Si no existe, mostramos mensaje amigable
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

        {/* Galería principal + miniaturas y detalles a la derecha */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Galería: Imagen principal + miniaturas */}
          <div className="flex flex-col items-center">
            <img
              src={product.images[0]}
              alt={product.name}
              className="rounded-xl w-full max-w-md object-cover mb-4"
            />
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-2">
                {product.images.slice(1).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={product.name + ' ' + (i + 2)}
                    className="h-20 w-20 object-cover rounded shadow border border-gray-200"
                  />
                ))}
              </div>
            )}
          </div>
          {/* Detalles del producto */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="mb-4 whitespace-pre-line">{product.description}</p>
            <p className="font-semibold text-xl mb-6">Precio: ${product.price}</p>
            {/* Botón WhatsApp SIEMPRE, usando el nombre del producto */}
            <a
              href={`https://wa.me/593969890689?text=Hola,%20deseo%20más%20información%20sobre%20el%20producto:%20${encodeURIComponent(product.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center justify-center w-full md:w-auto px-6 py-3 text-lg"
            >
              Consultar por WhatsApp
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.72 11.06c-.31-.16-1.84-.91-2.12-1.02-.28-.1-.49-.16-.7.16-.2.31-.81 1.02-.99 1.23-.18.2-.36.23-.67.08-.31-.16-1.32-.49-2.52-1.55-.93-.83-1.56-1.84-1.74-2.15-.18-.31-.02-.48.14-.63.14-.14.31-.36.47-.54.16-.18.21-.31.31-.51.1-.2.05-.38-.02-.54-.07-.16-.7-1.68-.96-2.3-.25-.61-.5-.53-.69-.54-.18-.01-.38-.02-.59-.02-.2 0-.53.08-.81.38-.27.29-1.07 1.05-1.07 2.56s1.09 2.97 1.24 3.18c.15.2 2.15 3.28 5.22 4.47.73.29 1.29.46 1.73.59.73.23 1.4.2 1.93.12.59-.09 1.81-.74 2.07-1.46.26-.71.26-1.33.18-1.46-.08-.14-.28-.22-.59-.38z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Ficha técnica PDF */}
        {product.ficha && (
          <div className="mb-6">
            <a href={product.ficha} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              Ver ficha técnica (PDF)
            </a>
          </div>
        )}

        {/* Video embebido */}
        {product.video && (
          <div className="mb-6">
            <iframe
              width="100%"
              height="315"
              src={product.video}
              title={product.name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-xl"
            />
          </div>
        )}

        {/* Puedes agregar aquí testimonios, reseñas, características técnicas, etc. */}
      </div>
    </section>
  );
};

export default ProductDetail;
