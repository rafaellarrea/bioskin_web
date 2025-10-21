// lib/frontend-blog-sync.js
// Servicio para sincronizar blogs entre frontend y backend usando localStorage

const LOCALSTORAGE_KEY = 'bioskin_dynamic_blogs';

// Función para guardar blogs en localStorage
export function saveBlogsToLocalStorage(blogs) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(blogs));
      return true;
    } catch (error) {
      console.warn('Error guardando en localStorage:', error.message);
      return false;
    }
  }
  return false;
}

// Función para cargar blogs desde localStorage
export function loadBlogsFromLocalStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const data = localStorage.getItem(LOCALSTORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Error leyendo localStorage:', error.message);
    }
  }
  return [];
}

// Función para sincronizar blogs después de generar uno nuevo
export function syncBlogToLocalStorage(newBlog) {
  const existingBlogs = loadBlogsFromLocalStorage();
  
  // Verificar si ya existe el blog
  const existingIndex = existingBlogs.findIndex(blog => blog.slug === newBlog.slug);
  
  if (existingIndex >= 0) {
    // Actualizar existente
    existingBlogs[existingIndex] = newBlog;
  } else {
    // Agregar nuevo al inicio
    existingBlogs.unshift(newBlog);
  }
  
  // Guardar la lista actualizada
  return saveBlogsToLocalStorage(existingBlogs);
}

// Función para obtener todos los blogs (combina backend + localStorage)
export async function getAllBlogsWithLocalStorage() {
  try {
    // Usar el nuevo endpoint que obtiene TODOS los blogs del servidor
    const response = await fetch('/api/blogs/list-all');
    const backendData = await response.json();
    
    // Primero obtener todos los blogs del servidor
    let allBlogs = [];
    
    if (backendData.success && backendData.blogs) {
      allBlogs = [...backendData.blogs];
    }
    
    // Obtener blogs del localStorage
    const localBlogs = loadBlogsFromLocalStorage();
    
    // Si hay blogs en localStorage que no están en el servidor, intentar migrarlos automáticamente
    const blogsToMigrate = localBlogs.filter(localBlog => 
      !allBlogs.some(serverBlog => 
        serverBlog.slug === localBlog.slug || serverBlog.id === localBlog.id
      )
    );
    
    // Si hay blogs para migrar, hacerlo automáticamente en background
    if (blogsToMigrate.length > 0) {
      console.log(`🔄 Migrando automáticamente ${blogsToMigrate.length} blogs desde localStorage al servidor...`);
      
      // Migrar en background (no esperar el resultado)
      fetch('/api/blogs/migrate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogs: blogsToMigrate
        })
      }).then(response => response.json())
        .then(result => {
          if (result.success) {
            console.log(`✅ Migración automática exitosa: ${result.results.added} blogs agregados`);
          }
        })
        .catch(error => console.warn('⚠️ Error en migración automática:', error));
      
      // Agregar los blogs locales temporalmente hasta que se complete la migración
      allBlogs.unshift(...blogsToMigrate);
    }
    
    // Ordenar por fecha de publicación (más recientes primero)
    allBlogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    return {
      success: true,
      blogs: allBlogs,
      sources: {
        localStorage: localBlogs.length,
        backend: backendData.success ? backendData.blogs.length : 0,
        migrated: blogsToMigrate.length,
        total: allBlogs.length
      }
    };
  } catch (error) {
    console.error('Error obteniendo blogs:', error);
    
    // Fallback a localStorage solamente
    const localBlogs = loadBlogsFromLocalStorage();
    return {
      success: true,
      blogs: localBlogs,
      sources: {
        localStorage: localBlogs.length,
        backend: 0,
        total: localBlogs.length
      }
    };
  }
}

// Función para obtener un blog específico (busca en localStorage primero)
export async function getBlogBySlugWithLocalStorage(slug) {
  try {
    // Buscar primero en localStorage
    const localBlogs = loadBlogsFromLocalStorage();
    const localBlog = localBlogs.find(blog => blog.slug === slug);
    
    if (localBlog) {
      return {
        success: true,
        blog: localBlog,
        source: 'localStorage'
      };
    }
    
    // Si no está en localStorage, buscar en backend
    const response = await fetch(`/api/blogs/${slug}`);
    const backendData = await response.json();
    
    return {
      success: backendData.success,
      blog: backendData.blog,
      source: 'backend'
    };
  } catch (error) {
    console.error('Error obteniendo blog:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para limpiar localStorage (útil para debugging)
export function clearLocalStorageBlogs() {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(LOCALSTORAGE_KEY);
    return true;
  }
  return false;
}