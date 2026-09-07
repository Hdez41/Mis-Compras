document.addEventListener('DOMContentLoaded', () => {
    const itemInput = document.getElementById('item-input');
    const addBtn = document.getElementById('add-btn');
    const shoppingList = document.getElementById('shopping-list');

    // ⚠️ COLOCA AQUÍ TU LINK DE GOOGLE APPS SCRIPT EXACTO
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyXHXIw6Q8z5c2-IwzHv6FCcsBup-mnC9h93wDumt7zN6WXUxZr3nY5ziBVrXlH9eYdWA/exec";

    let items = []; // Almacena los artículos descargados de la hoja de cálculo

    // 1. DIBUJAR LA LISTA EN LA PANTALLA (ESTILO IMAGEN #2)
    function renderList() {
        shoppingList.innerHTML = '';
        items.forEach((item) => {
            const li = document.createElement('li');
            li.className = `todo-item ${item.comprado === 'en proceso' ? 'completed' : ''}`;

            // A. Creamos el checkbox nativo (que se vuelve morado con tu CSS)
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = item.comprado === 'en proceso';
            checkbox.addEventListener('change', () => toggleItem(item.id, item.producto, checkbox.checked));

            // B. Creamos el texto del producto
            const span = document.createElement('span');
            span.className = 'item-text';
            span.textContent = item.producto;
            if (item.comprado === 'en proceso') span.style.textDecoration = 'line-through';
            span.addEventListener('click', () => toggleItem(item.id, item.producto, !checkbox.checked));

            // C. Creamos el botón de borrar con el texto "delete" en rosa
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Borrar';
            deleteBtn.addEventListener('click', () => deleteItem(item.id));

            // 🔥 EL ORDEN DE LA IMAGEN #2:
            li.appendChild(checkbox);   // 1° Izquierda: Cuadrado morado
            li.appendChild(span);       // 2° Centro: Nombre del producto
            li.appendChild(deleteBtn);  // 3° Derecha: Palabra "delete"

            shoppingList.appendChild(li);
        });
    }

    // 2. RECUPERAR DATOS DE GOOGLE SHEETS (doGet)
    async function fetchFromGoogle() {
        try {
            const response = await fetch(WEB_APP_URL);
            const datos = await response.json();
            
            if (datos.error) {
                console.error("Error del backend:", datos.error);
                return;
            }

            // Solo repinta la pantalla si hubo un cambio real para evitar parpadeos
            if (JSON.stringify(items) !== JSON.stringify(datos)) {
                items = datos;
                renderList();
            }
        } catch (error) {
            console.error("Error de conexión al sincronizar:", error);
        }
    }

    // 3. ENVIAR CAMBIOS AL SERVIDOR (doPost)
    async function sendToGoogle(payload) {
        try {
            await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            // Fuerza una consulta rápida para ver el cambio de inmediato
            setTimeout(fetchFromGoogle, 400); 
        } catch (error) {
            console.error("Error al enviar datos:", error);
        }
    }

    // 4. AGREGAR UN NUEVO PRODUCTO
    function addItem() {
        const text = itemInput.value.trim();
        if (text === '') return;

        const nuevoItem = {
            id: Date.now().toString(),
            producto: text,
            comprado: false
        };

        itemInput.value = '';
        sendToGoogle(nuevoItem);
    }

    // 5. MARCAR O DESMARCAR UN PRODUCTO (Función global vinculada a los eventos)
    window.toggleItem = (id, producto, estaComprado) => {
        sendToGoogle({
            id: id,
            producto: producto,
            comprado: estaComprado
        });
    };

    // 6. ELIMINAR UN PRODUCTO
    window.deleteItem = (id) => {
        sendToGoogle({
            id: id,
            accion: "delete"
        });
    };

    // Escuchadores de eventos para los botones principales
    addBtn.addEventListener('click', addItem);
    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });

    // Carga inicial de datos al abrir la aplicación
    fetchFromGoogle();

    // SINCREAL: Bucle en segundo plano automático cada 3 segundos
    setInterval(fetchFromGoogle, 3000);
});

// =========================================================================
// 🟢 REGISTRO DEL SERVICE WORKER
// =========================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/Mis-compras/sw.js')
            .then(() => console.log('Service Worker de Compras activo con éxito.'))
            .catch(err => console.error('Error al registrar el Service Worker:', err));
    });
}

// Lógica de instalación automática
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const launchAutomaticPrompt = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Instalación automática: ${outcome}`);
        deferredPrompt = null;
        document.removeEventListener('click', launchAutomaticPrompt);
    };
    document.addEventListener('click', launchAutomaticPrompt);
});
