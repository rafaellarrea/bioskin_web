import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, User, Tag, ArrowLeft, Share2, ChevronRight, Loader2 } from 'lucide-react';
import Footer from '../components/Footer';
import BlogContent from '../components/BlogContent';
import { useBlog, useBlogs } from '../hooks/useBlogs';

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Obtener blog por slug
  const { blog, loading, error } = useBlog(slug || '');
  
  // Obtener blogs relacionados (misma categoría)
  const { blogs: relatedBlogs } = useBlogs({
    category: blog?.category,
    limit: 3
  });

  // Filtrar blogs relacionados excluyendo el actual
  const filteredRelatedBlogs = relatedBlogs.filter(relatedBlog => relatedBlog.id !== blog?.id);

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

  const handleShare = async () => {
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={64} className="mx-auto mb-4 text-gray-400 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cargando artículo...</h1>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Artículo no encontrado'}
          </h1>
          <p className="text-gray-600 mb-6">El artículo que buscas no existe o ha sido movido.</p>
          <Link to="/blogs" className="btn-primary">
            Volver al Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container-custom py-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link to="/" className="hover:text-[#deb887]">Inicio</Link>
              <ChevronRight size={16} />
              <Link to="/blogs" className="hover:text-[#deb887]">Blog</Link>
              <ChevronRight size={16} />
              <span className="text-gray-900 font-medium">{blog.title}</span>
            </nav>
          </div>
        </div>

        {/* Header del artículo */}
        <article className="bg-white">
          <div className="container-custom py-12">
            <div className="max-w-4xl mx-auto">
              {/* Botón volver */}
              <Link 
                to="/blogs"
                className="inline-flex items-center text-[#deb887] hover:text-[#c9a677] mb-8 font-medium transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Volver al Blog
              </Link>

              {/* Categoría */}
              <div className="mb-4">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${categoryColors[blog.category]}`}>
                  {categoryLabels[blog.category]}
                </span>
                {blog.featured && (
                  <span className="ml-3 inline-block px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Destacado
                  </span>
                )}
              </div>

              {/* Título */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight font-['Playfair_Display']">
                {blog.title}
              </h1>

              {/* Excerpt */}
              <p className="text-xl text-gray-600 mb-8 leading-relaxed font-['Poppins'] font-light">
                {blog.excerpt}
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b font-['Poppins']">
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <span className="font-medium">{blog.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span>{formatDate(blog.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-[#deb887]">
                  <Clock size={18} />
                  <span className="font-medium">{blog.readTime} min de lectura</span>
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-[#deb887] hover:text-[#c9a677] transition-colors font-medium"
                >
                  <Share2 size={18} />
                  <span>Compartir</span>
                </button>
              </div>

              {/* Imagen personalizada principal (si existe) */}
              {blog.imagenPrincipal && (
                <div className="mb-12">
                  <img
                    src={blog.imagenPrincipal}
                    alt="Imagen principal del artículo"
                    className="w-full h-96 object-cover rounded-lg shadow-lg"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.log('❌ Error cargando imagen principal personalizada:', blog.imagenPrincipal);
                      console.log('🔄 Cambiando a imagen de fallback');
                      img.src = '/images/logo/logo1.jpg';
                    }}
                  />
                </div>
              )}

              {/* Imagen principal por defecto (solo si no hay imagen personalizada) */}
              {!blog.imagenPrincipal && (
                <div className="mb-12">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-96 object-cover rounded-lg shadow-lg"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.log('❌ Error cargando imagen:', blog.image);
                      console.log('🔄 Cambiando a imagen de fallback');
                      img.src = '/images/logo/logo1.jpg';
                    }}
                    onLoad={() => {
                      console.log('✅ Imagen cargada exitosamente:', blog.image);
                    }}
                  />
                </div>
              )}

              {/* Contenido */}
              <BlogContent content={blog.content || ''} />

              {/* Imagen después de conclusión (si existe) */}
              {blog.imagenConclusion && (
                <div className="mt-8 mb-12">
                  <img
                    src={blog.imagenConclusion}
                    alt="Imagen de conclusión del artículo"
                    className="w-full h-80 object-cover rounded-lg shadow-lg"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.log('❌ Error cargando imagen de conclusión:', blog.imagenConclusion);
                      console.log('🔄 Cambiando a imagen de fallback');
                      img.src = '/images/logo/logo1.jpg';
                    }}
                  />
                </div>
              )}

              {/* Tags */}
              <div className="mt-12 pt-8 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Citas (si existen) */}
              {blog.citations && blog.citations.length > 0 && (
                <div className="mt-12 pt-8 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Referencias:</h3>
                  <div className="space-y-3">
                    {blog.citations.map((citation: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 italic mb-2">"{citation.text}"</p>
                        <p className="text-sm text-gray-600">
                          — {citation.source}
                          {citation.url && (
                            <a 
                              href={citation.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#deb887] hover:text-[#c9a677] ml-2"
                            >
                              Ver fuente
                            </a>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Artículos relacionados */}
        {filteredRelatedBlogs.length > 0 && (
          <section className="py-16 bg-gray-100">
            <div className="container-custom">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                  Artículos Relacionados
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {filteredRelatedBlogs.map((relatedBlog) => (
                    <div key={relatedBlog.id} className="card">
                      <div className="h-48 overflow-hidden mb-4">
                        <img
                          src={relatedBlog.image}
                          alt={relatedBlog.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/logo/logo1.jpg';
                          }}
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                          <Link 
                            to={`/blogs/${relatedBlog.slug}`}
                            className="hover:text-[#deb887] transition-colors"
                          >
                            {relatedBlog.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {relatedBlog.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(relatedBlog.publishedAt)}</span>
                          <span>{relatedBlog.readTime} min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-[#deb887] to-[#c9a677] text-white">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold mb-4">
              ¿Interesado en nuestros tratamientos?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Agenda una consulta personalizada con nuestros especialistas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/appointment" className="bg-white text-[#deb887] hover:bg-gray-100 font-medium py-3 px-8 rounded-md transition-all duration-300">
                Agenda tu Cita
              </Link>
              <Link 
                to="/contact" 
                className="border-2 border-white text-white hover:bg-white hover:text-[#deb887] font-medium py-3 px-8 rounded-md transition-all duration-300"
              >
                Más Información
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default BlogDetail;