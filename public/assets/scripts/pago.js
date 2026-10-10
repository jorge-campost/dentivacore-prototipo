// REGISTRO DE PAGO (RF27 a RF31; RN09)

const usuario = exigirSesion(["recepcionista"]);
const datos = cargarDatos();

let pacienteElegido = null;

const formPago = document.getElementById("formPago");
const campoPaciente = document.getElementById("pacientePago");
const selectorPresupuesto = document.getElementById("presupuestoPago");
const campoMonto = document.getElementById("montoPago");

function numeroDePresupuesto(presupuesto) {
    return "N.º " + String(presupuesto.numero).padStart(4, "0");
}

// llena el selector con los presupuestos del paciente que todavía tienen saldo
function llenarPresupuestos(idElegido) {
    selectorPresupuesto.innerHTML = "";
    selectorPresupuesto.disabled = true;
    if (pacienteElegido === null) {
        selectorPresupuesto.innerHTML = '<option value="">Elige primero al paciente</option>';
        return;
    }

    const conSaldo = datos.presupuestos.filter(function (presupuesto) {
        return presupuesto.pacienteId === pacienteElegido.id && saldoPresupuesto(presupuesto, datos.pagos) > 0;
    });
    if (conSaldo.length === 0) {
        selectorPresupuesto.innerHTML = '<option value="">Sin presupuestos con saldo</option>';
        return;
    }
    conSaldo.forEach(function (presupuesto) {
        const opcion = document.createElement("option");
        opcion.value = presupuesto.id;
        opcion.textContent = numeroDePresupuesto(presupuesto) + " · saldo " +
            formatearSoles(saldoPresupuesto(presupuesto, datos.pagos));
        if (presupuesto.id === idElegido) {
            opcion.selected = true;
        }
        selectorPresupuesto.appendChild(opcion);
    });
    selectorPresupuesto.disabled = false;
}

// RF29: resumen de cuenta con el total, lo pagado y el saldo, más los pagos anteriores
function mostrarResumen(presupuesto) {
    const pagosAnteriores = document.getElementById("pagosAnteriores");
    if (presupuesto === null) {
        document.getElementById("resumenTotal").textContent = "—";
        document.getElementById("resumenPagado").textContent = "—";
        document.getElementById("resumenSaldo").textContent = "—";
        document.getElementById("ayudaMonto").textContent = "";
        pagosAnteriores.innerHTML = '<p class="secundario">Elige un presupuesto para ver sus pagos.</p>';
        return;
    }

    const saldo = saldoPresupuesto(presupuesto, datos.pagos);
    document.getElementById("resumenTotal").textContent = formatearSoles(totalPresupuesto(presupuesto.detalle));
    document.getElementById("resumenPagado").textContent = formatearSoles(pagadoPresupuesto(presupuesto, datos.pagos));
    document.getElementById("resumenSaldo").textContent = formatearSoles(saldo);
    if (saldo > 0) {
        document.getElementById("ayudaMonto").textContent =
            "El monto no puede superar el saldo pendiente de " + formatearSoles(saldo) + ".";
    } else {
        document.getElementById("ayudaMonto").textContent = "Este presupuesto ya está pagado.";
    }

    // RF31: los pagos se listan sin ninguna acción para eliminarlos
    pagosAnteriores.innerHTML = "";
    datos.pagos.forEach(function (pago) {
        if (pago.presupuestoId === presupuesto.id) {
            const registrador = buscarPorId(datos.usuarios, pago.usuarioId);
            const fila = document.createElement("div");
            fila.className = "par";
            fila.innerHTML = "<span>" + formatearFecha(pago.fecha) +
                '<br><span class="pequeno secundario">Registró ' + registrador.nombre + "</span></span>" +
                "<strong>" + formatearSoles(pago.monto) + "</strong>";
            pagosAnteriores.appendChild(fila);
        }
    });
    if (pagosAnteriores.children.length === 0) {
        pagosAnteriores.innerHTML = '<p class="secundario">Este presupuesto todavía no tiene pagos.</p>';
    }
}

function presupuestoElegido() {
    return buscarPorId(datos.presupuestos, selectorPresupuesto.value);
}

function elegirPaciente(paciente, idPresupuesto) {
    pacienteElegido = paciente;
    llenarPresupuestos(idPresupuesto);
    mostrarResumen(presupuestoElegido());
}

