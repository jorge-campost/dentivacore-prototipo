// FUNCIONES COMUNES a todas las pantallas: iconos, sesión, menú, formatos, avisos y ventanas

// iconos de línea del menú y de los botones
const ICONOS = {
    agenda: '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5H13.5M5.5 2V5M10.5 2V5"/>',
    pacientes: '<circle cx="6" cy="5.5" r="2.5"/><path d="M1.5 13.5C1.5 11 3.5 9.5 6 9.5C8.5 9.5 10.5 11 10.5 13.5M11 3.2C12 3.6 12.6 4.5 12.6 5.5C12.6 6.5 12 7.4 11 7.8M12.2 9.8C13.6 10.3 14.5 11.6 14.5 13.5"/>',
    atenciones: '<rect x="3.5" y="3" width="9" height="11" rx="1.5"/><path d="M6 1.8H10V4.2H6ZM6 8H10M6 11H10"/>',
    pagos: '<rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M2 7H14M10.5 10H12"/>',
    reportes: '<path d="M3 13V8M8 13V3M13 13V6"/>',
    configuracion: '<path d="M2.5 5H13.5M2.5 11H13.5"/><circle cx="6" cy="5" r="1.8" fill="white"/><circle cx="10" cy="11" r="1.8" fill="white"/>',
    buscar: '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>',
    menu: '<path d="M2.5 4.5H13.5M2.5 8H13.5M2.5 11.5H13.5"/>',
    mas: '<path d="M8 3.5V12.5M3.5 8H12.5"/>',
    anterior: '<path d="M10 4L6 8L10 12"/>',
    siguiente: '<path d="M6 4L10 8L6 12"/>',
    cerrar: '<path d="M4 4L12 12M12 4L4 12"/>',
    exito: '<circle cx="8" cy="8" r="6.3"/><path d="M5.2 8.3L7.2 10.3L10.9 6"/>',
    advertencia: '<path d="M8 2.2L14.3 13.3H1.7Z"/><path d="M8 6.5V9.6M8 11.3V11.5"/>',
    error: '<circle cx="8" cy="8" r="6.3"/><path d="M5.8 5.8L10.2 10.2M10.2 5.8L5.8 10.2"/>',
    info: '<circle cx="8" cy="8" r="6.3"/><path d="M8 7.3V11M8 4.9V5.1"/>'
};

function codigoIcono(nombre) {
    return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONOS[nombre] + '</svg>';
}

// dibuja el icono en cada elemento que tenga el atributo data-icono
function dibujarIconos() {
    const elementos = document.querySelectorAll("[data-icono]");
    elementos.forEach(function (elemento) {
        elemento.classList.add("icono");
        elemento.innerHTML = codigoIcono(elemento.dataset.icono);
    });
}

// SESIÓN del usuario (se guarda mientras la pestaña esté abierta)
const CLAVE_SESION = "dentivacore-sesion";

function obtenerUsuarioActual() {
    const texto = sessionStorage.getItem(CLAVE_SESION);
    if (texto === null) {
        return null;
    }
    return JSON.parse(texto);
}

function iniciarSesion(usuario) {
    const sesion = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, cargo: usuario.cargo };
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

function cerrarSesion() {
    sessionStorage.removeItem(CLAVE_SESION);
    window.location.href = "index.html";
}

// primera pantalla de cada rol
function paginaInicial(rol) {
    if (rol === "administrador") {
        return "reportes.html";
    }
    return "agenda.html";
}

// si no hay sesión vuelve al inicio; si el rol no tiene permiso, a su primera pantalla
function exigirSesion(rolesPermitidos) {
    const usuario = obtenerUsuarioActual();
    if (usuario === null) {
        window.location.href = "index.html";
        return null;
    }
    if (!rolesPermitidos.includes(usuario.rol)) {
        window.location.href = paginaInicial(usuario.rol) + "?aviso=permiso";
        return null;
    }
    return usuario;
}

