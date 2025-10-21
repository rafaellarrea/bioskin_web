// lib/dynamic-blogs-storage.js
// Almacenamiento compartido para blogs generados dinámicamente

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta para almacenamiento JSON local (solo para desarrollo)
const BLOGS_JSON_PATH = join(__dirname, '../data/blogs-generated.json');

// Array compartido para almacenar blogs dinámicamente en memoria (producción)
let dynamicBlogs = [];

// Clave para localStorage (frontend)
const LOCALSTORAGE_KEY = 'bioskin_dynamic_blogs';

// Función para guardar blogs en localStorage (frontend)
function saveBlogsToLocalStorage(blogs) {
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

// Función para cargar blogs desde localStorage (frontend)
function loadBlogsFromLocalStorage() {
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

// Función para leer blogs JSON existentes
function loadBlogsFromJSON() {
  if (typeof window !== 'undefined') return []; // Browser environment
  
  try {
    if (existsSync(BLOGS_JSON_PATH)) {
      const data = readFileSync(BLOGS_JSON_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Error leyendo blogs JSON:', error.message);
  }
  return [];
}

// Función para guardar blogs en JSON (solo desarrollo local)
function saveBlogsToJSON(blogs) {
  if (typeof window !== 'undefined' || process.env.VERCEL) return false; // Skip en browser y Vercel
  
  try {
    const dataDir = dirname(BLOGS_JSON_PATH);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    
    writeFileSync(BLOGS_JSON_PATH, JSON.stringify(blogs, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.warn('Error guardando blogs JSON:', error.message);
    return false;
  }
}

// Inicializar blogs dinámicos al importar
if (dynamicBlogs.length === 0) {
  const savedBlogs = loadBlogsFromJSON();
  if (savedBlogs.length === 0) {
    // Si no hay blogs en JSON, intentar cargar desde localStorage
    const localStorageBlogs = loadBlogsFromLocalStorage();
    dynamicBlogs.push(...localStorageBlogs);
  } else {
    dynamicBlogs.push(...savedBlogs);
  }
}

// Funciones públicas para gestión de blogs dinámicos
export function getDynamicBlogs() {
  return [...dynamicBlogs];
}

export function addDynamicBlog(blog) {
  // Verificar que no existe un blog con el mismo slug
  const existingIndex = dynamicBlogs.findIndex(b => b.slug === blog.slug);
  if (existingIndex >= 0) {
    dynamicBlogs[existingIndex] = blog; // Actualizar existente
  } else {
    dynamicBlogs.unshift(blog); // Agregar al inicio
  }
  
  // Intentar guardar en JSON y localStorage
  const savedJSON = saveBlogsToJSON(dynamicBlogs);
  const savedLocalStorage = saveBlogsToLocalStorage(dynamicBlogs);
  
  return {
    success: true,
    blogId: blog.id || blog.slug,
    storage: {
      memory: true,
      json: savedJSON,
      localStorage: savedLocalStorage,
      location: savedJSON ? BLOGS_JSON_PATH : (savedLocalStorage ? 'localStorage' : 'memory-only')
    }
  };
}

export function updateDynamicBlog(slug, updatedBlog) {
  const blogIndex = dynamicBlogs.findIndex(b => b.slug === slug);
  
  if (blogIndex === -1) {
    throw new Error('Blog no encontrado');
  }

  dynamicBlogs[blogIndex] = {
    ...dynamicBlogs[blogIndex],
    ...updatedBlog,
    updatedAt: new Date().toISOString()
  };

  const savedJSON = saveBlogsToJSON(dynamicBlogs);
  const savedLocalStorage = saveBlogsToLocalStorage(dynamicBlogs);

  return {
    success: true,
    blog: dynamicBlogs[blogIndex],
    storage: {
      memory: true,
      json: savedJSON,
      localStorage: savedLocalStorage
    }
  };
}

export function deleteDynamicBlog(slug) {
  const blogIndex = dynamicBlogs.findIndex(b => b.slug === slug);
  
  if (blogIndex === -1) {
    throw new Error('Blog no encontrado');
  }

  const deletedBlog = dynamicBlogs.splice(blogIndex, 1)[0];
  const savedJSON = saveBlogsToJSON(dynamicBlogs);
  const savedLocalStorage = saveBlogsToLocalStorage(dynamicBlogs);

  return {
    success: true,
    blog: deletedBlog,
    storage: {
      memory: true,
      json: savedJSON,
      localStorage: savedLocalStorage
    }
  };
}

export function findDynamicBlog(slug) {
  return dynamicBlogs.find(b => b.slug === slug) || null;
}

export function getDynamicBlogsCount() {
  return dynamicBlogs.length;
}