let imagenesAcumuladas = [];
let urlsPrevisualizacion = [];

const inputImagenes = document.getElementById("nuevasImagenes");
const contenedorImagenes = document.getElementById("contenedorImagenesSeleccionadas");

function sincronizarImagenes() {
    const transferencia = new DataTransfer();

    imagenesAcumuladas.forEach(imagen => {
        transferencia.items.add(imagen);
    });

    inputImagenes.files = transferencia.files;
}

function mostrarImagenesSeleccionadas() {
    // Liberar las URL anteriores para evitar acumulaciones
    urlsPrevisualizacion.forEach(url => URL.revokeObjectURL(url));
    urlsPrevisualizacion = [];

    contenedorImagenes.innerHTML = "";

    imagenesAcumuladas.forEach((imagen, indice) => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "imagen-seleccionada";

        const vista = document.createElement("img");
        const url = URL.createObjectURL(imagen);

        urlsPrevisualizacion.push(url);
        vista.src = url;
        vista.alt = imagen.name;

        const nombre = document.createElement("p");
        nombre.textContent = `${indice + 1}. ${imagen.name}`;

        const controles = document.createElement("div");

        const subir = document.createElement("button");
        subir.type = "button";
        subir.textContent = "↑";
        subir.disabled = indice === 0;

        subir.addEventListener("click", () => {
            [imagenesAcumuladas[indice - 1], imagenesAcumuladas[indice]] =
                [imagenesAcumuladas[indice], imagenesAcumuladas[indice - 1]];

            actualizarImagenes();
        });

        const bajar = document.createElement("button");
        bajar.type = "button";
        bajar.textContent = "↓";
        bajar.disabled = indice === imagenesAcumuladas.length - 1;

        bajar.addEventListener("click", () => {
            [imagenesAcumuladas[indice], imagenesAcumuladas[indice + 1]] =
                [imagenesAcumuladas[indice + 1], imagenesAcumuladas[indice]];

            actualizarImagenes();
        });

        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.textContent = "Quitar";

        quitar.addEventListener("click", () => {
            imagenesAcumuladas.splice(indice, 1);
            actualizarImagenes();
        });

        controles.append(subir, bajar, quitar);
        tarjeta.append(vista, nombre, controles);
        contenedorImagenes.appendChild(tarjeta);
    });
}

function actualizarImagenes() {
    sincronizarImagenes();
    mostrarImagenesSeleccionadas();
    actualizarSelectoresImagenes();
}

function limpiarImagenesSeleccionadas() {
    imagenesAcumuladas = [];
    inputImagenes.value = "";

    urlsPrevisualizacion.forEach(url => URL.revokeObjectURL(url));
    urlsPrevisualizacion = [];

    contenedorImagenes.innerHTML = "";
}

// Agregar imágenes sin perder las anteriores
inputImagenes.addEventListener("change", function () {
    const nuevasImagenes = Array.from(this.files);

    // Primero vaciar el selector; después sincronizar la lista acumulada
    this.value = "";

    nuevasImagenes.forEach(imagen => {
        const duplicada = imagenesAcumuladas.some(
            existente =>
                existente.name === imagen.name &&
                existente.size === imagen.size &&
                existente.lastModified === imagen.lastModified
        );

        if (!duplicada) {
            imagenesAcumuladas.push(imagen);
        }
    });

    actualizarImagenes();
});

const login = document.getElementById("login");
const panel = document.getElementById("panel");
const formLogin = document.getElementById("formLogin");
const mensajeLogin = document.getElementById("mensajeLogin");

async function iniciarPanel() {

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        mensajeLogin.textContent = error.message;
        return;
    }

    if (data.session) {
        mostrarPanel();
    } else {
        login.hidden = false;
        panel.hidden = true;
    }
}

formLogin.addEventListener("submit", async function(e) {

    e.preventDefault();

    mensajeLogin.textContent = "Verificando acceso...";

    const correo = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: correo,
        password: contrasena
    });

    if (error) {
        mensajeLogin.textContent = "Error: " + error.message;
        return;
    }

    mostrarPanel();
});

