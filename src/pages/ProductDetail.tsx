import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import products from '../data/products';
import { slugify } from '../utils/slugify';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = products.find(p => slugify(p.name) === slug);

  // Estado para la imagen principal
  const [mainImg, setMainImg] = useState(product?.images[0] || '');

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

        <div className="flex flex-col items-center mb-8">
          {/* Imagen principal dinámica */}
          <img
            src={mainImg}
            alt={product.name}
            className="rounded-xl w-full max-w-md object-cover mb-4"
            style={{ minHeight: 200 }}
          />
          {/* Miniaturas clickeables */}
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-2">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={product.name + ' miniatura ' + (i + 1)}
                  className={`h-20 w-20 object-cover rounded shadow border cursor-pointer transition-all duration-200
                    ${mainImg === img ? 'border-[#deb887] border-4 scale-110' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                  onClick={() => setMainImg(img)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center items-center">

          {/* Descripción principal */}
          <p className="text-gray-600 text-sm mb-6">{product.description}</p>

          {/* Detalles */}
          {product.details && (
            <div className="mb-6 w-full">
              <h2 className="text-lg font-semibold mb-2">Detalles</h2>
              <ul className="list-disc pl-6 text-gray-600 text-sm mb-4">
                {product.details.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Especificaciones técnicas */}
          {product.specifications && (
            <div className="mb-6 w-full">
              <h2 className="text-lg font-semibold mb-2">Especificaciones técnicas</h2>
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <tbody>
                  {Object.entries(product.specifications).map(([key, value], i) => (
                    <tr key={i}>
                      <td className="py-2 px-4 border-b font-semibold text-gray-600">{key}</td>
                      <td className="py-2 px-4 border-b text-gray-600 text-sm">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Indicaciones */}
          {product.indications && (
            <div className="mb-6 w-full">
              <h2 className="text-lg font-semibold mb-2">Indicaciones</h2>
              <ul className="list-disc pl-6 text-gray-600 text-sm">
                {product.indications.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="font-semibold text-xl mb-4">Precio: ${product.price}</p>
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
      </div>
    </section>
  );
};

export default ProductDetail;
