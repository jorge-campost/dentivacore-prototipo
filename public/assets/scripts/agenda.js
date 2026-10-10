// AGENDA DE CITAS (RF10 a RF16; RN02, RN03 y RN04)

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ALTO_HORA = 60; // píxeles que ocupa una hora en la vista de semana

const usuario = exigirSesion(["recepcionista", "odontologo"]);
const datos = cargarDatos();
const consultaCelular = window.matchMedia("(max-width: 768px)");

let fechaActual = hoyTexto();
let vista = "semana";
let idCitaElegida = null;
let pacienteElegido = null;

const filtroOdontologo = document.getElementById("filtroOdontologo");
const formCita = document.getElementById("formCita");

// la agenda no muestra el domingo: si hoy es domingo, empieza en el lunes
function evitarDomingo(fecha, paso) {
    if (textoAFecha(fecha).getDay() === 0) {
        return sumarDias(fecha, paso);
    }
    return fecha;
}

// lunes de la semana de una fecha
function lunesDeLaSemana(fecha) {
    const dia = textoAFecha(fecha).getDay();
    return sumarDias(fecha, 1 - dia);
}

// en celular siempre se muestra la lista del día
function vistaEnPantalla() {
    if (consultaCelular.matches) {
        return "dia";
    }
    return vista;
}

function horaFinCita(cita) {
    return minutosAHora(horaAMinutos(cita.hora) + cita.duracion);
}

// citas de una fecha, según el odontólogo elegido en el filtro, ordenadas por hora
function citasDelDia(fecha) {
    const odontologoId = Number(filtroOdontologo.value);
    const lista = datos.citas.filter(function (cita) {
        return cita.fecha === fecha && (odontologoId === 0 || cita.odontologoId === odontologoId);
    });
    lista.sort(function (a, b) {
        return horaAMinutos(a.hora) - horaAMinutos(b.hora);
    });
    return lista;
}

// reparte en carriles las citas que coinciden en el tiempo, para dibujarlas una al lado de otra
function repartirCarriles(citasDia) {
    const posiciones = [];
    let grupo = [];
    let finCarriles = [];
    let finGrupo = 0;
    citasDia.forEach(function (cita) {
        const inicio = horaAMinutos(cita.hora);
        const fin = inicio + cita.duracion;
        if (inicio >= finGrupo) {
            grupo = [];
            finCarriles = [];
        }
        let carril = 0;
        while (carril < finCarriles.length && finCarriles[carril] > inicio) {
            carril = carril + 1;
        }
        finCarriles[carril] = fin;
        const posicion = { cita: cita, carril: carril, grupo: grupo };
        grupo.push(posicion);
        posiciones.push(posicion);
        if (fin > finGrupo) {
            finGrupo = fin;
        }
    });
    return posiciones;
}

function carrilesDelGrupo(grupo) {
    let mayor = 0;
    grupo.forEach(function (posicion) {
        if (posicion.carril > mayor) {
            mayor = posicion.carril;
        }
    });
    return mayor + 1;
}

