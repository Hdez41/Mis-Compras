// CONFIGURACIÓN: Reemplaza con la URL de ejecución de tu Web App de Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyXHXIw6Q8z5c2-IwzHv6FCcsBup-mnC9h93wDumt7zN6WXUxZr3nY5ziBVrXlH9eYdWA/exec";

const itemInput = document.getElementById('item-input');
const addBtn = document.getElementById('add-btn');
const shoppingList = document.getElementById('shopping-list');

let listaLocal = []; // Almacena el estado actual para evitar parpadeos en la UI

// Escuchadores de eventos
addBtn.addEventListener('click', agregarItem);
itemInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarItem(); });

// 1. OBTENER DATOS (doGet)
async function cargarLista() {
    try {
        const response = await fetch(WEB_APP_URL);
        const datos = await response.json();
        
        if (datos.error) {
            console.error("Error del backend:", datos.error);
            return;
        }

        // Solo repintar si los datos del servidor cambiaron para evitar parpadeos molestos
        if (JSON.stringify(listaLocal) !== JSON.stringify(datos)) {
            listaLocal = datos;
            renderizarLista(datos);
        }
    } catch (error) {
        console.error("Error de conexión al sincronizar:", error);
    }
}

// 2. RENDERIZAR EN PANTALLA
function renderizarLista(items) {
    shoppingList.innerHTML = '';
    
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = `todo-item ${item.comprado === 'en proceso' ? 'completed' : ''}`;
        
        // Checkbox para marcar estado
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.comprado === 'en proceso';
        checkbox.addEventListener('change', () => alternarEstado(item.id, item.producto, checkbox.checked));

        // Texto del producto
        const span = document.createElement('span');
        span.textContent = item.producto;
        if(checkbox.checked) span.style.textDecoration = 'line-through';

        // Botón de eliminar
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => eliminarItem(item.id));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        shoppingList.appendChild(li);
    });
}

// 3. ENVIAR DATOS (doPost)
async function enviarAccion(payload) {
    try {
        // Ejecuta la petición en segundo plano
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Requerido para evitar problemas de CORS con Google Apps Script redirects
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        // Forzar actualización inmediata local tras la acción
        setTimeout(cargarLista, 500); 
    } catch (error) {
        console.error("Error al enviar datos:", error);
    }
}

function agregarItem() {
    const texto = itemInput.value.trim();
    if (!texto) return;

    const nuevoItem = {
        id: Date.now().toString(), // Genera un ID único basado en tiempo
        producto: texto,
        comprado: false // Inicia como "pendiente"
    };

    itemInput.value = '';
    enviarAccion(nuevoItem);
}

function alternarEstado(id, producto, estaComprado) {
    enviarAccion({
        id: id,
        producto: producto,
        comprado: estaComprado
    });
}

function eliminarItem(id) {
    enviarAccion({
        id: id,
        accion: "delete"
    });
}

// 4. INICIALIZACIÓN Y TIEMPO REAL (Polling)
// Carga inicial al abrir la app
cargarLista();

// Bucle en tiempo real: Consulta la hoja de cálculo cada 3000ms (3 segundos)
setInterval(cargarLista, 3000);
