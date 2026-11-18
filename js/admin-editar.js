// ==========================================================
// EDITAR PRODUCTOS
// Archivo nuevo: js/admin-editar.js
// Se carga DESPUÉS de js/admin.js (usa escaparHTML, cargarResumen
// y supabaseClient, que ya existen en los otros archivos).
// ==========================================================

const seccionEditar = document.getElementById("seccionEditar");
const formEditar = document.getElementById("formEditarProducto");
const mensajeEdicion = document.getElementById("mensajeEdicion");

// Datos del producto que se está editando
let edicionActual = null;

// ----------------------------------------------------------
// UTILIDADES (funciones puras, sin tocar la pantalla)
// ----------------------------------------------------------

function tipoDeSeccion(seccion) {
    const modo = comportamientoDeSeccion(seccion);

    if (modo === "talla_color") return "camisetas";
    if (modo === "solo_talla") return "combos";
    if (modo === "fragancia_ml") return "lociones";

    return "simple"; // relojes, gorras y cualquier sección sin variantes
}

function colorHexValido(valor) {
    return /^#[0-9a-f]{6}$/i.test(String(valor || "")) ? valor : "#cccccc";
}

// Convierte las filas de variantes_producto en listas fáciles de editar
function derivarEstado(variantes) {
    const tallas = [...new Set(variantes.map(v => v.talla).filter(Boolean).map(String))];

    const mapaColores = new Map();
    variantes.forEach(v => {
        if (v.color && !mapaColores.has(v.color)) {
            mapaColores.set(v.color, {
                color: String(v.color),
                hex: colorHexValido(v.color_hex),
                imagen_id: v.imagen_id
            });
        }
    });

    const fragancias = variantes
        .filter(v => v.fragancia)
        .map(v => String(v.fragancia));

    const presentaciones = variantes
        .filter(v => v.mililitros)
        .map(v => ({
            nombre: String(v.mililitros),
            precio: Number(v.precio) || 0,
            imagen_id: v.imagen_id
        }));

    return { tallas, colores: [...mapaColores.values()], fragancias, presentaciones };
}

// Las lociones no tienen un precio propio: se usa el de la presentación más barata
function precioMinimoPresentaciones(presentaciones) {
    const precios = presentaciones.map(p => Number(p.precio)).filter(n => n > 0);

    if (!precios.length) {
        throw new Error("Deja al menos una presentación con su precio.");
    }

    return Math.min(...precios);
}

function separarLista(texto) {
    return String(texto || "")
        .split(/[\n,]+/)
        .map(t => t.trim())
        .filter(Boolean);
}

function sinRepetidos(lista) {
    const vistos = new Set();

    return lista.filter(item => {
        const clave = String(item).toLowerCase();
        if (vistos.has(clave)) return false;
        vistos.add(clave);
        return true;
    });
}

// Arma las filas nuevas de variantes_producto según lo que quedó en el formulario
function construirVariantes(datos) {
    const { tipo, productoId, precio } = datos;
    const filas = [];

    if (tipo === "camisetas") {
        const tallas = sinRepetidos(datos.tallas);
        const colores = datos.colores;

        if (!tallas.length) {
            throw new Error('La camiseta debe tener al menos una talla. Si se agotó todo, desmarca "Visible en la tienda".');
        }

        if (!colores.length) {
            throw new Error('La camiseta debe tener al menos un color. Si se agotó todo, desmarca "Visible en la tienda".');
        }

        colores.forEach(c => {
            if (!c.color || c.imagen_id === "" || c.imagen_id == null) {
                throw new Error("Completa el nombre y la imagen de cada color.");
            }
        });

        if (sinRepetidos(colores.map(c => c.color)).length !== colores.length) {
            throw new Error("Hay dos colores con el mismo nombre.");
        }

        colores.forEach(c => {
            tallas.forEach(talla => {
                filas.push({
                    producto_id: productoId,
                    talla: talla,
                    color: c.color,
                    color_hex: c.hex,
                    imagen_id: c.imagen_id,
                    precio: precio,
                    orden: filas.length
                });
            });
        });
    }

    if (tipo === "combos") {
        const tallas = sinRepetidos(datos.tallas);

        if (!tallas.length) {
            throw new Error('El combo debe tener al menos una talla. Si se agotó todo, desmarca "Visible en la tienda".');
        }

        tallas.forEach(talla => {
            filas.push({
                producto_id: productoId,
                talla: talla,
                precio: precio,
                orden: filas.length
            });
        });
    }

    if (tipo === "lociones") {
        const fragancias = sinRepetidos(datos.fragancias);
        const presentaciones = datos.presentaciones;

        if (!fragancias.length) {
            throw new Error("Debes dejar al menos una fragancia.");
        }

        if (!presentaciones.length) {
            throw new Error("Debes dejar al menos una presentación (por ejemplo 30ml).");
        }

        presentaciones.forEach(p => {
            if (!p.nombre || !(p.precio > 0) || p.imagen_id === "" || p.imagen_id == null) {
                throw new Error("Completa el nombre, el precio y la imagen de cada presentación.");
            }
        });

        if (sinRepetidos(presentaciones.map(p => p.nombre)).length !== presentaciones.length) {
            throw new Error("Hay dos presentaciones con el mismo nombre.");
        }

        fragancias.forEach(fragancia => {
            filas.push({
                producto_id: productoId,
                fragancia: fragancia,
                precio: precio,
                orden: filas.length
            });
        });

        presentaciones.forEach(p => {
            filas.push({
                producto_id: productoId,
                mililitros: p.nombre,
                precio: p.precio,
                imagen_id: p.imagen_id,
                orden: filas.length
            });
        });
    }

    return filas;
}