// VISTA DE SEMANA: una columna por día y una fila por hora del horario de atención
function dibujarSemana() {
    const cabecera = document.getElementById("agendaCabecera");
    const cuerpo = document.getElementById("agendaCuerpo");
    const inicioHorario = horaAMinutos(datos.horario.horaInicio);
    const finHorario = horaAMinutos(datos.horario.horaFin);
    const lunes = lunesDeLaSemana(fechaActual);

    cabecera.innerHTML = "<div>Hora</div>";
    cuerpo.innerHTML = "";

    const horas = document.createElement("div");
    horas.id = "agendaHoras";
    for (let minutos = inicioHorario; minutos < finHorario; minutos = minutos + 60) {
        const fila = document.createElement("div");
        fila.textContent = minutosAHora(minutos);
        horas.appendChild(fila);
    }
    cuerpo.appendChild(horas);

    for (let numero = 0; numero < 6; numero = numero + 1) {
        const fecha = sumarDias(lunes, numero);
        const dia = textoAFecha(fecha);

        const titulo = document.createElement("div");
        titulo.textContent = DIAS_CORTOS[dia.getDay()] + " " + dia.getDate();
        if (fecha === hoyTexto()) {
            titulo.textContent = titulo.textContent + " · Hoy";
            titulo.className = "hoy";
        }
        cabecera.appendChild(titulo);

        const columna = document.createElement("div");
        columna.className = "agenda-dia";
        columna.style.height = ((finHorario - inicioHorario) / 60 * ALTO_HORA) + "px";

        repartirCarriles(citasDelDia(fecha)).forEach(function (posicion) {
            const cita = posicion.cita;
            const carriles = carrilesDelGrupo(posicion.grupo);
            const paciente = buscarPorId(datos.pacientes, cita.pacienteId);
            const odontologo = buscarPorId(datos.usuarios, cita.odontologoId);

            const bloque = document.createElement("button");
            bloque.type = "button";
            bloque.className = "cita " + claseEstado("cita", cita.estado);
            if (cita.id === idCitaElegida) {
                bloque.classList.add("seleccionada");
            }
            bloque.style.top = ((horaAMinutos(cita.hora) - inicioHorario) / 60 * ALTO_HORA + 2) + "px";
            bloque.style.height = (cita.duracion / 60 * ALTO_HORA - 5) + "px";
            bloque.style.left = "calc(" + (posicion.carril * 100 / carriles) + "% + 3px)";
            bloque.style.width = "calc(" + (100 / carriles) + "% - 6px)";
            bloque.title = cita.hora + " a " + horaFinCita(cita) + " · " + nombrePaciente(paciente);
            bloque.innerHTML = "<strong>" + textoSeguro(nombreBreve(paciente)) + "</strong>" +
                '<span class="odontologo">' + nombreCorto(odontologo.nombre) + "</span>" +
                '<span class="estado">' + cita.estado + "</span>";
            bloque.addEventListener("click", function () {
                elegirCita(cita.id);
            });
            columna.appendChild(bloque);
        });
        cuerpo.appendChild(columna);
    }
}

// VISTA DE DÍA: tira de días y lista de horas, con las horas libres
function dibujarDia() {
    const tira = document.getElementById("diasSemana");
    const lista = document.getElementById("listaDia");
    const inicioHorario = horaAMinutos(datos.horario.horaInicio);
    const finHorario = horaAMinutos(datos.horario.horaFin);
    const lunes = lunesDeLaSemana(fechaActual);
    const citasDia = citasDelDia(fechaActual);
    const fechaPasada = fechaActual < hoyTexto();
    const ahora = new Date();
    let minutosAhora = -1;
    if (fechaActual === hoyTexto()) {
        minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    }
    let libres = 0;

    tira.innerHTML = "";
    for (let numero = 0; numero < 6; numero = numero + 1) {
        const fecha = sumarDias(lunes, numero);
        const dia = textoAFecha(fecha);
        const boton = document.createElement("button");
        boton.type = "button";
        boton.innerHTML = "<span>" + DIAS_CORTOS[dia.getDay()] + "</span>" + dia.getDate();
        if (fecha === fechaActual) {
            boton.className = "activo";
        }
        boton.addEventListener("click", function () {
            fechaActual = fecha;
            idCitaElegida = null;
            dibujarAgenda();
        });
        tira.appendChild(boton);
    }

    lista.innerHTML = "";
    for (let minutos = inicioHorario; minutos < finHorario; minutos = minutos + 60) {
        const fila = document.createElement("div");
        fila.className = "hora-dia";
        fila.innerHTML = "<span>" + minutosAHora(minutos) + "</span>";
        const contenido = document.createElement("div");
        let horaOcupada = false;

        citasDia.forEach(function (cita) {
            const inicio = horaAMinutos(cita.hora);
            const fin = inicio + cita.duracion;
            // la hora está ocupada si una cita activa la toca
            if (citaOcupaHorario(cita) && inicio < minutos + 60 && fin > minutos) {
                horaOcupada = true;
            }
            // la cita se dibuja en la hora en que empieza
            if (inicio >= minutos && inicio < minutos + 60) {
                contenido.appendChild(crearCitaDia(cita));
            }
        });

        // una hora libre se ofrece solo si todavía no empezó
        if (!horaOcupada && !fechaPasada && minutos > minutosAhora) {
            libres = libres + 1;
            contenido.appendChild(crearHoraLibre(minutosAHora(minutos)));
        }
        if (contenido.children.length > 0) {
            fila.appendChild(contenido);
            lista.appendChild(fila);
        }
    }
    if (lista.children.length === 0) {
        lista.innerHTML = '<p class="tabla-vacia">No hubo citas ese día.</p>';
    }

    let resumen = citasDia.length + " citas";
    if (citasDia.length === 1) {
        resumen = "1 cita";
    }
    if (!fechaPasada) {
        resumen = resumen + " · " + libres + " horas libres";
    }
    document.getElementById("resumenDia").textContent = resumen;
}