async function mostrarPanel() {

    login.hidden = true;
    panel.hidden = false;

    await cargarResumen();
}

async function cargarResumen() {

    const lista = document.getElementById("listaProductos");
    const mensaje = document.getElementById("mensajePanel");

    lista.textContent = "Cargando productos...";

    const { data: productos, error: errorProductos } =
        await supabaseClient
            .from("productos")
            .select("*")
            .order("orden");

    if (errorProductos) {
        lista.textContent = "No se pudieron cargar los productos.";
        mensaje.textContent = errorProductos.message;
        return;
    }

    const { count, error: errorCategorias } =
        await supabaseClient
            .from("categorias")
            .select("*", { count: "exact", head: true });

    if (errorCategorias) {
        mensaje.textContent = errorCategorias.message;
        return;
    }

    document.getElementById("totalProductos").textContent =
        productos.length;

    document.getElementById("totalCategorias").textContent =
        count ?? 0;

    if (!productos.length) {
        lista.textContent = "Todavía no hay productos.";
        return;
    }

    lista.innerHTML = productos.map(producto => `
        <article class="producto-admin">
            <h3>${escaparHTML(producto.nombre)}</h3>

            <p>
                $${Number(producto.precio).toLocaleString("es-CO")}
                · ${producto.activo ? "Activo" : "Inactivo"}
            </p>

            <button
                type="button"
                class="btn-editar-producto"
                data-id="${producto.id}">
                Editar producto
            </button>

            <button
                type="button"
                class="btn-eliminar-producto"
                data-id="${producto.id}"
                data-nombre="${escaparHTML(producto.nombre)}">
                Eliminar producto
            </button>
        </article>
    `).join("");
}

function escaparHTML(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

document.getElementById("btnCerrarSesion")
    .addEventListener("click", async function() {

        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            document.getElementById("mensajePanel").textContent =
                error.message;
            return;
        }

        panel.hidden = true;
        login.hidden = false;
        formLogin.reset();
    });


iniciarPanel();

// ======================================
// AGREGAR PRODUCTOS
// ======================================

const formProducto = document.getElementById("formProducto");
const selectorCategoria = document.getElementById("nuevaCategoria");

async function cargarCategoriasAdmin() {
    const { data, error } = await supabaseClient
        .from("categorias")
        .select("*")
        .order("orden_seccion")
        .order("orden")
        .order("nombre");

    if (error) {
        document.getElementById("mensajePanel").textContent =
            error.message;
        return;
    }

    selectorCategoria.innerHTML =
        '<option value="">Selecciona una categoría</option>';

    data.forEach(categoria => {
        const opcion = document.createElement("option");

        opcion.value = categoria.id;
        opcion.textContent =
            `${categoria.seccion} - ${categoria.nombre}`;

        opcion.dataset.seccion = categoria.seccion;

        selectorCategoria.appendChild(opcion);
    });
}

// ======================================
// VARIANTES DE CAMISETAS
// ======================================

const variantesCamiseta = document.getElementById("variantesCamiseta");
const variantesCombo = document.getElementById("variantesCombo");
const variantesLocion = document.getElementById("variantesLocion");
const campoPrecio = document.getElementById("campoPrecio");
const contenedorColores = document.getElementById("contenedorColores");
const contenedorPresentaciones = document.getElementById("contenedorPresentaciones");

selectorCategoria.addEventListener("change", function () {
    const seccion = this.selectedOptions[0]?.dataset.seccion
        ?.trim()
        .toLowerCase();

    const modo = comportamientoDeSeccion(seccion);
    const esCamiseta = modo === "talla_color";
    const esCombo = modo === "solo_talla";
    const esLocion = modo === "fragancia_ml";

    variantesCamiseta.hidden = !esCamiseta;
    variantesCombo.hidden = !esCombo;
    variantesLocion.hidden = !esLocion;
    campoPrecio.hidden = esLocion; // en las lociones el precio va en cada presentación

    if (esCamiseta && !contenedorColores.children.length) {
        agregarColor();
    }

    if (esLocion && !contenedorPresentaciones.children.length) {
        agregarPresentacion();
    }
});

