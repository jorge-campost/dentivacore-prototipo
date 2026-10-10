// HISTORIA CLÍNICA (RF17 a RF21 y RF26; RN05, RN06 y RN07)

// RN05: solo el odontólogo entra a esta pantalla
const usuario = exigirSesion(["odontologo"]);
const datos = cargarDatos();
const paciente = buscarPorId(datos.pacientes, parametroDePagina("paciente"));

let atencionDeLaNota = null;

const formAtencion = document.getElementById("formAtencion");
const formNota = document.getElementById("formNota");
const formAntecedentes = document.getElementById("formAntecedentes");

// ordena de la atención más reciente a la más antigua
function ordenarPorFecha(atenciones) {
    atenciones.sort(function (a, b) {
        if (a.fecha === b.fecha) {
            return b.id - a.id;
        }
        return b.fecha.localeCompare(a.fecha);
    });
    return atenciones;
}

// SIN PACIENTE ELEGIDO: buscador y atenciones recientes del odontólogo
function mostrarSeleccion() {
    document.getElementById("seleccionPaciente").hidden = false;

    activarBuscadorPaciente("pacienteHistoria", "sugerenciasHistoria", datos.pacientes, function (elegido) {
        if (elegido !== null) {
            window.location.href = "historia.html?paciente=" + elegido.id;
        }
    });

    const propias = datos.atenciones.filter(function (atencion) {
        return atencion.odontologoId === usuario.id;
    });
    const filas = document.getElementById("filasRecientes");
    ordenarPorFecha(propias).slice(0, 8).forEach(function (atencion) {
        const atendido = buscarPorId(datos.pacientes, atencion.pacienteId);
        const fila = document.createElement("tr");
        fila.innerHTML = '<td data-etiqueta="Fecha">' + formatearFecha(atencion.fecha) + "</td>" +
            '<td data-etiqueta="Paciente">' + textoSeguro(nombrePaciente(atendido)) + "</td>" +
            '<td data-etiqueta="Pieza">' + textoSeguro(atencion.pieza) + "</td>" +
            '<td data-etiqueta="Diagnóstico">' + textoSeguro(atencion.diagnostico) + "</td>" +
            '<td class="derecha"><a href="historia.html?paciente=' + atendido.id + '">Abrir historia</a></td>';
        filas.appendChild(fila);
    });
    document.getElementById("sinRecientes").hidden = propias.length > 0;
}

// RNF07: cada consulta de la historia queda registrada con usuario, fecha y hora
function registrarConsulta() {
    const ahora = new Date();
    const hora = String(ahora.getHours()).padStart(2, "0") + ":" + String(ahora.getMinutes()).padStart(2, "0");
    datos.consultasHistoria.push({ pacienteId: paciente.id, usuarioId: usuario.id, fecha: hoyTexto(), hora: hora });
    guardarDatos(datos);

    const consultas = datos.consultasHistoria.filter(function (consulta) {
        return consulta.pacienteId === paciente.id;
    });
    document.getElementById("textoConsultas").textContent =
        "Cada consulta de esta historia queda registrada con usuario y fecha. Esta es la consulta n.º " +
        consultas.length + ": " + usuario.nombre + ", " + formatearFecha(hoyTexto()) + " a las " + hora + ".";
}

function dibujarDatos() {
    let correo = paciente.correo;
    if (correo === "") {
        correo = "No registra";
    }
    document.getElementById("rutaPaciente").textContent = nombrePaciente(paciente);
    document.getElementById("nombrePaciente").textContent = nombrePaciente(paciente);
    document.getElementById("datosPaciente").textContent = documentoPaciente(paciente) + " · " + paciente.telefono;
    document.getElementById("enlaceNuevoPresupuesto").href = "presupuesto.html?paciente=" + paciente.id;
    document.getElementById("listaDatos").innerHTML =
        "<dt>Documento</dt><dd>" + textoSeguro(documentoPaciente(paciente)) + "</dd>" +
        "<dt>Teléfono</dt><dd>" + textoSeguro(paciente.telefono) + "</dd>" +
        "<dt>Correo</dt><dd>" + textoSeguro(correo) + "</dd>";
}

// ANTECEDENTES (RF17)
function textoAntecedente(texto) {
    if (texto === "") {
        return "No registra";
    }
    return textoSeguro(texto);
}

function dibujarAntecedentes() {
    const antecedentes = paciente.antecedentes;
    document.getElementById("listaAntecedentes").innerHTML =
        "<dt>Alergias</dt><dd>" + textoAntecedente(antecedentes.alergias) + "</dd>" +
        "<dt>Enfermedades</dt><dd>" + textoAntecedente(antecedentes.enfermedades) + "</dd>" +
        "<dt>Medicación actual</dt><dd>" + textoAntecedente(antecedentes.medicacion) + "</dd>";
}

