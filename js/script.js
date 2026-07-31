let carrito = [];

// AGREGAR PRODUCTO
function agregarCarrito(nombre, precio, imagen){

    carrito.push({

        nombre: nombre,

        precio: precio,

        imagen: imagen,

        talla: "",

        color: "",

        nombreTalla: "",

        nombreColor: ""

    });

    actualizarCarrito();

}

// ACTUALIZAR CARRITO
function actualizarCarrito(){

    let total = 0;
    let carritoHTML = "";

    carrito.forEach((producto, index) => {

        total += producto.precio;

        carritoHTML += `
        <div class="item-carrito">

            <img src="${producto.imagen}" width="80">

            <div>
                <h4>${producto.nombre}</h4>
                <p>${producto.nombreColor}: ${producto.color}</p>
                <p>${producto.nombreTalla}: ${producto.talla}</p>
                <p>$${producto.precio}</p>
            </div>

            <button onclick="eliminarProducto(${index})">
                X
            </button>

        </div>
        `;

    });

    carritoHTML += `
    <div class="total-carrito">
        <h3>Total: $${total}</h3>
    </div>

    <button onclick="generarFactura()" class="btn-factura">
        Generar Factura
    </button>
    `;

    document.getElementById("carrito-items").innerHTML = carritoHTML;

    document.getElementById("contador").innerText = carrito.length;
}

// ELIMINAR PRODUCTO
function eliminarProducto(index){

    carrito.splice(index,1);

    actualizarCarrito();
}

// ABRIR CARRITO
function abrirCarrito(){

    const carrito =
    document.getElementById("carrito");

    carrito.classList.toggle("activo");
    
    document.body.classList.toggle("carrito-abierto");

    const whatsapp =
    document.querySelector(".whatsapp-float");

    const instagram =
    document.querySelector(".instagram-float");

    if(carrito.classList.contains("activo")){

        if(whatsapp){
            whatsapp.style.display = "none";
        }

        if(instagram){
            instagram.style.display = "none";
        }

    }else{

        if(whatsapp){
            whatsapp.style.display = "block";
        }

        if(instagram){
            instagram.style.display = "block";
        }

    }

}



function abrirMenu(){

    document
    .getElementById("menu-lateral")
    .classList.toggle("activo");

    

    document.body.classList

}

function buscarProductos() {

    let texto = document
        .getElementById("buscador")
        .value
        .toLowerCase()
        .trim();

    if (texto === "") return;

    let productos = document.querySelectorAll(".producto");

    productos.forEach(producto => {

        let nombre = producto
            .querySelector("h3")
            .textContent
            .toLowerCase();

        if (nombre.includes(texto)) {

            producto.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            producto.style.border =
                "3px solid gold";

            setTimeout(() => {
                producto.style.border = "";
            }, 3000);
        }

    });

}

let productoActual = null;

function abrirProducto(datos){

    productoActual = datos;

    document.getElementById("tituloOpcion1")
    .textContent =
    datos.opcion1Nombre || "Tallas";

    document.getElementById("tituloOpcion2")
    .textContent =
    datos.opcion2Nombre || "Colores";

    document.getElementById("nombreModal")
        .textContent = datos.nombre;

    document.getElementById("precioModal")
        .textContent = "$" + (datos.precios ? datos.precios[0] : datos.precio);

    document.getElementById("imgPrincipal")
    .src = datos.imagenes[0];

    imagenSeleccionada = datos.imagenes[0];

    let galeria =
        document.getElementById("galeria");

    galeria.innerHTML = "";

    datos.imagenes.forEach(img => {

        galeria.innerHTML += `
            <img src="${img}"
                 onclick="cambiarImagen('${img}')">
            
        
        `;

    });
    let contenedorTallas =
    document.getElementById("contenedorTallas");
    
    contenedorTallas.innerHTML = "";
    
    if(datos.opcion1Nombre){

    contenedorTallas.innerHTML = `
        <select id="selectorFragancia" class="selector-fragancia">
            <option value="">Selecciona una fragancia</option>
            ${(datos.opcion1 || []).map(f =>
                `<option value="${f}">${f}</option>`
            ).join("")}
        </select>
    `;

    }else{
    
        contenedorTallas.innerHTML = "";
    
        (datos.tallas || []).forEach(talla => {
    
            contenedorTallas.innerHTML += `
                <div class="talla"
                    onclick="seleccionarTalla(this)">
                    ${talla}
                </div>
            `;
    
        });
    
    }
    let contenedorColores =
    document.getElementById("contenedorColores");
    
    contenedorColores.innerHTML = "";
    
    (datos.opcion2 || datos.colores)
        .forEach((color, indice) => {
        
            if(datos.opcion2Nombre){
        
                contenedorColores.innerHTML += `
                    <div class="talla"
                        onclick="seleccionarColor(
                            this,
                            '${color}',
                            ${indice}
                        )">
                        ${color}
                    </div>
                `;
        
            }else{
        
                contenedorColores.innerHTML += `
                    <div
                        class="color"
        
                        style="background:${datos.coloresHex[indice]}"
        
                        onclick="seleccionarColor(
                            this,
                            '${color}',
                            ${indice}
                        )">
        
                    </div>
                `;
        
            }
        
        });
    document
        .getElementById("modalProducto")
        .classList
        .add("activo");

    document.body.classList.add("modal-abierto");

    tallaSeleccionada = "";
    colorSeleccionado = "";
    imagenSeleccionada = datos.imagenes[0];

    document
    .querySelectorAll(".talla")
    .forEach(t =>
        t.classList.remove("seleccionada")
    );

    document
    .querySelectorAll(".color")
    .forEach(c =>
        c.classList.remove("seleccionado")
    );
}

    

