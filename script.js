  // Datos globales de la aplicación
  let appData = {
    categories: [],
    links: {}
};

// Función principal para cargar datos
async function loadData() {
    try {
        const response = await fetch('http://localhost:3000/api/data');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        
        // Validar y normalizar la estructura de datos
        appData = {
            categories: Array.isArray(data.categories) ? data.categories : [],
            links: data.links && typeof data.links === 'object' ? data.links : {}
        };
        
        // Asegurar que todas las categorías tengan su array en links
        appData.categories.forEach(category => {
            if (!appData.links[category]) {
                appData.links[category] = [];
            }
        });
        
        updateUI();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        showError(`Error al cargar datos: ${error.message}. Mostrando datos de ejemplo.`);
        
        // Datos de ejemplo en caso de error
        appData = {
            categories: ['Inteligencia Artificial', 'Desarrollo Web', 'Ciberseguridad'],
            links: {
                'Inteligencia Artificial': [
                    {name: 'ChatGPT', description: 'IA conversacional de OpenAI', url: 'https://chat.openai.com'},
                    {name: 'DeepSeek', description: 'Modelo avanzado de razonamiento', url: 'https://deepseek.com'}
                ],
                'Desarrollo Web': [
                    {name: 'HTML', description: 'Lenguaje de marcado web', url: 'https://developer.mozilla.org/es/docs/Web/HTML'},
                    {name: 'CSS', description: 'Estilos para páginas web', url: 'https://developer.mozilla.org/es/docs/Web/CSS'}
                ],
                'Ciberseguridad': [] // Array vacío inicial para Ciberseguridad
            }
        };
        updateUI();
    }
}

// Actualizar toda la interfaz
function updateUI() {
    loadCategories();
    if (appData.categories.length > 0) {
        showLinks(appData.categories[0]);
    }
}

// Mostrar mensajes de error
function showError(message) {
    const detailsContent = document.getElementById('details-content');
    detailsContent.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
        </div>
    `;
}

// Cargar categorías en la interfaz
function loadCategories() {
    const categoriesList = document.getElementById('categories-list');
    categoriesList.innerHTML = '';
    
    if (!appData.categories || appData.categories.length === 0) {
        categoriesList.innerHTML = '<p class="no-items">No hay categorías disponibles</p>';
        return;
    }
    
    appData.categories.forEach(category => {
        const div = document.createElement('div');
        div.classList.add('item');
        div.textContent = category;
        div.onclick = () => showLinks(category);
        categoriesList.appendChild(div);
    });
    
    // Actualizar select en el modal de enlaces
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
        appData.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

// Mostrar enlaces de una categoría
function showLinks(category) {
    const linksList = document.getElementById('links-list');
    linksList.innerHTML = '';
    
    // Resaltar la categoría seleccionada
    document.querySelectorAll('#categories-list .item').forEach(item => {
        item.classList.toggle('active', item.textContent === category);
    });
    
    if (!appData.links[category] || appData.links[category].length === 0) {
        linksList.innerHTML = '<p class="no-items">No hay enlaces en esta categoría</p>';
        return;
    }
    
    appData.links[category].forEach((link, index) => {
        const div = document.createElement('div');
        div.classList.add('item');
        div.innerHTML = `
            <strong>${link.name}</strong>
            <p class="link-description">${link.description.substring(0, 50)}${link.description.length > 50 ? '...' : ''}</p>
        `;
        div.onclick = () => showDetails(link);
        linksList.appendChild(div);
    });
}

// Mostrar detalles de un enlace
function showDetails(link) {
    const detailsContent = document.getElementById('details-content');
    detailsContent.innerHTML = `
        <h3>${link.name}</h3>
        <p><strong>URL:</strong> <a href="${link.url}" target="_blank">${link.url}</a></p>
        <p><strong>Descripción:</strong></p>
        <p>${link.description}</p>
        <button class="visit-button" onclick="window.open('${link.url}', '_blank')">Visitar Enlace</button>
    `;
}

// Filtrar elementos
function filterItems() {
    const input = document.getElementById('search').value.toLowerCase();
    const categoryItems = document.querySelectorAll('#categories-list .item');
    const linkItems = document.querySelectorAll('#links-list .item');
    
    categoryItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(input) ? 'block' : 'none';
    });
    
    linkItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(input) ? 'block' : 'none';
    });
}

// Validar URL
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Añadir categoría
async function addCategory() {
    const newCategoryInput = document.getElementById('newCategory');
    const newCategory = newCategoryInput.value.trim();
    const errorElement = document.getElementById('categoryError');
    errorElement.textContent = '';
    
    if (!newCategory) {
        errorElement.textContent = 'El nombre de la categoría es requerido';
        return;
    }
    
    if (newCategory.length < 3) {
        errorElement.textContent = 'El nombre debe tener al menos 3 caracteres';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newCategory })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}`);
        }
        
        // Recargar datos desde el servidor
        await loadData();
        closeModal();
        
    } catch (error) {
        console.error('Error al agregar categoría:', error);
        errorElement.textContent = error.message || 'Error al agregar categoría. Intenta nuevamente.';
    }
}