function limpiarFormulario() {
    formPago.reset();
    limpiarErrores(formPago);
    ocultarAviso("avisoPago");
    document.getElementById("fechaPago").value = hoyTexto();
    document.getElementById("sugerenciasPago").hidden = true;
    elegirPaciente(null, 0);
}

// REGISTRAR PAGO (RF27, RF28 y RF30)
formPago.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarErrores(formPago);
    ocultarAviso("avisoPago");

    const presupuesto = presupuestoElegido();
    const fecha = document.getElementById("fechaPago").value;
    const monto = Number(campoMonto.value.trim().replace(",", "."));
    let formularioValido = true;

    if (pacienteElegido === null) {
        marcarError("pacientePago", "Busca y elige un paciente de la lista.");
        formularioValido = false;
    } else if (presupuesto === null) {
        marcarError("presupuestoPago", "Este paciente no tiene presupuestos con saldo pendiente.");
        formularioValido = false;
    }
    if (fecha === "") {
        marcarError("fechaPago", "Elige la fecha del pago.");
        formularioValido = false;
    } else if (fecha > hoyTexto()) {
        marcarError("fechaPago", "La fecha no puede ser posterior a hoy.");
        formularioValido = false;
    }
    if (campoMonto.value.trim() === "") {
        marcarError("montoPago", "Ingresa el monto del pago.");
        formularioValido = false;
    }
    if (!formularioValido) {
        return;
    }

    // RN09: el pago no puede superar el saldo pendiente
    const saldo = saldoPresupuesto(presupuesto, datos.pagos);
    const mensajeMonto = mensajeMontoPago(monto, saldo);
    if (mensajeMonto !== "") {
        marcarError("montoPago", mensajeMonto);
        if (monto > saldo) {
            mostrarAviso("avisoPago", "error", "El pago supera el saldo",
                "El saldo pendiente del presupuesto " + numeroDePresupuesto(presupuesto) + " es " +
                formatearSoles(saldo) + ". No se registró el pago.");
        }
        return;
    }

    datos.pagos.push({
        id: siguienteId(datos.pagos),
        presupuestoId: presupuesto.id,
        fecha: fecha,
        monto: Math.round(monto * 100) / 100,
        usuarioId: usuario.id
    });
    // RF30: cuando el saldo llega a cero, el presupuesto pasa a Pagado
    presupuesto.estado = estadoPresupuesto(presupuesto, datos.pagos);
    guardarDatos(datos);

    const saldoNuevo = saldoPresupuesto(presupuesto, datos.pagos);
    let texto = "Se registraron " + formatearSoles(monto) + " en el presupuesto " + numeroDePresupuesto(presupuesto) + ". ";
    if (presupuesto.estado === "Pagado") {
        texto = texto + "El saldo llegó a cero y el presupuesto pasó a Pagado.";
    } else {
        texto = texto + "Saldo pendiente: " + formatearSoles(saldoNuevo) + ".";
    }

    campoMonto.value = "";
    llenarPresupuestos(presupuesto.id);
    if (presupuestoElegido() === null) {
        // el presupuesto ya no tiene saldo: se muestra su cuenta en cero
        mostrarResumen(presupuesto);
    } else {
        mostrarResumen(presupuestoElegido());
    }
    mostrarAviso("avisoPago", "exito", "Pago registrado", texto);
});

function iniciarPago() {
    prepararMenu(usuario, "pagos");
    mostrarAvisoDePagina("avisoPagina");
    limpiarFormulario();

    activarBuscadorPaciente("pacientePago", "sugerenciasPago", datos.pacientes, function (paciente) {
        ocultarAviso("avisoPago");
        elegirPaciente(paciente, 0);
    });
    selectorPresupuesto.addEventListener("change", function () {
        ocultarAviso("avisoPago");
        mostrarResumen(presupuestoElegido());
    });
    document.getElementById("botonLimpiarPago").addEventListener("click", limpiarFormulario);

    // pago.html?presupuesto=6 llega con el paciente y el presupuesto ya elegidos
    const presupuestoInicial = buscarPorId(datos.presupuestos, parametroDePagina("presupuesto"));
    if (presupuestoInicial !== null) {
        const paciente = buscarPorId(datos.pacientes, presupuestoInicial.pacienteId);
        campoPaciente.value = nombrePaciente(paciente) + " · " + documentoPaciente(paciente);
        elegirPaciente(paciente, presupuestoInicial.id);
    }
}

if (usuario !== null) {
    iniciarPago();
}