function agregarColor() {
    const fila = document.createElement("div");
    fila.className = "fila-color";

    fila.innerHTML = `
        <label>Nombre del color</label>
        <input type="text" class="nombre-color" placeholder="Negro" required>

        <label>Código hexadecimal</label>
        <input type="color" class="hex-color" value="#000000">

        <label>Imagen correspondiente</label>
        <select class="imagen-color" required>
            <option value="">Selecciona una imagen</option>
        </select>

        <button type="button" class="quitar-color">Quitar</button>
    `;

    const selectorImagen = fila.querySelector(".imagen-color");

    imagenesAcumuladas.forEach((imagen, indice) => {
        const opcion = document.createElement("option");
        opcion.value = indice;
        opcion.textContent = `${indice + 1}. ${imagen.name}`;
        selectorImagen.appendChild(opcion);
    });

    fila.querySelector(".quitar-color").addEventListener("click", () => {
        fila.remove();
    });

    contenedorColores.appendChild(fila);
}

document.getElementById("btnAgregarColor").addEventListener("click", agregarColor);

// ======================================
// PRESENTACIONES DE LOCIONES (mililitros)
// ======================================

function agregarPresentacion() {
    const fila = document.createElement("div");
    fila.className = "fila-presentacion";

    fila.innerHTML = `
        <label>Presentación (ejemplo: 30ml)</label>
        <input type="text" class="nombre-presentacion" placeholder="30ml">

        <label>Precio de esta presentación</label>
        <input type="number" class="precio-presentacion" min="0">

        <label>Imagen correspondiente</label>
        <select class="imagen-presentacion">
            <option value="">Selecciona una imagen</option>
        </select>

        <button type="button" class="quitar-presentacion">Quitar</button>
    `;

    const selectorImagen = fila.querySelector(".imagen-presentacion");

    imagenesAcumuladas.forEach((imagen, indice) => {
        const opcion = document.createElement("option");
        opcion.value = indice;
        opcion.textContent = `${indice + 1}. ${imagen.name}`;
        selectorImagen.appendChild(opcion);
    });

    fila.querySelector(".quitar-presentacion").addEventListener("click", () => {
        fila.remove();
    });

    contenedorPresentaciones.appendChild(fila);
}

document.getElementById("btnAgregarPresentacion").addEventListener("click", agregarPresentacion);

function actualizarSelectoresImagenes() {
    document.querySelectorAll(".imagen-color, .imagen-presentacion").forEach(selector => {
        const valorAnterior = selector.value;

        selector.innerHTML = '<option value="">Selecciona una imagen</option>';

        imagenesAcumuladas.forEach((imagen, indice) => {
            const opcion = document.createElement("option");
            opcion.value = indice;
            opcion.textContent = `${indice + 1}. ${imagen.name}`;
            selector.appendChild(opcion);
        });

        if (valorAnterior !== "" && Number(valorAnterior) < imagenesAcumuladas.length) {
            selector.value = valorAnterior;
        }
    });
}

// Abrir formulario
document.getElementById("btnNuevoProducto").onclick = async function() {

    formProducto.hidden = false;

    await cargarCategoriasAdmin();

    formProducto.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
};

// Cancelar
document.getElementById("btnCancelarProducto").onclick = function() {

    formProducto.reset();
    limpiarImagenesSeleccionadas();
    contenedorColores.innerHTML = "";
    contenedorPresentaciones.innerHTML = "";
    variantesCamiseta.hidden = true;
    variantesCombo.hidden = true;
    variantesLocion.hidden = true;
    campoPrecio.hidden = false;
    formProducto.hidden = true;
};

