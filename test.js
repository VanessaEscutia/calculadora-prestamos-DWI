// pruebas unitarias con el assert nativo de node, sin jest ni nada raro
// para correrlas: node test.js
const assert = require('assert');
const { calcularCuota, calcularTablaAmortizacion, convertirMontos, exportarExcel, exportarPDF } = require('./script.js');

// prueba 1: la cuota fija con valores conocidos
// 10000 pesos al 12% anual a 12 meses debe dar 888.49
// (lo verifique contra una calculadora online de amortizacion frances)
const cuota = calcularCuota(10000, 12, 12);
// console.log('La cuota me dio:', cuota); // esto lo use para verificar a mano
assert.strictEqual(Number(cuota.toFixed(2)), 888.49, 'La cuota fija no coincide con el valor esperado');
console.log('Prueba 1 paso ✓');

// prueba 2: el IVA se calcula sobre el interes de cada cuota
// primera cuota: interes = 10000 * 0.01 = 100 -> IVA = 16
const tabla = calcularTablaAmortizacion(10000, 12, 12);
assert.strictEqual(tabla[0].iva, 16, 'El IVA de la primera cuota deberia ser 16');
// de paso tambien checo la segunda cuota por si acaso
// interes de la 2da = 9211.51 * 0.01 = 92.1151 -> iva = 14.74
assert.strictEqual(tabla[1].iva, 14.74, 'El IVA de la segunda cuota deberia ser 14.74');
console.log('Prueba 2 paso ✓');

// prueba 3: conversion de moneda con tipo de cambio fijo
// 1 USD = 20 MXN -> 100 pesos deben ser 5 dolares (el tc me lo dan como 0.05)
const dolares = convertirMontos(100, 'USD', 0.05);
assert.strictEqual(Number(dolares.toFixed(2)), 5, 'La conversion a USD no cuadra');
// de paso pruebo euros: 1 EUR = 18 MXN -> 90 pesos = 5 EUR
const euros = convertirMontos(90, 'EUR', 1 / 18);
assert.strictEqual(Number(euros.toFixed(2)), 5, 'La conversion a EUR no cuadra');
console.log('Prueba 3 paso ✓');

// prueba 4: solo verifico que las funciones de exportacion existan
// (generar el archivo real necesita el navegador, pero asi confirmo que estan conectadas)
assert.strictEqual(typeof exportarExcel, 'function', 'exportarExcel no existe o no se exporta');
assert.strictEqual(typeof exportarPDF, 'function', 'exportarPDF no existe o no se exporta');
console.log('Prueba 4 paso ✓');

console.log('Todas las pruebas pasaron :)');