function cerrarModal(){

    document
        .getElementById("modalProducto")
        .classList
        .remove("activo");

    document.body.classList.remove("modal-abierto");

}
function cambiarImagen(src){

    document.getElementById("imgPrincipal")
    .src = src;

    imagenSeleccionada = src;

    let indice =
    productoActual.imagenes.indexOf(src);

    if(indice !== -1){

        colorSeleccionado =
        (productoActual.opcion2 || productoActual.colores)[indice];

        document
        .querySelectorAll(".color")
        .forEach(c =>
            c.classList.remove("seleccionado")
        );

        let colores =
        document.querySelectorAll(".color");

        if(colores[indice]){

            colores[indice]
            .classList
            .add("seleccionado");

        }

    }

}


let tallaSeleccionada = "";
let colorSeleccionado = "";
let imagenSeleccionada = "";

function seleccionarTalla(elemento){

    document
        .querySelectorAll(".talla")
        .forEach(t => t.classList.remove("seleccionada"));

    elemento.classList.add("seleccionada");

    tallaSeleccionada = elemento.textContent;

}
function seleccionarColor(
    elemento,
    color,
    indice
){

    document
    .querySelectorAll("#contenedorColores .color, #contenedorColores .talla")
    .forEach(c =>
        c.classList.remove("seleccionado","seleccionada")
    );

    elemento.classList.add("seleccionado");
    elemento.classList.add("seleccionada");

    colorSeleccionado = color;

    if(productoActual.imagenes[indice]){

        document.getElementById("imgPrincipal")
        .src =
        productoActual.imagenes[indice];

        imagenSeleccionada =
        productoActual.imagenes[indice];

    }
    if(productoActual.precios){
    document.getElementById("precioModal").textContent =
    "$" + productoActual.precios[indice];
    }

}


function agregarDesdeModal(){

    if(document.getElementById("selectorFragancia")){

        tallaSeleccionada =
        document.getElementById("selectorFragancia").value;

    }

    if(tallaSeleccionada === ""){

        alert("Selecciona una talla");
        return;
    }
    


    if(tallaSeleccionada === ""){

        alert("Selecciona una talla");
        return;
    }

    if(colorSeleccionado === ""){

        alert("Selecciona un color");
        return;
    }

    let indiceColor =
    (productoActual.opcion2 || productoActual.colores)
    .indexOf(colorSeleccionado);
    let imagenFinal =
        productoActual.imagenes[indiceColor];

    carrito.push({

    nombre: productoActual.nombre,

    precio: productoActual.precios
        ? productoActual.precios[indiceColor]
        : productoActual.precio,

    imagen: imagenSeleccionada,

    talla: tallaSeleccionada,

    color: colorSeleccionado,

    nombreTalla:
        productoActual.opcion1Nombre || "Talla",

    nombreColor:
        productoActual.opcion2Nombre || "Color"

});

    actualizarCarrito();

    cerrarModal();

    tallaSeleccionada = "";
    colorSeleccionado = "";
    imagenSeleccionada = "";

}

