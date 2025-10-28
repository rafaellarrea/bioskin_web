// src/data/blogs.ts

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'medico-estetico' | 'tecnico';
  author: string;
  publishedAt: string;
  readTime: number; // en minutos
  tags: string[];
  image: string;
  featured: boolean;
  citations?: {
    text: string;
    source: string;
    url?: string;
  }[];
}

// Datos de ejemplo para desarrollo
export const blogPosts: BlogPost[] = [
  // Array vacío - los blogs se cargan dinámicamente desde el generador
  // Los blogs se obtienen desde:
  // 1. Sistema de generación con IA (blog-system/)
  // 2. Archivos JSON organizados (src/data/blogs/)
  // 3. API endpoints (/api/blogs/)
];

// Función para obtener blogs por categoría
export const getBlogsByCategory = (category?: 'medico-estetico' | 'tecnico'): BlogPost[] => {
  if (!category) return blogPosts;
  return blogPosts.filter(blog => blog.category === category);
};

// Función para obtener blog por slug
export const getBlogBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find(blog => blog.slug === slug);
};

// Función para obtener blogs destacados
export const getFeaturedBlogs = (): BlogPost[] => {
  return blogPosts.filter(blog => blog.featured);
};