// MENÚ: muestra solo las secciones del rol y marca la sección activa
function prepararMenu(usuario, seccionActiva) {
    const enlaces = document.querySelectorAll("#menu a");
    const selector = document.getElementById("selectorSeccion");
    enlaces.forEach(function (enlace) {
        const roles = enlace.dataset.roles.split(" ");
        if (!roles.includes(usuario.rol)) {
            enlace.parentElement.hidden = true;
            return;
        }
        const opcion = document.createElement("option");
        opcion.value = enlace.getAttribute("href");
        opcion.textContent = enlace.textContent.trim();
        if (enlace.dataset.seccion === seccionActiva) {
            enlace.classList.add("activo");
            enlace.setAttribute("aria-current", "page");
            opcion.selected = true;
        }
        selector.appendChild(opcion);
    });
    selector.addEventListener("change", function () {
        window.location.href = selector.value;
    });

    document.getElementById("nombreUsuario").textContent = usuario.nombre;
    document.getElementById("cargoUsuario").textContent = usuario.cargo;
    document.getElementById("botonCerrarSesion").addEventListener("click", cerrarSesion);

    const menuLateral = document.querySelector(".menu-lateral");
    document.getElementById("botonMenu").addEventListener("click", function () {
        menuLateral.classList.toggle("abierto");
    });
}

// FECHAS: se guardan como texto "AAAA-MM-DD"
function fechaATexto(fecha) {
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return fecha.getFullYear() + "-" + mes + "-" + dia;
}

