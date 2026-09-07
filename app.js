// ⚠️ REEMPLAZA ESTA URL CON TU LINK DE GOOGLE APPS SCRIPT EXACTO
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyXHXIw6Q8z5c2-IwzHv6FCcsBup-mnC9h93wDumt7zN6WXUxZr3nY5ziBVrXlH9eYdWA/exec";

const itemInput = document.getElementById('item-input');
const addBtn = document.getElementById('add-btn');
const shoppingList = document.getElementById('shopping-list');

let listaLocal = []; // Almacena el estado previo para evitar parpadeos visuales

// Eventos de usuario
addBtn.addEventListener('click', agregarItem);
itemInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarItem(); });

// 1. OBTENER DATOS EN TIEMPO REAL (doGet)
async function cargarLista() {
    try {
        const response = await fetch(WEB_APP_URL);
        const datos = await response.json();
        
        if (datos.error) {
            console.error("Error del backend:", datos.error);
            return;
        }

        // SOLO repinta el HTML si los datos del servidor cambiaron (evita parpadeos)
        if (JSON.stringify(listaLocal) !== JSON.stringify(datos)) {
            listaLocal = datos;
            renderizarLista(datos);
        }
    } catch (error) {
        console.error("Error de conexión al sincronizar:", error);
    }
}

// 2. MOSTRAR ELEMENTOS EN PANTALLA
function renderizarLista(items) {
    shoppingList.innerHTML = '';
    
    items.forEach(item => {
        const li = document.createElement('li');
        // Si está "en proceso", añade la clase completado
        if (item.comprado === 'en proceso') {
            li.classList.add('completed');
        }
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.comprado === 'en proceso';
        checkbox.addEventListener('change', () => alternarEstado(item.id, item.producto, checkbox.checked));

        // Texto
        const span = document.createElement('span');
        span.textContent = item.producto;
        if (checkbox.checked) {
            span.style.textDecoration = 'line-through';
        }

        // Botón Eliminar
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

// 3. ENVIAR DATOS AL SERVIDOR (doPost)
async function enviarAccion(payload) {
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Evita bloqueos de seguridad de Google
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        // Sincronizar inmediatamente tras una acción del usuario
        setTimeout(cargarLista, 400); 
    } catch (error) {
        console.error("Error al enviar datos:", error);
    }
}

function agregarItem() {
    const texto = itemInput.value.trim();
    if (!texto) return;

    const nuevoItem = {
        id: Date.now().toString(), // Genera un ID único en base al tiempo
        producto: texto,
        comprado: false
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

// 4. BUCLE DE TIEMPO REAL (Polling)
cargarLista(); // Primera carga al abrir
setInterval(cargarLista, 3000); // Consulta la base de datos automáticamente cada 3 segundos
