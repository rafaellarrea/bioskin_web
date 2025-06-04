import React from 'react';
import ImageCarousel from './ImageCarousel';
import { Link } from 'react-router-dom';
import { slugify } from '../utils/slugify';

type ProductCardProps = {
  name: string;
  shortDescription: string;
  price: number;
  images: string[];
  category: 'equipment' | 'cosmetic';
  showDetailButton?: boolean; // <--- Añadido (opcional)
};

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  shortDescription,
  price,
  images,
  category,
  showDetailButton = true, // Por defecto se muestra
}) => {
  return (
    <div className="card group flex flex-col h-full">
      <div className="relative overflow-hidden">
        <ImageCarousel images={images} folderPath="" height="h-48" />
        <div className="absolute top-0 right-0 bg-[#deb887] text-white py-1 px-3 font-semibold">
          ${price} USD
        </div>
        <div className="absolute top-0 left-0 bg-white/90 py-1 px-3 text-sm capitalize">
          {category}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-gray-600 mb-4 whitespace-pre-line flex-1">{shortDescription}</p>
        
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
