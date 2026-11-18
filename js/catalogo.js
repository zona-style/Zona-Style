// ==============================================
// CARGAR CATÁLOGO DESDE SUPABASE
// ==============================================

async function cargarCatalogoSupabase() {
    try {
        const [productosResult, categoriasResult, imagenesResult, variantesResult] =
            await Promise.all([
                supabaseClient.from("productos").select("*").eq("activo", true).order("orden"),
                supabaseClient.from("categorias").select("*"),
                supabaseClient.from("imagenes_producto").select("*").order("orden"),
                supabaseClient.from("variantes_producto").select("*").order("orden")
            ]);

        if (productosResult.error) throw productosResult.error;
        if (categoriasResult.error) throw categoriasResult.error;
        if (imagenesResult.error) throw imagenesResult.error;
        if (variantesResult.error) throw variantesResult.error;

        const productos = productosResult.data || [];
        const categorias = categoriasResult.data || [];
        const imagenes = imagenesResult.data || [];
        const variantes = variantesResult.data || [];

        return productos.map(producto => ({
            ...producto,
            categoria: categorias.find(cat => cat.id === producto.categoria_id) || null,
            imagenes: imagenes.filter(img => img.producto_id === producto.id),
            variantes: variantes.filter(v => v.producto_id === producto.id)
        }));

    } catch (error) {
        console.error("Error cargando catálogo de Supabase:", error);
        return [];
    }
}

// ==============================================
// PREPARAR PRODUCTO PARA EL MODAL EXISTENTE
// ==============================================

function prepararProductoParaModal(producto) {
    const imagenes = [...(producto.imagenes || [])]
        .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));

    const variantes = producto.variantes || [];
    const seccion = String(producto.categoria?.seccion || "").trim().toLowerCase();
    const modo = comportamientoDeProducto(producto);
    const esCombo = modo === "solo_talla";
    const esLocion = modo === "fragancia_ml";

    const tallas = [...new Set(variantes.map(v => v.talla).filter(Boolean))];
    const colores = [...new Set(variantes.map(v => v.color).filter(Boolean))];
    const fragancias = [...new Set(variantes.map(v => v.fragancia).filter(Boolean))];
    const mililitros = [...new Set(variantes.map(v => v.mililitros).filter(Boolean))];

    const imagenPortada = imagenes[0]?.url || "";
    let imagenesModal = imagenes.map(img => img.url).filter(Boolean);
    let coloresHex = [];
    let precios = null;
    let opcion2Nombre = "";
    let opcion2 = null;

    if (esCombo) {
        // Los combos muestran todas sus imágenes en el modal.
        // En el carrito se usa la primera (portada); eso lo resuelve agregarDesdeModal().
    } else if (esLocion) {
        // Cada presentación (mililitros) tiene su propia imagen y su propio precio.
        const presentaciones = variantes
            .filter(v => v.mililitros)
            .map(v => ({
                nombre: String(v.mililitros),
                precio: Number(v.precio) || Number(producto.precio) || 0,
                url: imagenes.find(img => img.id === v.imagen_id)?.url || imagenPortada
            }))
            .filter(p => p.url);

        if (presentaciones.length) {
            imagenesModal = presentaciones.map(p => p.url);
            precios = presentaciones.map(p => p.precio);
            opcion2Nombre = "Mililitros";
            opcion2 = presentaciones.map(p => p.nombre);
        }
    } else if (modo === "talla_color" && colores.length) {
        // Cada color utiliza la imagen asociada a su variante.
        const coloresConImagen = colores.map(color => {
            const variante = variantes.find(v => v.color === color);
            const imagen = imagenes.find(img => img.id === variante?.imagen_id);
            return {
                color,
                hex: variante?.color_hex || "#cccccc",
                url: imagen?.url || imagenPortada
            };
        }).filter(item => item.url);

        imagenesModal = coloresConImagen.map(item => item.url);
        coloresHex = coloresConImagen.map(item => item.hex);
    } else {
        coloresHex = colores.map(color => {
            const variante = variantes.find(v => v.color === color);
            return variante?.color_hex || "#cccccc";
        });
    }

    // El modal actual utiliza opcion1 para los selectores de fragancia/mililitros.
    let opcion1Nombre = "";
    let opcion1 = null;

    if (fragancias.length) {
        opcion1Nombre = "Fragancia";
        opcion1 = fragancias;
    } else if (mililitros.length && !esLocion) {
        opcion1Nombre = "Mililitros";
        opcion1 = mililitros;
    }

    return {
        id: producto.id,
        nombre: producto.nombre,
        precio: Number(producto.precio) || 0,
        tipo: producto.tipo,
        seccion,
        esCombo,
        imagenes: imagenesModal,
        imagenPortada,
        tallas: tallas.length ? tallas : null,
        colores: colores.length && !esCombo ? colores : null,
        coloresHex,
        opcion1Nombre,
        opcion1,
        opcion2Nombre,
        opcion2,
        precios,
        variantes
    };
}

// Precio que se muestra en la tarjeta: las lociones muestran "Desde $X" con su presentación más barata.
function precioParaTarjeta(producto) {
    const base = Number(producto.precio) || 0;
    const esLocion = comportamientoDeProducto(producto) === "fragancia_ml";

    if (esLocion) {
        const preciosMl = (producto.variantes || [])
            .filter(v => v.mililitros)
            .map(v => Number(v.precio))
            .filter(n => n > 0);

        if (preciosMl.length) {
            return "Desde $" + Math.min(...preciosMl).toLocaleString("es-CO");
        }
    }

    return "$" + base.toLocaleString("es-CO");
}

