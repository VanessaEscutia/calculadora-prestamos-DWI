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

// ==================== frontend ====================

const inputMonto = document.getElementById('monto');
const inputTasa = document.getElementById('tasa');
const inputPlazo = document.getElementById('plazo');
const btnCalcular = document.getElementById('btn-calcular');
const resultadosDiv = document.getElementById('resultados');
const resumenDiv = document.getElementById('resumen');

// pinta la tabla y el resumen en el DOM
function pintarResultados(tabla, totalIntereses, totalIva) {
    // armo la tabla con innerHTML, mas rapido que andar creando nodos uno por uno
    let html = '<table><thead><tr>';
    html += '<th>N° Cuota</th><th>Saldo Inicial</th><th>Interés</th><th>IVA</th><th>Amortización</th><th>Cuota Fija</th><th>Saldo Final</th>';
    html += '</tr></thead><tbody>';

    for (let i = 0; i < tabla.length; i++) {
        const fila = tabla[i];
        html += '<tr>';
        html += '<td>' + fila.numeroCuota + '</td>';
        html += '<td>$' + fila.saldoInicial.toFixed(2) + '</td>';
        html += '<td>$' + fila.interes.toFixed(2) + '</td>';
        html += '<td>$' + fila.iva.toFixed(2) + '</td>';
        html += '<td>$' + fila.amortizacion.toFixed(2) + '</td>';
        html += '<td>$' + fila.cuotaFija.toFixed(2) + '</td>';
        html += '<td>$' + fila.saldoFinal.toFixed(2) + '</td>';
        html += '</tr>';
    }

    html += '</tbody></table>';
    resultadosDiv.innerHTML = html;

    resumenDiv.innerHTML = '<p>Total de intereses pagados: $' + totalIntereses.toFixed(2) + '</p>' +
                           '<p>Total de IVA pagado: $' + totalIva.toFixed(2) + '</p>';
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

    pintarResultados(tabla, totalIntereses, totalIva);
});
