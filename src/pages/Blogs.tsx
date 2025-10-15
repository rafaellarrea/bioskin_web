import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, TrendingUp } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import Footer from '../components/Footer';
import { blogPosts, getBlogsByCategory, getFeaturedBlogs, BlogPost } from '../data/blogs';

const Blogs = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'medico-estetico' | 'tecnico'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>(blogPosts);

  // Filtrar blogs según categoría y término de búsqueda
  useEffect(() => {
    let filtered = selectedCategory === 'all' 
      ? blogPosts 
      : getBlogsByCategory(selectedCategory);

    if (searchTerm) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredBlogs(filtered);
  }, [selectedCategory, searchTerm]);

  const featuredBlogs = getFeaturedBlogs();

  const categoryLabels = {
    'all': 'Todos',
    'medico-estetico': 'Médico Estético',
    'tecnico': 'Técnico'
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
        {featuredBlogs.length > 0 && (
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
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                      onClick={() => setSelectedCategory(value as any)}
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
              <p className="text-gray-600">
                {filteredBlogs.length === 0 
                  ? 'No se encontraron artículos'
                  : `${filteredBlogs.length} artículo${filteredBlogs.length !== 1 ? 's' : ''} encontrado${filteredBlogs.length !== 1 ? 's' : ''}`
                }
                {searchTerm && ` para "${searchTerm}"`}
                {selectedCategory !== 'all' && ` en "${categoryLabels[selectedCategory]}"`}
              </p>
            </div>
          </div>
        </section>

        {/* Lista de blogs */}
        <section className="py-12 bg-gray-50">
          <div className="container-custom">
            {filteredBlogs.length === 0 ? (
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
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="btn-primary"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBlogs.map((blog) => (
                  <BlogCard key={blog.id} {...blog} />
                ))}
              </div>
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