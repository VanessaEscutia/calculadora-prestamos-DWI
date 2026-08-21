// =====================================================
// SmartCredit UTVT - Calculadora de Prestamos
// por ahora todo junto en un archivo, luego ya se vera
// =====================================================

// calcula la cuota fija mensual con el sistema de amortizacion frances
// ESTO ERA LO QUE TENIA ANTES Y ESTABA MAL (repartia interes simple):
// const cuota = (monto + (monto * tasaMensual * plazo)) / plazo;
function calcularCuota(monto, tasaAnual, plazo) {
    const tasaMensual = (tasaAnual / 100) / 12;
    // formula buena: M x i x (1+i)^n / ((1+i)^n - 1)
    const factor = Math.pow(1 + tasaMensual, plazo);
    const cuota = monto * tasaMensual * factor / (factor - 1);
    return cuota;
}

// genera la tabla de amortizacion completa, un objeto por cuota
const calcularTablaAmortizacion = (monto, tasaAnual, plazo) => {
    const tasaMensual = (tasaAnual / 100) / 12;
    const cuotaFija = calcularCuota(monto, tasaAnual, plazo);
    let saldo = monto;
    const tabla = [];

    for (let i = 1; i <= plazo; i++) {
        const saldoInicial = saldo;
        const interes = saldoInicial * tasaMensual;
        // el IVA es 16% y va SOLO sobre el interes generado, no sobre la cuota completa
        const iva = Math.round(interes * 0.16 * 100) / 100;
        const amortizacion = cuotaFija - interes;
        saldo = saldoInicial - amortizacion;

        tabla.push({
            numeroCuota: i,
            saldoInicial: Number(saldoInicial.toFixed(2)),
            interes: Number(interes.toFixed(2)),
            iva: iva,
            amortizacion: Number(amortizacion.toFixed(2)),
            cuotaFija: Number(cuotaFija.toFixed(2)),
            saldoFinal: Number(saldo.toFixed(2))
        });
    }
    return tabla;
};

// tipo de cambio global, lo llena la API cuando responde
// si la API todavia no contesta quedan en null y convertirMontos devuelve el monto tal cual
let tipoCambioUSD = null;
let tipoCambioEUR = null;

// convierte un monto de pesos a la moneda indicada
// el tercer parametro es opcional, lo agregue para las pruebas (pasas un tc fijo)
function convertirMontos(monto, moneda, tipoCambioFijo) {
    if (moneda === 'USD') {
        const tc = tipoCambioFijo || tipoCambioUSD;
        return tc ? monto * tc : monto;
    }
    if (moneda === 'EUR') {
        const tc = tipoCambioFijo || tipoCambioEUR;
        return tc ? monto * tc : monto;
    }
    // MXN o cualquier otra cosa se regresa igual
    return monto;
}

// exporta la tabla a excel con SheetJS (la cargo por CDN en el html)
// recibe las filas ya armadas y el resumen, asi es mas facil de probar
function exportarExcel(filas, resumen) {
    const hojaTabla = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hojaTabla, "Amortizacion");

    const hojaResumen = XLSX.utils.json_to_sheet([resumen]);
    XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen");

    XLSX.writeFile(libro, "tabla_amortizacion.xlsx");
}

// genera el PDF con jsPDF + autoTable
function exportarPDF(columnas, filas, lineasResumen) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const ancho = doc.internal.pageSize.getWidth();
    doc.setFontSize(14);
    doc.text("Tabla de Amortización - SmartCredit UTVT", ancho / 2, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text("Fecha de generación: " + new Date().toLocaleString(), ancho / 2, 23, { align: "center" });

    doc.autoTable({
        head: [columnas],
        body: filas,
        startY: 30,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [26, 95, 168], textColor: 255 } // azul como los encabezados de la pagina
    });

    // resumen al final de la tabla
    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    for (let i = 0; i < lineasResumen.length; i++) {
        doc.text(lineasResumen[i], 14, y);
        y += 7;
    }

    doc.save("tabla_amortizacion.pdf");
}

// esto lo tuve que agregar para poder hacer require desde las pruebas con node
// (en el navegador module no existe y no pasa nada)
if (typeof module !== 'undefined') {
    module.exports = { calcularCuota, calcularTablaAmortizacion, convertirMontos, exportarExcel, exportarPDF };
}