function crearCitaDia(cita) {
    const paciente = buscarPorId(datos.pacientes, cita.pacienteId);
    const odontologo = buscarPorId(datos.usuarios, cita.odontologoId);
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "cita-dia";
    if (cita.id === idCitaElegida) {
        boton.classList.add("seleccionada");
    }
    boton.innerHTML = '<div class="fila-separada"><strong>' + textoSeguro(nombrePaciente(paciente)) + "</strong>" +
        etiquetaEstado(cita.estado) + "</div>" +
        '<span class="secundario">' + cita.hora + " – " + horaFinCita(cita) + " · " + odontologo.nombre + "</span>";
    boton.addEventListener("click", function () {
        elegirCita(cita.id);
        if (consultaCelular.matches) {
            document.getElementById("panelCita").scrollIntoView({ behavior: "smooth" });
        }
    });
    return boton;
}

// una hora libre se puede tocar para agendar (solo la recepcionista agenda)
function crearHoraLibre(hora) {
    if (usuario.rol !== "recepcionista") {
        const texto = document.createElement("span");
        texto.className = "libre";
        texto.textContent = "Libre";
        return texto;
    }
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "libre";
    boton.textContent = "Libre · tocar para agendar";
    boton.addEventListener("click", function () {
        abrirNuevaCita(fechaActual, hora);
    });
    return boton;
}

// título del periodo: "5 – 10 de octubre de 2026" o "Viernes 9 de octubre de 2026"
function tituloDelPeriodo() {
    if (vistaEnPantalla() === "dia") {
        const dia = textoAFecha(fechaActual);
        return mayusculaInicial(fechaLarga(fechaActual)) + " de " + dia.getFullYear();
    }
    const lunes = textoAFecha(lunesDeLaSemana(fechaActual));
    const sabado = textoAFecha(sumarDias(lunesDeLaSemana(fechaActual), 5));
    let inicio = String(lunes.getDate());
    if (lunes.getMonth() !== sabado.getMonth()) {
        inicio = inicio + " de " + NOMBRES_MESES[lunes.getMonth()];
    }
    return inicio + " – " + sabado.getDate() + " de " + NOMBRES_MESES[sabado.getMonth()] + " de " + sabado.getFullYear();
}

function dibujarAgenda() {
    const enDia = vistaEnPantalla() === "dia";
    document.getElementById("agendaSemana").hidden = enDia;
    document.getElementById("agendaDia").hidden = !enDia;
    document.getElementById("vistaDia").classList.toggle("activo", enDia);
    document.getElementById("vistaSemana").classList.toggle("activo", !enDia);
    document.getElementById("tituloPeriodo").textContent = tituloDelPeriodo();
    if (enDia) {
        dibujarDia();
    } else {
        dibujarSemana();
    }
    dibujarPanel();
}

// PANEL con el detalle de la cita elegida y sus cambios de estado
function elegirCita(idCita) {
    idCitaElegida = idCita;
    ocultarAviso("avisoAgenda");
    dibujarAgenda();
}