// Guardar producto
formProducto.addEventListener("submit", async function(e) {

    e.preventDefault();

    const boton = formProducto.querySelector('[type="submit"]');
    const mensaje = document.getElementById("mensajePanel");
    const archivos = document.getElementById("nuevasImagenes").files;

    boton.disabled = true;
    boton.textContent = "Guardando producto...";

    try {

        const categoriaId = selectorCategoria.value;

        const { data: categoria, error: errorCategoria } =
            await supabaseClient
                .from("categorias")
                .select("*")
                .eq("id", categoriaId)
                .single();

        if (errorCategoria) throw errorCategoria;

        const tiposPorModo = {
            talla_color: "camiseta",
            solo_talla: "combo",
            fragancia_ml: "locion",
            directo: "reloj"
        };

        const modoSeccion = comportamientoDeSeccion(categoria.seccion);
        const tipo = tiposPorModo[modoSeccion];

        if (!tipo) {
            throw new Error(
                "No hay un tipo configurado para la sección: " +
                categoria.seccion
            );
        }

        // Precio del producto: en las lociones se toma solo, de la presentación más barata
        let precioProducto;

        if (modoSeccion === "fragancia_ml") {
            const preciosPresentaciones = [...document.querySelectorAll(".precio-presentacion")]
                .map(input => Number(input.value))
                .filter(n => n > 0);

            if (!preciosPresentaciones.length) {
                throw new Error("Agrega al menos una presentación con su precio.");
            }

            precioProducto = Math.min(...preciosPresentaciones);
        } else {
            const textoPrecio = document.getElementById("nuevoPrecio").value;

            if (textoPrecio === "" || !(Number(textoPrecio) >= 0)) {
                throw new Error("Escribe el precio del producto.");
            }

            precioProducto = Number(textoPrecio);
        }

        // 1. Crear el producto
        const producto = {
            nombre: document.getElementById("nuevoNombre").value.trim(),
            tipo: tipo,
            descripcion: document.getElementById("nuevaDescripcion").value.trim(),
            categoria_id: categoriaId,
            precio: precioProducto,
            activo: true,
            orden: 0
        };

        const { data: productoGuardado, error: errorProducto } =
            await supabaseClient
                .from("productos")
                .insert([producto])
                .select()
                .single();

        if (errorProducto) throw errorProducto;

        // 2. Subir imágenes al Storage
        const registrosImagenes = [];

        for (let i = 0; i < archivos.length; i++) {

            const archivo = archivos[i];

            if (!archivo.type.startsWith("image/")) {
                throw new Error("El archivo seleccionado no es una imagen.");
            }

            const nombreLimpio = archivo.name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9._-]/g, "-");

            const ruta = `${productoGuardado.id}/${Date.now()}-${i}-${nombreLimpio}`;

            const { error: errorSubida } =
                await supabaseClient.storage
                    .from("productos")
                    .upload(ruta, archivo);

            if (errorSubida) throw errorSubida;

            // 3. Obtener la URL pública
            const { data: urlImagen } =
                supabaseClient.storage
                    .from("productos")
                    .getPublicUrl(ruta);

            registrosImagenes.push({
                producto_id: productoGuardado.id,
                url: urlImagen.publicUrl,
                nombre_archivo: archivo.name,
                orden: i
            });
        }

        // 4. Guardar las imágenes en la tabla
        let imagenesGuardadas = [];

        if (registrosImagenes.length > 0) {

            const { data, error: errorImagenes } =
                await supabaseClient
                    .from("imagenes_producto")
                    .insert(registrosImagenes)
                    .select();

            if (errorImagenes) throw errorImagenes;

            imagenesGuardadas = data;
        }

        // ======================================
        // GUARDAR VARIANTES DE CAMISETAS
        // ======================================

        if (modoSeccion === "talla_color") {

            const tallas = document.getElementById("tallasCamiseta")
                .value
                .split(",")
                .map(t => t.trim())
                .filter(Boolean);

            const filasColores = [...document.querySelectorAll(".fila-color")];

            if (!tallas.length) {
                throw new Error("Debes agregar al menos una talla.");
            }

            if (!filasColores.length) {
                throw new Error("Debes agregar al menos un color.");
            }

            if (!imagenesGuardadas?.length) {
                throw new Error("Debes subir imágenes para asociarlas a los colores.");
            }

            const variantes = [];

            filasColores.forEach(fila => {

                const color = fila.querySelector(".nombre-color").value.trim();
                const colorHex = fila.querySelector(".hex-color").value;
                const indiceImagen = Number(fila.querySelector(".imagen-color").value);

                if (!color || fila.querySelector(".imagen-color").value === "") {
                    throw new Error("Completa el color y selecciona su imagen.");
                }

                const imagen = imagenesGuardadas.find(
                    img => img.orden === indiceImagen
                );

                if (!imagen) {
                    throw new Error(`No se encontró la imagen del color ${color}.`);
                }

                tallas.forEach(talla => {
                    variantes.push({
                        producto_id: productoGuardado.id,
                        talla: talla,
                        color: color,
                        color_hex: colorHex,
                        imagen_id: imagen.id,
                        precio: Number(productoGuardado.precio),
                        orden: variantes.length
                    });
                });
            });

            const { error: errorVariantes } = await supabaseClient
                .from("variantes_producto")
                .insert(variantes);

            if (errorVariantes) throw errorVariantes;
        }

        // ======================================
        // GUARDAR TALLAS DE LOS COMBOS
        // ======================================

        if (modoSeccion === "solo_talla") {
            const tallasCombo = document.getElementById("tallasCombo")
                .value
                .split(",")
                .map(t => t.trim())
                .filter(Boolean);

            if (!tallasCombo.length) {
                throw new Error("Debes agregar al menos una talla para el combo.");
            }

            const variantesComboGuardar = tallasCombo.map((talla, indice) => ({
                producto_id: productoGuardado.id,
                talla: talla,
                precio: Number(productoGuardado.precio),
                orden: indice
            }));

            const { error: errorVariantesCombo } = await supabaseClient
                .from("variantes_producto")
                .insert(variantesComboGuardar);

            if (errorVariantesCombo) throw errorVariantesCombo;
        }

        // ======================================
        // GUARDAR FRAGANCIAS Y PRESENTACIONES DE LOCIONES
        // ======================================

        if (modoSeccion === "fragancia_ml") {

            const fragancias = document.getElementById("fraganciasLocion")
                .value
                .split(/[\n,]+/)
                .map(f => f.trim())
                .filter(Boolean);

            const filasPresentaciones = [...document.querySelectorAll(".fila-presentacion")];

            if (!fragancias.length) {
                throw new Error("Debes agregar al menos una fragancia.");
            }

            if (!filasPresentaciones.length) {
                throw new Error("Debes agregar al menos una presentación (por ejemplo 30ml).");
            }

            if (!imagenesGuardadas?.length) {
                throw new Error("Debes subir imágenes para asociarlas a las presentaciones.");
            }

            const variantesLocionGuardar = [];

            fragancias.forEach(fragancia => {
                variantesLocionGuardar.push({
                    producto_id: productoGuardado.id,
                    fragancia: fragancia,
                    precio: Number(productoGuardado.precio),
                    orden: variantesLocionGuardar.length
                });
            });

            filasPresentaciones.forEach(fila => {

                const nombrePresentacion = fila.querySelector(".nombre-presentacion").value.trim();
                const precioPresentacion = Number(fila.querySelector(".precio-presentacion").value);
                const valorImagen = fila.querySelector(".imagen-presentacion").value;

                if (!nombrePresentacion || valorImagen === "" || !(precioPresentacion > 0)) {
                    throw new Error("Completa el nombre, el precio y la imagen de cada presentación.");
                }

                const imagen = imagenesGuardadas.find(
                    img => img.orden === Number(valorImagen)
                );

                if (!imagen) {
                    throw new Error(`No se encontró la imagen de la presentación ${nombrePresentacion}.`);
                }

                variantesLocionGuardar.push({
                    producto_id: productoGuardado.id,
                    mililitros: nombrePresentacion,
                    precio: precioPresentacion,
                    imagen_id: imagen.id,
                    orden: variantesLocionGuardar.length
                });
            });

            const { error: errorVariantesLocion } = await supabaseClient
                .from("variantes_producto")
                .insert(variantesLocionGuardar);

            if (errorVariantesLocion) throw errorVariantesLocion;
        }

        mensaje.textContent =
            archivos.length > 0
                ? "¡Producto e imágenes guardados correctamente!"
                : "¡Producto guardado! No seleccionaste imágenes.";

        formProducto.reset();
        limpiarImagenesSeleccionadas();
        contenedorColores.innerHTML = "";
        contenedorPresentaciones.innerHTML = "";
        variantesCamiseta.hidden = true;
        variantesCombo.hidden = true;
        variantesLocion.hidden = true;
        campoPrecio.hidden = false;
        formProducto.hidden = true;

        await cargarResumen();

    } catch (error) {

        mensaje.textContent = "Error: " + error.message;

    } finally {

        boton.disabled = false;
        boton.textContent = "Guardar producto";

    }

});