function textoAFecha(texto) {
    const partes = texto.split("-");
    return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

function hoyTexto() {
    return fechaATexto(new Date());
}

function sumarDias(texto, dias) {
    const fecha = textoAFecha(texto);
    fecha.setDate(fecha.getDate() + dias);
    return fechaATexto(fecha);
}

// "2026-10-09" se muestra como "09/10/2026"
function formatearFecha(texto) {
    const partes = texto.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

const NOMBRES_DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const NOMBRES_MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
    "septiembre", "octubre", "noviembre", "diciembre"];

// "2026-10-09" se muestra como "viernes 9 de octubre"
function fechaLarga(texto) {
    const fecha = textoAFecha(texto);
    return NOMBRES_DIAS[fecha.getDay()] + " " + fecha.getDate() + " de " + NOMBRES_MESES[fecha.getMonth()];
}

function mayusculaInicial(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// MONTOS en soles: 1150 se muestra como "S/ 1,150.00"
function formatearSoles(monto) {
    const texto = Number(monto).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return "S/ " + texto;
}

// evita que un texto escrito por el usuario se interprete como HTML
function textoSeguro(texto) {
    const elemento = document.createElement("div");
    elemento.textContent = texto;
    return elemento.innerHTML;
}

// clase de la etiqueta según el estado: "No asistió" -> "etiqueta-no-asistio"
function claseEstado(prefijo, estado) {
    const nombres = {
        "Programada": "programada", "Confirmada": "confirmada", "Atendida": "atendida",
        "Cancelada": "cancelada", "No asistió": "no-asistio", "Pagado": "pagado", "Con saldo": "con-saldo"
    };
    return prefijo + "-" + nombres[estado];
}

function etiquetaEstado(estado) {
    return '<span class="etiqueta ' + claseEstado("etiqueta", estado) + '">' + estado + '</span>';
}

// AVISOS: tipo puede ser "exito", "advertencia" o "error"
function mostrarAviso(idAviso, tipo, titulo, textoHtml) {
    const aviso = document.getElementById(idAviso);
    aviso.className = "aviso aviso-" + tipo;
    aviso.innerHTML = '<span class="icono">' + codigoIcono(tipo) + '</span>' +
        '<div><strong>' + titulo + '</strong><span>' + textoHtml + '</span></div>';
    aviso.hidden = false;
}

function ocultarAviso(idAviso) {
    document.getElementById(idAviso).hidden = true;
}

// aviso que llega en la dirección de la página, por ejemplo agenda.html?aviso=permiso
function mostrarAvisoDePagina(idAviso) {
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.get("aviso") === "permiso") {
        mostrarAviso(idAviso, "error", "No tienes permiso para ver esa sección",
            "Tu usuario no tiene acceso a la pantalla que intentaste abrir.");
    }
}

// VENTANAS modales
function abrirVentana(idVentana) {
    document.getElementById(idVentana).hidden = false;
}

function cerrarVentana(idVentana) {
    document.getElementById(idVentana).hidden = true;
}

// los botones con data-cerrar="idVentana" cierran esa ventana
function prepararVentanas() {
    const botones = document.querySelectorAll("[data-cerrar]");
    botones.forEach(function (boton) {
        boton.addEventListener("click", function () {
            cerrarVentana(boton.dataset.cerrar);
        });
    });
}

// ERRORES de un campo: marca el campo y escribe el mensaje en su <small>
function marcarError(idCampo, mensaje) {
    document.getElementById(idCampo).classList.add("con-error");
    const nombreError = "error" + idCampo.charAt(0).toUpperCase() + idCampo.slice(1);
    document.getElementById(nombreError).textContent = mensaje;
}

function limpiarErrores(formulario) {
    const campos = formulario.querySelectorAll(".con-error");
    campos.forEach(function (campo) {
        campo.classList.remove("con-error");
    });
    const mensajes = formulario.querySelectorAll("small");
    mensajes.forEach(function (mensaje) {
        mensaje.textContent = "";
    });
}

// BUSCADOR de pacientes por nombre o número de documento.
// Al elegir un paciente llama a la función alElegir(paciente).
function activarBuscadorPaciente(idCampo, idSugerencias, pacientes, alElegir) {
    const campo = document.getElementById(idCampo);
    const sugerencias = document.getElementById(idSugerencias);

    campo.addEventListener("input", function () {
        const texto = campo.value.trim().toLowerCase();
        sugerencias.innerHTML = "";
        alElegir(null);
        if (texto === "") {
            sugerencias.hidden = true;
            return;
        }
        const encontrados = filtrarPacientes(pacientes, texto).slice(0, 5);
        if (encontrados.length === 0) {
            sugerencias.innerHTML = "<li>No hay pacientes con ese nombre o documento.</li>";
        }
        encontrados.forEach(function (paciente) {
            const elemento = document.createElement("li");
            const boton = document.createElement("button");
            boton.type = "button";
            boton.textContent = nombrePaciente(paciente) + " · " + documentoPaciente(paciente);
            boton.addEventListener("click", function () {
                campo.value = boton.textContent;
                sugerencias.hidden = true;
                alElegir(paciente);
            });
            elemento.appendChild(boton);
            sugerencias.appendChild(elemento);
        });
        sugerencias.hidden = false;
    });
}

// quita las tildes y pasa a minúsculas, para que "lucia" encuentre a "Lucía"
function sinTildes(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filtrarPacientes(pacientes, texto) {
    const buscado = sinTildes(texto.trim());
    return pacientes.filter(function (paciente) {
        return sinTildes(nombrePaciente(paciente)).includes(buscado) ||
            paciente.numeroDocumento.toLowerCase().includes(buscado);
    });
}

// "Dr. Andrés Rojas" -> "El Dr. Andrés Rojas"; "Dra. Ana Medina" -> "La Dra. Ana Medina"
function conArticulo(nombre) {
    if (nombre.startsWith("Dra.")) {
        return "La " + nombre;
    }
    return "El " + nombre;
}

// valor de un parámetro de la dirección, por ejemplo historia.html?paciente=2
function parametroDePagina(nombre) {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get(nombre);
}

// teléfono celular del Perú: 9 dígitos y empieza con 9
function mensajeTelefono(telefono) {
    if (!/^9[0-9]{8}$/.test(telefono.trim())) {
        return "Ingresa un celular de 9 dígitos que empiece con 9.";
    }
    return "";
}

function mensajeCorreo(correo) {
    const texto = correo.trim();
    if (texto !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(texto)) {
        return "Ingresa un correo válido, por ejemplo nombre@correo.com.";
    }
    return "";
}

// se ejecuta en todas las pantallas
dibujarIconos();
prepararVentanas();