function dibujarPanel() {
    const panel = document.getElementById("panelCita");
    const cita = buscarPorId(datos.citas, idCitaElegida);
    if (cita === null) {
        panel.innerHTML = "<h2>Cita seleccionada</h2>" +
            '<p class="secundario">Elige una cita de la agenda para ver su detalle y cambiar su estado.</p>';
        return;
    }
    const paciente = buscarPorId(datos.pacientes, cita.pacienteId);
    const odontologo = buscarPorId(datos.usuarios, cita.odontologoId);
    const permitidos = cambiosPermitidos(cita.estado);

    let codigo = "<h2>Cita seleccionada</h2>" +
        '<dl class="dato">' +
        "<dt>Paciente</dt><dd>" + textoSeguro(nombrePaciente(paciente)) +
        '<br><span class="pequeno secundario">' + documentoPaciente(paciente) + " · " + paciente.telefono + "</span></dd>" +
        "<dt>Fecha y hora</dt><dd>" + mayusculaInicial(fechaLarga(cita.fecha)) + " · " + cita.hora + " – " + horaFinCita(cita) + "</dd>" +
        "<dt>Odontólogo</dt><dd>" + odontologo.nombre + "</dd>" +
        "<dt>Estado</dt><dd>" + etiquetaEstado(cita.estado) + "</dd>" +
        "</dl><hr>";

    if (permitidos.length === 0) {
        // RF14: una cita en estado final no ofrece cambios
        codigo = codigo + '<p class="pequeno secundario">Una cita en estado ' + cita.estado +
            " ya no cambia de estado.</p>";
    } else {
        codigo = codigo + "<h3>Cambiar estado</h3>";
        if (cita.estado === "Programada") {
            codigo = codigo + '<button type="button" class="boton boton-primario boton-ancho" data-estado="Confirmada">Confirmar cita</button>';
        } else {
            codigo = codigo + '<button type="button" class="boton boton-primario boton-ancho" data-estado="Atendida">Marcar como atendida</button>';
        }
        codigo = codigo + '<button type="button" class="boton boton-peligro boton-ancho" data-estado="Cancelada">Cancelar cita</button>' +
            '<button type="button" class="boton boton-ancho" data-estado="No asistió">Marcar No asistió</button>';
        if (cita.estado === "Programada") {
            codigo = codigo + '<button type="button" class="boton boton-ancho" disabled>Marcar como atendida</button>' +
                '<p class="pequeno secundario">Una cita se marca como atendida después de confirmarla.</p>';
        }
    }

    if (puedeVerHistoria(usuario.rol)) {
        codigo = codigo + '<a href="historia.html?paciente=' + paciente.id + '">Abrir historia clínica</a>';
    } else {
        codigo = codigo + '<a href="pacientes.html?ficha=' + paciente.id + '">Ver ficha del paciente</a>';
    }
    panel.innerHTML = codigo;

    const botones = panel.querySelectorAll("[data-estado]");
    botones.forEach(function (boton) {
        boton.addEventListener("click", function () {
            if (boton.dataset.estado === "Cancelada") {
                pedirConfirmacionCancelar(cita);
            } else {
                cambiarEstado(cita, boton.dataset.estado);
            }
        });
    });
}

// RF13 y RF14: cambia el estado solo si la regla RN04 lo permite
function cambiarEstado(cita, estadoNuevo) {
    const paciente = buscarPorId(datos.pacientes, cita.pacienteId);
    if (!cambiosPermitidos(cita.estado).includes(estadoNuevo)) {
        mostrarAviso("avisoAgenda", "error", "Cambio de estado no permitido",
            "Una cita en estado " + cita.estado + " no puede pasar a " + estadoNuevo + ".");
        return;
    }
    cita.estado = estadoNuevo;
    guardarDatos(datos);

    let texto = "La cita de " + textoSeguro(nombrePaciente(paciente)) + " pasó a " + estadoNuevo + ".";
    if (!citaOcupaHorario(cita)) {
        // RF15: la hora queda libre para otro paciente
        texto = texto + " Su hora, de " + cita.hora + " a " + horaFinCita(cita) + ", quedó libre.";
    }
    mostrarAviso("avisoAgenda", "exito", "Estado actualizado", texto);
    dibujarAgenda();
}

function pedirConfirmacionCancelar(cita) {
    const paciente = buscarPorId(datos.pacientes, cita.pacienteId);
    const odontologo = buscarPorId(datos.usuarios, cita.odontologoId);
    document.getElementById("resumenCancelar").innerHTML =
        "<strong>" + textoSeguro(nombrePaciente(paciente)) + "</strong>" +
        "<span>" + mayusculaInicial(fechaLarga(cita.fecha)) + " · " + cita.hora + " – " + horaFinCita(cita) + "</span>" +
        '<span class="secundario">' + odontologo.nombre + "</span>";
    abrirVentana("ventanaCancelar");
}