function generarFactura(){

    let nombre =
    document.getElementById("nombreCliente").value.trim();
    
    let documento =
    document.getElementById("documentoCliente").value.trim();
    
    let telefono =
    document.getElementById("telefonoCliente").value.trim();
    
    let direccion =
    document.getElementById("direccionCliente").value.trim();
    
    if(
        nombre === "" ||
        documento === "" ||
        telefono === "" ||
        direccion === ""
    ){
    
        alert(
            "⚠️ Por favor complete todos los datos antes de generar la factura."
        );

    return;
}
    let total = 0;

    let productosHTML = "";

    carrito.forEach(producto => {

        total += producto.precio;

        productosHTML += `

        <tr>

            <td>
                <img
                src="${producto.imagen}"
                width="80">
            </td>

            <td>${producto.nombre}</td>

            <td>${producto.talla}</td>

            <td>${producto.color}</td>

            <td>$${producto.precio}</td>

        </tr>

        `;

    });

    let factura = `
    <html>

    <head>
    
        <title>Factura Zona Style</title>
        <meta name="viewport"content="width=device-width, initial-scale=1.0">


        <style>

            body{
                    font-family: Arial, sans-serif;
                    padding: 15px;
                    max-width: 900px;
                    margin: auto;
                }
            #facturaPDF{
                width: 1000px;
                max-width: 1000px;
                background: white;
                padding: 20px;
                margin: auto;
            }
                
            .no-imprimir{
                display:block;
            }

            .encabezado{
                text-align:center;
                margin-bottom:30px;
            }

            .logo{
                font-size:40px;
                font-weight:bold;
            }

            .subtitulo{
                color:gray;
            }

            table{
                width:100%;
                border-collapse:collapse;
                margin-top:20px;
            }

            th{
                background:black;
                color:white;
            }

            th,td{
                border:1px solid #ddd;
                padding:10px;
                text-align:center;
            }

            .total{
                margin-top:20px;
                text-align:right;
                font-size:22px;
                font-weight:bold;
            }

            .cliente{
                margin-top:20px;
                line-height:1.8;
            }

            @media print{

                .no-imprimir{
                    display:none;
                }

            }
            
            .btn-descargar{

                width:100%;

                padding:12px;

                margin-top:10px;

                background:#111;

                color:white;

                border:none;

                border-radius:8px;

                cursor:pointer;

                font-size:16px;

                font-weight:bold;

            }
            img{
                max-width:100%;
                height:auto;
            }
            
            @media (max-width:768px){
            
                body{
                    padding:10px;
                }
            
                .logo{
                    font-size:28px;
                }
            
                table{
                    font-size:12px;
                }
            
                th,td{
                    padding:5px;
                }
            
                .total{
                    font-size:18px;
                }
            
                .btn-descargar{
                    font-size:14px;
                }
            
            }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        
    </head>

    <body>

        <div id="facturaPDF">    
    
            <div class="encabezado">
    
                <div class="logo">
                    ZONA STYLE
                </div>
    
                <div class="subtitulo">
                    Factura de Compra
                </div>
    
            </div>
    
            <div class="cliente">
    
                <b>Nombre:</b>
                ${document.getElementById("nombreCliente").value}
                <br>
    
                <b>Documento:</b>
                ${document.getElementById("documentoCliente").value}
                <br>
    
                <b>Teléfono:</b>
                ${document.getElementById("telefonoCliente").value}
                <br>
    
                <b>Dirección:</b>
                ${document.getElementById("direccionCliente").value}
                <br>
    
                <b>Método de Pago:</b>
                ${document.getElementById("metodoPago").value}
    
            </div>
    
            <table>
                <tr>
                    <th>Imagen</th>
                    <th>Producto</th>
                    <th>Talla/Fragancia</th>
                    <th>Color/Mililitros</th>
                    <th>Precio</th>
                </tr>
    
                ${productosHTML}
    
            </table>
    
            <div class="total">
    
                Cantidad de Productos:
                ${carrito.length}
                <br><br>
    
                Total:
                $${total}
    
            </div>
            <div style="text-align:center;margin-top:30px;">
    
                <button
                        class="btn-descargar no-imprimir"
                        onclick="descargarFactura()">
                    
                        📄 Descargar Factura PDF
        
                </button>
                <a
                        id="btnWhatsApp"
                        href="https://api.whatsapp.com/send?phone=573134905998"
                        target="_blank"
                        class="btn-descargar no-imprimir"
                        style="display:none; background:#25D366; margin-top:10px; text-decoration:none;">
                    
                        📲 Pedir por WhatsApp
                    
                </a>
    
            </div>
        
        </div>
        <script>
            async function descargarFactura(){

                    const factura =
                    document.getElementById("facturaPDF");
                
                    document.querySelector(".no-imprimir").style.display = "none";
                
                    const canvas =
                    await html2canvas(factura,{
                        scale:3,
                        backgroundColor:"#FFFFFF",
                        useCORS:true
                    });
                
                    document.querySelector(".no-imprimir").style.display = "block";
                
                    const imgData = canvas.toDataURL("image/png");

                        const pdf = new jspdf.jsPDF({
                            orientation: "portrait",
                            unit: "mm",
                            format: "a4"
                        });
                        
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        
                        const imgWidth = pageWidth;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        
                        pdf.addImage(
                            imgData,
                            "PNG",
                            0,
                            0,
                            imgWidth,
                            imgHeight
                        );
                        
                        pdf.save("Factura-Zona-Style.pdf");
                        
                        document.getElementById("btnWhatsApp").style.display = "block";
                }
        </script>    
    </body>

    </html>
    `;

    let ventana = window.open();
        
        if(!ventana){
        
            alert(
                "Tu navegador bloqueó la factura. Prueba en Chrome o sube la página a Netlify."
            );
        
            return;
        }
        
        ventana.document.open();
        
        ventana.document.write(factura);
        
        ventana.document.close();
}

