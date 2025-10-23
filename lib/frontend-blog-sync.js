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

// Función para cargar blogs desde archivos JSON estáticos
export async function loadJsonBlogs() {
  try {
    // Usar el endpoint del servidor para cargar blogs JSON
    const response = await fetch('/api/blogs/json-files');
    if (!response.ok) {
      console.warn('No se pudieron cargar blogs JSON desde el servidor');
      return [];
    }
    
    const data = await response.json();
    if (data.success && data.blogs) {
      return data.blogs.map(blog => ({
        ...blog,
        source: 'json-file'
      }));
    }
    
    return [];
  } catch (error) {
    console.warn('Error cargando blogs JSON:', error);
    return [];
  }
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

// Función para obtener todos los blogs (combina backend + localStorage + JSON files)
export async function getAllBlogsWithLocalStorage() {
  try {
    // 1. PRIORIDAD MÁXIMA: blogs de localStorage (inmediatos)
    const localBlogs = loadBlogsFromLocalStorage();
    
    // 2. SEGUNDA PRIORIDAD: Cargar blogs desde archivos JSON estáticos
    const jsonBlogs = await loadJsonBlogs();
    
    // 3. TERCERA PRIORIDAD: Intentar obtener blogs del servidor (incluyendo JSON files)
    let backendBlogs = [];
    try {
      const response = await fetch('/api/blogs/manage?source=all&limit=100');
      const backendData = await response.json();
      if (backendData.success && backendData.blogs) {
        backendBlogs = backendData.blogs;
      }
    } catch (error) {
      console.warn('Error cargando blogs del servidor:', error);
      // Fallback: intentar el endpoint básico
      try {
        const fallbackResponse = await fetch('/api/blogs');
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.success && fallbackData.blogs) {
          backendBlogs = fallbackData.blogs;
        }
      } catch (fallbackError) {
        console.warn('Error en fallback:', fallbackError);
      }
    }
    
    // 4. Combinar blogs evitando duplicados (prioridad: localStorage > JSON > Servidor)
    const allSlugs = new Set();
    const allBlogs = [];
    
    // Agregar localStorage blogs (prioridad máxima)
    localBlogs.forEach(blog => {
      if (!allSlugs.has(blog.slug)) {
        allSlugs.add(blog.slug);
        allBlogs.push({ ...blog, source: 'localStorage' });
      }
    });
    
    // Agregar JSON blogs (segunda prioridad)
    jsonBlogs.forEach(blog => {
      if (!allSlugs.has(blog.slug)) {
        allSlugs.add(blog.slug);
        allBlogs.push({ ...blog, source: 'json-file' });
      }
    });
    
    // Agregar server blogs (última prioridad)
    backendBlogs.forEach(blog => {
      if (!allSlugs.has(blog.slug)) {
        allSlugs.add(blog.slug);
        allBlogs.push(blog);
      }
    });
    
    // Migrar blogs de localStorage al servidor en background (sin bloquear la UI)
    if (localBlogs.length > 0) {
      // Solo migrar si hay blogs locales que probablemente no estén en el servidor
      fetch('/api/blogs/migrate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogs: localBlogs
        })
      }).then(response => response.json())
        .then(result => {
          if (result.success && result.results.added > 0) {
            console.log(`✅ Migración automática en background: ${result.results.added} blogs agregados al servidor`);
          }
        })
        .catch(error => console.warn('⚠️ Migración automática falló (no crítico):', error));
    }
    
    // Ordenar por fecha de publicación (más recientes primero)
    allBlogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    return {
      success: true,
      blogs: allBlogs,
      sources: {
        localStorage: localBlogs.length,
        jsonFiles: jsonBlogs.length,
        backend: backendBlogs.length,
        total: allBlogs.length
      }
    };
  } catch (error) {
    console.error('Error obteniendo blogs:', error);
    
    // Fallback SIEMPRE a localStorage
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

// Función para obtener un blog específico (busca en localStorage primero, luego JSON, luego backend)
export async function getBlogBySlugWithLocalStorage(slug) {
  try {
    // 1. Buscar primero en localStorage
    const localBlogs = loadBlogsFromLocalStorage();
    const localBlog = localBlogs.find(blog => blog.slug === slug);
    
    if (localBlog) {
      return {
        success: true,
        blog: localBlog,
        source: 'localStorage'
      };
    }
    
    // 2. Buscar en blogs JSON
    const jsonBlogs = await loadJsonBlogs();
    const jsonBlog = jsonBlogs.find(blog => blog.slug === slug);
    
    if (jsonBlog) {
      return {
        success: true,
        blog: jsonBlog,
        source: 'json-file'
      };
    }
    
    // 3. Buscar en backend usando el endpoint de manage con slug específico
    const response = await fetch(`/api/blogs/manage?slug=${slug}`);
    const backendData = await response.json();
    
    if (backendData.success && backendData.blog) {
      return {
        success: true,
        blog: backendData.blog,
        source: 'backend'
      };
    }
    
    // 4. Fallback: usar endpoint básico
    const fallbackResponse = await fetch(`/api/blogs/${slug}`);
    const fallbackData = await fallbackResponse.json();
    
    return {
      success: fallbackData.success,
      blog: fallbackData.blog,
      source: 'backend-fallback'
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