document.getElementById("botonConfirmarCancelar").addEventListener("click", function () {
    const cita = buscarPorId(datos.citas, idCitaElegida);
    cerrarVentana("ventanaCancelar");
    if (cita !== null) {
        cambiarEstado(cita, "Cancelada");
    }
});

// NUEVA CITA (RF10, RF11 y RF12)
function llenarFormularioCita() {
    const selectorOdontologo = document.getElementById("odontologoCita");
    const selectorHora = document.getElementById("horaCita");
    const inicioHorario = horaAMinutos(datos.horario.horaInicio);
    const finHorario = horaAMinutos(datos.horario.horaFin);

    listaOdontologos(datos).forEach(function (odontologo) {
        const opcion = document.createElement("option");
        opcion.value = odontologo.id;
        opcion.textContent = odontologo.nombre;
        selectorOdontologo.appendChild(opcion);
    });
    // horas de inicio cada 30 minutos dentro del horario de atención
    for (let minutos = inicioHorario; minutos < finHorario; minutos = minutos + 30) {
        const opcion = document.createElement("option");
        opcion.value = minutosAHora(minutos);
        opcion.textContent = minutosAHora(minutos);
        selectorHora.appendChild(opcion);
    }
}

function abrirNuevaCita(fecha, hora) {
    formCita.reset();
    limpiarErrores(formCita);
    ocultarAviso("avisoCita");
    pacienteElegido = null;
    document.getElementById("sugerenciasCita").hidden = true;

    if (fecha < hoyTexto()) {
        fecha = evitarDomingo(hoyTexto(), 1);
    }
    document.getElementById("fechaCita").value = fecha;
    document.getElementById("horaCita").value = hora;
    document.getElementById("duracionCita").value = "60";
    if (Number(filtroOdontologo.value) !== 0) {
        document.getElementById("odontologoCita").value = filtroOdontologo.value;
    }
    abrirVentana("ventanaCita");
    document.getElementById("pacienteCita").focus();
}

formCita.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarErrores(formCita);
    ocultarAviso("avisoCita");

    const odontologoId = Number(document.getElementById("odontologoCita").value);
    const fecha = document.getElementById("fechaCita").value;
    const hora = document.getElementById("horaCita").value;
    const duracion = Number(document.getElementById("duracionCita").value);
    let formularioValido = true;

    if (pacienteElegido === null) {
        marcarError("pacienteCita", "Busca y elige un paciente de la lista.");
        formularioValido = false;
    }
    if (fecha === "") {
        marcarError("fechaCita", "Elige la fecha de la cita.");
        formularioValido = false;
    }
    if (!formularioValido) {
        return;
    }

    // RN03: fecha futura y dentro del horario de atención
    const mensajeHorario = mensajeHorarioCita(datos.horario, fecha, hora, duracion, new Date());
    if (mensajeHorario !== "") {
        document.getElementById("fechaCita").classList.add("con-error");
        document.getElementById("horaCita").classList.add("con-error");
        mostrarAviso("avisoCita", "error", "No se puede agendar en ese horario", mensajeHorario);
        return;
    }

    // RN02: el odontólogo no puede tener otra cita activa que se cruce
    const cruce = citaQueSeCruza(datos.citas, odontologoId, fecha, hora, duracion);
    if (cruce !== null) {
        const odontologoCruce = buscarPorId(datos.usuarios, cruce.odontologoId);
        document.getElementById("horaCita").classList.add("con-error");
        mostrarAviso("avisoCita", "error", "Cruce de horario",
            conArticulo(odontologoCruce.nombre) + " ya tiene una cita de " + cruce.hora + " a " +
            horaFinCita(cruce) + ". Elige otra hora.");
        return;
    }

    const cita = {
        id: siguienteId(datos.citas),
        fecha: fecha,
        hora: hora,
        duracion: duracion,
        pacienteId: pacienteElegido.id,
        odontologoId: odontologoId,
        estado: "Programada"
    };
    datos.citas.push(cita);
    guardarDatos(datos);

    cerrarVentana("ventanaCita");
    fechaActual = fecha;
    idCitaElegida = cita.id;
    // si el filtro mostraba a otro odontólogo, vuelve a "Todos" para que la cita nueva se vea
    if (Number(filtroOdontologo.value) !== 0 && Number(filtroOdontologo.value) !== odontologoId) {
        filtroOdontologo.value = "0";
    }
    dibujarAgenda();
    mostrarAviso("avisoAgenda", "exito", "Cita agendada",
        textoSeguro(nombrePaciente(pacienteElegido)) + ", " + fechaLarga(fecha) + " a las " + hora + " con " +
        buscarPorId(datos.usuarios, odontologoId).nombre + ". Quedó en estado Programada.");
});