// ======================================
// ADMINISTRAR SECCIONES Y MARCAS
// ======================================

const formNuevaCategoria =
    document.getElementById("formNuevaCategoria");

async function mostrarCategoriasAdmin() {
    const contenedor = document.getElementById("listaCategoriasAdmin");

    const { data, error } = await supabaseClient
        .from("categorias")
        .select("*")
        .order("orden_seccion")
        .order("orden");

    if (error) {
        contenedor.textContent = error.message;
        return;
    }

    contenedor.innerHTML = "";

    data.forEach(categoria => {
        const fila = document.createElement("div");
        fila.className = "fila-categoria";

        fila.innerHTML = `
            <label>Sección</label>
            <input class="editar-seccion"
                   value="${escaparHTML(categoria.seccion)}">

            <label>Marca o categoría</label>
            <input class="editar-marca"
                   value="${escaparHTML(categoria.nombre)}">

            <label>Orden de sección</label>
            <input class="editar-orden-seccion"
                   type="number"
                   value="${categoria.orden_seccion ?? 0}">

            <label>Orden de marca</label>
            <input class="editar-orden-marca"
                   type="number"
                   value="${categoria.orden ?? 0}">

            <button type="button" class="guardar-categoria">
                Guardar cambios
            </button>

            <button type="button" class="eliminar-categoria">
                Eliminar
            </button>
        `;

        fila.querySelector(".guardar-categoria").onclick = async () => {
            const cambios = {
                seccion: fila.querySelector(".editar-seccion").value.trim(),
                nombre: fila.querySelector(".editar-marca").value.trim(),
                orden_seccion: Number(fila.querySelector(".editar-orden-seccion").value),
                orden: Number(fila.querySelector(".editar-orden-marca").value)
            };

            if (!cambios.seccion || !cambios.nombre) {
                alert("Completa el nombre de la sección y la marca.");
                return;
            }

            const { error } = await supabaseClient
                .from("categorias")
                .update(cambios)
                .eq("id", categoria.id);

            if (error) {
                alert(error.message);
                return;
            }

            alert("Cambios guardados.");
            await mostrarCategoriasAdmin();
            await cargarCategoriasAdmin();
            await cargarResumen();
        };

        fila.querySelector(".eliminar-categoria").onclick = async () => {
            const { count, error: errorConteo } = await supabaseClient
                .from("productos")
                .select("*", { count: "exact", head: true })
                .eq("categoria_id", categoria.id);

            if (errorConteo) {
                alert(errorConteo.message);
                return;
            }

            if (count > 0) {
                alert("No puedes eliminar esta categoría porque todavía tiene productos. Primero elimina o cambia de categoría esos productos.");
                return;
            }

            if (!confirm(`¿Eliminar la categoría "${categoria.nombre}" de "${categoria.seccion}"?`)) {
                return;
            }

            const { error } = await supabaseClient
                .from("categorias")
                .delete()
                .eq("id", categoria.id);

            if (error) {
                alert(error.message);
                return;
            }

            await mostrarCategoriasAdmin();
            await cargarCategoriasAdmin();
            await cargarResumen();
        };

        contenedor.appendChild(fila);
    });
}

