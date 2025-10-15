import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag, User } from 'lucide-react';

interface BlogCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: 'medico-estetico' | 'tecnico';
  author: string;
  publishedAt: string;
  readTime: number;
  tags: string[];
  image: string;
  featured?: boolean;
}

const BlogCard: React.FC<BlogCardProps> = ({
  title,
  slug,
  excerpt,
  category,
  author,
  publishedAt,
  readTime,
  tags,
  image,
  featured = false
}) => {
  const categoryLabels = {
    'medico-estetico': 'Médico Estético',
    'tecnico': 'Técnico'
  };

  const categoryColors = {
    'medico-estetico': 'bg-[#deb887] text-white',
    'tecnico': 'bg-blue-600 text-white'
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <article className={`card group ${featured ? 'ring-2 ring-[#deb887]' : ''}`}>
      {featured && (
        <div className="absolute top-4 left-4 z-10 bg-[#deb887] text-white px-3 py-1 rounded-full text-sm font-medium">
          Destacado
        </div>
      )}
      
      {/* Imagen del blog */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/logo/logo1.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        
        {/* Categoría */}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${categoryColors[category]}`}>
          {categoryLabels[category]}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Título */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#deb887] transition-colors">
          <Link to={`/blogs/${slug}`} className="hover:underline">
            {title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
            >
              <Tag size={10} />
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-gray-500 text-xs">+{tags.length - 3} más</span>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>{author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(publishedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{readTime} min lectura</span>
          </div>
        </div>

        {/* Botón Leer más */}
        <div className="mt-4">
          <Link
            to={`/blogs/${slug}`}
            className="inline-flex items-center text-[#deb887] hover:text-[#c9a677] font-medium transition-colors"
          >
            Leer más
            <svg
              className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;