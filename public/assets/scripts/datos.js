// DATOS DE EJEMPLO del prototipo
// No hay servidor ni base de datos: los datos se guardan en el navegador (localStorage)
// para que lo registrado en una pantalla se vea en las demás.

const CLAVE_DATOS = "dentivacore-datos";

// fecha de ejemplo relativa a hoy; si cae domingo se mueve un día más
function fechaEjemplo(dias) {
    let fecha = sumarDias(hoyTexto(), dias);
    if (textoAFecha(fecha).getDay() === 0) {
        if (dias < 0) {
            fecha = sumarDias(fecha, -1);
        } else {
            fecha = sumarDias(fecha, 1);
        }
    }
    return fecha;
}

function crearDatosIniciales() {
    const usuarios = [
        { id: 1, usuario: "carmen.vela", clave: "dentiva123", nombre: "Carmen Vela", rol: "administrador", cargo: "Administradora" },
        { id: 2, usuario: "marisol.diaz", clave: "dentiva123", nombre: "Marisol Díaz", rol: "recepcionista", cargo: "Recepcionista" },
        { id: 3, usuario: "andres.rojas", clave: "dentiva123", nombre: "Dr. Andrés Rojas", rol: "odontologo", cargo: "Odontólogo" },
        { id: 4, usuario: "ana.medina", clave: "dentiva123", nombre: "Dra. Ana Medina", rol: "odontologo", cargo: "Odontóloga" },
        { id: 5, usuario: "rosa.salinas", clave: "dentiva123", nombre: "Dra. Rosa Salinas", rol: "odontologo", cargo: "Odontóloga" }
    ];

    // horario de atención del consultorio: lunes (1) a sábado (6), de 08:00 a 18:00
    const horario = { dias: [1, 2, 3, 4, 5, 6], horaInicio: "08:00", horaFin: "18:00" };

    const listaPacientes = [
        ["DNI", "74829163", "Lucía", "Torres Ramos", "987245610", "lucia.torres@example.com"],
        ["DNI", "45678219", "Miguel", "Quispe Salas", "946318752", "miguel.quispe@example.com"],
        ["CE", "001458723", "Valentina", "Rojas Díaz", "955704128", ""],
        ["Pasaporte", "118204653", "Andrés", "Molina Vera", "912683490", "andres.molina@example.com"],
        ["DNI", "70318452", "Camila", "Flores Paz", "944870215", ""],
        ["DNI", "62849317", "Luis", "Mendoza Ruiz", "999301778", "luis.mendoza@example.com"],
        ["DNI", "71904526", "Jorge", "Ramírez Soto", "933208114", ""],
        ["DNI", "40587312", "Pedro", "Chávez Luna", "975019846", ""],
        ["DNI", "48120957", "Ana", "Paredes Ríos", "912445060", "ana.paredes@example.com"],
        ["DNI", "76251830", "Lucero", "Vargas Pinto", "981760392", ""],
        ["DNI", "43906127", "Rosa", "Huamán Ccori", "956112430", ""],
        ["DNI", "72815064", "Diego", "Castro León", "987654321", "diego.castro@example.com"],
        ["DNI", "09873415", "Elena", "Gutiérrez Vda. de Soto", "944120873", ""],
        ["DNI", "46092781", "Renzo", "Aguilar Tello", "991204576", ""],
        ["DNI", "73410952", "Fiorella", "Campos Reyes", "923875104", "fiorella.campos@example.com"],
        ["CE", "002715480", "Mateo", "Fernández Gil", "930441287", ""],
        ["DNI", "41267893", "Gloria", "Salazar Ponce", "965730218", ""],
        ["DNI", "75038216", "Sebastián", "Ortiz Vega", "914608352", ""],
        ["DNI", "44781209", "Patricia", "Núñez Alva", "978231640", "patricia.nunez@example.com"],
        ["DNI", "70924518", "Kevin", "Espinoza Cruz", "932105487", ""],
        ["DNI", "42350876", "Milagros", "Tapia Arce", "951867034", ""],
        ["Pasaporte", "AB4521907", "Daniela", "Herrera Montes", "940278615", ""],
        ["DNI", "77103459", "Bruno", "Cárdenas Solís", "986450127", ""],
        ["DNI", "45219038", "Yolanda", "Mamani Apaza", "917342806", ""],
        ["DNI", "71560293", "Álvaro", "Zevallos Prado", "962018473", "alvaro.zevallos@example.com"],
        ["DNI", "40816725", "Carmen", "Delgado Rivas", "928576301", ""]
    ];
    const pacientes = [];
    listaPacientes.forEach(function (fila, indice) {
        pacientes.push({
            id: indice + 1,
            tipoDocumento: fila[0],
            numeroDocumento: fila[1],
            nombres: fila[2],
            apellidos: fila[3],
            telefono: fila[4],
            correo: fila[5],
            antecedentes: { alergias: "", enfermedades: "", medicacion: "" }
        });
    });
    pacientes[1].antecedentes = { alergias: "Penicilina", enfermedades: "Hipertensión controlada", medicacion: "Losartán 50 mg" };

    // catálogo de tratamientos con su precio en soles
    const tratamientos = [
        { id: 1, nombre: "Evaluación dental", precio: 50, activo: true },
        { id: 2, nombre: "Profilaxis", precio: 80, activo: true },
        { id: 3, nombre: "Resina compuesta", precio: 150, activo: true },
        { id: 4, nombre: "Endodoncia", precio: 450, activo: true },
        { id: 5, nombre: "Extracción simple", precio: 120, activo: true },
        { id: 6, nombre: "Sellante", precio: 60, activo: true },
        { id: 7, nombre: "Blanqueamiento dental", precio: 350, activo: true },
        { id: 8, nombre: "Corona de porcelana", precio: 680, activo: true }
    ];

    // citas: [días desde hoy, hora, duración en minutos, paciente, odontólogo, estado]
    const listaCitas = [
        [-4, "09:00", 60, 2, 3, "Atendida"],
        [-4, "11:00", 60, 6, 5, "Atendida"],
        [-3, "10:00", 90, 5, 4, "Atendida"],
        [-3, "15:00", 60, 7, 3, "No asistió"],
        [-2, "09:00", 60, 4, 3, "Atendida"],
        [-2, "14:00", 60, 3, 5, "Cancelada"],
        [-1, "11:00", 60, 8, 4, "Atendida"],
        [-1, "16:00", 60, 5, 3, "Atendida"],
        [0, "09:00", 60, 1, 3, "Programada"],
        [0, "10:00", 60, 2, 3, "Confirmada"],
        [0, "14:00", 90, 5, 4, "Confirmada"],
        [1, "09:00", 60, 6, 5, "Programada"]
    ];
    const citas = [];
    listaCitas.forEach(function (fila, indice) {
        citas.push({
            id: indice + 1,
            fecha: fechaEjemplo(fila[0]),
            hora: fila[1],
            duracion: fila[2],
            pacienteId: fila[3],
            odontologoId: fila[4],
            estado: fila[5]
        });
    });

    // atenciones de la historia clínica de Miguel Quispe Salas
    const atenciones = [
        {
            id: 1, pacienteId: 2, odontologoId: 5, fecha: sumarDias(hoyTexto(), -220), pieza: "26",
            diagnostico: "Sensibilidad dental", procedimiento: "Evaluación y sellante",
            indicaciones: "Usar pasta desensibilizante", notas: []
        },
        {
            id: 2, pacienteId: 2, odontologoId: 3, fecha: sumarDias(hoyTexto(), -87), pieza: "36",
            diagnostico: "Gingivitis localizada", procedimiento: "Profilaxis y aplicación de flúor",
            indicaciones: "Cepillado suave; control en 6 meses", notas: []
        },
        {
            id: 3, pacienteId: 2, odontologoId: 3, fecha: sumarDias(hoyTexto(), -7), pieza: "16",
            diagnostico: "Caries en cara oclusal", procedimiento: "Restauración con resina",
            indicaciones: "Evitar alimentos duros por 24 horas",
            notas: [{ fecha: sumarDias(hoyTexto(), -6), usuarioId: 3, texto: "La pieza tratada fue la 17, no la 16." }]
        }
    ];

    // presupuestos con cabecera y detalle; el precio queda copiado del catálogo
    const presupuestos = [
        {
            id: 1, numero: 37, pacienteId: 6, odontologoId: 5, fecha: sumarDias(hoyTexto(), -10), estado: "Pagado",
            detalle: [{ tratamientoId: 4, nombre: "Endodoncia", cantidad: 1, precio: 450 }]
        },
        {
            id: 2, numero: 38, pacienteId: 1, odontologoId: 3, fecha: sumarDias(hoyTexto(), -9), estado: "Pagado",
            detalle: [{ tratamientoId: 2, nombre: "Profilaxis", cantidad: 1, precio: 80 }]
        },
        {
            id: 3, numero: 39, pacienteId: 5, odontologoId: 4, fecha: sumarDias(hoyTexto(), -8), estado: "Con saldo",
            detalle: [{ tratamientoId: 8, nombre: "Corona de porcelana", cantidad: 1, precio: 680 }]
        },
        {
            id: 4, numero: 40, pacienteId: 3, odontologoId: 5, fecha: sumarDias(hoyTexto(), -8), estado: "Con saldo",
            detalle: [{ tratamientoId: 3, nombre: "Resina compuesta", cantidad: 1, precio: 150 }]
        },
        {
            id: 5, numero: 41, pacienteId: 8, odontologoId: 4, fecha: sumarDias(hoyTexto(), -7), estado: "Con saldo",
            detalle: [
                { tratamientoId: 2, nombre: "Profilaxis", cantidad: 1, precio: 80 },
                { tratamientoId: 6, nombre: "Sellante", cantidad: 3, precio: 60 }
            ]
        },
        {
            id: 6, numero: 42, pacienteId: 2, odontologoId: 3, fecha: sumarDias(hoyTexto(), -7), estado: "Con saldo",
            detalle: [
                { tratamientoId: 2, nombre: "Profilaxis", cantidad: 1, precio: 80 },
                { tratamientoId: 3, nombre: "Resina compuesta", cantidad: 2, precio: 150 },
                { tratamientoId: 4, nombre: "Endodoncia", cantidad: 1, precio: 450 }
            ]
        }
    ];

    // pagos registrados sobre los presupuestos
    const pagos = [
        { id: 1, presupuestoId: 1, fecha: sumarDias(hoyTexto(), -8), monto: 450, usuarioId: 2 },
        { id: 2, presupuestoId: 2, fecha: sumarDias(hoyTexto(), -7), monto: 80, usuarioId: 2 },
        { id: 3, presupuestoId: 6, fecha: sumarDias(hoyTexto(), -7), monto: 200, usuarioId: 2 },
        { id: 4, presupuestoId: 3, fecha: sumarDias(hoyTexto(), -4), monto: 200, usuarioId: 2 },
        { id: 5, presupuestoId: 5, fecha: sumarDias(hoyTexto(), -3), monto: 200, usuarioId: 2 }
    ];

    return {
        usuarios: usuarios,
        horario: horario,
        pacientes: pacientes,
        tratamientos: tratamientos,
        citas: citas,
        atenciones: atenciones,
        presupuestos: presupuestos,
        pagos: pagos,
        consultasHistoria: []
    };
}

