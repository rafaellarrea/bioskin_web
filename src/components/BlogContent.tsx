// src/components/BlogContent.tsx
// Componente para renderizar contenido de blog con formato mejorado

import React from 'react';

interface BlogContentProps {
  content: string;
}

const BlogContent: React.FC<BlogContentProps> = ({ content }) => {
  
  // Función para procesar y formatear el contenido
  const formatContent = (text: string) => {
    // Dividir el contenido en líneas
    const lines = text.split('\n');
    const formattedElements: JSX.Element[] = [];
    let currentKey = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        // Línea vacía - agregar espacio
        formattedElements.push(<div key={currentKey++} className="h-4" />);
        continue;
      }

      // Títulos principales (# Título)
      if (line.startsWith('# ')) {
        const title = line.substring(2).trim();
        formattedElements.push(
          <h2 key={currentKey++} className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-[#deb887] pb-2">
            {title}
          </h2>
        );
        continue;
      }

      // Subtítulos (## Subtítulo)
      if (line.startsWith('## ')) {
        const subtitle = line.substring(3).trim();
        formattedElements.push(
          <h3 key={currentKey++} className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            {subtitle}
          </h3>
        );
        continue;
      }

      // Subtítulos menores (### Subtítulo)
      if (line.startsWith('### ')) {
        const subtitle = line.substring(4).trim();
        formattedElements.push(
          <h4 key={currentKey++} className="text-lg font-medium text-gray-700 mt-4 mb-2">
            {subtitle}
          </h4>
        );
        continue;
      }

      // Listas numeradas
      if (/^\d+\.\s/.test(line)) {
        const listItem = line.replace(/^\d+\.\s/, '').trim();
        formattedElements.push(
          <div key={currentKey++} className="flex items-start mb-2">
            <span className="flex-shrink-0 w-6 h-6 bg-[#deb887] text-white text-sm font-medium rounded-full flex items-center justify-center mr-3 mt-0.5">
              {line.match(/^(\d+)/)?.[1]}
            </span>
            <p className="text-gray-700 leading-relaxed">{listItem}</p>
          </div>
        );
        continue;
      }

      // Listas con viñetas
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const listItem = line.substring(2).trim();
        formattedElements.push(
          <div key={currentKey++} className="flex items-start mb-2">
            <span className="flex-shrink-0 w-2 h-2 bg-[#deb887] rounded-full mr-3 mt-3"></span>
            <p className="text-gray-700 leading-relaxed">{listItem}</p>
          </div>
        );
        continue;
      }

      // Texto en negrita (**texto** o *texto*)
      if (line.includes('**') || line.includes('*')) {
        let processedLine = line;
        
        // Primero procesar **texto**
        if (processedLine.includes('**')) {
          const parts = processedLine.split('**');
          const formattedParts = parts.map((part, index) => {
            if (index % 2 === 1) {
              return <strong key={`bold-${currentKey}-${index}`} className="font-semibold text-gray-900">{part}</strong>;
            }
            return part;
          });
          
          formattedElements.push(
            <p key={currentKey++} className="text-gray-700 leading-relaxed mb-4">
              {formattedParts}
            </p>
          );
          continue;
        }
        
        // Luego procesar *texto* simple (pero evitar listas)
        if (processedLine.includes('*') && !processedLine.startsWith('*') && !processedLine.startsWith('- ')) {
          const parts = processedLine.split('*');
          const formattedParts = parts.map((part, index) => {
            if (index % 2 === 1) {
              return <strong key={`italic-${currentKey}-${index}`} className="font-semibold text-gray-900">{part}</strong>;
            }
            return part;
          });
          
          formattedElements.push(
            <p key={currentKey++} className="text-gray-700 leading-relaxed mb-4">
              {formattedParts}
            </p>
          );
          continue;
        }
      }

      // Párrafos normales
      formattedElements.push(
        <p key={currentKey++} className="text-gray-700 leading-relaxed mb-4">
          {line}
        </p>
      );
    }

    return formattedElements;
  };

  return (
    <div className="prose prose-lg max-w-none blog-content">
      <div className="space-y-2">
        {formatContent(content)}
      </div>
    </div>
  );
};

export default BlogContent;