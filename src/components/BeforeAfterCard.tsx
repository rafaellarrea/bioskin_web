import React, { useState } from 'react';

type BeforeAfterCardProps = {
  beforeImage: string;
  afterImage: string;
  title: string;
  description: string;
};

const BeforeAfterCard: React.FC<BeforeAfterCardProps> = ({
  beforeImage,
  afterImage,
  title,
  description,
}) => {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div className="card overflow-hidden animate-fade-in" data-aos="fade-up">
      <div className="relative">
        <div className="relative h-64 overflow-hidden">
          <img
            src={beforeImage}
            alt={`Antes - ${title}`}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              showAfter ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ position: showAfter ? 'absolute' : 'relative' }}
          />
          <img
            src={afterImage}
            alt={`Después - ${title}`}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              showAfter ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        </div>
        
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex justify-between items-center">
          <span className={`text-white font-medium ${showAfter ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            Antes
          </span>
          <span className={`text-white font-medium ${showAfter ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
            Después
          </span>
        </div>
        
        <button
          className="absolute inset-0 w-full h-full cursor-pointer z-10 focus:outline-none"
          onClick={() => setShowAfter(!showAfter)}
          onMouseEnter={() => setShowAfter(true)}
          onMouseLeave={() => setShowAfter(false)}
          aria-label="Ver antes y después"
        />
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
};

export default BeforeAfterCard;