formAntecedentes.addEventListener("submit", function (evento) {
    evento.preventDefault();
    paciente.antecedentes = {
        alergias: document.getElementById("alergias").value.trim(),
        enfermedades: document.getElementById("enfermedades").value.trim(),
        medicacion: document.getElementById("medicacion").value.trim()
    };
    guardarDatos(datos);
    cerrarVentana("ventanaAntecedentes");
    dibujarAntecedentes();
    mostrarAviso("avisoHistoria", "exito", "Antecedentes guardados",
        "Los antecedentes de " + textoSeguro(nombrePaciente(paciente)) + " se actualizaron.");
});

// ATENCIONES en orden cronológico (RF20), sin acciones para editar ni eliminar (RF21)
function dibujarAtenciones() {
    const lista = document.getElementById("listaAtenciones");
    const atenciones = datos.atenciones.filter(function (atencion) {
        return atencion.pacienteId === paciente.id;
    });

    lista.innerHTML = "";
    ordenarPorFecha(atenciones).forEach(function (atencion) {
        const odontologo = buscarPorId(datos.usuarios, atencion.odontologoId);
        let indicaciones = atencion.indicaciones;
        if (indicaciones === "") {
            indicaciones = "Sin indicaciones";
        }

        const bloque = document.createElement("article");
        bloque.className = "atencion";
        let codigo = '<div class="fila-separada"><div class="fila">' +
            "<strong>" + formatearFecha(atencion.fecha) + "</strong>" +
            '<span class="etiqueta">Pieza ' + textoSeguro(atencion.pieza) + "</span>" +
            '<span class="secundario">' + odontologo.nombre + "</span></div>" +
            '<button type="button" class="boton-texto">Agregar nota aclaratoria</button></div>' +
            '<div class="atencion-datos">' +
            '<dl class="dato"><dt>Diagnóstico</dt><dd>' + textoSeguro(atencion.diagnostico) + "</dd></dl>" +
            '<dl class="dato"><dt>Procedimiento</dt><dd>' + textoSeguro(atencion.procedimiento) + "</dd></dl>" +
            '<dl class="dato"><dt>Indicaciones</dt><dd>' + textoSeguro(indicaciones) + "</dd></dl></div>";
        // RN06: las notas aclaratorias se muestran debajo, con su fecha y su usuario
        atencion.notas.forEach(function (nota) {
            const autor = buscarPorId(datos.usuarios, nota.usuarioId);
            codigo = codigo + '<p class="nota">Nota aclaratoria · ' + formatearFecha(nota.fecha) + " · " +
                autor.nombre + ": " + textoSeguro(nota.texto) + "</p>";
        });
        bloque.innerHTML = codigo;
        bloque.querySelector("button").addEventListener("click", function () {
            abrirNota(atencion);
        });
        lista.appendChild(bloque);
    });
    document.getElementById("sinAtenciones").hidden = atenciones.length > 0;
}

// REGISTRAR ATENCIÓN (RF18 y RF19)
formAtencion.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarErrores(formAtencion);
    ocultarAviso("avisoHistoria");

    const fecha = document.getElementById("fechaAtencion").value;
    const pieza = document.getElementById("piezaAtencion").value.trim();
    const diagnostico = document.getElementById("diagnosticoAtencion").value.trim();
    const procedimiento = document.getElementById("procedimientoAtencion").value.trim();
    const indicaciones = document.getElementById("indicacionesAtencion").value.trim();
    let formularioValido = true;

    if (fecha === "") {
        marcarError("fechaAtencion", "Elige la fecha de la atención.");
        formularioValido = false;
    } else if (fecha > hoyTexto()) {
        marcarError("fechaAtencion", "La fecha no puede ser posterior a hoy.");
        formularioValido = false;
    }
    // RN07: la pieza debe existir en la numeración FDI
    if (pieza === "") {
        marcarError("piezaAtencion", "Ingresa la pieza dental.");
        formularioValido = false;
    } else if (!piezaValida(pieza)) {
        marcarError("piezaAtencion", "La pieza " + pieza + " no existe en la numeración FDI. " +
            "Usa de 11 a 48 en dientes permanentes o de 51 a 85 en temporales.");
        formularioValido = false;
    }
    if (diagnostico === "") {
        marcarError("diagnosticoAtencion", "Escribe el diagnóstico.");
        formularioValido = false;
    }
    if (procedimiento === "") {
        marcarError("procedimientoAtencion", "Escribe el procedimiento realizado.");
        formularioValido = false;
    }
    if (!formularioValido) {
        return;
    }

    datos.atenciones.push({
        id: siguienteId(datos.atenciones),
        pacienteId: paciente.id,
        odontologoId: usuario.id,
        fecha: fecha,
        pieza: pieza,
        diagnostico: diagnostico,
        procedimiento: procedimiento,
        indicaciones: indicaciones,
        notas: []
    });
    guardarDatos(datos);

    formAtencion.reset();
    document.getElementById("fechaAtencion").value = hoyTexto();
    dibujarAtenciones();
    mostrarAviso("avisoHistoria", "exito", "Atención registrada",
        "La atención de la pieza " + pieza + " quedó en la historia de " + textoSeguro(nombrePaciente(paciente)) + ".");
});