// ----------------------------------------------------------
// DIBUJAR EL FORMULARIO
// ----------------------------------------------------------

function opcionesImagenes(imagenes, seleccionada) {
    return imagenes.map((img, i) => `
        <option value="${escaparHTML(img.id)}"
            ${String(img.id) === String(seleccionada) ? "selected" : ""}>
            ${i + 1}. ${escaparHTML(img.nombre_archivo || "imagen")}
        </option>
    `).join("");
}

function htmlChipTalla(talla) {
    return `
        <span class="chip-talla" data-talla="${escaparHTML(talla)}">
            ${escaparHTML(talla)}
            <button type="button" class="quitar-chip" title="Quitar">✕</button>
        </span>
    `;
}

function htmlFilaColor(color, imagenes) {
    return `
        <div class="fila-edicion fila-color-edicion">
            <label>Nombre del color</label>
            <input type="text" class="ed-color-nombre" value="${escaparHTML(color.color || "")}">

            <label>Código del color</label>
            <input type="color" class="ed-color-hex" value="${colorHexValido(color.hex)}">

            <label>Imagen correspondiente</label>
            <select class="ed-color-imagen">
                <option value="">Selecciona una imagen</option>
                ${opcionesImagenes(imagenes, color.imagen_id)}
            </select>

            <button type="button" class="quitar-fila">Quitar este color</button>
        </div>
    `;
}

function htmlFilaPresentacion(pres, imagenes) {
    return `
        <div class="fila-edicion fila-presentacion-edicion">
            <label>Presentación (ejemplo: 30ml)</label>
            <input type="text" class="ed-pres-nombre" value="${escaparHTML(pres.nombre || "")}">

            <label>Precio</label>
            <input type="number" class="ed-pres-precio" min="0" value="${pres.precio ?? ""}">

            <label>Imagen correspondiente</label>
            <select class="ed-pres-imagen">
                <option value="">Selecciona una imagen</option>
                ${opcionesImagenes(imagenes, pres.imagen_id)}
            </select>

            <button type="button" class="quitar-fila">Quitar esta presentación</button>
        </div>
    `;
}

function htmlFormularioEdicion(producto, categoria, tipo, imagenes, variantes) {
    const estado = derivarEstado(variantes);

    let html = `
        <p><strong>${escaparHTML(categoria.seccion)} — ${escaparHTML(categoria.nombre)}</strong></p>

        <label>Nombre del producto</label>
        <input type="text" id="edNombre" value="${escaparHTML(producto.nombre)}" required>

        <label>Descripción</label>
        <textarea id="edDescripcion" rows="3">${escaparHTML(producto.descripcion)}</textarea>

        ${tipo === "lociones" ? "" : `
        <label>Precio</label>
        <input type="number" id="edPrecio" min="0" value="${Number(producto.precio) || 0}" required>
        `}

        <label>
            <input type="checkbox" id="edActivo" ${producto.activo ? "checked" : ""}>
            Visible en la tienda
        </label>
    `;

    if (tipo === "camisetas" || tipo === "combos") {
        html += `
            <h3>Tallas disponibles</h3>
            <p>Quita con ✕ las tallas que se agotaron.</p>
            <div id="edTallas">${estado.tallas.map(htmlChipTalla).join("")}</div>

            <div class="fila-add">
                <input type="text" id="edNuevaTalla" placeholder="Agregar talla (ejemplo: XL, o varias: S, M)">
                <button type="button" id="btnAddTalla">+ Agregar talla</button>
            </div>
        `;
    }

    if (tipo === "camisetas") {
        html += `
            <h3>Colores disponibles</h3>
            <p>Quita los colores que se agotaron.</p>
            <div id="edColores">${estado.colores.map(c => htmlFilaColor(c, imagenes)).join("")}</div>
            <button type="button" id="btnAddColorEd">+ Agregar color</button>
        `;
    }

    if (tipo === "lociones") {
        html += `
            <h3>Fragancias</h3>
            <label>Una por línea o separadas por coma. Borra las que se agotaron.</label>
            <textarea id="edFragancias" rows="6">${escaparHTML(estado.fragancias.join("\n"))}</textarea>

            <h3>Presentaciones</h3>
            <div id="edPresentaciones">${estado.presentaciones.map(p => htmlFilaPresentacion(p, imagenes)).join("")}</div>
            <button type="button" id="btnAddPresentacionEd">+ Agregar presentación</button>
        `;
    }

    html += `
        <div style="display:flex; gap:10px; margin-top:20px;">
            <button type="submit">Guardar cambios</button>
            <button type="button" id="btnCancelarEdicion">Cancelar</button>
        </div>
    `;

    return html;
}

