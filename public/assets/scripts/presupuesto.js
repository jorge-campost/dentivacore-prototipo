// PRESUPUESTO DE TRATAMIENTO (RF23, RF24 y RF25; RN08)

const usuario = exigirSesion(["odontologo"]);
const datos = cargarDatos();
const paciente = buscarPorId(datos.pacientes, parametroDePagina("paciente"));

// líneas del detalle: cada una guarda el tratamiento elegido y la cantidad
let lineas = [];

const formPresupuesto = document.getElementById("formPresupuesto");

// tratamientos activos del catálogo
function tratamientosActivos() {
    return datos.tratamientos.filter(function (tratamiento) {
        return tratamiento.activo;
    });
}

// siguiente número de presupuesto: 42 -> 43
function siguienteNumero() {
    let mayor = 0;
    datos.presupuestos.forEach(function (presupuesto) {
        if (presupuesto.numero > mayor) {
            mayor = presupuesto.numero;
        }
    });
    return mayor + 1;
}

// RF24: arma el detalle copiando el nombre y el precio que el catálogo tiene hoy
function armarDetalle() {
    const detalle = [];
    lineas.forEach(function (linea) {
        const tratamiento = buscarPorId(datos.tratamientos, linea.tratamientoId);
        detalle.push({
            tratamientoId: tratamiento.id,
            nombre: tratamiento.nombre,
            cantidad: linea.cantidad,
            precio: tratamiento.precio
        });
    });
    return detalle;
}

function cantidadValida(cantidad) {
    return Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= 99;
}

// dibuja una fila por cada línea del detalle
function dibujarLineas() {
    const filas = document.getElementById("lineasPresupuesto");
    filas.innerHTML = "";

    lineas.forEach(function (linea, indice) {
        const fila = document.createElement("tr");
        let opciones = "";
        tratamientosActivos().forEach(function (tratamiento) {
            let elegido = "";
            if (tratamiento.id === linea.tratamientoId) {
                elegido = " selected";
            }
            opciones = opciones + '<option value="' + tratamiento.id + '"' + elegido + ">" +
                textoSeguro(tratamiento.nombre) + "</option>";
        });
        fila.innerHTML = '<td data-etiqueta="Tratamiento"><select aria-label="Tratamiento">' + opciones + "</select></td>" +
            '<td data-etiqueta="Cantidad"><input type="number" min="1" max="99" value="' + linea.cantidad + '" aria-label="Cantidad"></td>' +
            '<td class="derecha secundario precio" data-etiqueta="Precio unitario"></td>' +
            '<td class="derecha subtotal" data-etiqueta="Subtotal"></td>' +
            '<td class="derecha"><button type="button" class="boton-texto boton-texto-peligro">Quitar</button></td>';

        fila.querySelector("select").addEventListener("change", function (evento) {
            linea.tratamientoId = Number(evento.target.value);
            actualizarTotales();
        });
        fila.querySelector("input").addEventListener("input", function (evento) {
            linea.cantidad = Number(evento.target.value);
            evento.target.classList.toggle("con-error", !cantidadValida(linea.cantidad));
            actualizarTotales();
        });
        fila.querySelector("button").addEventListener("click", function () {
            lineas.splice(indice, 1);
            dibujarLineas();
        });
        filas.appendChild(fila);
    });

    if (lineas.length === 0) {
        filas.innerHTML = '<tr><td colspan="5" class="secundario">Agrega al menos un tratamiento.</td></tr>';
    }
    actualizarTotales();
}

// RF25: el subtotal y el total se calculan solos y no se editan
function actualizarTotales() {
    const detalle = armarDetalle();
    const filas = document.querySelectorAll("#lineasPresupuesto tr");

    detalle.forEach(function (linea, indice) {
        let subtotal = 0;
        if (cantidadValida(linea.cantidad)) {
            subtotal = linea.cantidad * linea.precio;
        } else {
            linea.cantidad = 0;
        }
        filas[indice].querySelector(".precio").textContent = formatearSoles(linea.precio);
        filas[indice].querySelector(".subtotal").innerHTML = "<strong>" + formatearSoles(subtotal) + "</strong>";
    });

    let resumen = detalle.length + " tratamientos";
    if (detalle.length === 1) {
        resumen = "1 tratamiento";
    }
    document.getElementById("resumenLineas").textContent = resumen;
    document.getElementById("totalPresupuesto").textContent = formatearSoles(totalPresupuesto(detalle));
}

document.getElementById("botonAgregarLinea").addEventListener("click", function () {
    lineas.push({ tratamientoId: tratamientosActivos()[0].id, cantidad: 1 });
    ocultarAviso("avisoPresupuesto");
    dibujarLineas();
});

// EMITIR PRESUPUESTO (RF23)
formPresupuesto.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarErrores(formPresupuesto);
    ocultarAviso("avisoPresupuesto");

    const fecha = document.getElementById("fechaPresupuesto").value;
    let cantidadesValidas = true;

    if (fecha === "") {
        marcarError("fechaPresupuesto", "Elige la fecha del presupuesto.");
        return;
    }
    if (lineas.length === 0) {
        mostrarAviso("avisoPresupuesto", "error", "El presupuesto no tiene tratamientos",
            "Agrega al menos un tratamiento al detalle antes de emitirlo.");
        return;
    }
    lineas.forEach(function (linea) {
        if (!cantidadValida(linea.cantidad)) {
            cantidadesValidas = false;
        }
    });
    if (!cantidadesValidas) {
        mostrarAviso("avisoPresupuesto", "error", "Revisa las cantidades",
            "Cada cantidad debe ser un número entero de 1 a 99.");
        return;
    }

    datos.presupuestos.push({
        id: siguienteId(datos.presupuestos),
        numero: siguienteNumero(),
        pacienteId: paciente.id,
        odontologoId: usuario.id,
        fecha: fecha,
        estado: "Con saldo",
        detalle: armarDetalle()
    });
    guardarDatos(datos);
    window.location.href = "historia.html?paciente=" + paciente.id + "&aviso=presupuesto";
});

function iniciarPresupuesto() {
    prepararMenu(usuario, "atenciones");

    const rutaHistoria = "historia.html?paciente=" + paciente.id;
    document.getElementById("rutaPaciente").textContent = nombrePaciente(paciente);
    document.getElementById("rutaPaciente").href = rutaHistoria;
    document.getElementById("enlaceCancelar").href = rutaHistoria;
    document.getElementById("numeroPresupuesto").textContent = "N.º " + String(siguienteNumero()).padStart(4, "0");
    document.getElementById("pacientePresupuesto").value = nombrePaciente(paciente);
    document.getElementById("odontologoPresupuesto").value = usuario.nombre;
    document.getElementById("fechaPresupuesto").value = hoyTexto();

    lineas.push({ tratamientoId: tratamientosActivos()[0].id, cantidad: 1 });
    dibujarLineas();
}

if (usuario !== null) {
    if (paciente === null) {
        // el presupuesto se emite desde la historia de un paciente
        window.location.href = "historia.html";
    } else {
        iniciarPresupuesto();
    }
}