// ==================== frontend ====================
// todo lo del DOM va dentro de este if para que node no explote con las pruebas
if (typeof window !== 'undefined') {

const inputMonto = document.getElementById('monto');
const inputTasa = document.getElementById('tasa');
const inputPlazo = document.getElementById('plazo');
const btnCalcular = document.getElementById('btn-calcular');
const resultadosDiv = document.getElementById('resultados');
const resumenDiv = document.getElementById('resumen');
const selectMoneda = document.getElementById('moneda');

// estado global de la vista (lo lleno cuando dan clic en calcular)
let ultimaTabla = null;
let ultimosTotales = null;
let monedaSeleccionada = 'MXN';

// pinta la tabla y el resumen en el DOM
// moneda puede ser MXN, USD, EUR o TODAS
function pintarResultados(tabla, totalIntereses, totalIva, moneda) {
    // la etiqueta de la moneda en los encabezados va dinamica
    const etiquetaMoneda = moneda === 'TODAS' ? 'MXN' : moneda;
    // armo la tabla con innerHTML, mas rapido que andar creando nodos uno por uno
    let html = '<table><thead><tr>';
    html += '<th>N° Cuota</th><th>Saldo Inicial (' + etiquetaMoneda + ')</th><th>Interés (' + etiquetaMoneda + ')</th><th>IVA (' + etiquetaMoneda + ')</th><th>Amortización (' + etiquetaMoneda + ')</th><th>Cuota Fija (' + etiquetaMoneda + ')</th><th>Saldo Final (' + etiquetaMoneda + ')</th>';
    // en modo TODAS meto columnas extra al final
    if (moneda === 'TODAS') {
        html += '<th>Cuota Fija (USD)</th><th>Cuota Fija (EUR)</th>';
    }
    html += '</tr></thead><tbody>';

    for (let i = 0; i < tabla.length; i++) {
        const fila = tabla[i];
        html += '<tr>';
        html += '<td>' + fila.numeroCuota + '</td>';
        html += '<td>$' + convertirMontos(fila.saldoInicial, moneda).toFixed(2) + '</td>';
        html += '<td>$' + convertirMontos(fila.interes, moneda).toFixed(2) + '</td>';
        html += '<td>$' + convertirMontos(fila.iva, moneda).toFixed(2) + '</td>';
        html += '<td>$' + convertirMontos(fila.amortizacion, moneda).toFixed(2) + '</td>';
        html += '<td>$' + convertirMontos(fila.cuotaFija, moneda).toFixed(2) + '</td>';
        html += '<td>$' + convertirMontos(fila.saldoFinal, moneda).toFixed(2) + '</td>';
        // estas dos celdas van solo en modo TODAS
        if (moneda === 'TODAS') {
            html += '<td>$' + convertirMontos(fila.cuotaFija, 'USD').toFixed(2) + '</td>';
            html += '<td>$' + convertirMontos(fila.cuotaFija, 'EUR').toFixed(2) + '</td>';
        }
        html += '</tr>';
    }

    html += '</tbody></table>';
    resultadosDiv.innerHTML = html;

    resumenDiv.innerHTML = '<p>Total de intereses pagados: $' + convertirMontos(totalIntereses, moneda).toFixed(2) + '</p>' +
                           '<p>Total de IVA pagado: $' + convertirMontos(totalIva, moneda).toFixed(2) + '</p>';
}

// obtiene el tipo de cambio y pinta los equivalentes en USD/EUR
// URL hardcodeada porque la version free no necesita api key
function obtenerTipoCambio(primeraCuota, totalPrestamo) {
    fetch('https://open.er-api.com/v6/latest/MXN')
        .then(function(respuesta) {
            // este chequeo lo agregue porque si la API fallaba el .then de abajo
            // se quedaba raro y no avisaba nada
            if (!respuesta.ok) {
                throw new Error('La API respondio con error ' + respuesta.status);
            }
            return respuesta.json();
        })
        .then(function(datos) {
            // guardo los tc en las variables globales, las usa el selector de moneda
            tipoCambioUSD = datos.rates.USD;
            tipoCambioEUR = datos.rates.EUR;
            const tcUSD = tipoCambioUSD;
            const tcEUR = tipoCambioEUR;
            const equivalenteUsd = (primeraCuota * tcUSD).toFixed(2);
            const equivalenteEur = (primeraCuota * tcEUR).toFixed(2);
            const equivDivisas = document.getElementById('equiv-divisas');
            equivDivisas.innerHTML =
                '<p>Primera cuota: $' + equivalenteUsd + ' USD / €' + equivalenteEur + ' EUR</p>' +
                '<p>Total del préstamo: $' + (totalPrestamo * tcUSD).toFixed(2) + ' USD / $' + (totalPrestamo * tcEUR).toFixed(2) + ' EUR</p>';

            // si el usuario ya habia elegido otra moneda, repinto la tabla con el tc real
            if (monedaSeleccionada !== 'MXN' && ultimaTabla) {
                pintarResultados(ultimaTabla, ultimosTotales.intereses, ultimosTotales.iva, monedaSeleccionada);
            }
        })
        .catch(function(error) {
            console.error(error);
            // aviso al usuario y la app sigue funcionando en pesos
            alert('No se pudo obtener el tipo de cambio');
            const equivDivisas = document.getElementById('equiv-divisas');
            equivDivisas.innerHTML = '<p>No se pudo obtener el tipo de cambio, los resultados se muestran en pesos</p>';
        });
}

btnCalcular.addEventListener('click', function() {
    // valido hasta aqui porque si valido mientras escriben molesta mucho
    const monto = parseFloat(inputMonto.value);
    const tasa = parseFloat(inputTasa.value);
    const plazo = parseInt(inputPlazo.value);

    if (isNaN(monto) || isNaN(tasa) || isNaN(plazo)) {
        alert('Llena todos los campos con números válidos');
        return;
    }

    const tabla = calcularTablaAmortizacion(monto, tasa, plazo);

    let totalIntereses = 0;
    let totalIva = 0;
    for (let i = 0; i < tabla.length; i++) {
        totalIntereses += tabla[i].interes;
        totalIva += tabla[i].iva;
    }

    // guardo el estado para cuando cambien la moneda desde el select
    ultimaTabla = tabla;
    ultimosTotales = { intereses: totalIntereses, iva: totalIva };

    pintarResultados(tabla, totalIntereses, totalIva, monedaSeleccionada);

    obtenerTipoCambio(tabla[0].cuotaFija, monto + totalIntereses + totalIva);
});

// cuando cambian la moneda del select vuelvo a pintar con lo que ya tenia calculado
selectMoneda.addEventListener('change', function() {
    monedaSeleccionada = selectMoneda.value;
    if (ultimaTabla) {
        pintarResultados(ultimaTabla, ultimosTotales.intereses, ultimosTotales.iva, monedaSeleccionada);
    }
});

// ===== exportaciones =====
// armo las filas respetando la moneda que esta viendo el usuario
// ojo: si la API no ha respondido, convertirMontos regresa pesos aunque diga USD, caso raro
function armarFilasExport() {
    return ultimaTabla.map(function(f) {
        if (monedaSeleccionada === 'TODAS') {
            return {
                "N° Cuota": f.numeroCuota,
                "Saldo Inicial (MXN)": f.saldoInicial,
                "Interés (MXN)": f.interes,
                "IVA (MXN)": f.iva,
                "Amortización (MXN)": f.amortizacion,
                "Cuota Fija (MXN)": f.cuotaFija,
                "Saldo Final (MXN)": f.saldoFinal,
                "Cuota Fija (USD)": Number(convertirMontos(f.cuotaFija, 'USD').toFixed(2)),
                "Cuota Fija (EUR)": Number(convertirMontos(f.cuotaFija, 'EUR').toFixed(2))
            };
        }
        if (monedaSeleccionada === 'MXN') {
            return {
                "N° Cuota": f.numeroCuota,
                "Saldo Inicial": f.saldoInicial,
                "Interés": f.interes,
                "IVA": f.iva,
                "Amortización": f.amortizacion,
                "Cuota Fija": f.cuotaFija,
                "Saldo Final": f.saldoFinal
            };
        }
        // USD o EUR: convierto todas las columnas
        return {
            "N° Cuota": f.numeroCuota,
            "Saldo Inicial": Number(convertirMontos(f.saldoInicial, monedaSeleccionada).toFixed(2)),
            "Interés": Number(convertirMontos(f.interes, monedaSeleccionada).toFixed(2)),
            "IVA": Number(convertirMontos(f.iva, monedaSeleccionada).toFixed(2)),
            "Amortización": Number(convertirMontos(f.amortizacion, monedaSeleccionada).toFixed(2)),
            "Cuota Fija": Number(convertirMontos(f.cuotaFija, monedaSeleccionada).toFixed(2)),
            "Saldo Final": Number(convertirMontos(f.saldoFinal, monedaSeleccionada).toFixed(2))
        };
    });
}

function armarResumenExport() {
    return {
        "Monto": inputMonto.value,
        "Tasa Anual (%)": inputTasa.value,
        "Plazo (meses)": inputPlazo.value,
        "Total Intereses": ultimosTotales.intereses.toFixed(2),
        "Total IVA": ultimosTotales.iva.toFixed(2),
        "Cuota Mensual": ultimaTabla[0].cuotaFija
    };
}

document.getElementById('btn-excel').addEventListener('click', function() {
    if (!ultimaTabla) {
        alert('Primero calcula un crédito');
        return;
    }
    exportarExcel(armarFilasExport(), armarResumenExport());
});

document.getElementById('btn-pdf').addEventListener('click', function() {
    if (!ultimaTabla) {
        alert('Primero calcula un crédito');
        return;
    }
    const etiqueta = monedaSeleccionada === 'TODAS' ? 'MXN' : monedaSeleccionada;
    const columnas = ['N° Cuota', 'Saldo Inicial (' + etiqueta + ')', 'Interés (' + etiqueta + ')', 'IVA (' + etiqueta + ')', 'Amortización (' + etiqueta + ')', 'Cuota Fija (' + etiqueta + ')', 'Saldo Final (' + etiqueta + ')'];
    if (monedaSeleccionada === 'TODAS') {
        columnas.push('Cuota Fija (USD)', 'Cuota Fija (EUR)');
    }
    // para el pdf necesito arreglos simples, no objetos como el excel
    const filas = armarFilasExport().map(function(obj) { return Object.values(obj); });
    const resumen = armarResumenExport();
    const lineasResumen = [
        "Monto: $" + resumen["Monto"],
        "Tasa Anual: " + resumen["Tasa Anual (%)"] + "%",
        "Plazo: " + resumen["Plazo (meses)"] + " meses",
        "Total Intereses: $" + resumen["Total Intereses"],
        "Total IVA: $" + resumen["Total IVA"],
        "Cuota Mensual: $" + resumen["Cuota Mensual"]
    ];
    exportarPDF(columnas, filas, lineasResumen);
});
}
