// ==========================================================
// COMPORTAMIENTO DE CADA SECCIÓN
// Archivo compartido por la tienda (index.html) y el panel (admin.html).
//
// Para agregar una sección nueva solo hay que agregar UNA línea aquí:
//     nombre de la sección en minúsculas : comportamiento
//
// Comportamientos disponibles:
//   "talla_color"  → talla + color, cada color con su imagen (como las camisetas)
//   "solo_talla"   → solo talla, se ven todas las imágenes (como los combos)
//   "fragancia_ml" → fragancia en lista + mililitros con imagen y precio (como las lociones)
//   "directo"      → se agrega al carrito sin abrir el modal (como los relojes)
// ==========================================================

const SECCIONES_COMPORTAMIENTO = {
    camisetas: "talla_color",
    polos: "talla_color",
    pantalones: "talla_color",

    combos: "solo_talla",
    combo: "solo_talla",
    shorts: "solo_talla",

    perfumes: "fragancia_ml",

    relojes: "directo",
    gorras: "directo"
};

// Para productos viejos cuya sección no aparece arriba, se usa el campo "tipo" guardado en la base de datos
const MODO_POR_TIPO = {
    camiseta: "talla_color",
    combo: "solo_talla",
    locion: "fragancia_ml",
    reloj: "directo"
};

function comportamientoDeSeccion(seccion) {
    const clave = String(seccion || "").trim().toLowerCase();
    return SECCIONES_COMPORTAMIENTO[clave] || "";
}

function comportamientoDeProducto(producto) {
    const porSeccion = comportamientoDeSeccion(producto?.categoria?.seccion);
    if (porSeccion) return porSeccion;

    return MODO_POR_TIPO[String(producto?.tipo || "").trim().toLowerCase()] || "";
}