// NOTA ACLARATORIA (RF21): la atención original no cambia
function abrirNota(atencion) {
    atencionDeLaNota = atencion;
    formNota.reset();
    limpiarErrores(formNota);
    document.getElementById("resumenNota").textContent = "Atención del " + formatearFecha(atencion.fecha) +
        " · Pieza " + atencion.pieza + " · " + atencion.diagnostico;
    abrirVentana("ventanaNota");
    document.getElementById("textoNota").focus();
}

formNota.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarErrores(formNota);

    const texto = document.getElementById("textoNota").value.trim();
    if (texto === "") {
        marcarError("textoNota", "Escribe la aclaración.");
        return;
    }

    atencionDeLaNota.notas.push(crearNotaAclaratoria(texto, usuario.id, hoyTexto()));
    guardarDatos(datos);
    cerrarVentana("ventanaNota");
    dibujarAtenciones();
    mostrarAviso("avisoHistoria", "exito", "Nota aclaratoria agregada",
        "La nota quedó debajo de la atención del " + formatearFecha(atencionDeLaNota.fecha) + ", con tu usuario y la fecha de hoy.");
});

// PRESUPUESTOS del paciente con su total, sus pagos y su estado (RF26)
function dibujarPresupuestos() {
    const filas = document.getElementById("filasPresupuestos");
    const lista = datos.presupuestos.filter(function (presupuesto) {
        return presupuesto.pacienteId === paciente.id;
    });

    filas.innerHTML = "";
    lista.forEach(function (presupuesto) {
        const fila = document.createElement("tr");
        fila.innerHTML = '<td data-etiqueta="N.º">' + String(presupuesto.numero).padStart(4, "0") + "</td>" +
            '<td data-etiqueta="Fecha">' + formatearFecha(presupuesto.fecha) + "</td>" +
            '<td class="derecha" data-etiqueta="Total">' + formatearSoles(totalPresupuesto(presupuesto.detalle)) + "</td>" +
            '<td class="derecha" data-etiqueta="Pagado">' + formatearSoles(pagadoPresupuesto(presupuesto, datos.pagos)) + "</td>" +
            '<td class="derecha" data-etiqueta="Saldo">' + formatearSoles(saldoPresupuesto(presupuesto, datos.pagos)) + "</td>" +
            '<td data-etiqueta="Estado">' + etiquetaEstado(estadoPresupuesto(presupuesto, datos.pagos)) + "</td>";
        filas.appendChild(fila);
    });
    document.getElementById("sinPresupuestos").hidden = lista.length > 0;
}

// PESTAÑAS: datos del paciente, historia clínica y presupuestos
function mostrarPestana(idPestana) {
    const botones = document.querySelectorAll(".pestanas button");
    botones.forEach(function (boton) {
        const elegida = boton.dataset.pestana === idPestana;
        boton.classList.toggle("activo", elegida);
        document.getElementById(boton.dataset.pestana).hidden = !elegida;
    });
}

function mostrarHistoria() {
    document.getElementById("historiaPaciente").hidden = false;
    document.title = "Historia de " + nombrePaciente(paciente) + " - DentivaCore";

    registrarConsulta();
    dibujarDatos();
    dibujarAntecedentes();
    dibujarAtenciones();
    dibujarPresupuestos();
    document.getElementById("fechaAtencion").value = hoyTexto();

    const botones = document.querySelectorAll(".pestanas button");
    botones.forEach(function (boton) {
        boton.addEventListener("click", function () {
            mostrarPestana(boton.dataset.pestana);
        });
    });

    document.getElementById("botonEditarAntecedentes").addEventListener("click", function () {
        document.getElementById("alergias").value = paciente.antecedentes.alergias;
        document.getElementById("enfermedades").value = paciente.antecedentes.enfermedades;
        document.getElementById("medicacion").value = paciente.antecedentes.medicacion;
        abrirVentana("ventanaAntecedentes");
    });

    // al volver de emitir un presupuesto se muestra la pestaña de presupuestos
    if (parametroDePagina("aviso") === "presupuesto") {
        mostrarPestana("pestanaPresupuestos");
        mostrarAviso("avisoHistoria", "exito", "Presupuesto emitido",
            "El presupuesto quedó registrado con los precios del catálogo a la fecha de emisión.");
    }
}

function iniciarHistoria() {
    prepararMenu(usuario, "atenciones");
    if (paciente === null) {
        mostrarSeleccion();
    } else {
        mostrarHistoria();
    }
}

if (usuario !== null) {
    iniciarHistoria();
}
