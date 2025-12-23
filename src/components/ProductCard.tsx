import React from 'react';
import ImageCarousel from './ImageCarousel';
import { Link } from 'react-router-dom';
import { slugify } from '../utils/slugify';

type ProductCardProps = {
  name: string;
  shortDescription: string;
  price: string | number;
  originalPrice?: string | number;
  images: string[];
  category: 'equipment' | 'cosmetic';
  showDetailButton?: boolean; // <--- Añadido (opcional)
};

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  shortDescription,
  price,
  originalPrice,
  images,
  category,
  showDetailButton = true, // Por defecto se muestra
}) => {
  const formatPrice = (p: string | number) => {
    if (typeof p === 'number') return `$${p}`;
    if (p.startsWith('$')) return p;
    return `$${p}`;
  };

  return (
    <div className="card group flex flex-col h-full">
      <div className="relative overflow-hidden">
        <ImageCarousel images={images} folderPath="" height="h-48" />
        <div className="absolute top-0 right-0 flex flex-col items-end">
          <div className="bg-[#deb887] text-white py-1 px-3 font-semibold">
            <div className="flex flex-col items-end leading-tight">
              {originalPrice && (
                <span className="text-xs line-through opacity-80">
                  {formatPrice(originalPrice)} USD
                </span>
              )}
              <span>{formatPrice(price)} USD</span>
            </div>
          </div>
          <div className="bg-black/50 text-white text-[10px] px-3 py-0.5 w-full text-center backdrop-blur-sm">
            IVA INCLUIDO
          </div>
        </div>
        <div className="absolute top-0 left-0 bg-white/90 py-1 px-3 text-sm capitalize">
          {category}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-semibold mb-2">{name}</h3>
        <p className="text-gray-600 text-sm">{shortDescription}</p>
        
        {/* Mostrar solo si showDetailButton es true */}
        {showDetailButton && (
          <Link to={`/products/${slugify(name)}`}>
            <button className="btn-primary w-full mt-2">Más información</button>
          </Link>
        )}
        
        {/* Botón WhatsApp */}
        <a
          href="https://wa.me/593969890689"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#deb887] font-medium inline-flex items-center hover:underline mt-2"
        >
          Consultar Disponibilidad
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14"></path>
            <path d="M12 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default ProductCard;
