// src/utils/blogLoader.ts
// Utilidad para cargar blogs desde archivos JSON

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'medico-estetico' | 'tecnico';
  author: string;
  publishedAt: string;
  readTime: number;
  tags: string[];
  image: string;
  imagenPrincipal?: string;
  imagenConclusion?: string;
  featured: boolean;
  source: string;
}

export interface BlogIndex {
  version: string;
  lastUpdated: string;
  blogFiles: Array<{
    file: string;
    id: string;
    title: string;
    slug: string;
    category: string;
    featured: boolean;
    publishedAt: string;
  }>;
  categories: string[];
  totalBlogs: number;
}

/**
 * Carga el índice de blogs JSON
 */
export async function loadBlogIndex(): Promise<BlogIndex | null> {
  try {
    const response = await fetch('/src/data/blogs/index.json');
    if (!response.ok) {
      console.warn('No se pudo cargar el índice de blogs JSON');
      return null;
    }
    const index: BlogIndex = await response.json();
    return index;
  } catch (error) {
    console.error('Error cargando índice de blogs:', error);
    return null;
  }
}

/**
 * Carga un blog individual desde archivo JSON
 */
export async function loadBlogFromFile(fileName: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`/src/data/blogs/${fileName}`);
    if (!response.ok) {
      console.warn(`No se pudo cargar el blog: ${fileName}`);
      return null;
    }
    const blog: BlogPost = await response.json();
    return blog;
  } catch (error) {
    console.error(`Error cargando blog ${fileName}:`, error);
    return null;
  }
}

/**
 * Carga todos los blogs desde archivos JSON
 */
export async function loadAllJsonBlogs(): Promise<BlogPost[]> {
  try {
    const index = await loadBlogIndex();
    if (!index) {
      return [];
    }

    const blogPromises = index.blogFiles.map(fileInfo => 
      loadBlogFromFile(fileInfo.file)
    );

    const blogs = await Promise.all(blogPromises);
    
    // Filtrar blogs que fallaron en cargar y agregar metadatos
    return blogs
      .filter((blog): blog is BlogPost => blog !== null)
      .map(blog => ({
        ...blog,
        source: 'json-file'
      }));
  } catch (error) {
    console.error('Error cargando blogs JSON:', error);
    return [];
  }
}

/**
 * Busca un blog específico por slug en archivos JSON
 */
export async function findJsonBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const index = await loadBlogIndex();
    if (!index) {
      return null;
    }

    const fileInfo = index.blogFiles.find(blog => blog.slug === slug);
    if (!fileInfo) {
      return null;
    }

    return await loadBlogFromFile(fileInfo.file);
  } catch (error) {
    console.error(`Error buscando blog con slug ${slug}:`, error);
    return null;
  }
}