// Añadir enlace
async function addLink() {
    const category = document.getElementById('categorySelect').value;
    const name = document.getElementById('linkName').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const description = document.getElementById('linkDescription').value.trim();
    const errorElement = document.getElementById('linkError');
    errorElement.textContent = '';
    
    // Validaciones
    if (!category) {
        errorElement.textContent = 'Debes seleccionar una categoría';
        return;
    }
    if (!name || name.length < 3) {
        errorElement.textContent = 'El nombre debe tener al menos 3 caracteres';
        return;
    }
    if (!url || !isValidUrl(url)) {
        errorElement.textContent = 'La URL debe ser válida (comenzar con http:// o https://)';
        return;
    }
    if (!description || description.length < 10) {
        errorElement.textContent = 'La descripción debe tener al menos 10 caracteres';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category: category,
                name: name,
                url: url,
                description: description
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}`);
        }
        
        // Recargar datos desde el servidor
        await loadData();
        showLinks(category);
        closeModal();
        
    } catch (error) {
        console.error('Error al agregar enlace:', error);
        errorElement.textContent = error.message || 'Error al agregar enlace. Intenta nuevamente.';
    }
}

// Funciones para modales
function openModal(type) {
    document.getElementById('modalBackdrop').style.display = 'block';
    document.getElementById('categoryError').textContent = '';
    document.getElementById('linkError').textContent = '';
    
    if (type === 'category') {
        document.getElementById('categoryModal').style.display = 'block';
        document.getElementById('newCategory').value = '';
    } else {
        document.getElementById('linkModal').style.display = 'block';
        document.getElementById('linkName').value = '';
        document.getElementById('linkUrl').value = '';
        document.getElementById('linkDescription').value = '';
    }
}

function closeModal() {
    document.getElementById('modalBackdrop').style.display = 'none';
    document.getElementById('categoryModal').style.display = 'none';
    document.getElementById('linkModal').style.display = 'none';
}

// Realizar búsqueda externa
function performSearch() {
    const query = document.getElementById('searchQuery').value.trim();
    const engine = document.getElementById('searchEngine').value;
    
    if (query) {
        window.open(engine + encodeURIComponent(query), '_blank');
    }
}
  // Toggle del contenido principal
  document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleContent');
    const mainContent = document.getElementById('mainContent');

    toggleButton.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            mainContent.style.display = 'none';
            this.setAttribute('aria-expanded', 'false');
            this.innerHTML = '<i class="fas fa-chevron-down"></i> Mostrar Contenido';
        } else {
            mainContent.style.display = 'block';
            this.setAttribute('aria-expanded', 'true');
            this.innerHTML = '<i class="fas fa-chevron-up"></i> Ocultar Contenido';
        }
        
        // Guardar estado
        localStorage.setItem('contentVisible', !isExpanded);
    });

    // Cargar estado guardado
    if (localStorage.getItem('contentVisible') === 'true') {
        toggleButton.click();
    }
});

// Funciones existentes (mantenidas de tu script.js)
function performSearch() {
    const engine = document.getElementById('searchEngine').value;
    const query = document.getElementById('searchQuery').value;
    if (query) window.open(engine + encodeURIComponent(query), '_blank');
}

function openModal(type) {
    document.getElementById('modalBackdrop').style.display = 'block';
    document.getElementById(type + 'Modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modalBackdrop').style.display = 'none';
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}
// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
