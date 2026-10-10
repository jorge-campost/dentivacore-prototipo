// INICIO DE SESIÓN (RF01)

const datos = cargarDatos();
const formLogin = document.getElementById("formLogin");
const entradaUsuario = document.getElementById("usuario");
const entradaClave = document.getElementById("clave");
const botonMostrarClave = document.getElementById("botonMostrarClave");
const botonRestablecer = document.getElementById("botonRestablecer");

// si ya hay una sesión abierta, va directo a la primera pantalla del rol
const usuarioActual = obtenerUsuarioActual();
if (usuarioActual !== null) {
    window.location.href = paginaInicial(usuarioActual.rol);
}

// busca al usuario por su nombre de usuario y su contraseña
function buscarUsuario(nombreUsuario, clave) {
    let encontrado = null;
    datos.usuarios.forEach(function (usuario) {
        if (usuario.usuario === nombreUsuario && usuario.clave === clave) {
            encontrado = usuario;
        }
    });
    return encontrado;
}

formLogin.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limpiarErrores(formLogin);
    ocultarAviso("avisoLogin");

    const nombreUsuario = entradaUsuario.value.trim().toLowerCase();
    const clave = entradaClave.value;
    let formularioValido = true;

    if (nombreUsuario === "") {
        marcarError("usuario", "Ingresa tu usuario.");
        formularioValido = false;
    }
    if (clave === "") {
        marcarError("clave", "Ingresa tu contraseña.");
        formularioValido = false;
    }
    if (!formularioValido) {
        return;
    }

    const usuario = buscarUsuario(nombreUsuario, clave);
    if (usuario === null) {
        // el mensaje no dice cuál de los dos datos está mal
        mostrarAviso("avisoLogin", "error", "No se pudo iniciar sesión",
            "El usuario o la contraseña no son correctos. Revisa los datos e inténtalo otra vez.");
        return;
    }

    iniciarSesion(usuario);
    window.location.href = paginaInicial(usuario.rol);
});

// muestra u oculta la contraseña
botonMostrarClave.addEventListener("click", function () {
    if (entradaClave.type === "password") {
        entradaClave.type = "text";
        botonMostrarClave.textContent = "Ocultar";
    } else {
        entradaClave.type = "password";
        botonMostrarClave.textContent = "Mostrar";
    }
});

// vuelve a cargar los datos de ejemplo del prototipo
botonRestablecer.addEventListener("click", function () {
    restablecerDatos();
    document.getElementById("mensajeRestablecer").textContent = "Los datos de ejemplo se restablecieron.";
});