// ----------------------------------------------------------
// ABRIR Y CERRAR LA EDICIÓN
// ----------------------------------------------------------

function cerrarEdicion() {
    edicionActual = null;
    formEditar.innerHTML = "";
    mensajeEdicion.textContent = "";
    seccionEditar.hidden = true;
}

async function abrirEdicion(id) {
    const mensaje = document.getElementById("mensajePanel");
    mensaje.textContent = "Cargando producto...";

    try {
        const { data: producto, error: errorProducto } = await supabaseClient
            .from("productos")
            .select("*")
            .eq("id", id)
            .single();

        if (errorProducto) throw errorProducto;

        const [categoriaRes, imagenesRes, variantesRes] = await Promise.all([
            supabaseClient.from("categorias").select("*").eq("id", producto.categoria_id).single(),
            supabaseClient.from("imagenes_producto").select("*").eq("producto_id", id).order("orden"),
            supabaseClient.from("variantes_producto").select("*").eq("producto_id", id).order("orden")
        ]);

        if (categoriaRes.error) throw categoriaRes.error;
        if (imagenesRes.error) throw imagenesRes.error;
        if (variantesRes.error) throw variantesRes.error;

        const categoria = categoriaRes.data;
        const imagenes = imagenesRes.data || [];
        const variantes = variantesRes.data || [];
        const tipo = tipoDeSeccion(categoria.seccion);

        edicionActual = { producto, categoria, tipo, imagenes, variantes };

        formEditar.innerHTML = htmlFormularioEdicion(producto, categoria, tipo, imagenes, variantes);
        mensajeEdicion.textContent = "";
        mensaje.textContent = "";

        seccionEditar.hidden = false;
        seccionEditar.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (error) {
        mensaje.textContent = "Error al cargar el producto: " + error.message;
    }
}

// Botón "Editar producto" de la lista
document.getElementById("listaProductos").addEventListener("click", async (e) => {
    const boton = e.target.closest(".btn-editar-producto");
    if (!boton) return;

    await abrirEdicion(boton.dataset.id);
});

// ----------------------------------------------------------
// BOTONES DENTRO DEL FORMULARIO DE EDICIÓN
// ----------------------------------------------------------

function agregarTallasDesdeInput() {
    const input = document.getElementById("edNuevaTalla");
    const contenedor = document.getElementById("edTallas");
    if (!input || !contenedor) return;

    const existentes = [...contenedor.querySelectorAll(".chip-talla")]
        .map(c => c.dataset.talla.toLowerCase());

    separarLista(input.value).forEach(talla => {
        if (!existentes.includes(talla.toLowerCase())) {
            contenedor.insertAdjacentHTML("beforeend", htmlChipTalla(talla));
            existentes.push(talla.toLowerCase());
        }
    });

    input.value = "";
    input.focus();
}

formEditar.addEventListener("click", (e) => {
    if (!edicionActual) return;

    if (e.target.closest(".quitar-chip")) {
        e.target.closest(".chip-talla").remove();
        return;
    }

    if (e.target.closest(".quitar-fila")) {
        e.target.closest(".fila-edicion").remove();
        return;
    }

    if (e.target.id === "btnAddTalla") {
        agregarTallasDesdeInput();
        return;
    }

    if (e.target.id === "btnAddColorEd") {
        document.getElementById("edColores").insertAdjacentHTML(
            "beforeend",
            htmlFilaColor({ color: "", hex: "#000000", imagen_id: "" }, edicionActual.imagenes)
        );
        return;
    }

    if (e.target.id === "btnAddPresentacionEd") {
        document.getElementById("edPresentaciones").insertAdjacentHTML(
            "beforeend",
            htmlFilaPresentacion({ nombre: "", precio: "", imagen_id: "" }, edicionActual.imagenes)
        );
        return;
    }

    if (e.target.id === "btnCancelarEdicion") {
        cerrarEdicion();
    }
});

// Enter en el campo de talla agrega la talla (sin enviar el formulario)
formEditar.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "edNuevaTalla") {
        e.preventDefault();
        agregarTallasDesdeInput();
    }
});

