// PACIENTES (RF05 a RF09 y RF26; RN01 y RN05)

const PACIENTES_POR_PAGINA = 8;

const usuario = exigirSesion(["recepcionista", "odontologo"]);
const datos = cargarDatos();

let paginaActual = 1;
let pacienteDeLaFicha = null;

const campoBuscar = document.getElementById("buscarPaciente");
const formPaciente = document.getElementById("formPaciente");
const formContacto = document.getElementById("formContacto");
const botonGuardarPaciente = document.getElementById("botonGuardarPaciente");

// pacientes que coinciden con la búsqueda, en el orden en que se registraron
function pacientesFiltrados() {
    return filtrarPacientes(datos.pacientes, campoBuscar.value);
}

// LISTA con búsqueda (RF07) y paginación (RF08)
function dibujarPacientes() {
    const lista = pacientesFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(lista.length / PACIENTES_POR_PAGINA));
    if (paginaActual > totalPaginas) {
        paginaActual = totalPaginas;
    }
    const primero = (paginaActual - 1) * PACIENTES_POR_PAGINA;
    const pagina = lista.slice(primero, primero + PACIENTES_POR_PAGINA);
    const filas = document.getElementById("filasPacientes");

    filas.innerHTML = "";
    pagina.forEach(function (paciente) {
        const fila = document.createElement("tr");
        fila.innerHTML = '<td data-etiqueta="Paciente">' + textoSeguro(nombrePaciente(paciente)) + "</td>" +
            '<td data-etiqueta="Documento">' + textoSeguro(documentoPaciente(paciente)) + "</td>" +
            '<td data-etiqueta="Teléfono">' + textoSeguro(paciente.telefono) + "</td>" +
            '<td class="derecha"><button type="button" class="boton-texto">Ver ficha</button></td>';
        fila.querySelector("button").addEventListener("click", function () {
            abrirFicha(paciente);
        });
        filas.appendChild(fila);
    });

    document.getElementById("sinPacientes").hidden = lista.length > 0;
    document.getElementById("totalPacientes").textContent = datos.pacientes.length + " pacientes registrados";
    if (lista.length === 0) {
        document.getElementById("resumenPaginas").textContent = "Sin resultados";
    } else {
        document.getElementById("resumenPaginas").textContent = "Mostrando " + (primero + 1) + " a " +
            (primero + pagina.length) + " de " + lista.length + " pacientes";
    }
    document.getElementById("paginaActual").textContent = paginaActual + " de " + totalPaginas;
    document.getElementById("paginaAnterior").disabled = paginaActual === 1;
    document.getElementById("paginaSiguiente").disabled = paginaActual === totalPaginas;
}

// NUEVO PACIENTE (RF05 y RF06)
function abrirNuevoPaciente() {
    formPaciente.reset();
    limpiarErrores(formPaciente);
    ocultarAviso("avisoPaciente");
    botonGuardarPaciente.disabled = false;
    abrirVentana("ventanaPaciente");
    document.getElementById("numeroDocumento").focus();
}

// RN01: mientras se escribe el documento, avisa si ya tiene una ficha y bloquea el guardado
function revisarDocumentoDuplicado() {
    const tipoDocumento = document.getElementById("tipoDocumento").value;
    const campoNumero = document.getElementById("numeroDocumento");
    const existente = pacienteConDocumento(datos.pacientes, tipoDocumento, campoNumero.value);

    campoNumero.classList.remove("con-error");
    document.getElementById("errorNumeroDocumento").textContent = "";
    if (campoNumero.value.trim() === "" || existente === null) {
        ocultarAviso("avisoPaciente");
        botonGuardarPaciente.disabled = false;
        return null;
    }

    campoNumero.classList.add("con-error");
    botonGuardarPaciente.disabled = true;
    mostrarAviso("avisoPaciente", "advertencia", "Este documento ya tiene una ficha",
        textoSeguro(nombrePaciente(existente)) + " · " + textoSeguro(documentoPaciente(existente)) +
        '. No se crea otra ficha. <button type="button" id="botonVerExistente" class="boton-texto">Ver ficha</button>');
    document.getElementById("botonVerExistente").addEventListener("click", function () {
        cerrarVentana("ventanaPaciente");
        abrirFicha(existente);
    });
    return existente;
}

