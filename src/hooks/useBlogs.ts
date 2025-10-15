// src/hooks/useBlogs.ts

import { useState, useEffect } from 'react';

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

interface BlogResponse {
  success: boolean;
  blog: BlogPost;
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

      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.search) params.append('search', options.search);
      if (options.featured) params.append('featured', 'true');

      const response = await fetch(`/api/blogs?${params.toString()}`);
      const data: BlogsResponse = await response.json();

      if (data.success) {
        setBlogs(data.blogs);
        setPagination(data.pagination);
      } else {
        throw new Error('Error cargando blogs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setBlogs([]);
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

      const response = await fetch(`/api/blogs/${slug}`);
      const data: BlogResponse = await response.json();

      if (data.success) {
        setBlog(data.blog);
      } else {
        throw new Error('Blog no encontrado');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setBlog(null);
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