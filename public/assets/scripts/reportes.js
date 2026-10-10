// REPORTES (RF32 a RF35)
// La pantalla es de solo lectura y no muestra contenido clínico (RN05).

const ESTADOS_CITA = ["Programada", "Confirmada", "Atendida", "Cancelada", "No asistió"];

const usuario = exigirSesion(["administrador"]);
const datos = cargarDatos();

// cada reporte guarda sus filas para poder exportarlas a CSV
let filasCsvCitas = [];
let filasCsvSaldos = [];
let filasCsvIngresos = [];

// RF32: citas del día por odontólogo y por estado
function dibujarCitas() {
    const fecha = document.getElementById("fechaCitas").value;
    const filas = document.getElementById("filasCitas");
    const totales = [0, 0, 0, 0, 0];
    let totalGeneral = 0;

    filas.innerHTML = "";
    filasCsvCitas = [["Odontólogo", "Programada", "Confirmada", "Atendida", "Cancelada", "No asistió", "Total"]];

    listaOdontologos(datos).forEach(function (odontologo) {
        const cuenta = [0, 0, 0, 0, 0];
        let total = 0;
        datos.citas.forEach(function (cita) {
            if (cita.fecha === fecha && cita.odontologoId === odontologo.id) {
                const posicion = ESTADOS_CITA.indexOf(cita.estado);
                cuenta[posicion] = cuenta[posicion] + 1;
                totales[posicion] = totales[posicion] + 1;
                total = total + 1;
            }
        });
        totalGeneral = totalGeneral + total;

        let codigo = '<td data-etiqueta="Odontólogo">' + odontologo.nombre + "</td>";
        cuenta.forEach(function (cantidad, posicion) {
            codigo = codigo + '<td class="derecha" data-etiqueta="' + ESTADOS_CITA[posicion] + '">' + cantidad + "</td>";
        });
        codigo = codigo + '<td class="derecha" data-etiqueta="Total"><strong>' + total + "</strong></td>";
        const fila = document.createElement("tr");
        fila.innerHTML = codigo;
        filas.appendChild(fila);
        filasCsvCitas.push([odontologo.nombre].concat(cuenta, [total]));
    });

    let codigoTotal = '<td data-etiqueta="">Total</td>';
    totales.forEach(function (cantidad, posicion) {
        codigoTotal = codigoTotal + '<td class="derecha" data-etiqueta="' + ESTADOS_CITA[posicion] + '">' + cantidad + "</td>";
    });
    codigoTotal = codigoTotal + '<td class="derecha" data-etiqueta="Total">' + totalGeneral + "</td>";
    const filaTotal = document.createElement("tr");
    filaTotal.className = "total";
    filaTotal.innerHTML = codigoTotal;
    filas.appendChild(filaTotal);
    filasCsvCitas.push(["Total"].concat(totales, [totalGeneral]));
}

// RF34: pacientes con saldo pendiente, del saldo mayor al menor
function dibujarSaldos() {
    const filas = document.getElementById("filasSaldos");
    const lista = [];
    let totalSaldos = 0;

    datos.pacientes.forEach(function (paciente) {
        let saldo = 0;
        datos.presupuestos.forEach(function (presupuesto) {
            if (presupuesto.pacienteId === paciente.id) {
                saldo = saldo + saldoPresupuesto(presupuesto, datos.pagos);
            }
        });
        if (saldo > 0) {
            lista.push({ paciente: paciente, saldo: saldo });
            totalSaldos = totalSaldos + saldo;
        }
    });
    lista.sort(function (a, b) {
        return b.saldo - a.saldo;
    });

    filas.innerHTML = "";
    filasCsvSaldos = [["Paciente", "Documento", "Saldo (S/)"]];
    lista.forEach(function (elemento) {
        const fila = document.createElement("tr");
        fila.innerHTML = '<td data-etiqueta="Paciente">' + textoSeguro(nombrePaciente(elemento.paciente)) + "</td>" +
            '<td data-etiqueta="Documento">' + textoSeguro(documentoPaciente(elemento.paciente)) + "</td>" +
            '<td class="derecha" data-etiqueta="Saldo">' + formatearSoles(elemento.saldo) + "</td>";
        filas.appendChild(fila);
        filasCsvSaldos.push([nombrePaciente(elemento.paciente), documentoPaciente(elemento.paciente), elemento.saldo.toFixed(2)]);
    });

    if (lista.length > 0) {
        const filaTotal = document.createElement("tr");
        filaTotal.className = "total";
        filaTotal.innerHTML = '<td data-etiqueta="">Total por cobrar</td><td></td>' +
            '<td class="derecha" data-etiqueta="Saldo">' + formatearSoles(totalSaldos) + "</td>";
        filas.appendChild(filaTotal);
        filasCsvSaldos.push(["Total por cobrar", "", totalSaldos.toFixed(2)]);
    }
    document.getElementById("sinSaldos").hidden = lista.length > 0;
}