function enviarPedidoWhatsapp(){

    let nombre =
    document.getElementById("nombreCliente").value;

    let documento =
    document.getElementById("documentoCliente").value;

    let telefono =
    document.getElementById("telefonoCliente").value;

    let direccion =
    document.getElementById("direccionCliente").value;

    let pago =
    document.getElementById("metodoPago").value;

    let mensaje =
`*PEDIDO ZONA STYLE*

Nombre: ${nombre}
Documento: ${documento}
Teléfono: ${telefono}
Dirección: ${direccion}
Método de pago: ${pago}

PRODUCTOS:
`;

    let total = 0;

    carrito.forEach(producto => {

        mensaje += `
• ${producto.nombre}
Talla: ${producto.talla}
Color: ${producto.color}
Precio: $${producto.precio}

`;

        total += producto.precio;

    });

    mensaje += `
Cantidad: ${carrito.length}
Total: $${total}
`;



    window.open(url,"_blank");

    document.getElementById("nombreCliente").value = "";
    document.getElementById("documentoCliente").value = "";
    document.getElementById("telefonoCliente").value = "";
    document.getElementById("direccionCliente").value = "";
    document.getElementById("metodoPago").selectedIndex = 0;

    carrito = [];
    actualizarCarrito();
}

let promoActual = 0;

const promos = document.querySelectorAll(".promo");

setInterval(() => {

    promos[promoActual].classList.remove("activa");

    promoActual++;

    if(promoActual >= promos.length){
        promoActual = 0;
    }

    promos[promoActual].classList.add("activa");

}, 2000);



const slides =
document.querySelectorAll(".slide");

const prevBtn =
document.querySelector(".prev");

const nextBtn =
document.querySelector(".next");

const indicadores =
document.querySelector(".indicadores");

let slideActual = 0;
let intervalo;

// Crear indicadores

slides.forEach((_, i)=>{

    const punto =
    document.createElement("div");

    punto.classList.add("indicador");

    if(i === 0){

        punto.classList.add("activo");

    }

    punto.addEventListener("click", ()=>{

        mostrarSlide(i);

        reiniciar();

    });

    indicadores.appendChild(punto);

});

const puntos =
document.querySelectorAll(".indicador");

function mostrarSlide(indice){

    slides.forEach(slide =>
        slide.classList.remove("activo")
    );

    puntos.forEach(p =>
        p.classList.remove("activo")
    );

    if(indice >= slides.length){

        indice = 0;

    }

    if(indice < 0){

        indice = slides.length - 1;

    }

    slideActual = indice;

    slides[slideActual]
    .classList.add("activo");

    puntos[slideActual]
    .classList.add("activo");
}

nextBtn.addEventListener("click", ()=>{

    mostrarSlide(slideActual + 1);

    reiniciar();

});

prevBtn.addEventListener("click", ()=>{

    mostrarSlide(slideActual - 1);

    reiniciar();

});

function reiniciar(){

    clearInterval(intervalo);

    intervalo = setInterval(()=>{

        mostrarSlide(slideActual + 1);

    },2000);

}

reiniciar();