formPaciente.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarErrores(formPaciente);

    const tipoDocumento = document.getElementById("tipoDocumento").value;
    const numeroDocumento = document.getElementById("numeroDocumento").value.trim().toUpperCase();
    const nombres = document.getElementById("nombres").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const correo = document.getElementById("correo").value.trim();
    let formularioValido = true;

    // el duplicado se revisa otra vez al guardar: la regla no depende solo del aviso
    if (revisarDocumentoDuplicado() !== null) {
        return;
    }
    const mensajeDocumento = mensajeFormatoDocumento(tipoDocumento, numeroDocumento);
    if (mensajeDocumento !== "") {
        marcarError("numeroDocumento", mensajeDocumento);
        formularioValido = false;
    }
    if (nombres === "") {
        marcarError("nombres", "Ingresa los nombres del paciente.");
        formularioValido = false;
    }
    if (apellidos === "") {
        marcarError("apellidos", "Ingresa los apellidos del paciente.");
        formularioValido = false;
    }
    if (mensajeTelefono(telefono) !== "") {
        marcarError("telefono", mensajeTelefono(telefono));
        formularioValido = false;
    }
    if (mensajeCorreo(correo) !== "") {
        marcarError("correo", mensajeCorreo(correo));
        formularioValido = false;
    }
    if (!formularioValido) {
        return;
    }

    const paciente = {
        id: siguienteId(datos.pacientes),
        tipoDocumento: tipoDocumento,
        numeroDocumento: numeroDocumento,
        nombres: nombres,
        apellidos: apellidos,
        telefono: telefono,
        correo: correo,
        antecedentes: { alergias: "", enfermedades: "", medicacion: "" }
    };
    datos.pacientes.push(paciente);
    guardarDatos(datos);

    cerrarVentana("ventanaPaciente");
    campoBuscar.value = numeroDocumento;
    paginaActual = 1;
    dibujarPacientes();
    mostrarAviso("avisoPacientes", "exito", "Paciente registrado",
        textoSeguro(nombrePaciente(paciente)) + " ya tiene su ficha. " +
        '<a href="agenda.html?paciente=' + paciente.id + '">Agendar una cita para este paciente</a>');
});

// FICHA del paciente: datos de contacto (RF09) y presupuestos con su saldo (RF26)
function abrirFicha(paciente) {
    pacienteDeLaFicha = paciente;
    limpiarErrores(formContacto);
    ocultarAviso("avisoFicha");

    document.getElementById("fichaNombre").textContent = nombrePaciente(paciente);
    document.getElementById("fichaDocumento").textContent = documentoPaciente(paciente);
    document.getElementById("fichaTelefono").value = paciente.telefono;
    document.getElementById("fichaCorreo").value = paciente.correo;

    // RF09: solo la recepcionista actualiza los datos de contacto
    const puedeEditar = usuario.rol === "recepcionista";
    document.getElementById("fichaTelefono").disabled = !puedeEditar;
    document.getElementById("fichaCorreo").disabled = !puedeEditar;
    document.getElementById("botonGuardarContacto").hidden = !puedeEditar;

    // RN05: la historia clínica solo se ofrece al odontólogo
    const enlaceHistoria = document.getElementById("enlaceHistoria");
    enlaceHistoria.hidden = !puedeVerHistoria(usuario.rol);
    enlaceHistoria.href = "historia.html?paciente=" + paciente.id;

    dibujarPresupuestosFicha(paciente);
    abrirVentana("ventanaFicha");
}

