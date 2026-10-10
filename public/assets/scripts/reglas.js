// REGLAS DE NEGOCIO (RN01 a RN09)
// Cada función recibe los datos que necesita y devuelve un resultado, sin tocar la pantalla.
// En el prototipo se usan en el navegador; en el sistema final se validan en el servidor.

// RN01: cada paciente tiene una sola ficha, identificada por su documento.
// Devuelve el paciente que ya tiene ese documento, o null si no existe.
function pacienteConDocumento(pacientes, tipoDocumento, numeroDocumento) {
    let existente = null;
    pacientes.forEach(function (paciente) {
        if (paciente.tipoDocumento === tipoDocumento &&
            paciente.numeroDocumento.toUpperCase() === numeroDocumento.trim().toUpperCase()) {
            existente = paciente;
        }
    });
    return existente;
}

// formato del número según el tipo de documento (validación de formato, no regla de negocio)
function mensajeFormatoDocumento(tipoDocumento, numeroDocumento) {
    const numero = numeroDocumento.trim();
    if (tipoDocumento === "DNI" && !/^[0-9]{8}$/.test(numero)) {
        return "Ingresa un DNI de 8 dígitos.";
    }
    if (tipoDocumento === "CE" && !/^[0-9]{9}$/.test(numero)) {
        return "Ingresa un carné de extranjería de 9 dígitos.";
    }
    if (tipoDocumento === "Pasaporte" && !/^[A-Za-z0-9]{6,12}$/.test(numero)) {
        return "Ingresa un pasaporte de 6 a 12 letras o números.";
    }
    return "";
}

// convierte "09:30" en minutos desde la medianoche
function horaAMinutos(hora) {
    const partes = hora.split(":");
    return Number(partes[0]) * 60 + Number(partes[1]);
}

function minutosAHora(minutos) {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return String(horas).padStart(2, "0") + ":" + String(resto).padStart(2, "0");
}

// una cita cancelada o con inasistencia ya no ocupa su hora
function citaOcupaHorario(cita) {
    return cita.estado !== "Cancelada" && cita.estado !== "No asistió";
}

// RN02: un odontólogo no puede tener dos citas que se superpongan.
// Devuelve la cita con la que se cruza, o null si el horario está libre.
function citaQueSeCruza(citas, odontologoId, fecha, hora, duracion) {
    const inicio = horaAMinutos(hora);
    const fin = inicio + Number(duracion);
    let cruce = null;
    citas.forEach(function (cita) {
        if (cita.odontologoId === Number(odontologoId) && cita.fecha === fecha && citaOcupaHorario(cita)) {
            const inicioCita = horaAMinutos(cita.hora);
            const finCita = inicioCita + cita.duracion;
            if (inicio < finCita && inicioCita < fin) {
                cruce = cita;
            }
        }
    });
    return cruce;
}

// RN03: la cita debe ser en una fecha futura y dentro del horario de atención.
// Devuelve el mensaje del problema, o "" si la cita es válida.
function mensajeHorarioCita(horario, fecha, hora, duracion, ahora) {
    const partes = fecha.split("-");
    const minutosInicio = horaAMinutos(hora);
    const momento = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]),
        Math.floor(minutosInicio / 60), minutosInicio % 60);
    if (momento <= ahora) {
        return "La fecha y la hora ya pasaron. Elige un horario futuro.";
    }
    if (!horario.dias.includes(momento.getDay())) {
        return "El consultorio no atiende ese día. Elige un día de lunes a sábado.";
    }
    const fin = minutosInicio + Number(duracion);
    if (minutosInicio < horaAMinutos(horario.horaInicio) || fin > horaAMinutos(horario.horaFin)) {
        return "La cita queda fuera del horario de atención, de " + horario.horaInicio + " a " + horario.horaFin + ".";
    }
    return "";
}

// RN04: Programada -> Confirmada -> Atendida. Antes de ser atendida puede pasar a
// Cancelada o No asistió. Atendida, Cancelada y No asistió son estados finales.
function cambiosPermitidos(estado) {
    if (estado === "Programada") {
        return ["Confirmada", "Cancelada", "No asistió"];
    }
    if (estado === "Confirmada") {
        return ["Atendida", "Cancelada", "No asistió"];
    }
    return [];
}

// RN05: solo los odontólogos ven y registran el contenido clínico.
function puedeVerHistoria(rol) {
    return rol === "odontologo";
}

// RN06: una atención no se elimina; se corrige con una nota que guarda fecha y usuario.
function crearNotaAclaratoria(texto, usuarioId, fecha) {
    return { fecha: fecha, usuarioId: usuarioId, texto: texto.trim() };
}

// RN07: la pieza dental debe existir en la numeración FDI, permanente o temporal.
function piezaValida(pieza) {
    const texto = String(pieza).trim();
    if (!/^[0-9]{2}$/.test(texto)) {
        return false;
    }
    const cuadrante = Number(texto[0]);
    const posicion = Number(texto[1]);
    if (cuadrante >= 1 && cuadrante <= 4) {
        return posicion >= 1 && posicion <= 8;
    }
    if (cuadrante >= 5 && cuadrante <= 8) {
        return posicion >= 1 && posicion <= 5;
    }
    return false;
}

// RN08: el total es la suma de cantidad x precio de cada tratamiento del detalle.
function totalPresupuesto(detalle) {
    let total = 0;
    detalle.forEach(function (linea) {
        total = total + linea.cantidad * linea.precio;
    });
    return total;
}

// RN09: saldo = total - pagos.
function pagadoPresupuesto(presupuesto, pagos) {
    let pagado = 0;
    pagos.forEach(function (pago) {
        if (pago.presupuestoId === presupuesto.id) {
            pagado = pagado + pago.monto;
        }
    });
    return pagado;
}

function saldoPresupuesto(presupuesto, pagos) {
    const saldo = totalPresupuesto(presupuesto.detalle) - pagadoPresupuesto(presupuesto, pagos);
    return Math.round(saldo * 100) / 100;
}

// RN09: un pago no puede superar el saldo pendiente.
// Devuelve el mensaje del problema, o "" si el monto es válido.
function mensajeMontoPago(monto, saldo) {
    if (isNaN(monto) || monto <= 0) {
        return "Ingresa un monto mayor que cero.";
    }
    if (monto > saldo) {
        return "El monto supera el saldo pendiente de S/ " + saldo.toFixed(2) + ". Ingresa un monto igual o menor.";
    }
    return "";
}

// RN09: cuando el saldo llega a cero, el presupuesto pasa a Pagado.
function estadoPresupuesto(presupuesto, pagos) {
    if (saldoPresupuesto(presupuesto, pagos) <= 0) {
        return "Pagado";
    }
    return "Con saldo";
}