function guardarDatos(datos) {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
}

function cargarDatos() {
    const texto = localStorage.getItem(CLAVE_DATOS);
    if (texto === null) {
        const datos = crearDatosIniciales();
        guardarDatos(datos);
        return datos;
    }
    return JSON.parse(texto);
}

function restablecerDatos() {
    const datos = crearDatosIniciales();
    guardarDatos(datos);
    return datos;
}

// siguiente identificador de una lista
function siguienteId(lista) {
    let mayor = 0;
    lista.forEach(function (elemento) {
        if (elemento.id > mayor) {
            mayor = elemento.id;
        }
    });
    return mayor + 1;
}

// consultas sencillas sobre los datos
function buscarPorId(lista, id) {
    let encontrado = null;
    lista.forEach(function (elemento) {
        if (elemento.id === Number(id)) {
            encontrado = elemento;
        }
    });
    return encontrado;
}

function nombrePaciente(paciente) {
    return paciente.nombres + " " + paciente.apellidos;
}

// "Lucía Torres Ramos" se muestra como "Lucía Torres" en los bloques de la agenda
function nombreBreve(paciente) {
    return paciente.nombres.split(" ")[0] + " " + paciente.apellidos.split(" ")[0];
}

function documentoPaciente(paciente) {
    return paciente.tipoDocumento + " " + paciente.numeroDocumento;
}

function listaOdontologos(datos) {
    return datos.usuarios.filter(function (usuario) {
        return usuario.rol === "odontologo";
    });
}

// "Dr. Andrés Rojas" se muestra como "Dr. Rojas" dentro de la agenda
function nombreCorto(nombre) {
    const partes = nombre.split(" ");
    if (partes.length < 3) {
        return nombre;
    }
    return partes[0] + " " + partes[partes.length - 1];
}
