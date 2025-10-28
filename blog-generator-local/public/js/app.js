// public/js/app.js - Frontend para el generador de blogs
class BlogGeneratorApp {
    constructor() {
        this.currentBlog = null;
        this.isEditMode = false;
        this.blogImages = [];
        this.currentStep = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTopicSuggestions();
        this.checkSystemStatus();
        this.log('Sistema iniciado correctamente');
    }

    setupEventListeners() {
        // Tipo de blog
        document.getElementById('blogType').addEventListener('change', () => {
            this.loadTopicSuggestions();
        });

        // Refresh sugerencias
        document.getElementById('refreshSuggestions').addEventListener('click', () => {
            this.loadTopicSuggestions();
        });

        // Tema personalizado
        document.getElementById('customTopic').addEventListener('input', () => {
            this.validateInput();
        });

        // Botones principales
        document.getElementById('generateBlog').addEventListener('click', () => {
            this.generateBlog();
        });

        document.getElementById('saveBlog').addEventListener('click', () => {
            this.saveBlog();
        });

        document.getElementById('deployBlog').addEventListener('click', () => {
            this.deployBlog();
        });

        // Modos de vista
        document.getElementById('editMode').addEventListener('click', () => {
            this.toggleEditMode(true);
        });

        document.getElementById('previewMode').addEventListener('click', () => {
            this.toggleEditMode(false);
        });

        // Gestión de imágenes
        document.getElementById('uploadButton').addEventListener('click', () => {
            document.getElementById('imageUpload').click();
        });

        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.uploadImage(e.target.files[0]);
        });

        document.getElementById('addImageUrl').addEventListener('click', () => {
            this.addImageFromUrl();
        });

        // Clear logs
        document.getElementById('clearLogs').addEventListener('click', () => {
            this.clearLogs();
        });

        // Ver blogs guardados
        document.getElementById('showSavedBlogs').addEventListener('click', () => {
            this.showSavedBlogsModal();
        });

        document.getElementById('closeSavedBlogs').addEventListener('click', () => {
            this.hideSavedBlogsModal();
        });

        // Cerrar modal al hacer click fuera
        document.getElementById('savedBlogsModal').addEventListener('click', (e) => {
            if (e.target.id === 'savedBlogsModal') {
                this.hideSavedBlogsModal();
            }
        });
    }

    async loadTopicSuggestions() {
        try {
            const blogType = document.getElementById('blogType').value;
            const response = await fetch('/api/topic-suggestions');
            const data = await response.json();

            if (data.success) {
                this.renderTopicSuggestions(data.suggestions[blogType]);
                this.log(`Sugerencias cargadas para tipo: ${blogType}`);
            }
        } catch (error) {
            this.log(`Error cargando sugerencias: ${error.message}`, 'error');
        }
    }

    renderTopicSuggestions(suggestions) {
        const container = document.getElementById('topicSuggestions');
        container.innerHTML = '';

        suggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.className = 'text-left p-3 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors text-sm';
            button.textContent = suggestion;
            button.addEventListener('click', () => {
                document.getElementById('customTopic').value = suggestion;
                this.validateInput();
            });
            container.appendChild(button);
        });
    }

    validateInput() {
        const topic = document.getElementById('customTopic').value.trim();
        const generateBtn = document.getElementById('generateBlog');

        if (topic.length > 10) {
            generateBtn.disabled = false;
            generateBtn.classList.remove('opacity-50');
        } else {
            generateBtn.disabled = true;
            generateBtn.classList.add('opacity-50');
        }
    }

    async generateBlog() {
        const topic = document.getElementById('customTopic').value.trim();
        const blogType = document.getElementById('blogType').value;

        if (!topic) {
            this.showAlert('Por favor, ingresa un tema para el blog', 'warning');
            return;
        }

        this.showStatus('Generando blog con IA...', true);
        this.updateStep(2);
        this.log(`Generando blog: "${topic}" (${blogType})`);

        try {
            const response = await fetch('/api/generate-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blogType, topic, manual: false })
            });

            const data = await response.json();

            if (data.success) {
                this.currentBlog = data.blog;
                this.renderBlogPreview();
                this.showImagePanel();
                this.enableActionButtons();
                this.updateStep(3);
                this.log(`Blog generado: "${data.blog.title}" (${data.stats.words} palabras)`);
                this.showAlert('Blog generado exitosamente', 'success');
            } else {
                throw new Error(data.message || 'Error generando blog');
            }
        } catch (error) {
            this.log(`Error generando blog: ${error.message}`, 'error');
            this.showAlert(`Error: ${error.message}`, 'error');
        } finally {
            this.hideStatus();
        }
    }

    renderBlogPreview() {
        if (!this.currentBlog) return;

        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('blogContent').style.display = 'block';
        document.getElementById('editMode').style.display = 'inline-block';

        // Convertir markdown a HTML básico
        const htmlContent = this.markdownToHtml(this.currentBlog.content);
        document.getElementById('blogContent').innerHTML = htmlContent;

        // Llenar campos del editor
        document.getElementById('editTitle').value = this.currentBlog.title;
        document.getElementById('editExcerpt').value = this.currentBlog.excerpt;
        document.getElementById('editContent').value = this.currentBlog.content;
        document.getElementById('editTags').value = this.currentBlog.tags.join(', ');
    }

    markdownToHtml(markdown) {
        return markdown
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^(.+)$/, '<p>$1</p>');
    }

    toggleEditMode(editMode) {
        this.isEditMode = editMode;

        if (editMode) {
            document.getElementById('blogContent').style.display = 'none';
            document.getElementById('blogEditor').style.display = 'block';
            document.getElementById('editMode').style.display = 'none';
            document.getElementById('previewMode').style.display = 'inline-block';
            this.log('Modo edición activado');
        } else {
            // Actualizar el blog con los cambios
            this.updateBlogFromEditor();
            document.getElementById('blogContent').style.display = 'block';
            document.getElementById('blogEditor').style.display = 'none';
            document.getElementById('editMode').style.display = 'inline-block';
            document.getElementById('previewMode').style.display = 'none';
            this.renderBlogPreview();
            this.log('Vista previa actualizada');
        }
    }

    updateBlogFromEditor() {
        if (!this.currentBlog) return;

        this.currentBlog.title = document.getElementById('editTitle').value;
        this.currentBlog.excerpt = document.getElementById('editExcerpt').value;
        this.currentBlog.content = document.getElementById('editContent').value;
        this.currentBlog.tags = document.getElementById('editTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        // Regenerar slug si cambió el título
        this.currentBlog.slug = this.generateSlug(this.currentBlog.title);
    }

    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    showImagePanel() {
        document.getElementById('imagePanel').style.display = 'block';
        this.updateStep(4);
    }

    async uploadImage(file) {
        if (!file) return;

        if (!this.currentBlog) {
            this.showAlert('Primero genera un blog para poder subir imágenes', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('blogSlug', this.currentBlog.slug); // Añadir slug del blog

        this.showUploadProgress();
        this.log(`Subiendo imagen para blog: ${this.currentBlog.slug} - ${file.name}`);

        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.addImageToBlog(data.imageUrl, file.name, data.blogSlug);
                this.log(`Imagen subida a carpeta organizada: ${data.imageUrl}`);
                this.showAlert('Imagen subida y organizada exitosamente', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.log(`Error subiendo imagen: ${error.message}`, 'error');
            this.showAlert(`Error subiendo imagen: ${error.message}`, 'error');
        } finally {
            this.hideUploadProgress();
        }
    }

    async addImageFromUrl() {
        const url = document.getElementById('imageUrl').value.trim();
        
        if (!url) {
            this.showAlert('Por favor, ingresa una URL válida', 'warning');
            return;
        }

        try {
            // Validar que sea una URL de imagen
            const response = await fetch(url, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.startsWith('image/')) {
                throw new Error('La URL no parece ser una imagen válida');
            }

            this.addImageToBlog(url, 'Imagen desde URL');
            document.getElementById('imageUrl').value = '';
            this.log(`Imagen añadida desde URL: ${url}`);
            this.showAlert('Imagen añadida exitosamente', 'success');
        } catch (error) {
            this.log(`Error validando imagen URL: ${error.message}`, 'error');
            this.showAlert(`Error con la URL: ${error.message}`, 'error');
        }
    }

    addImageToBlog(imageUrl, name, blogSlug = null) {
        const imageData = { 
            url: imageUrl, 
            name: name, 
            id: Date.now(),
            blogSlug: blogSlug,
            isOrganized: blogSlug ? true : false
        };
        this.blogImages.push(imageData);
        
        // Añadir imagen principal si no existe
        if (!this.currentBlog.image) {
            this.currentBlog.image = imageUrl;
            this.currentBlog.imagenPrincipal = imageUrl;
        }

        // Actualizar lista de imágenes en el blog
        if (!this.currentBlog.images) {
            this.currentBlog.images = [];
        }
        this.currentBlog.images.push(imageData);

        this.renderBlogImages();
        this.log(`Imagen añadida al blog ${blogSlug || 'temporal'}: ${name}`);
    }

    renderBlogImages() {
        const container = document.getElementById('blogImages');
        container.innerHTML = '';

        this.blogImages.forEach((image, index) => {
            const div = document.createElement('div');
            div.className = 'relative group';
            
            const organizedLabel = image.isOrganized ? 
                '<span class="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">Organizada</span>' : 
                '<span class="absolute top-1 left-1 bg-gray-500 text-white text-xs px-1 rounded">Temporal</span>';
            
            div.innerHTML = `
                ${organizedLabel}
                <img src="${image.url}" alt="${image.name}" class="image-preview w-full">
                <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onclick="app.removeImage(${image.id})" class="bg-red-500 text-white px-2 py-1 rounded text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="app.setMainImage('${image.url}')" class="bg-blue-500 text-white px-2 py-1 rounded text-sm ml-2">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
                <div class="text-xs text-gray-500 mt-1 truncate">${image.name}</div>
                <div class="text-xs text-gray-400">${image.blogSlug || 'temporal'}</div>
            `;
            container.appendChild(div);
        });
    }

    removeImage(imageId) {
        this.blogImages = this.blogImages.filter(img => img.id !== imageId);
        this.renderBlogImages();
        this.log('Imagen eliminada');
    }

    setMainImage(imageUrl) {
        if (this.currentBlog) {
            this.currentBlog.image = imageUrl;
            this.currentBlog.imagenPrincipal = imageUrl;
            this.log('Imagen principal actualizada');
            this.showAlert('Imagen principal establecida', 'success');
        }
    }

    enableActionButtons() {
        document.getElementById('saveBlog').style.display = 'block';
        document.getElementById('saveBlog').disabled = false;
    }

    async saveBlog() {
        if (!this.currentBlog) {
            this.showAlert('No hay blog para guardar', 'warning');
            return;
        }

        this.showStatus('Guardando blog...', true);
        this.log(`Guardando blog: ${this.currentBlog.title}`);

        try {
            const response = await fetch('/api/save-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blogData: this.currentBlog })
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById('deployBlog').style.display = 'block';
                document.getElementById('deployBlog').disabled = false;
                this.updateStep(5);
                this.log(`Blog guardado: ${data.slug}.json`);
                this.showAlert('Blog guardado exitosamente', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.log(`Error guardando blog: ${error.message}`, 'error');
            this.showAlert(`Error: ${error.message}`, 'error');
        } finally {
            this.hideStatus();
        }
    }

    async deployBlog() {
        if (!this.currentBlog) {
            this.showAlert('No hay blog para desplegar', 'warning');
            return;
        }

        const commitMessage = `📝 Nuevo blog organizado: ${this.currentBlog.title}`;
        
        this.showStatus('Desplegando al repositorio...', true);
        this.log(`Desplegando blog organizado: ${this.currentBlog.slug}`);

        try {
            const response = await fetch('/api/deploy-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    blogSlug: this.currentBlog.slug,
                    commitMessage: commitMessage
                })
            });

            const data = await response.json();

            if (data.success) {
                this.updateStep(5, true);
                this.log(`Blog desplegado exitosamente. Commit: ${data.details.commit}`);
                this.log(`Estructura: ${data.details.structure}, Imágenes incluidas: ${data.details.imagesIncluded}`);
                this.showAlert('¡Blog desplegado exitosamente con estructura organizada!', 'success');
                
                // Mostrar resumen de despliegue
                this.showDeploymentSummary(data.details);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.log(`Error desplegando blog: ${error.message}`, 'error');
            this.showAlert(`Error desplegando: ${error.message}`, 'error');
        } finally {
            this.hideStatus();
        }
    }

    showDeploymentSummary(details) {
        const summary = `
            📁 Blog: ${details.slug}
            📝 Título: ${details.title}
            🏗️ Estructura: ${details.structure}
            🖼️ Imágenes: ${details.imagesIncluded ? 'Incluidas en carpeta organizada' : 'No incluidas'}
            🔗 Commit: ${details.commit}
        `;
        this.log(summary);
    }

    updateStep(stepNumber, completed = false) {
        // Resetear todos los steps
        for (let i = 1; i <= 5; i++) {
            const step = document.getElementById(`step${i}`);
            step.classList.remove('active', 'completed');
            
            if (i < stepNumber || (i === stepNumber && completed)) {
                step.classList.add('completed');
            } else if (i === stepNumber) {
                step.classList.add('active');
            }
        }
        this.currentStep = stepNumber;
    }

    async checkSystemStatus() {
        // Verificar conexión con el servidor
        try {
            await fetch('/api/topic-suggestions');
            this.updateSystemStatus('Conectado', 'green');
        } catch (error) {
            this.updateSystemStatus('Desconectado', 'red');
        }
    }

    updateSystemStatus(status, color) {
        const statusElement = document.getElementById('systemStatus');
        const colorMap = {
            green: 'bg-green-500',
            yellow: 'bg-yellow-500',
            red: 'bg-red-500'
        };
        
        statusElement.innerHTML = `
            <div class="w-3 h-3 rounded-full ${colorMap[color]} mr-2"></div>
            <span class="text-sm">${status}</span>
        `;
    }

    showStatus(message, loading = false) {
        const statusArea = document.getElementById('statusArea');
        const statusText = document.getElementById('statusText');
        
        statusText.textContent = message;
        statusArea.style.display = 'block';
        
        if (!loading) {
            statusArea.querySelector('.loading-spinner').style.display = 'none';
        }
    }

    hideStatus() {
        document.getElementById('statusArea').style.display = 'none';
    }

    showUploadProgress() {
        document.getElementById('uploadProgress').style.display = 'block';
        // Simular progreso
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            document.getElementById('uploadProgressBar').style.width = `${progress}%`;
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 100);
    }

    hideUploadProgress() {
        setTimeout(() => {
            document.getElementById('uploadProgress').style.display = 'none';
            document.getElementById('uploadProgressBar').style.width = '0%';
        }, 500);
    }

    showAlert(message, type = 'info') {
        // Crear alert temporal
        const alert = document.createElement('div');
        const colors = {
            success: 'bg-green-100 border-green-500 text-green-700',
            error: 'bg-red-100 border-red-500 text-red-700',
            warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
            info: 'bg-blue-100 border-blue-500 text-blue-700'
        };

        alert.className = `fixed top-4 right-4 p-4 border-l-4 rounded shadow-lg z-50 ${colors[type]}`;
        alert.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg">×</button>
            </div>
        `;

        document.body.appendChild(alert);
        
        // Auto-remove después de 5 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    log(message, type = 'info') {
        const logContainer = document.getElementById('activityLog');
        const timestamp = new Date().toLocaleTimeString();
        const icons = {
            info: '📘',
            error: '❌',
            success: '✅',
            warning: '⚠️'
        };

        const logEntry = document.createElement('div');
        logEntry.className = 'mb-1';
        logEntry.innerHTML = `<span class="text-gray-400">[${timestamp}]</span> ${icons[type]} ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    clearLogs() {
        const logContainer = document.getElementById('activityLog');
        logContainer.innerHTML = '<div class="text-gray-500">Logs limpiados...</div>';
    }

    async showSavedBlogsModal() {
        this.log('Cargando blogs guardados...');
        document.getElementById('savedBlogsModal').style.display = 'block';
        
        try {
            const response = await fetch('/api/saved-blogs');
            const data = await response.json();

            if (data.success) {
                this.renderSavedBlogsMetadata(data.metadata);
                this.renderSavedBlogs(data.blogs);
                this.log(`Cargados ${data.blogs.length} blogs (${data.metadata.organized} organizados, ${data.metadata.legacy} legacy)`);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.log(`Error cargando blogs: ${error.message}`, 'error');
            this.showAlert(`Error cargando blogs: ${error.message}`, 'error');
        }
    }

    hideSavedBlogsModal() {
        document.getElementById('savedBlogsModal').style.display = 'none';
    }

    renderSavedBlogsMetadata(metadata) {
        const container = document.getElementById('savedBlogsMetadata');
        container.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <div class="text-2xl font-bold text-blue-600">${metadata.total}</div>
                    <div class="text-sm text-gray-600">Total Blogs</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-green-600">${metadata.organized}</div>
                    <div class="text-sm text-gray-600">Organizados</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-yellow-600">${metadata.legacy}</div>
                    <div class="text-sm text-gray-600">Legacy</div>
                </div>
                <div>
                    <div class="text-sm text-gray-600">Actualizado</div>
                    <div class="text-xs text-gray-500">${new Date(metadata.lastUpdated).toLocaleString()}</div>
                </div>
            </div>
        `;
    }

    renderSavedBlogs(blogs) {
        const container = document.getElementById('savedBlogsList');
        container.innerHTML = '';

        if (blogs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>No hay blogs guardados</p>
                </div>
            `;
            return;
        }

        blogs.forEach(blog => {
            const blogCard = document.createElement('div');
            blogCard.className = 'border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors';
            
            const structureIcon = blog.structure === 'organized' ? 
                '<i class="fas fa-folder text-green-500"></i>' : 
                '<i class="fas fa-file text-yellow-500"></i>';
            
            const publishedDate = new Date(blog.publishedAt).toLocaleDateString();
            const imageCount = blog.images ? blog.images.length : 0;

            blogCard.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            ${structureIcon}
                            <h3 class="font-semibold text-gray-800">${blog.title}</h3>
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${blog.category}</span>
                        </div>
                        
                        <p class="text-sm text-gray-600 mb-2">${blog.excerpt}</p>
                        
                        <div class="flex items-center gap-4 text-xs text-gray-500">
                            <span><i class="fas fa-calendar mr-1"></i>${publishedDate}</span>
                            <span><i class="fas fa-clock mr-1"></i>${blog.readTime} min</span>
                            <span><i class="fas fa-images mr-1"></i>${imageCount} imágenes</span>
                            <span><i class="fas fa-tags mr-1"></i>${blog.tags.length} tags</span>
                        </div>
                        
                        <div class="mt-2">
                            <div class="text-xs text-gray-400">
                                Slug: ${blog.slug} | 
                                Estructura: ${blog.structure || 'legacy'} | 
                                Fuente: ${blog.source || 'unknown'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-2 ml-4">
                        <button onclick="app.loadBlogForEdit('${blog.slug}')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                        <button onclick="app.deployExistingBlog('${blog.slug}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">
                            <i class="fas fa-rocket mr-1"></i>Desplegar
                        </button>
                        ${blog.structure === 'organized' ? 
                            `<button onclick="app.openBlogFolder('${blog.slug}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs">
                                <i class="fas fa-folder-open mr-1"></i>Carpeta
                            </button>` : ''
                        }
                    </div>
                </div>
            `;
            
            container.appendChild(blogCard);
        });
    }

    async loadBlogForEdit(slug) {
        this.log(`Cargando blog para edición: ${slug}`);
        this.hideSavedBlogsModal();
        
        try {
            const response = await fetch(`/api/blog/${slug}`);
            const data = await response.json();

            if (data.success) {
                this.currentBlog = data.blog;
                this.renderBlogPreview();
                this.showImagePanel();
                this.enableActionButtons();
                this.updateStep(3);
                
                // Cargar imágenes si las hay
                if (data.blog.images) {
                    this.blogImages = data.blog.images.map(img => ({
                        ...img,
                        id: Date.now() + Math.random()
                    }));
                    this.renderBlogImages();
                }
                
                this.log(`Blog cargado para edición: ${data.blog.title} (${data.structure})`);
                this.showAlert('Blog cargado para edición', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.log(`Error cargando blog: ${error.message}`, 'error');
            this.showAlert(`Error cargando blog: ${error.message}`, 'error');
        }
    }

    async deployExistingBlog(slug) {
        this.log(`Desplegando blog existente: ${slug}`);
        this.hideSavedBlogsModal();
        
        this.showStatus('Desplegando blog existente...', true);
        
        try {
            const response = await fetch('/api/deploy-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    blogSlug: slug,
                    commitMessage: `🔄 Redesplegando blog: ${slug}`
                })
            });

            const data = await response.json();

            if (data.success) {
                this.log(`Blog redesplegado: ${data.details.commit}`);
                this.showAlert('Blog redesplegado exitosamente', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.log(`Error redesplegando blog: ${error.message}`, 'error');
            this.showAlert(`Error redesplegando: ${error.message}`, 'error');
        } finally {
            this.hideStatus();
        }
    }

    openBlogFolder(slug) {
        this.log(`Blog organizado en: src/data/blogs/${slug}/`);
        this.log(`Imágenes en: public/images/blog/${slug}/`);
        this.showAlert(`Rutas del blog en logs`, 'info');
    }
}

// Inicializar la aplicación
const app = new BlogGeneratorApp();