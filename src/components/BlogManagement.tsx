// src/components/BlogManagement.tsx
// Componente completo para gestión de blogs (CRUD + visualización)

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Search, 
  Save,
  X,
  FileText,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category: 'medico-estetico' | 'tecnico';
  author: string;
  publishedAt: string;
  readTime: number;
  image: string;
  imagenPrincipal?: string;    // Nueva imagen principal personalizada
  imagenConclusion?: string;   // Nueva imagen después de conclusión
  featured: boolean;
  tags: string[];
  source: 'static' | 'dynamic';
  createdAt?: string;
  updatedAt?: string;
}

interface BlogStats {
  static: number;
  dynamic: number;
  total: number;
}

const BlogManagement: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [stats, setStats] = useState<BlogStats>({ static: 0, dynamic: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'medico-estetico' | 'tecnico'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'static' | 'dynamic'>('all');
  
  // Modal de edición
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para crear nuevo blog
  const [isCreating, setIsCreating] = useState(false);
  const [newBlog, setNewBlog] = useState<Partial<Blog>>({
    title: '',
    excerpt: '',
    content: '',
    category: 'medico-estetico',
    author: 'BIOSKIN IA',
    featured: false,
    tags: [],
    imagenPrincipal: '',
    imagenConclusion: ''
  });

  // Función para cargar blogs desde localStorage
  const loadBlogsFromLocalStorage = () => {
    try {
      const data = localStorage.getItem('bioskin_dynamic_blogs');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Error leyendo localStorage:', error.message);
      return [];
    }
  };

  // Cargar blogs (combinando backend + localStorage)
  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener blogs del backend (estáticos + dinámicos en memoria del servidor)
      const params = new URLSearchParams({
        limit: '50',
        source: 'all', // Siempre cargar todos del servidor
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/blogs/manage?${params}`);
      const data = await response.json();
      
      // Obtener blogs adicionales de localStorage
      const localStorageBlogs = loadBlogsFromLocalStorage();
      
      // Combinar blogs evitando duplicados
      let allBlogs = [];
      
      if (data.success && data.blogs) {
        allBlogs = [...data.blogs];
      }
      
      // Agregar blogs de localStorage que no estén en el servidor
      localStorageBlogs.forEach(localBlog => {
        const exists = allBlogs.some(serverBlog => 
          serverBlog.slug === localBlog.slug || serverBlog.id === localBlog.id
        );
        
        if (!exists) {
          // Marcar como fuente localStorage y agregar
          allBlogs.push({
            ...localBlog,
            source: 'localStorage'
          });
        }
      });

      // Aplicar filtros de fuente
      let filteredBlogs = allBlogs;
      if (sourceFilter === 'static') {
        filteredBlogs = allBlogs.filter(blog => blog.source === 'static');
      } else if (sourceFilter === 'dynamic') {
        filteredBlogs = allBlogs.filter(blog => blog.source === 'dynamic' || blog.source === 'localStorage');
      }

      // Aplicar filtros de categoría
      if (categoryFilter !== 'all') {
        filteredBlogs = filteredBlogs.filter(blog => blog.category === categoryFilter);
      }

      // Aplicar búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredBlogs = filteredBlogs.filter(blog =>
          blog.title.toLowerCase().includes(searchLower) ||
          blog.excerpt.toLowerCase().includes(searchLower) ||
          (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      }

      // Ordenar por fecha (más recientes primero)
      filteredBlogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      setBlogs(filteredBlogs);
      
      // Calcular estadísticas
      const staticCount = allBlogs.filter(blog => blog.source === 'static').length;
      const dynamicCount = allBlogs.filter(blog => blog.source === 'dynamic' || blog.source === 'localStorage').length;
      
      setStats({
        static: staticCount,
        dynamic: dynamicCount,
        total: allBlogs.length
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando blogs');
      
      // Fallback: intentar cargar solo desde localStorage
      try {
        const localStorageBlogs = loadBlogsFromLocalStorage();
        setBlogs(localStorageBlogs.map(blog => ({ ...blog, source: 'localStorage' })));
        setStats({
          static: 0,
          dynamic: localStorageBlogs.length,
          total: localStorageBlogs.length
        });
      } catch (localError) {
        console.error('Error incluso con fallback localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para sincronizar blogs de localStorage al servidor
  const syncLocalStorageToServer = async () => {
    try {
      setLoading(true);
      setError(null);

      const localStorageBlogs = loadBlogsFromLocalStorage();

      if (localStorageBlogs.length === 0) {
        alert('No hay blogs en localStorage para sincronizar');
        return;
      }

      const response = await fetch('/api/blogs/sync-localStorage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localStorageBlogs })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Sincronización completada: ${data.results.added} blogs agregados, ${data.results.skipped} omitidos`);
        
        // Limpiar localStorage después de sincronización exitosa
        if (data.results.added > 0 && confirm('¿Quieres limpiar localStorage ya que los blogs fueron sincronizados al servidor?')) {
          localStorage.removeItem('bioskin_dynamic_blogs');
        }
        
        // Recargar blogs para reflejar los cambios
        await loadBlogs();
      } else {
        throw new Error(data.message);
      }

    } catch (error) {
      setError('Error durante la sincronización: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Efectos
  useEffect(() => {
    loadBlogs();
  }, [searchTerm, categoryFilter, sourceFilter]);

  // Guardar blog (crear o actualizar)
  const saveBlog = async (blogData: Partial<Blog>, isUpdate = false) => {
    try {
      setIsSaving(true);
      
      const url = isUpdate 
        ? `/api/blogs/manage?slug=${blogData.slug}`
        : '/api/blogs/manage';
      
      const method = isUpdate ? 'PUT' : 'POST';
      
      // Generar slug si no existe
      if (!blogData.slug && blogData.title) {
        blogData.slug = blogData.title
          .toLowerCase()
          .replace(/[áàäâ]/g, 'a')
          .replace(/[éèëê]/g, 'e')
          .replace(/[íìïî]/g, 'i')
          .replace(/[óòöô]/g, 'o')
          .replace(/[úùüû]/g, 'u')
          .replace(/ñ/g, 'n')
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .replace(/^-+|-+$/g, '') + '-' + Date.now();
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blog: blogData })
      });

      const result = await response.json();

      if (result.success) {
        await loadBlogs(); // Recargar lista
        setEditingBlog(null);
        setIsEditing(false);
        setIsCreating(false);
        setNewBlog({
          title: '',
          excerpt: '',
          content: '',
          category: 'medico-estetico',
          author: 'BIOSKIN IA',
          featured: false,
          tags: []
        });
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error guardando blog';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar blog
  const deleteBlog = async (slug: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este blog?')) {
      return;
    }

    try {
      const response = await fetch(`/api/blogs/manage?slug=${slug}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await loadBlogs(); // Recargar lista
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando blog');
    }
  };

  // Renderizar formulario de edición
  const renderEditForm = (blog: Partial<Blog>, isNew = false) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              {isNew ? 'Crear Nuevo Blog' : 'Editar Blog'}
            </h3>
            <button
              onClick={() => {
                setIsEditing(false);
                setIsCreating(false);
                setEditingBlog(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            saveBlog(isNew ? newBlog : (editingBlog || {}), !isNew);
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={blog.title || ''}
                  onChange={(e) => {
                    if (isNew) {
                      setNewBlog({ ...newBlog, title: e.target.value });
                    } else {
                      setEditingBlog({ ...editingBlog!, title: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={blog.category || 'medico-estetico'}
                  onChange={(e) => {
                    const category = e.target.value as 'medico-estetico' | 'tecnico';
                    if (isNew) {
                      setNewBlog({ ...newBlog, category });
                    } else {
                      setEditingBlog({ ...editingBlog!, category });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                >
                  <option value="medico-estetico">Médico Estético</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autor
                </label>
                <input
                  type="text"
                  value={blog.author || ''}
                  onChange={(e) => {
                    if (isNew) {
                      setNewBlog({ ...newBlog, author: e.target.value });
                    } else {
                      setEditingBlog({ ...editingBlog!, author: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={blog.featured || false}
                  onChange={(e) => {
                    if (isNew) {
                      setNewBlog({ ...newBlog, featured: e.target.checked });
                    } else {
                      setEditingBlog({ ...editingBlog!, featured: e.target.checked });
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                  Blog destacado
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extracto *
              </label>
              <textarea
                value={blog.excerpt || ''}
                onChange={(e) => {
                  if (isNew) {
                    setNewBlog({ ...newBlog, excerpt: e.target.value });
                  } else {
                    setEditingBlog({ ...editingBlog!, excerpt: e.target.value });
                  }
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido
              </label>
              <textarea
                value={blog.content || ''}
                onChange={(e) => {
                  if (isNew) {
                    setNewBlog({ ...newBlog, content: e.target.value });
                  } else {
                    setEditingBlog({ ...editingBlog!, content: e.target.value });
                  }
                }}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                placeholder="Contenido en formato Markdown"
              />
            </div>

            {/* 🖼️ NUEVOS CAMPOS DE IMÁGENES PERSONALIZADAS */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">📸 Imágenes Personalizadas</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Imagen Principal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Imagen Principal (al inicio del blog)
                  </label>
                  <input
                    type="url"
                    value={blog.imagenPrincipal || ''}
                    onChange={(e) => {
                      if (isNew) {
                        setNewBlog({ ...newBlog, imagenPrincipal: e.target.value });
                      } else {
                        setEditingBlog({ ...editingBlog!, imagenPrincipal: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                    placeholder="https://ejemplo.com/imagen-principal.jpg"
                  />
                  {blog.imagenPrincipal && (
                    <div className="mt-2">
                      <img 
                        src={blog.imagenPrincipal} 
                        alt="Vista previa principal" 
                        className="w-full h-32 object-cover rounded-md border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Se mostrará al inicio del blog si se proporciona una URL válida
                  </p>
                </div>

                {/* Imagen de Conclusión */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏁 Imagen de Conclusión (después de conclusión)
                  </label>
                  <input
                    type="url"
                    value={blog.imagenConclusion || ''}
                    onChange={(e) => {
                      if (isNew) {
                        setNewBlog({ ...newBlog, imagenConclusion: e.target.value });
                      } else {
                        setEditingBlog({ ...editingBlog!, imagenConclusion: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
                    placeholder="https://ejemplo.com/imagen-conclusion.jpg"
                  />
                  {blog.imagenConclusion && (
                    <div className="mt-2">
                      <img 
                        src={blog.imagenConclusion} 
                        alt="Vista previa conclusión" 
                        className="w-full h-32 object-cover rounded-md border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Se mostrará después de la sección de conclusión si se proporciona una URL válida
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setIsCreating(false);
                  setEditingBlog(null);
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-[#deb887] text-white rounded-md hover:bg-[#d4a574] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isNew ? 'Crear Blog' : 'Guardar Cambios'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Blogs</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={loadBlogs}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
            disabled={loading}
            title="Recargar lista de blogs"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
            )}
            Recargar
          </button>
          <button
            onClick={syncLocalStorageToServer}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
            disabled={loading}
            title="Sincronizar blogs de localStorage al servidor"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
                <path d="M4 7l16 0"/>
                <path d="M10 15l6 0"/>
              </svg>
            )}
            Sincronizar
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Nuevo Blog
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Blogs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blogs Estáticos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.static}</p>
            </div>
            <FileText className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blogs Generados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dynamic}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Esta Semana</p>
              <p className="text-2xl font-bold text-gray-900">
                {blogs.filter(b => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(b.publishedAt) > weekAgo;
                }).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
          >
            <option value="all">Todas las categorías</option>
            <option value="medico-estetico">Médico Estético</option>
            <option value="tecnico">Técnico</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#deb887]"
          >
            <option value="all">Todas las fuentes</option>
            <option value="static">Estáticos</option>
            <option value="dynamic">Generados</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={16} />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Lista de blogs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="animate-spin mx-auto mb-4" size={32} />
            <p className="text-gray-600">Cargando blogs...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">No se encontraron blogs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blog
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fuente
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {blog.title}
                            </div>
                            {blog.featured && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Destacado
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {blog.excerpt.substring(0, 100)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        blog.category === 'medico-estetico' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {blog.category === 'medico-estetico' ? 'Médico Estético' : 'Técnico'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {blog.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(blog.publishedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        blog.source === 'static' 
                          ? 'bg-green-100 text-green-800' 
                          : blog.source === 'localStorage'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {blog.source === 'static' ? 'Estático' : 
                         blog.source === 'localStorage' ? 'LocalStorage' : 'Generado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/#/blogs/${blog.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                          title="Ver blog"
                        >
                          <Eye size={16} />
                        </a>
                        {blog.source === 'dynamic' && (
                          <>
                            <button
                              onClick={() => {
                                setEditingBlog(blog);
                                setIsEditing(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => deleteBlog(blog.slug)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      {isCreating && renderEditForm(newBlog, true)}
      {isEditing && editingBlog && renderEditForm(editingBlog, false)}
    </div>
  );
};

export default BlogManagement;