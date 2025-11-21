import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import products from '../data/products';
import { slugify } from '../utils/slugify';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const product = products.find(p => slugify(p.name) === slug);

  // Obtener el índice de la imagen desde la URL (si existe)
  const imageIndexFromUrl = searchParams.get('img');
  const initialImageIndex = imageIndexFromUrl && product ? 
    Math.min(Math.max(0, parseInt(imageIndexFromUrl) - 1), product.images.length - 1) : 0;

  // Estado para la imagen principal
  const [mainImg, setMainImg] = useState(product?.images[initialImageIndex] || '');
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [showCopyNotification, setShowCopyNotification] = useState(false);

  // Efecto para actualizar la imagen cuando cambia el parámetro URL
  useEffect(() => {
    if (product && imageIndexFromUrl) {
      const index = Math.min(Math.max(0, parseInt(imageIndexFromUrl) - 1), product.images.length - 1);
      setMainImg(product.images[index]);
      setCurrentImageIndex(index);
    }
  }, [imageIndexFromUrl, product]);

  // Función para copiar URL de la imagen actual
  const copyImageUrl = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    });
  };

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
          <div className="relative w-full max-w-md">
            <img
              src={mainImg}
              alt={product.name}
              className="rounded-xl w-full object-cover mb-4 min-h-[200px]"
            />
            
            {/* Botón para copiar URL de la imagen */}
            {product.images.length > 1 && (
              <button
                onClick={copyImageUrl}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 px-3 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                title="Copiar enlace a esta imagen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Compartir imagen
              </button>
            )}
            
            {/* Notificación de copiado */}
            {showCopyNotification && (
              <div className="absolute top-14 right-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-notification">
                ✓ URL copiada al portapapeles
              </div>
            )}
          </div>
          
          {/* Miniaturas clickeables */}
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-2 flex-wrap justify-center">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={product.name + ' miniatura ' + (i + 1)}
                  className={`h-20 w-20 object-cover rounded shadow border cursor-pointer transition-all duration-200
                    ${currentImageIndex === i ? 'border-[#deb887] border-4 scale-110' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                  onClick={() => {
                    setMainImg(img);
                    setCurrentImageIndex(i);
                    // Actualizar URL con el índice de la imagen (1-indexed para usuarios)
                    setSearchParams({ img: (i + 1).toString() });
                  }}
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