// RF33: ingresos por periodo, con los pagos agrupados por fecha
function dibujarIngresos() {
    const desde = document.getElementById("fechaDesde").value;
    const hasta = document.getElementById("fechaHasta").value;
    const filas = document.getElementById("filasIngresos");

    ocultarAviso("avisoIngresos");
    if (desde === "" || hasta === "" || desde > hasta) {
        mostrarAviso("avisoIngresos", "error", "Revisa el periodo",
            "Elige las dos fechas. La fecha inicial no puede ser posterior a la final.");
        return;
    }

    // suma los pagos de cada fecha dentro del periodo
    const porFecha = {};
    datos.pagos.forEach(function (pago) {
        if (pago.fecha >= desde && pago.fecha <= hasta) {
            if (porFecha[pago.fecha] === undefined) {
                porFecha[pago.fecha] = { cantidad: 0, monto: 0 };
            }
            porFecha[pago.fecha].cantidad = porFecha[pago.fecha].cantidad + 1;
            porFecha[pago.fecha].monto = porFecha[pago.fecha].monto + pago.monto;
        }
    });
    const fechas = Object.keys(porFecha).sort();
    let totalPagos = 0;
    let totalIngresos = 0;

    filas.innerHTML = "";
    filasCsvIngresos = [["Fecha", "N.º de pagos", "Ingresos (S/)"]];
    fechas.forEach(function (fecha) {
        const dia = porFecha[fecha];
        const fila = document.createElement("tr");
        fila.innerHTML = '<td data-etiqueta="Fecha">' + formatearFecha(fecha) + "</td>" +
            '<td class="derecha" data-etiqueta="N.º de pagos">' + dia.cantidad + "</td>" +
            '<td class="derecha" data-etiqueta="Ingresos">' + formatearSoles(dia.monto) + "</td>";
        filas.appendChild(fila);
        filasCsvIngresos.push([formatearFecha(fecha), dia.cantidad, dia.monto.toFixed(2)]);
        totalPagos = totalPagos + dia.cantidad;
        totalIngresos = totalIngresos + dia.monto;
    });

    if (fechas.length > 0) {
        const filaTotal = document.createElement("tr");
        filaTotal.className = "total";
        filaTotal.innerHTML = '<td data-etiqueta="">Total del periodo</td>' +
            '<td class="derecha" data-etiqueta="N.º de pagos">' + totalPagos + "</td>" +
            '<td class="derecha" data-etiqueta="Ingresos">' + formatearSoles(totalIngresos) + "</td>";
        filas.appendChild(filaTotal);
        filasCsvIngresos.push(["Total del periodo", totalPagos, totalIngresos.toFixed(2)]);
    }
    document.getElementById("sinIngresos").hidden = fechas.length > 0;
}

// RF35: exporta las filas a un archivo CSV que Excel abre con sus tildes (RNF10)
function textoCsv(filas) {
    const lineas = [];
    filas.forEach(function (fila) {
        const celdas = [];
        fila.forEach(function (valor) {
            let texto = String(valor);
            // un valor con punto y coma, comillas o salto de línea va entre comillas
            if (/[;"\n]/.test(texto)) {
                texto = '"' + texto.replace(/"/g, '""') + '"';
            }
            celdas.push(texto);
        });
        lineas.push(celdas.join(";"));
    });
    return lineas.join("\r\n");
}

function descargarCsv(nombreArchivo, filas) {
    // la marca inicial (BOM) indica a Excel que el archivo está en UTF-8
    const contenido = "﻿" + textoCsv(filas);
    const archivo = new Blob([contenido], { type: "text/csv;charset=utf-8" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
}

function iniciarReportes() {
    prepararMenu(usuario, "reportes");
    mostrarAvisoDePagina("avisoReportes");

    document.getElementById("fechaCitas").value = hoyTexto();
    document.getElementById("fechaDesde").value = sumarDias(hoyTexto(), -8);
    document.getElementById("fechaHasta").value = hoyTexto();

    dibujarCitas();
    dibujarSaldos();
    dibujarIngresos();

    document.getElementById("fechaCitas").addEventListener("change", dibujarCitas);
    document.getElementById("aplicarIngresos").addEventListener("click", dibujarIngresos);

    document.getElementById("exportarCitas").addEventListener("click", function () {
        descargarCsv("citas-del-dia-" + document.getElementById("fechaCitas").value + ".csv", filasCsvCitas);
    });
    document.getElementById("exportarSaldos").addEventListener("click", function () {
        descargarCsv("saldos-pendientes-" + hoyTexto() + ".csv", filasCsvSaldos);
    });
    document.getElementById("exportarIngresos").addEventListener("click", function () {
        descargarCsv("ingresos-" + document.getElementById("fechaDesde").value + "-a-" +
            document.getElementById("fechaHasta").value + ".csv", filasCsvIngresos);
    });
}

if (usuario !== null) {
    iniciarReportes();
}