// ----------------------------------------------------------
// GUARDAR CAMBIOS
// ----------------------------------------------------------

// El valor de un <select> es texto; aquí se recupera el id original de la imagen
function idImagenOriginal(valor, imagenes) {
    if (valor === "" || valor == null) return "";
    const imagen = imagenes.find(img => String(img.id) === String(valor));
    return imagen ? imagen.id : "";
}

function leerDatosVariantes(tipo, imagenes) {
    const datos = { tallas: [], colores: [], fragancias: [], presentaciones: [] };

    datos.tallas = [...formEditar.querySelectorAll(".chip-talla")].map(c => c.dataset.talla);

    datos.colores = [...formEditar.querySelectorAll(".fila-color-edicion")].map(fila => ({
        color: fila.querySelector(".ed-color-nombre").value.trim(),
        hex: fila.querySelector(".ed-color-hex").value,
        imagen_id: idImagenOriginal(fila.querySelector(".ed-color-imagen").value, imagenes)
    }));

    const cajaFragancias = document.getElementById("edFragancias");
    datos.fragancias = cajaFragancias ? separarLista(cajaFragancias.value) : [];

    datos.presentaciones = [...formEditar.querySelectorAll(".fila-presentacion-edicion")].map(fila => ({
        nombre: fila.querySelector(".ed-pres-nombre").value.trim(),
        precio: Number(fila.querySelector(".ed-pres-precio").value),
        imagen_id: idImagenOriginal(fila.querySelector(".ed-pres-imagen").value, imagenes)
    }));

    return datos;
}

formEditar.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!edicionActual) return;

    const { producto, tipo, imagenes, variantes } = edicionActual;
    const boton = formEditar.querySelector('[type="submit"]');
    const mensajePanel = document.getElementById("mensajePanel");

    boton.disabled = true;
    boton.textContent = "Guardando cambios...";
    mensajeEdicion.textContent = "";

    try {
        const nombre = document.getElementById("edNombre").value.trim();
        const descripcion = document.getElementById("edDescripcion").value.trim();
        const activo = document.getElementById("edActivo").checked;

        if (!nombre) throw new Error("El nombre no puede estar vacío.");

        // 1. Leer las variantes y calcular el precio ANTES de tocar la base de datos
        const datosVariantes = tipo !== "simple" ? leerDatosVariantes(tipo, imagenes) : null;

        let precio;

        if (tipo === "lociones") {
            precio = precioMinimoPresentaciones(datosVariantes.presentaciones);
        } else {
            precio = Number(document.getElementById("edPrecio").value);
            if (!(precio >= 0)) throw new Error("El precio no es válido.");
        }

        let filasNuevas = null;

        if (datosVariantes) {
            filasNuevas = construirVariantes({
                tipo: tipo,
                productoId: producto.id,
                precio: precio,
                ...datosVariantes
            });
        }

        // 2. Actualizar los datos del producto
        const { error: errorProducto } = await supabaseClient
            .from("productos")
            .update({ nombre, descripcion, precio, activo })
            .eq("id", producto.id);

        if (errorProducto) throw errorProducto;

        // 3. Variantes: primero se insertan las nuevas y solo si salió bien se borran las anteriores.
        //    Así, si algo falla, el producto no se queda sin tallas ni colores.
        if (filasNuevas) {
            const idsViejos = variantes.map(v => v.id);

            const { error: errorInsertar } = await supabaseClient
                .from("variantes_producto")
                .insert(filasNuevas);

            if (errorInsertar) throw errorInsertar;

            if (idsViejos.length) {
                const { error: errorBorrar } = await supabaseClient
                    .from("variantes_producto")
                    .delete()
                    .in("id", idsViejos);

                if (errorBorrar) {
                    throw new Error(
                        "Los cambios se guardaron, pero no se pudieron borrar las variantes anteriores: " +
                        errorBorrar.message
                    );
                }
            }
        }

        cerrarEdicion();
        mensajePanel.textContent = "Producto actualizado correctamente.";
        await cargarResumen();

    } catch (error) {
        mensajeEdicion.textContent =
            "Error: " + error.message +
            (error.details ? " | Detalle: " + error.details : "") +
            (error.hint ? " | Pista: " + error.hint : "") +
            (error.code ? " | Código: " + error.code : "");

    } finally {
        boton.disabled = false;
        boton.textContent = "Guardar cambios";
    }
});