function dibujarPresupuestosFicha(paciente) {
    const filas = document.getElementById("fichaPresupuestos");
    const lista = datos.presupuestos.filter(function (presupuesto) {
        return presupuesto.pacienteId === paciente.id;
    });

    filas.innerHTML = "";
    lista.forEach(function (presupuesto) {
        const saldo = saldoPresupuesto(presupuesto, datos.pagos);
        const fila = document.createElement("tr");
        let accion = "";
        if (usuario.rol === "recepcionista" && saldo > 0) {
            accion = '<a href="pago.html?presupuesto=' + presupuesto.id + '">Registrar pago</a>';
        }
        fila.innerHTML = '<td data-etiqueta="N.º">' + String(presupuesto.numero).padStart(4, "0") + "</td>" +
            '<td class="derecha" data-etiqueta="Total">' + formatearSoles(totalPresupuesto(presupuesto.detalle)) + "</td>" +
            '<td class="derecha" data-etiqueta="Saldo">' + formatearSoles(saldo) + "</td>" +
            '<td data-etiqueta="Estado">' + etiquetaEstado(estadoPresupuesto(presupuesto, datos.pagos)) + "</td>" +
            '<td class="derecha">' + accion + "</td>";
        filas.appendChild(fila);
    });
    document.getElementById("fichaSinPresupuestos").hidden = lista.length > 0;
}

formContacto.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarErrores(formContacto);
    ocultarAviso("avisoFicha");

    const telefono = document.getElementById("fichaTelefono").value.trim();
    const correo = document.getElementById("fichaCorreo").value.trim();
    let formularioValido = true;

    if (mensajeTelefono(telefono) !== "") {
        marcarError("fichaTelefono", mensajeTelefono(telefono));
        formularioValido = false;
    }
    if (mensajeCorreo(correo) !== "") {
        marcarError("fichaCorreo", mensajeCorreo(correo));
        formularioValido = false;
    }
    if (!formularioValido) {
        return;
    }

    pacienteDeLaFicha.telefono = telefono;
    pacienteDeLaFicha.correo = correo;
    guardarDatos(datos);
    dibujarPacientes();
    mostrarAviso("avisoFicha", "exito", "Contacto actualizado",
        "Los datos de contacto de " + textoSeguro(nombrePaciente(pacienteDeLaFicha)) + " se guardaron.");
});

function iniciarPacientes() {
    prepararMenu(usuario, "pacientes");
    mostrarAvisoDePagina("avisoPacientes");

    campoBuscar.addEventListener("input", function () {
        paginaActual = 1;
        dibujarPacientes();
    });
    document.getElementById("paginaAnterior").addEventListener("click", function () {
        paginaActual = paginaActual - 1;
        dibujarPacientes();
    });
    document.getElementById("paginaSiguiente").addEventListener("click", function () {
        paginaActual = paginaActual + 1;
        dibujarPacientes();
    });
    document.getElementById("tipoDocumento").addEventListener("change", revisarDocumentoDuplicado);
    document.getElementById("numeroDocumento").addEventListener("input", revisarDocumentoDuplicado);

    // RF05: solo la recepcionista registra pacientes
    const botonNuevoPaciente = document.getElementById("botonNuevoPaciente");
    if (usuario.rol === "recepcionista") {
        botonNuevoPaciente.addEventListener("click", abrirNuevoPaciente);
    } else {
        botonNuevoPaciente.hidden = true;
    }

    dibujarPacientes();

    // pacientes.html?nuevo=1 abre el registro; pacientes.html?ficha=2 abre la ficha de ese paciente
    const pacienteInicial = buscarPorId(datos.pacientes, parametroDePagina("ficha"));
    if (parametroDePagina("nuevo") === "1" && usuario.rol === "recepcionista") {
        abrirNuevoPaciente();
    } else if (pacienteInicial !== null) {
        abrirFicha(pacienteInicial);
    }
}

if (usuario !== null) {
    iniciarPacientes();
}
