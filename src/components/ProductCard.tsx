import React from 'react';

type ProductCardProps = {
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'equipment' | 'cosmetic';
};

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  description,
  price,
  image,
  category,
}) => {
  return (
    <div className="card group animate-fade-in" data-aos="fade-up">
      <div className="relative overflow-hidden h-48">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-0 right-0 bg-[#deb887] text-white py-1 px-3 font-semibold">
          ${price} USD
        </div>
        <div className="absolute top-0 left-0 bg-white/90 py-1 px-3 text-sm capitalize">
          {category}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <a
          href="https://wa.me/593969890689"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#deb887] font-medium inline-flex items-center hover:underline"
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