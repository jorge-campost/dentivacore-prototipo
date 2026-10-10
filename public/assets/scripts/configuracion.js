// CONFIGURACIÓN (RF03, RF04 y RF22)
// Pantalla pendiente: en el prototipo solo muestra los datos con los que trabajan las demás pantallas.

const usuario = exigirSesion(["administrador"]);
const datos = cargarDatos();

function iniciarConfiguracion() {
    prepararMenu(usuario, "configuracion");

    const activos = datos.tratamientos.filter(function (tratamiento) {
        return tratamiento.activo;
    });
    document.getElementById("datosConfiguracion").innerHTML =
        "<dt>Horario de atención</dt><dd>Lunes a sábado, de " + datos.horario.horaInicio + " a " + datos.horario.horaFin + "</dd>" +
        "<dt>Usuarios registrados</dt><dd>" + datos.usuarios.length + "</dd>" +
        "<dt>Tratamientos activos en el catálogo</dt><dd>" + activos.length + "</dd>";
}

if (usuario !== null) {
    iniciarConfiguracion();
}
