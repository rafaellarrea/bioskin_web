// src/hooks/useBlogs.ts

import { useState, useEffect } from 'react';
import hybridAnalyticsService from '../../lib/hybrid-analytics';

// @ts-ignore
import { getAllBlogsWithLocalStorage, getBlogBySlugWithLocalStorage } from '../../lib/frontend-blog-sync.js';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category: 'medico-estetico' | 'tecnico';
  author: string;
  publishedAt: string;
  readTime: number;
  image: string;
  imagenPrincipal?: string;    // Imagen principal personalizada
  imagenConclusion?: string;   // Imagen después de conclusión
  featured: boolean;
  tags: string[];
  citations?: {
    text: string;
    source: string;
    url?: string;
  }[];
}

interface BlogsResponse {
  success: boolean;
  blogs: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    category: string | null;
    search: string | null;
    featured: boolean;
  };
}

export function useBlogs(options: {
  category?: 'medico-estetico' | 'tecnico';
  page?: number;
  limit?: number;
  search?: string;
  featured?: boolean;
} = {}) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<BlogsResponse['pagination'] | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, [options.category, options.page, options.search, options.featured]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Track page view para analytics
      hybridAnalyticsService.trackPageView('/blogs');

      // Usar el nuevo sistema de sincronización que combina backend + localStorage
      const response = await getAllBlogsWithLocalStorage();
      
      if (response.success) {
        let filteredBlogs = response.blogs;

        // Aplicar filtros
        if (options.category) {
          filteredBlogs = filteredBlogs.filter(blog => blog.category === options.category);
        }

        if (options.search) {
          const searchLower = options.search.toLowerCase();
          filteredBlogs = filteredBlogs.filter(blog =>
            blog.title.toLowerCase().includes(searchLower) ||
            blog.excerpt.toLowerCase().includes(searchLower) ||
            blog.tags?.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }

        if (options.featured) {
          filteredBlogs = filteredBlogs.filter(blog => blog.featured);
        }

        // Aplicar paginación
        const page = options.page || 1;
        const limit = options.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);

        setBlogs(paginatedBlogs);
        setPagination({
          page,
          limit,
          total: filteredBlogs.length,
          totalPages: Math.ceil(filteredBlogs.length / limit),
          hasNext: endIndex < filteredBlogs.length,
          hasPrev: page > 1
        });

        // Track successful blog load
        hybridAnalyticsService.trackEvent('blogs_loaded', {
          source: 'api',
          count: paginatedBlogs.length,
          category: options.category || 'all',
          search: options.search || null
        });
      } else {
        throw new Error('Error cargando blogs');
      }
    } catch (err) {
      console.error('Error en fetchBlogs:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setBlogs([]);
      
      // Track error
      hybridAnalyticsService.trackEvent('blogs_error', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    blogs,
    loading,
    error,
    pagination,
    refetch: fetchBlogs
  };
}

export function useBlog(slug: string) {
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError(null);

      // Track page view para analytics
      hybridAnalyticsService.trackPageView(`/blog/${slug}`);

      // Usar el nuevo sistema de sincronización
      const response = await getBlogBySlugWithLocalStorage(slug);

      if (response.success && response.blog) {
        setBlog(response.blog);
        
        // Track blog view
        hybridAnalyticsService.trackEvent('blog_view', {
          slug,
          title: response.blog.title,
          category: response.blog.category
        });
      } else {
        throw new Error('Blog no encontrado');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setBlog(null);
      
      // Track error
      hybridAnalyticsService.trackEvent('blog_not_found', {
        slug,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    blog,
    loading,
    error,
    refetch: fetchBlog
  };
}