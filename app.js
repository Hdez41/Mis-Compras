// ⚠️ REEMPLAZA ESTA URL CON TU URL DE GOOGLE APPS SCRIPT
const URL_BACKEND = "https://script.google.com/macros/s/AKfycbyXHXIw6Q8z5c2-IwzHv6FCcsBup-mnC9h93wDumt7zN6WXUxZr3nY5ziBVrXlH9eYdWA/exec";

const itemInput = document.getElementById("item-input");
const addBtn = document.getElementById("add-btn");
const shoppingList = document.getElementById("shopping-list");

// 1. CARGAR LA LISTA ACTUAL AL ABRIR LA APP
async function cargarListaActual() {
    shoppingList.innerHTML = "<li>Cargando lista actual...</li>";
    try {
        const respuesta = await fetch(URL_BACKEND);
        const productos = await respuesta.json();
        
        shoppingList.innerHTML = ""; 
        
        if (productos.length === 0) {
            shoppingList.innerHTML = "<li class='empty-msg'>No hay artículos en la lista 🛒</li>";
            return;
        }

        productos.forEach(item => {
            renderizarArticulo(item);
        });
    } catch (error) {
        console.error("Error al conectar con la lista:", error);
        shoppingList.innerHTML = "<li style='color: red;'>Error al conectar con la hoja de cálculo.</li>";
    }
}

// 2. DIBUJAR CADA ELEMENTO EN LA PANTALLA
function renderizarArticulo(item) {
    const li = document.createElement("li");
    li.dataset.id = item.id;
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "item-content";

    // Checkbox para tachar
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "item-checkbox";
    
    const estaEnProceso = (item.comprado === "en proceso" || item.comprado === true || item.comprado === "true");
    checkbox.checked = estaEnProceso;
    
    const textSpan = document.createElement("span");
    textSpan.className = "item-text";
    textSpan.textContent = item.producto;
    
    if (estaEnProceso) {
        li.classList.add("completed");
    }

    contentDiv.appendChild(checkbox);
    contentDiv.appendChild(textSpan);

    // Botón de borrar con tu icono de Google
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-item-btn";
    deleteBtn.innerHTML = "<span class='material-icons'>delete</span>";

    li.appendChild(contentDiv);
    li.appendChild(deleteBtn);
    shoppingList.appendChild(li);

    // EVENTO DE TACHADO: Se ve de inmediato y se guarda de fondo
    checkbox.addEventListener("change", async () => {
        if (checkbox.checked) {
            li.classList.add("completed");
        } else {
            li.classList.remove("completed");
        }
        
        await fetch(URL_BACKEND, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, producto: item.producto, comprado: checkbox.checked })
        });
    });

    // EVENTO DE BORRADO: Se borra de inmediato de la pantalla y se procesa de fondo
    deleteBtn.addEventListener("click", async () => {
        li.remove();
        if (shoppingList.children.length === 0) {
            shoppingList.innerHTML = "<li class='empty-msg'>No hay artículos en la lista 🛒</li>";
        }
        
        await fetch(URL_BACKEND, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, accion: "delete" })
        });
    });
}

// 3. AÑADIR NUEVO ARTÍCULO DESDE EL INPUT (Instantáneo)
async function agregarNuevoProducto() {
    const textoProducto = itemInput.value.trim();
    if (textoProducto === "") return;

    const nuevoItem = {
        id: Date.now().toString(),
        producto: textoProducto,
        comprado: "pendiente"
    };

    // Quitar mensaje de lista vacía si existía
    const emptyMsg = shoppingList.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    renderizarArticulo(nuevoItem);
    itemInput.value = ""; // Limpiar el cuadro rápido

    // Enviar a la hoja de cálculo de fondo de forma silenciosa
    await fetch(URL_BACKEND, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nuevoItem.id, producto: nuevoItem.producto, comprado: false })
    });
}

// ESCUCHADORES DE EVENTOS
addBtn.addEventListener("click", agregarNuevoProducto);
itemInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") agregarNuevoProducto();
});

// Cargar la lista actual en cuanto se abre la aplicación
window.onload = cargarListaActual;
