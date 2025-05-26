
import React, { useState } from 'react';

interface ImageCarouselProps {
  images: string[];
  folderPath: string;
  height?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, folderPath, height = "h-[500px]" }) => {
  const [current, setCurrent] = useState(0);

  const getImageSrc = (path: string) => {
    return path.startsWith('http') || path.startsWith('/') ? path : `${folderPath}/${path}`;
  };

  const handlePrev = () => {
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg shadow-md mb-6">
      <img
        src={getImageSrc(images[current])}
        alt={`Imagen ${current + 1}`}
        className={`w-full ${height} object-cover transition duration-500`}
      />

      <button onClick={handlePrev} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full shadow-md">
        ‹
      </button>
      <button onClick={handleNext} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full shadow-md">
        ›
      </button>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full ${idx === current ? 'bg-[#deb887]' : 'bg-gray-300'} transition`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