// BARRA DE HERRAMIENTAS
function llenarFiltroOdontologo() {
    if (usuario.rol === "odontologo") {
        // el odontólogo ve su propia agenda
        filtroOdontologo.innerHTML = '<option value="' + usuario.id + '">Mi agenda</option>';
        filtroOdontologo.disabled = true;
        return;
    }
    filtroOdontologo.innerHTML = '<option value="0">Odontólogo: Todos</option>';
    listaOdontologos(datos).forEach(function (odontologo) {
        const opcion = document.createElement("option");
        opcion.value = odontologo.id;
        opcion.textContent = odontologo.nombre;
        filtroOdontologo.appendChild(opcion);
    });
}

function moverPeriodo(sentido) {
    if (vistaEnPantalla() === "dia") {
        fechaActual = evitarDomingo(sumarDias(fechaActual, sentido), sentido);
    } else {
        fechaActual = sumarDias(fechaActual, 7 * sentido);
    }
    idCitaElegida = null;
    dibujarAgenda();
}

function iniciarAgenda() {
    prepararMenu(usuario, "agenda");
    mostrarAvisoDePagina("avisoAgenda");
    fechaActual = evitarDomingo(hoyTexto(), 1);
    llenarFiltroOdontologo();
    llenarFormularioCita();

    activarBuscadorPaciente("pacienteCita", "sugerenciasCita", datos.pacientes, function (paciente) {
        pacienteElegido = paciente;
    });

    document.getElementById("botonHoy").addEventListener("click", function () {
        fechaActual = evitarDomingo(hoyTexto(), 1);
        idCitaElegida = null;
        dibujarAgenda();
    });
    document.getElementById("botonAnterior").addEventListener("click", function () {
        moverPeriodo(-1);
    });
    document.getElementById("botonSiguiente").addEventListener("click", function () {
        moverPeriodo(1);
    });
    document.getElementById("vistaDia").addEventListener("click", function () {
        vista = "dia";
        dibujarAgenda();
    });
    document.getElementById("vistaSemana").addEventListener("click", function () {
        vista = "semana";
        dibujarAgenda();
    });
    filtroOdontologo.addEventListener("change", function () {
        idCitaElegida = null;
        dibujarAgenda();
    });
    consultaCelular.addEventListener("change", dibujarAgenda);

    // solo la recepcionista agenda citas (RF10)
    const botonNuevaCita = document.getElementById("botonNuevaCita");
    if (usuario.rol === "recepcionista") {
        botonNuevaCita.addEventListener("click", function () {
            abrirNuevaCita(fechaActual, "09:00");
        });
    } else {
        botonNuevaCita.hidden = true;
    }

    dibujarAgenda();

    // agenda.html?paciente=5 abre la ventana de nueva cita con ese paciente ya elegido
    const pacienteInicial = buscarPorId(datos.pacientes, parametroDePagina("paciente"));
    if (pacienteInicial !== null && usuario.rol === "recepcionista") {
        abrirNuevaCita(fechaActual, "09:00");
        pacienteElegido = pacienteInicial;
        document.getElementById("pacienteCita").value = nombrePaciente(pacienteInicial) + " · " + documentoPaciente(pacienteInicial);
    }
}

if (usuario !== null) {
    iniciarAgenda();
}
