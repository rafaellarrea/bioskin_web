import React from 'react';

type ServiceCardProps = {
  title: string;
  description: string;
  price: string | number;
  image: string;
  index: number;
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  price,
  image,
  index,
}) => {
  return (
    <div
      className="card group"
      style={{ animationDelay: (index * 150) + 'ms' }}
    >
      <div className="relative overflow-hidden h-48">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-0 right-0 bg-[#deb887] text-white py-1 px-3 font-semibold">
          {typeof price === 'number' ? `$${price} USD` : price}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <a
          href="#appointment"
          className="inline-block bg-[#deb887] hover:bg-[#cdaa7d] text-white py-2 px-4 rounded"
        >
          Reservar
        </a>
      </div>
    </div>
  );
};

export default ServiceCard;
