// lib/organized-blogs-service.js - Servicio para manejar blogs con estructura organizada
const fs = require('fs-extra');
const path = require('path');

class OrganizedBlogsService {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../');
    this.blogsDir = path.join(this.projectRoot, 'src/data/blogs');
    this.publicImagesDir = path.join(this.projectRoot, 'public/images/blog');
  }

  /**
   * Obtiene todos los blogs (organizados y legacy)
   */
  async getAllBlogs() {
    try {
      const indexPath = path.join(this.blogsDir, 'index.json');
      
      if (await fs.pathExists(indexPath)) {
        const indexContent = await fs.readFile(indexPath, 'utf8');
        const indexData = JSON.parse(indexContent);
        return {
          success: true,
          blogs: indexData.blogs,
          metadata: {
            total: indexData.total,
            organized: indexData.organized,
            legacy: indexData.legacy,
            lastUpdated: indexData.lastUpdated
          }
        };
      }

      // Si no existe índice, crearlo
      await this.updateBlogsIndex();
      return this.getAllBlogs();

    } catch (error) {
      console.error('Error obteniendo blogs:', error);
      return {
        success: false,
        error: error.message,
        blogs: [],
        metadata: { total: 0, organized: 0, legacy: 0 }
      };
    }
  }

  /**
   * Obtiene un blog específico por slug
   */
  async getBlogBySlug(slug) {
    try {
      // Buscar primero en estructura organizada
      const organizedPath = path.join(this.blogsDir, slug, 'index.json');
      if (await fs.pathExists(organizedPath)) {
        const content = await fs.readFile(organizedPath, 'utf8');
        const blogData = JSON.parse(content);
        
        // También obtener metadata
        const metadataPath = path.join(this.blogsDir, slug, 'metadata.json');
        let metadata = {};
        if (await fs.pathExists(metadataPath)) {
          const metadataContent = await fs.readFile(metadataPath, 'utf8');
          metadata = JSON.parse(metadataContent);
        }
        
        return {
          success: true,
          blog: blogData,
          metadata: metadata,
          structure: 'organized'
        };
      }
      
      // Si no está en estructura organizada, buscar en archivos legacy
      const legacyPath = path.join(this.blogsDir, `${slug}.json`);
      if (await fs.pathExists(legacyPath)) {
        const content = await fs.readFile(legacyPath, 'utf8');
        const blogData = JSON.parse(content);
        
        return {
          success: true,
          blog: blogData,
          metadata: blogData,
          structure: 'legacy'
        };
      }
      
      return {
        success: false,
        error: 'Blog no encontrado'
      };

    } catch (error) {
      console.error(`Error obteniendo blog ${slug}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene blogs para la web (formato compatible con el frontend)
   */
  async getBlogsForWeb() {
    try {
      const allBlogs = await this.getAllBlogs();
      
      if (!allBlogs.success) {
        return [];
      }

      // Transformar blogs para el formato esperado por el frontend
      const webBlogs = allBlogs.blogs.map(blog => ({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        category: blog.category,
        author: blog.author,
        publishedAt: blog.publishedAt,
        readTime: blog.readTime,
        tags: blog.tags,
        image: blog.image || blog.imagenPrincipal,
        imagenPrincipal: blog.imagenPrincipal,
        imagenConclusion: blog.imagenConclusion,
        featured: blog.featured || false,
        source: blog.source || 'unknown',
        structure: blog.structure || 'legacy'
      }));

      // Ordenar por fecha de publicación (más recientes primero)
      webBlogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      return webBlogs;

    } catch (error) {
      console.error('Error obteniendo blogs para web:', error);
      return [];
    }
  }

  /**
   * Obtiene blogs por categoría
   */
  async getBlogsByCategory(category) {
    try {
      const allBlogs = await this.getBlogsForWeb();
      return allBlogs.filter(blog => blog.category === category);
    } catch (error) {
      console.error(`Error obteniendo blogs por categoría ${category}:`, error);
      return [];
    }
  }

  /**
   * Obtiene blogs destacados
   */
  async getFeaturedBlogs() {
    try {
      const allBlogs = await this.getBlogsForWeb();
      return allBlogs.filter(blog => blog.featured === true);
    } catch (error) {
      console.error('Error obteniendo blogs destacados:', error);
      return [];
    }
  }

  /**
   * Busca blogs por término
   */
  async searchBlogs(searchTerm) {
    try {
      const allBlogs = await this.getBlogsForWeb();
      const term = searchTerm.toLowerCase();
      
      return allBlogs.filter(blog => 
        blog.title.toLowerCase().includes(term) ||
        blog.excerpt.toLowerCase().includes(term) ||
        blog.content.toLowerCase().includes(term) ||
        blog.tags.some(tag => tag.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error(`Error buscando blogs con término ${searchTerm}:`, error);
      return [];
    }
  }

  /**
   * Actualiza el índice de blogs
   */
  async updateBlogsIndex() {
    try {
      const indexPath = path.join(this.blogsDir, 'index.json');
      const blogs = [];
      
      // Leer todos los blogs organizados y legacy
      if (await fs.pathExists(this.blogsDir)) {
        const entries = await fs.readdir(this.blogsDir);
        
        for (const entry of entries) {
          const entryPath = path.join(this.blogsDir, entry);
          const stat = await fs.stat(entryPath);
          
          if (stat.isDirectory()) {
            // Es un blog organizado
            const metadataPath = path.join(entryPath, 'metadata.json');
            if (await fs.pathExists(metadataPath)) {
              try {
                const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
                blogs.push(metadata);
              } catch (err) {
                console.warn(`⚠️ Error leyendo metadata de ${entry}:`, err.message);
              }
            }
          } else if (entry.endsWith('.json') && entry !== 'index.json') {
            // Es un blog legacy (archivo individual)
            try {
              const content = await fs.readFile(entryPath, 'utf8');
              const blogData = JSON.parse(content);
              blogs.push({
                ...blogData,
                structure: 'legacy',
                source: blogData.source || 'legacy'
              });
            } catch (err) {
              console.warn(`⚠️ Error leyendo blog legacy ${entry}:`, err.message);
            }
          }
        }
      }

      // Ordenar por fecha de publicación
      blogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      // Guardar índice actualizado
      const indexData = {
        lastUpdated: new Date().toISOString(),
        total: blogs.length,
        organized: blogs.filter(b => b.structure === 'organized').length,
        legacy: blogs.filter(b => b.structure === 'legacy').length,
        blogs: blogs
      };

      await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
      console.log(`📇 Índice de blogs actualizado: ${blogs.length} blogs`);

      return indexData;

    } catch (error) {
      console.error('❌ Error actualizando índice de blogs:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de blogs
   */
  async getBlogStats() {
    try {
      const allBlogs = await this.getAllBlogs();
      
      if (!allBlogs.success) {
        return {
          total: 0,
          organized: 0,
          legacy: 0,
          categories: {},
          totalImages: 0
        };
      }

      const stats = {
        total: allBlogs.metadata.total,
        organized: allBlogs.metadata.organized,
        legacy: allBlogs.metadata.legacy,
        categories: {},
        totalImages: 0,
        lastUpdated: allBlogs.metadata.lastUpdated
      };

      // Contar por categorías
      allBlogs.blogs.forEach(blog => {
        if (stats.categories[blog.category]) {
          stats.categories[blog.category]++;
        } else {
          stats.categories[blog.category] = 1;
        }

        // Contar imágenes
        if (blog.images && Array.isArray(blog.images)) {
          stats.totalImages += blog.images.length;
        }
      });

      return stats;

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        total: 0,
        organized: 0,
        legacy: 0,
        categories: {},
        totalImages: 0
      };
    }
  }

  /**
   * Migra un blog legacy a estructura organizada
   */
  async migrateLegacyBlog(slug) {
    try {
      const legacyPath = path.join(this.blogsDir, `${slug}.json`);
      
      if (!await fs.pathExists(legacyPath)) {
        throw new Error('Blog legacy no encontrado');
      }

      const legacyContent = await fs.readFile(legacyPath, 'utf8');
      const blogData = JSON.parse(legacyContent);

      // Crear estructura organizada
      const organizedDir = path.join(this.blogsDir, slug);
      const organizedPath = path.join(organizedDir, 'index.json');
      const metadataPath = path.join(organizedDir, 'metadata.json');

      await fs.ensureDir(organizedDir);

      // Actualizar datos del blog
      const organizedBlogData = {
        ...blogData,
        structure: 'organized',
        migratedAt: new Date().toISOString(),
        migratedFrom: 'legacy'
      };

      // Crear metadata
      const metadata = {
        id: blogData.id,
        title: blogData.title,
        slug: blogData.slug,
        category: blogData.category,
        author: blogData.author,
        publishedAt: blogData.publishedAt,
        savedAt: organizedBlogData.migratedAt,
        readTime: blogData.readTime,
        tags: blogData.tags,
        featured: blogData.featured || false,
        source: 'migrated-from-legacy',
        structure: 'organized',
        images: [],
        status: 'published'
      };

      // Guardar archivos organizados
      await fs.writeFile(organizedPath, JSON.stringify(organizedBlogData, null, 2), 'utf8');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

      // Crear directorio de imágenes
      const imagesDir = path.join(this.publicImagesDir, slug);
      await fs.ensureDir(imagesDir);

      // Eliminar archivo legacy
      await fs.remove(legacyPath);

      // Actualizar índice
      await this.updateBlogsIndex();

      console.log(`🔄 Blog migrado de legacy a organizado: ${slug}`);

      return {
        success: true,
        message: 'Blog migrado exitosamente',
        paths: {
          blog: organizedPath,
          metadata: metadataPath,
          images: imagesDir
        }
      };

    } catch (error) {
      console.error(`Error migrando blog ${slug}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = OrganizedBlogsService;