formNuevaCategoria.addEventListener("submit", async function(e) {
    e.preventDefault();

    const mensaje = document.getElementById("mensajeCategorias");

    const seccion = document.getElementById("nombreSeccion")
        .value.trim();

    const marca = document.getElementById("nombreMarca")
        .value.trim();

    const ordenSeccion = Number(
        document.getElementById("ordenSeccion").value
    );

    const ordenMarca = Number(
        document.getElementById("ordenMarca").value
    );

    mensaje.textContent = "Guardando...";

    const { data: existente, error: errorConsulta } =
        await supabaseClient
            .from("categorias")
            .select("id, orden_seccion")
            .ilike("seccion", seccion);

    if (errorConsulta) {
        mensaje.textContent = errorConsulta.message;
        return;
    }

    const ordenFinal = existente.length
        ? existente[0].orden_seccion
        : ordenSeccion;

    const { error } = await supabaseClient
        .from("categorias")
        .insert([{
            nombre: marca,
            seccion: seccion,
            orden: ordenMarca,
            orden_seccion: ordenFinal,
            activo: true
        }]);

    if (error) {
        mensaje.textContent = "Error: " + error.message;
        return;
    }

    mensaje.textContent = "¡Marca creada correctamente!";

    formNuevaCategoria.reset();

    await mostrarCategoriasAdmin();
    await cargarCategoriasAdmin();
    await cargarResumen();
});

