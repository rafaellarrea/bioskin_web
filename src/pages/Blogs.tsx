import { useState } from 'react';
import { Search, Filter, BookOpen, TrendingUp, Loader2 } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import Footer from '../components/Footer';
import { useBlogs } from '../hooks/useBlogs';

const Blogs = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'medico-estetico' | 'tecnico'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Usar el hook para obtener blogs filtrados
  const { 
    blogs, 
    loading, 
    error, 
    pagination 
  } = useBlogs({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: searchTerm || undefined,
    page: currentPage,
    limit: 9
  });

  // Obtener blogs destacados
  const { 
    blogs: featuredBlogs, 
    loading: featuredLoading 
  } = useBlogs({
    featured: true,
    limit: 3
  });

  const categoryLabels = {
    'all': 'Todos',
    'medico-estetico': 'Médico Estético',
    'tecnico': 'Técnico'
  };

  const handleCategoryChange = (category: 'all' | 'medico-estetico' | 'tecnico') => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#deb887] to-[#c9a677] text-white py-16">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-4">
                <BookOpen size={48} className="mr-3" />
                <h1 className="text-4xl md:text-5xl font-bold">Blog BIOSKIN</h1>
              </div>
              <p className="text-xl md:text-2xl text-white/90 mb-8">
                Conocimiento especializado en medicina estética y tecnología avanzada
              </p>
              <div className="flex items-center justify-center gap-6 text-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  <span>Contenido actualizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={20} />
                  <span>Artículos especializados</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blogs destacados */}
        {!featuredLoading && featuredBlogs.length > 0 && (
          <section className="py-12 bg-white">
            <div className="container-custom">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
                Artículos Destacados
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredBlogs.map((blog) => (
                  <BlogCard key={blog.id} {...blog} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filtros y búsqueda */}
        <section className="py-8 bg-gray-50">
          <div className="container-custom">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between mb-8">
              {/* Buscador */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar artículos..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                />
              </div>

              {/* Filtros de categoría */}
              <div className="flex items-center gap-4">
                <Filter size={20} className="text-gray-600" />
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => handleCategoryChange(value as any)}
                      className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                        selectedCategory === value
                          ? 'bg-[#deb887] text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resultados */}
            <div className="mb-6">
              {loading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Cargando artículos...</span>
                </div>
              ) : (
                <p className="text-gray-600">
                  {pagination?.total === 0 
                    ? 'No se encontraron artículos'
                    : `${pagination?.total} artículo${pagination?.total !== 1 ? 's' : ''} encontrado${pagination?.total !== 1 ? 's' : ''}`
                  }
                  {searchTerm && ` para "${searchTerm}"`}
                  {selectedCategory !== 'all' && ` en "${categoryLabels[selectedCategory]}"`}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Lista de blogs */}
        <section className="py-12 bg-gray-50">
          <div className="container-custom">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 size={64} className="mx-auto mb-4 text-gray-400 animate-spin" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Cargando artículos...
                </h3>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <BookOpen size={64} className="mx-auto mb-4 text-red-400" />
                <h3 className="text-xl font-semibold text-red-600 mb-2">
                  Error cargando artículos
                </h3>
                <p className="text-red-500 mb-6">
                  {error}
                </p>
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={64} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No se encontraron artículos
                </h3>
                <p className="text-gray-500 mb-6">
                  Intenta ajustar los filtros o términos de búsqueda
                </p>
                <button
                  onClick={() => {
                    handleSearchChange('');
                    handleCategoryChange('all');
                  }}
                  className="btn-primary"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {blogs.map((blog) => (
                    <BlogCard key={blog.id} {...blog} />
                  ))}
                </div>

                {/* Paginación */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          pagination.hasPrev
                            ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Anterior
                      </button>
                      
                      <span className="px-4 py-2 text-gray-600">
                        Página {pagination.page} de {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          pagination.hasNext
                            ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold mb-4">
              ¿Tienes alguna pregunta sobre nuestros tratamientos?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Nuestro equipo de especialistas está aquí para asesorarte
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#appointment" className="btn-primary">
                Agenda una Consulta
              </a>
              <a 
                href="#contact" 
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-medium py-3 px-8 rounded-md transition-all duration-300"
              >
                Contáctanos
              </a>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Blogs;