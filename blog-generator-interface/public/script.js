// Variables globales
let currentBlog = null;
let uploadedImages = [];
let currentStep = 1;

console.log('🚀 Script.js iniciando...');

// Capturar errores de JavaScript
window.addEventListener('error', function(e) {
    console.error('🚨 ERROR DE JAVASCRIPT:', e.error);
    console.error('🚨 En archivo:', e.filename);
    console.error('🚨 En línea:', e.lineno);
    showAlert(`Error JS: ${e.message}`, 'error');
});

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, inicializando aplicación...');
    console.log('🔧 Configurando subida de imágenes...');
    setupImageUpload();
    console.log('📚 Cargando blogs existentes...');
    loadExistingBlogs();
    console.log('👣 Actualizando progreso...');
    updateStepProgress();
    console.log('✅ Inicialización completa');
});

// Configuración de subida de imágenes
function setupImageUpload() {
    const imageUpload = document.getElementById('imageUpload');
    const imageInput = document.getElementById('imageInput');

    // Drag and drop
    imageUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUpload.classList.add('dragover');
    });

    imageUpload.addEventListener('dragleave', () => {
        imageUpload.classList.remove('dragover');
    });

    imageUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUpload.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        handleImageFiles(files);
    });

    // Input file change
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleImageFiles(files);
    });
}

// Manejar archivos de imagen
function handleImageFiles(files) {
    const validFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
            showAlert('Solo se permiten archivos de imagen', 'error');
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            showAlert(`El archivo ${file.name} es muy grande (máx. 5MB)`, 'error');
            return false;
        }
        return true;
    });

    validFiles.forEach(uploadImage);
}

// Subir imagen al servidor
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            const imageData = {
                filename: result.filename,
                path: result.imageUrl,
                originalName: file.name
            };
            uploadedImages.push(imageData);
            displayUploadedImage(imageData);
            showAlert(`Imagen ${file.name} subida exitosamente`, 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        showAlert(`Error subiendo ${file.name}: ${error.message}`, 'error');
    }
}

