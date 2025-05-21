import React from 'react';

type ServiceCardProps = {
  title: string;
  description: string;
  price: number;
  image: string;
  index: number;
};

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  title, 
  description, 
  price, 
  image,
  index 
}) => {
  return (
    <div 
      className="card group animate-fade-in"
      style={{ animationDelay: `${index * 150}ms` }}
      data-aos="fade-up"
    >
      <div className="relative overflow-hidden h-48">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-0 right-0 bg-[#deb887] text-white py-1 px-3 font-semibold">
          ${price} USD
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <a
          href="#appointment"
          className="text-[#deb887] font-medium inline-flex items-center hover:underline"
        >
          Agendar Cita
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

export default ServiceCard;