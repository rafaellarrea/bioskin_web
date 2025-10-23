// services/blog-manager.js - Gestor de blogs (guardar/cargar)
const fs = require('fs-extra');
const path = require('path');

class BlogManager {
  constructor() {
    // Paths relativos al proyecto principal
    this.projectRoot = path.join(__dirname, '../../');
    this.blogsDir = path.join(this.projectRoot, 'src/data/blogs');
    this.localBlogsDir = path.join(__dirname, '../saved-blogs');
    
    // Asegurar que existan las carpetas
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.ensureDir(this.blogsDir);
      await fs.ensureDir(this.localBlogsDir);
      console.log('📁 Directorios de blogs verificados');
    } catch (error) {
      console.error('❌ Error creando directorios:', error);
    }
  }

  // Guardar blog en formato JSON
  async saveBlog(blogData) {
    try {
      const { slug } = blogData;
      
      if (!slug) {
        throw new Error('El blog debe tener un slug válido');
      }

      // Validar estructura del blog
      this.validateBlogStructure(blogData);

      // Preparar datos finales
      const finalBlogData = {
        ...blogData,
        savedAt: new Date().toISOString(),
        source: 'local-generator'
      };

      // Guardar en ambas ubicaciones
      const localFile = path.join(this.localBlogsDir, `${slug}.json`);
      const projectFile = path.join(this.blogsDir, `${slug}.json`);

      // Escribir archivos
      await fs.writeFile(localFile, JSON.stringify(finalBlogData, null, 2), 'utf8');
      await fs.writeFile(projectFile, JSON.stringify(finalBlogData, null, 2), 'utf8');

      console.log(`💾 Blog guardado: ${slug}.json`);

      return {
        success: true,
        message: 'Blog guardado exitosamente',
        slug: slug,
        paths: {
          local: localFile,
          project: projectFile
        }
      };

    } catch (error) {
      console.error('❌ Error guardando blog:', error);

      return {
        success: false,
        message: 'Error guardando el blog',
        error: error.message
      };
    }
  }

  // Validar estructura del blog
  validateBlogStructure(blogData) {
    const requiredFields = [
      'id', 'title', 'slug', 'excerpt', 'content', 
      'category', 'author', 'publishedAt', 'tags'
    ];

    const missingFields = requiredFields.filter(field => !blogData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }

    // Validar tipos
    if (typeof blogData.title !== 'string' || blogData.title.length < 5) {
      throw new Error('El título debe ser un string de al menos 5 caracteres');
    }

    if (typeof blogData.content !== 'string' || blogData.content.length < 100) {
      throw new Error('El contenido debe tener al menos 100 caracteres');
    }

    if (!Array.isArray(blogData.tags) || blogData.tags.length === 0) {
      throw new Error('Los tags deben ser un array no vacío');
    }

    if (!['medico-estetico', 'tecnico'].includes(blogData.category)) {
      throw new Error('La categoría debe ser "medico-estetico" o "tecnico"');
    }
  }

  // Obtener lista de blogs guardados
  async getSavedBlogs() {
    try {
      const blogs = [];

      // Leer desde carpeta local
      if (await fs.pathExists(this.localBlogsDir)) {
        const localFiles = await fs.readdir(this.localBlogsDir);
        
        for (const file of localFiles) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(this.localBlogsDir, file);
              const content = await fs.readFile(filePath, 'utf8');
              const blogData = JSON.parse(content);
              
              blogs.push({
                ...blogData,
                location: 'local',
                filename: file
              });
            } catch (err) {
              console.warn(`⚠️  Error leyendo ${file}:`, err.message);
            }
          }
        }
      }

      // Leer desde carpeta del proyecto
      if (await fs.pathExists(this.blogsDir)) {
        const projectFiles = await fs.readdir(this.blogsDir);
        
        for (const file of projectFiles) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(this.blogsDir, file);
              const content = await fs.readFile(filePath, 'utf8');
              const blogData = JSON.parse(content);
              
              // Evitar duplicados
              const exists = blogs.find(b => b.slug === blogData.slug);
              if (!exists) {
                blogs.push({
                  ...blogData,
                  location: 'project',
                  filename: file
                });
              }
            } catch (err) {
              console.warn(`⚠️  Error leyendo ${file}:`, err.message);
            }
          }
        }
      }

      // Ordenar por fecha (más recientes primero)
      blogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      console.log(`📚 Encontrados ${blogs.length} blogs guardados`);

      return blogs;

    } catch (error) {
      console.error('❌ Error obteniendo blogs:', error);
      return [];
    }
  }

  // Obtener blog específico por slug
  async getBlogBySlug(slug) {
    try {
      // Buscar primero en local
      const localFile = path.join(this.localBlogsDir, `${slug}.json`);
      if (await fs.pathExists(localFile)) {
        const content = await fs.readFile(localFile, 'utf8');
        return JSON.parse(content);
      }

      // Buscar en proyecto
      const projectFile = path.join(this.blogsDir, `${slug}.json`);
      if (await fs.pathExists(projectFile)) {
        const content = await fs.readFile(projectFile, 'utf8');
        return JSON.parse(content);
      }

      return null;

    } catch (error) {
      console.error(`❌ Error obteniendo blog ${slug}:`, error);
      return null;
    }
  }

  // Eliminar blog
  async deleteBlog(slug) {
    try {
      let deleted = false;

      // Eliminar de local
      const localFile = path.join(this.localBlogsDir, `${slug}.json`);
      if (await fs.pathExists(localFile)) {
        await fs.remove(localFile);
        deleted = true;
      }

      // Eliminar de proyecto
      const projectFile = path.join(this.blogsDir, `${slug}.json`);
      if (await fs.pathExists(projectFile)) {
        await fs.remove(projectFile);
        deleted = true;
      }

      if (deleted) {
        console.log(`🗑️  Blog eliminado: ${slug}`);
        return {
          success: true,
          message: 'Blog eliminado exitosamente'
        };
      } else {
        return {
          success: false,
          message: 'Blog no encontrado'
        };
      }

    } catch (error) {
      console.error(`❌ Error eliminando blog ${slug}:`, error);
      return {
        success: false,
        message: 'Error eliminando el blog',
        error: error.message
      };
    }
  }

  // Exportar blog a archivo
  async exportBlog(slug, format = 'json') {
    try {
      const blog = await this.getBlogBySlug(slug);
      
      if (!blog) {
        throw new Error('Blog no encontrado');
      }

      const exportDir = path.join(__dirname, '../exports');
      await fs.ensureDir(exportDir);

      let exportContent, extension, filename;

      switch (format.toLowerCase()) {
        case 'json':
          exportContent = JSON.stringify(blog, null, 2);
          extension = 'json';
          break;

        case 'md':
        case 'markdown':
          exportContent = this.blogToMarkdown(blog);
          extension = 'md';
          break;

        default:
          throw new Error('Formato no soportado. Use: json, md');
      }

      filename = `${slug}.${extension}`;
      const exportPath = path.join(exportDir, filename);

      await fs.writeFile(exportPath, exportContent, 'utf8');

      console.log(`📤 Blog exportado: ${filename}`);

      return {
        success: true,
        message: 'Blog exportado exitosamente',
        path: exportPath,
        filename: filename
      };

    } catch (error) {
      console.error(`❌ Error exportando blog ${slug}:`, error);
      return {
        success: false,
        message: 'Error exportando el blog',
        error: error.message
      };
    }
  }

  // Convertir blog a Markdown
  blogToMarkdown(blog) {
    return `---
title: ${blog.title}
slug: ${blog.slug}
excerpt: ${blog.excerpt}
category: ${blog.category}
author: ${blog.author}
publishedAt: ${blog.publishedAt}
readTime: ${blog.readTime}
tags: ${blog.tags.join(', ')}
featured: ${blog.featured || false}
---

${blog.content}
`;
  }

  // Estadísticas de blogs
  async getBlogStats() {
    try {
      const blogs = await this.getSavedBlogs();

      const stats = {
        total: blogs.length,
        byCategory: {},
        byAuthor: {},
        totalWords: 0,
        averageReadTime: 0
      };

      blogs.forEach(blog => {
        // Por categoría
        stats.byCategory[blog.category] = (stats.byCategory[blog.category] || 0) + 1;

        // Por autor
        stats.byAuthor[blog.author] = (stats.byAuthor[blog.author] || 0) + 1;

        // Palabras
        if (blog.content) {
          stats.totalWords += blog.content.split(' ').length;
        }
      });

      // Promedio de tiempo de lectura
      if (blogs.length > 0) {
        const totalReadTime = blogs.reduce((sum, blog) => sum + (blog.readTime || 0), 0);
        stats.averageReadTime = Math.round(totalReadTime / blogs.length);
      }

      return stats;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }
}

module.exports = BlogManager;