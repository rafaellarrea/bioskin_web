// services/deploy-manager.js - Gestor de despliegue automático
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs-extra');

class DeployManager {
  constructor() {
    this.projectRoot = path.join(__dirname, '../../');
    this.git = simpleGit(this.projectRoot);
  }

  // Verificar estado de Git
  async checkGitStatus() {
    try {
      const status = await this.git.status();
      
      return {
        success: true,
        status: {
          current: status.current,
          tracking: status.tracking,
          ahead: status.ahead,
          behind: status.behind,
          modified: status.modified,
          created: status.created,
          deleted: status.deleted,
          conflicted: status.conflicted,
          isClean: status.isClean()
        }
      };

    } catch (error) {
      console.error('❌ Error verificando Git:', error);
      return {
        success: false,
        message: 'Error verificando estado de Git',
        error: error.message
      };
    }
  }

  // Verificar que el blog existe
  async verifyBlogExists(blogSlug) {
    try {
      const blogPath = path.join(this.projectRoot, 'src/data/blogs', `${blogSlug}.json`);
      const exists = await fs.pathExists(blogPath);
      
      if (!exists) {
        throw new Error(`El blog ${blogSlug}.json no existe en src/data/blogs/`);
      }

      // Verificar que el archivo es válido JSON
      const content = await fs.readFile(blogPath, 'utf8');
      const blogData = JSON.parse(content);

      return {
        success: true,
        exists: true,
        path: blogPath,
        blog: blogData
      };

    } catch (error) {
      return {
        success: false,
        exists: false,
        error: error.message
      };
    }
  }

  // Desplegar blog (Git add + commit + push)
  async deployBlog({ blogSlug, commitMessage }) {
    try {
      console.log(`🚀 Iniciando despliegue del blog: ${blogSlug}`);

      // 1. Verificar que el blog existe
      const blogCheck = await this.verifyBlogExists(blogSlug);
      if (!blogCheck.success) {
        throw new Error(`Blog no válido: ${blogCheck.error}`);
      }

      console.log('✅ Blog verificado');

      // 2. Verificar estado de Git
      const gitStatus = await this.checkGitStatus();
      if (!gitStatus.success) {
        throw new Error('Error verificando Git: ' + gitStatus.error);
      }

      console.log('✅ Git verificado');

      // 3. Añadir archivos al staging area
      const blogPath = path.relative(this.projectRoot, blogCheck.path);
      await this.git.add(blogPath);
      
      console.log(`✅ Archivo añadido: ${blogPath}`);

      // 4. Verificar que hay cambios para commit
      const statusAfterAdd = await this.git.status();
      const hasChanges = statusAfterAdd.staged.length > 0 || statusAfterAdd.modified.length > 0;

      if (!hasChanges) {
        return {
          success: true,
          message: 'No hay cambios para desplegar (archivo ya sincronizado)',
          skipped: true
        };
      }

      // 5. Hacer commit
      const finalCommitMessage = commitMessage || `📝 Nuevo blog: ${blogCheck.blog.title}`;
      const commitResult = await this.git.commit(finalCommitMessage);
      
      console.log('✅ Commit realizado:', commitResult.commit);

      // 6. Push al repositorio remoto
      const pushResult = await this.git.push('origin', 'main');
      
      console.log('✅ Push completado');

      return {
        success: true,
        message: 'Blog desplegado exitosamente',
        details: {
          blog: blogCheck.blog.title,
          slug: blogSlug,
          commit: commitResult.commit,
          commitMessage: finalCommitMessage,
          pushedTo: 'origin/main'
        }
      };

    } catch (error) {
      console.error('❌ Error durante despliegue:', error);

      return {
        success: false,
        message: 'Error desplegando el blog',
        error: error.message,
        details: error.toString()
      };
    }
  }

  // Desplegar múltiples blogs
  async deployMultipleBlogs({ blogSlugs, commitMessage }) {
    try {
      const results = [];
      
      for (const slug of blogSlugs) {
        console.log(`\n📝 Desplegando blog: ${slug}`);
        
        const result = await this.deployBlog({
          blogSlug: slug,
          commitMessage: commitMessage || `📚 Actualización masiva de blogs`
        });
        
        results.push({
          slug: slug,
          ...result
        });

        // Esperar un poco entre despliegues
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;

      return {
        success: failed === 0,
        message: `Despliegue masivo completado: ${successful} exitosos, ${failed} fallidos`,
        results: results,
        summary: {
          total: results.length,
          successful: successful,
          failed: failed
        }
      };

    } catch (error) {
      console.error('❌ Error en despliegue masivo:', error);

      return {
        success: false,
        message: 'Error en despliegue masivo',
        error: error.message
      };
    }
  }

  // Obtener información del repositorio
  async getRepositoryInfo() {
    try {
      const remotes = await this.git.getRemotes(true);
      const status = await this.git.status();
      const log = await this.git.log({ maxCount: 5 });

      return {
        success: true,
        info: {
          currentBranch: status.current,
          remotes: remotes,
          recentCommits: log.all.map(commit => ({
            hash: commit.hash.substring(0, 8),
            message: commit.message,
            author: commit.author_name,
            date: commit.date
          })),
          status: {
            ahead: status.ahead,
            behind: status.behind,
            isClean: status.isClean()
          }
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo info del repositorio:', error);

      return {
        success: false,
        message: 'Error obteniendo información del repositorio',
        error: error.message
      };
    }
  }

  // Sincronizar con el repositorio remoto
  async syncWithRemote() {
    try {
      console.log('🔄 Sincronizando con repositorio remoto...');

      // Pull latest changes
      const pullResult = await this.git.pull('origin', 'main');
      
      console.log('✅ Sincronización completada');

      return {
        success: true,
        message: 'Repositorio sincronizado exitosamente',
        details: pullResult
      };

    } catch (error) {
      console.error('❌ Error sincronizando:', error);

      return {
        success: false,
        message: 'Error sincronizando con repositorio remoto',
        error: error.message
      };
    }
  }

  // Verificar conectividad con repositorio remoto
  async testRemoteConnection() {
    try {
      // Intentar fetch para verificar conectividad
      await this.git.fetch();

      return {
        success: true,
        message: 'Conexión con repositorio remoto exitosa'
      };

    } catch (error) {
      console.error('❌ Error conectando con repositorio remoto:', error);

      return {
        success: false,
        message: 'Error conectando con repositorio remoto',
        error: error.message,
        suggestions: [
          'Verificar conexión a internet',
          'Verificar credenciales de Git',
          'Verificar permisos del repositorio'
        ]
      };
    }
  }
}

module.exports = DeployManager;