// Cargar las categorías al abrir el panel
const mostrarCategoriasOriginal = mostrarPanel;

mostrarPanel = async function() {
    await mostrarCategoriasOriginal();
    await mostrarCategoriasAdmin();
};

// ======================================
// ELIMINAR PRODUCTOS
// ======================================

document.getElementById("listaProductos").addEventListener("click", async (e) => {
    const boton = e.target.closest(".btn-eliminar-producto");
    if (!boton) return;

    const id = boton.dataset.id;
    const nombre = boton.dataset.nombre;

    if (!confirm(`¿Seguro que deseas eliminar "${nombre}"?`)) return;

    const mensaje = document.getElementById("mensajePanel");
    mensaje.textContent = "Eliminando producto...";

    try {
        // Buscar imágenes del producto
        const { data: imagenes, error: errorImagenes } =
            await supabaseClient
                .from("imagenes_producto")
                .select("*")
                .eq("producto_id", id);

        if (errorImagenes) throw errorImagenes;

        // Eliminar variantes
        const { error: errorVariantes } = await supabaseClient
            .from("variantes_producto")
            .delete()
            .eq("producto_id", id);

        if (errorVariantes) throw errorVariantes;

        // Eliminar registros de imágenes
        const { error: errorBorrarImagenes } = await supabaseClient
            .from("imagenes_producto")
            .delete()
            .eq("producto_id", id);

        if (errorBorrarImagenes) throw errorBorrarImagenes;

        // Eliminar producto
        const { error: errorProducto } = await supabaseClient
            .from("productos")
            .delete()
            .eq("id", id);

        if (errorProducto) throw errorProducto;

        // Eliminar archivos del Storage
        if (imagenes.length) {
            const rutas = imagenes
                .map(img => {
                    const marcador = "/productos/";
                    const posicion = img.url.indexOf(marcador);

                    return posicion >= 0
                        ? decodeURIComponent(img.url.substring(posicion + marcador.length).split("?")[0])
                        : null;
                })
                .filter(Boolean);

            if (rutas.length) {
                const { error: errorStorage } = await supabaseClient.storage
                    .from("productos")
                    .remove(rutas);

                if (errorStorage) {
                    mensaje.textContent =
                        "Producto eliminado, pero algunas imágenes quedaron en Storage: " +
                        errorStorage.message;
                    await cargarResumen();
                    return;
                }
            }
        }

        mensaje.textContent = "Producto eliminado correctamente.";
        await cargarResumen();

    } catch (error) {
        mensaje.textContent = "Error al eliminar: " + error.message;
    }
});