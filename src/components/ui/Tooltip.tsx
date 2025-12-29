import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: { bottom: '100%', left: '50%', x: '-50%', y: -8 },
    bottom: { top: '100%', left: '50%', x: '-50%', y: 8 },
    left: { right: '100%', top: '50%', y: '-50%', x: -8 },
    right: { left: '100%', top: '50%', y: '-50%', x: 8 },
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, ...positions[position] }}
            animate={{ opacity: 1, scale: 1, ...positions[position] }}
            exit={{ opacity: 0, scale: 0.9, ...positions[position] }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap pointer-events-none"
          >
            {content}
            <div 
              className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
                position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                'left-[-4px] top-1/2 -translate-y-1/2'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