// Mostrar imagen subida
function displayUploadedImage(imageData) {
    const container = document.getElementById('uploadedImages');
    
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.innerHTML = `
        <img src="/public${imageData.path}" alt="${imageData.originalName}">
        <button class="remove-btn" onclick="removeImage('${imageData.filename}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(imageItem);
}

// Remover imagen
function removeImage(filename) {
    uploadedImages = uploadedImages.filter(img => img.filename !== filename);
    
    // Remover del DOM
    const imageItems = document.querySelectorAll('.image-item');
    imageItems.forEach(item => {
        const img = item.querySelector('img');
        if (img.src.includes(filename)) {
            item.remove();
        }
    });
    
    showAlert('Imagen removida', 'success');
}

// Generar blog con IA
async function generateBlog() {
    console.log('🚀 Iniciando generación de blog...');
    
    const category = document.getElementById('category').value;
    const customTopic = document.getElementById('customTopic').value.trim();

    console.log('📝 Categoría seleccionada:', category);
    console.log('🎯 Tema personalizado:', customTopic);

    if (!category) {
        showAlert('Por favor selecciona una categoría', 'error');
        return;
    }

    const generateBtn = document.getElementById('generateBtn');
    const loading = document.getElementById('loading');

    // UI Loading state
    generateBtn.disabled = true;
    loading.classList.add('active');
    updateStepProgress(2);

    try {
        console.log('📡 Enviando petición a /api/generate-blog...');
        
        const requestData = {
            category: category,
            customTopic: customTopic || undefined
        };
        
        console.log('📤 Datos enviados:', requestData);

        const response = await fetch('/api/generate-blog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        console.log('📥 Respuesta recibida:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Resultado parseado:', result);

        if (result.success && result.blog) {
            currentBlog = result.blog;
            displayBlogPreview(result.blog);
            updateStepProgress(3);
            showAlert('Blog generado exitosamente', 'success');
        } else {
            throw new Error(result.error || 'Error generando blog - sin detalles');
        }

    } catch (error) {
        console.error('❌ Error completo generando blog:', error);
        console.error('❌ Stack trace:', error.stack);
        showAlert(`Error generando blog: ${error.message}`, 'error');
        updateStepProgress(1);
    } finally {
        generateBtn.disabled = false;
        loading.classList.remove('active');
    }
}

// Mostrar vista previa del blog
function displayBlogPreview(blog) {
    const previewContainer = document.getElementById('blogPreview');
    const contentContainer = document.getElementById('previewContent');

    // Convertir markdown a HTML básico
    const htmlContent = blog.content
        .replace(/#{3}\s(.*)/g, '<h3>$1</h3>')
        .replace(/#{2}\s(.*)/g, '<h2>$1</h2>')
        .replace(/#{1}\s(.*)/g, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.)/g, '<p>$1')
        .replace(/(.)$/g, '$1</p>');

    contentContainer.innerHTML = `
        <div class="blog-title">${blog.title}</div>
        <div class="blog-meta">
            <span><i class="fas fa-calendar"></i> ${blog.published_at}</span>
            <span><i class="fas fa-clock"></i> ${blog.readTime} min lectura</span>
            <span><i class="fas fa-tag"></i> ${blog.category}</span>
            <span><i class="fas fa-user"></i> ${blog.author}</span>
        </div>
        <div class="blog-content">
            ${htmlContent}
        </div>
        <div style="margin-top: 1rem;">
            <strong>Excerpt:</strong>
            <p style="font-style: italic; color: #666;">${blog.excerpt}</p>
        </div>
        <div style="margin-top: 1rem;">
            <strong>Tags:</strong>
            ${blog.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        ${uploadedImages.length > 0 ? `
            <div style="margin-top: 1rem;">
                <strong>Imágenes (${uploadedImages.length}):</strong>
                <div class="uploaded-images">
                    ${uploadedImages.map(img => `
                        <div class="image-item">
                            <img src="/public${img.path}" alt="${img.originalName}">
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    previewContainer.classList.add('active');
    document.getElementById('saveBtn').disabled = false;
}

// Guardar blog y hacer deploy
async function saveBlog() {
    if (!currentBlog) {
        showAlert('No hay blog para guardar', 'error');
        return;
    }

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando y Desplegando...';

    try {
        const response = await fetch('/api/save-and-deploy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                blogData: currentBlog,
                images: uploadedImages
            })
        });

        const result = await response.json();

        if (result.success) {
            updateStepProgress(4);
            showAlert(`Blog "${currentBlog.title}" guardado y desplegado exitosamente`, 'success');
            
            // Reset form
            setTimeout(() => {
                resetForm();
                loadExistingBlogs();
            }, 2000);
        } else {
            throw new Error(result.error || 'Error guardando blog');
        }

    } catch (error) {
        console.error('Error guardando blog:', error);
        showAlert(`Error guardando blog: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar y Desplegar Blog';
    }
}

// Editar blog (función placeholder)
function editBlog() {
    showAlert('Función de edición en desarrollo', 'error');
}

// Cargar blogs existentes
async function loadExistingBlogs() {
    try {
        const response = await fetch('/api/blogs');
        const data = await response.json();

        const container = document.getElementById('existingBlogs');
        
        if (data.blogs && data.blogs.length > 0) {
            container.innerHTML = `
                <div style="max-height: 400px; overflow-y: auto;">
                    ${data.blogs.map(blog => `
                        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #f8f9fa;">
                            <h4 style="margin: 0 0 0.5rem; color: #2c3e50;">${blog.title}</h4>
                            <p style="margin: 0 0 0.5rem; color: #666; font-size: 0.9rem;">${blog.excerpt}</p>
                            <div style="font-size: 0.8rem; color: #999;">
                                <span><i class="fas fa-calendar"></i> ${blog.published_at}</span> | 
                                <span><i class="fas fa-tag"></i> ${blog.category}</span> | 
                                <span><i class="fas fa-clock"></i> ${blog.readTime} min</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <p style="text-align: center; color: #666; font-size: 0.9rem; margin-top: 1rem;">
                    Total: ${data.blogs.length} blogs
                </p>
            `;
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No hay blogs disponibles</p>
                    <small>Genera tu primer blog con IA</small>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando blogs:', error);
        document.getElementById('existingBlogs').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                <p>Error cargando blogs existentes</p>
            </div>
        `;
    }
}

// Actualizar progreso de pasos
function updateStepProgress(step = 1) {
    currentStep = step;
    
    for (let i = 1; i <= 4; i++) {
        const stepElement = document.getElementById(`step-${i}`);
        stepElement.classList.remove('active', 'completed');
        
        if (i < step) {
            stepElement.classList.add('completed');
        } else if (i === step) {
            stepElement.classList.add('active');
        }
    }
}

// Reset formulario
function resetForm() {
    document.getElementById('category').value = '';
    document.getElementById('customTopic').value = '';
    document.getElementById('uploadedImages').innerHTML = '';
    document.getElementById('blogPreview').classList.remove('active');
    document.getElementById('saveBtn').disabled = true;
    
    currentBlog = null;
    uploadedImages = [];
    updateStepProgress(1);
}

// Mostrar alertas
function showAlert(message, type = 'success') {
    // Remover alertas existentes
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    // Insertar después del header
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Función de prueba de conexión
async function testConnection() {
    console.log('🧪 BOTÓN TEST CONEXIÓN CLICKEADO');
    console.log('🧪 Probando conexión...');
    
    showAlert('Probando conexión al servidor...', 'success');
    
    try {
        console.log('📡 Enviando fetch a /api/test...');
        const response = await fetch('/api/test');
        console.log('📥 Respuesta recibida:', response);
        
        const result = await response.json();
        console.log('✅ Test de conexión exitoso:', result);
        showAlert(`Conexión OK: ${result.message}`, 'success');
    } catch (error) {
        console.error('❌ Error en test de conexión:', error);
        showAlert(`Error de conexión: ${error.message}`, 'error');
    }
}

// Función de prueba de generación
async function testGeneration() {
    console.log('🧪 BOTÓN TEST GENERACIÓN CLICKEADO');
    console.log('🧪 Probando endpoint de generación...');
    
    const category = document.getElementById('category').value;
    console.log('📂 Categoría seleccionada:', category);
    
    if (!category) {
        console.log('❌ No hay categoría seleccionada');
        showAlert('Selecciona una categoría para probar', 'error');
        return;
    }

    showAlert('Probando endpoint de generación...', 'success');

    try {
        console.log('📡 Enviando POST a /api/test-generation...');
        
        const response = await fetch('/api/test-generation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category: category,
                test: true
            })
        });
        
        console.log('📥 Respuesta recibida:', response);
        
        const result = await response.json();
        console.log('✅ Test de generación exitoso:', result);
        showAlert(`Endpoint OK: ${result.message}`, 'success');
    } catch (error) {
        console.error('❌ Error en test de generación:', error);
        showAlert(`Error en endpoint: ${error.message}`, 'error');
    }
}