// ==============================================
// UTILIDADES PARA SECCIONES Y MARCAS
// ==============================================

function crearIdCatalogo(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// ==============================================
// MOSTRAR PRODUCTOS AGRUPADOS
// ==============================================

async function mostrarProductosSupabase() {
    const contenedor = document.getElementById("productos-supabase");
    const menu = document.getElementById("menu-categorias-supabase");
    if (!contenedor) return;

    contenedor.innerHTML = "<p>Cargando productos...</p>";

    const catalogo = await cargarCatalogoSupabase();
    if (!catalogo.length) {
        contenedor.innerHTML = "<p>No hay productos disponibles.</p>";
        if (menu) menu.innerHTML = "";
        return;
    }

    const categorias = [...new Map(
        catalogo.filter(p => p.categoria).map(p => [p.categoria.id, p.categoria])
    ).values()];

    categorias.sort((a, b) =>
        (Number(a.orden_seccion) || 0) - (Number(b.orden_seccion) || 0) ||
        (Number(a.orden) || 0) - (Number(b.orden) || 0) ||
        String(a.nombre).localeCompare(String(b.nombre), "es")
    );

    const secciones = [...new Set(categorias.map(c => c.seccion).filter(Boolean))];

    // Menú de secciones y marcas
    if (menu) {
        menu.innerHTML = "";
        secciones.forEach(seccion => {
            const grupo = document.createElement("div");
            grupo.className = "categoria";

            const titulo = document.createElement("h3");
            titulo.textContent = seccion;
            grupo.appendChild(titulo);

            categorias.filter(c => c.seccion === seccion).forEach(categoria => {
                const enlace = document.createElement("a");
                enlace.href = "#marca-" + crearIdCatalogo(seccion + "-" + categoria.nombre);
                enlace.textContent = categoria.nombre;
                grupo.appendChild(enlace);
            });

            menu.appendChild(grupo);
        });
    }

    // Catálogo por sección y marca
    contenedor.innerHTML = "";

    secciones.forEach(seccion => {
        const productosSeccion = catalogo.filter(p => p.categoria?.seccion === seccion);
        if (!productosSeccion.length) return;

        const bloqueSeccion = document.createElement("section");
        bloqueSeccion.className = "seccion-catalogo";
        bloqueSeccion.id = "seccion-" + crearIdCatalogo(seccion);

        const tituloSeccion = document.createElement("h2");
        tituloSeccion.textContent = seccion;
        bloqueSeccion.appendChild(tituloSeccion);

        categorias.filter(c => c.seccion === seccion).forEach(categoria => {
            const productosMarca = productosSeccion.filter(p => p.categoria?.id === categoria.id);
            if (!productosMarca.length) return;

            const bloqueMarca = document.createElement("div");
            bloqueMarca.className = "grupo-productos";
            bloqueMarca.id = "marca-" + crearIdCatalogo(seccion + "-" + categoria.nombre);

            const tituloMarca = document.createElement("h3");
            tituloMarca.textContent = categoria.nombre;

            const rejilla = document.createElement("div");
            rejilla.className = "productos";

            productosMarca.forEach(producto => {
                const tarjeta = document.createElement("article");
                tarjeta.className = "producto";

                const imagen = document.createElement("img");
                imagen.src = producto.imagenes?.[0]?.url || "";
                imagen.alt = producto.nombre || "Producto";
                imagen.loading = "lazy";

                const nombre = document.createElement("h3");
                nombre.textContent = producto.nombre || "";

                const precio = document.createElement("p");
                precio.textContent = precioParaTarjeta(producto);

                const boton = document.createElement("button");
                boton.type = "button";
                boton.className = "btn-ver-producto";

                const esDirecto = comportamientoDeProducto(producto) === "directo";

                if (esDirecto) {
                    boton.textContent = "Agregar al carrito";
                    boton.onclick = function (evento) {
                        evento.preventDefault();
                        evento.stopPropagation();

                        if (typeof window.agregarCarrito !== "function") {
                            console.error("No se encontró agregarCarrito(). Revisa js/script.js");
                            alert("No se pudo agregar el producto. Recarga la página.");
                            return;
                        }

                        window.agregarCarrito(
                            producto.nombre,
                            Number(producto.precio) || 0,
                            producto.imagenes?.[0]?.url || ""
                        );
                    };
                } else {
                    boton.textContent = "Ver producto";
                    const datosModal = prepararProductoParaModal(producto);

                    // Abrir el modal directamente desde el botón.
                    boton.addEventListener("click", function (evento) {
                        evento.preventDefault();

                        if (!Array.isArray(datosModal.imagenes) || datosModal.imagenes.length === 0) {
                            console.error("Producto sin imágenes:", producto);
                            alert("Este producto todavía no tiene imágenes cargadas.");
                            return;
                        }

                        try {
                            // abrirProducto está declarada en js/script.js.
                            abrirProducto(datosModal);
                        } catch (error) {
                            console.error("Error al abrir el modal del producto:", error);
                            alert("Ocurrió un error al abrir el producto. Revisa la consola.");
                        }
                    });
                }

                tarjeta.append(imagen, nombre, precio, boton);
                rejilla.appendChild(tarjeta);
            });

            bloqueMarca.append(tituloMarca, rejilla);
            bloqueSeccion.appendChild(bloqueMarca);
        });

        contenedor.appendChild(bloqueSeccion);
    });
}

// Cargar una sola vez cuando el HTML esté listo.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mostrarProductosSupabase, { once: true });
} else {
    mostrarProductosSupabase();
}