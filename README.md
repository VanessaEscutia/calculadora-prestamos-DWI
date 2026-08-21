# SmartCredit UTVT - Calculadora de Préstamos

SPA hecha con HTML, CSS y JavaScript puro (vanilla) que calcula prestamos usando el
**sistema de amortización frances** (cuotas fijas mensuales), con IVA del 16% sobre
el interes de cada cuota. Tambien convierte los resultados a USD y EUR con una API
publica de tipos de cambio, y exporta la tabla a Excel y PDF.

## 🔗 Demo en produccion

> https://vanessaescutia.github.io/calculadora-prestamos-DWI/

*(si el link no carga, los pasos de instalacion local de abajo funcionan siempre)*

## 🛠️ Instalacion y ejecucion local

No hay paso de compilacion ni dependencias, es JS puro:

1. Clona el repositorio:
   ```
   git clone https://github.com/VanessaEscutia/calculadora-prestamos-DWI.git
   ```
2. Abre `index.html` directo en tu navegador (doble clic), **o**
3. Usa la extension Live Server de VS Code, **o**
4. Corre un server estatico cualquiera: `npx serve .` o `python -m http.server`

Para correr las pruebas unitarias necesitas Node.js:

```
node test.js
```

## 📖 Uso

1. Escribe el **monto** en pesos mexicanos (ej. 10000)
2. Escribe la **tasa de interes anual** en porcentaje (ej. 12)
3. Escribe el **plazo** en meses (ej. 12)
4. Dale clic a **Calcular**

La app muestra la tabla completa de amortizacion (saldo inicial, interes, IVA,
amortizacion, cuota fija y saldo final por mes), el total de intereses, el total
de IVA pagado, y el equivalente en USD/EUR.

## 🪙 Selector de Moneda

Debajo del boton **Calcular** hay un selector para ver los resultados en otra moneda:

| Opcion | Que hace |
|--------|----------|
| MXN | Todo en pesos mexicanos (por defecto) |
| USD | Convierte todas las cantidades a dolares |
| EUR | Convierte todas las cantidades a euros |
| TODAS | Muestra las columnas en pesos + columnas extra en USD y EUR |

El tipo de cambio lo obtiene de la misma API de divisas. Si cambias la moneda
antes de calcular, la tabla sale con la moneda seleccionada en cuanto la API responda.

## 📤 Exportaciones

Debajo de la tabla hay dos botones:

- **📊 Exportar a Excel**: genera `tabla_amortizacion.xlsx` con 2 hojas:
  - Hoja 1 "Amortizacion": la tabla completa con las monedas que estes viendo
  - Hoja 2 "Resumen": Monto, Tasa, Plazo, Total Intereses, Total IVA y Cuota Mensual
- **📄 Exportar a PDF**: genera `tabla_amortizacion.pdf` con titulo
  "Tabla de Amortización - SmartCredit UTVT", fecha de generacion, la tabla
  completa y el resumen al final.

## 🧰 Tecnologias utilizadas

- HTML5 + CSS3 + JavaScript vanilla (sin frameworks)
- [SheetJS (xlsx)](https://cdn.sheetjs.com/) para exportar a Excel
- [jsPDF](https://cdnjs.com/libraries/jspdf) + [jspdf-autotable](https://cdnjs.com/libraries/jspdf-autotable) para exportar a PDF
- assert nativo de Node.js para las pruebas

## 🧪 Pruebas

Las pruebas usan el modulo `assert` nativo de Node (no use Jest porque para 4
pruebas era matar moscas a cañonazos).

Comando:

```
node test.js
```

### Reporte de pruebas ejecutadas

| # | Prueba | Valores | Esperado | Obtenido | Estado |
|---|--------|---------|----------|----------|--------|
| 1 | Cuota fija (amortización frances) | monto=10000, tasa=12%, plazo=12 | 888.49 | 888.49 | ✅ Paso |
| 2 | IVA sobre interes (cuotas 1 y 2) | monto=10000, tasa=12%, plazo=12 | 16.00 / 14.74 | 16.00 / 14.74 | ✅ Paso |
| 3 | Conversion MXN → USD con tc fijo (1 USD = 20 MXN) | 100 MXN, tc=0.05 | 5.00 USD | 5.00 USD | ✅ Paso |
| 4 | Funciones de exportacion existen | exportarExcel / exportarPDF | function | function | ✅ Paso |

**Resultado: 4/4 pruebas pasaron ✔** (ejecutadas antes del deploy a produccion)

## 📦 Matriz de componentes integrados

| Componente | Tecnologia | Responsabilidad | Estado |
|------------|------------|-----------------|--------|
| Frontend | HTML5 + CSS3 + JS vanilla | Formulario, tabla, resumen, selector de moneda, responsive | ✅ Completo |
| Backend / Calculo | JavaScript (logica compartida con Node) | Amortizacion francesa, IVA 16%, conversion de moneda, totales | ✅ Completo |
| API Externa | open.er-api.com (ExchangeRate-API) | Tipo de cambio MXN → USD / EUR | ✅ Integrada |
| Exportaciones | SheetJS + jsPDF/autoTable (CDN) | Excel de 2 hojas y PDF con tabla y resumen | ✅ Completo |
| Pruebas | assert nativo de Node.js | Validacion de cuota, IVA, conversion y exportaciones | ✅ 4/4 pasan |

## 📁 Estructura del proyecto

```
├── index.html      # estructura de la SPA
├── style.css       # estilos
├── script.js       # logica de calculo + frontend + consumo de API + exportaciones
├── test.js         # pruebas unitarias con assert nativo
└── README.md
```

## 🤝 Como contribuir

Este es un proyecto escolar asi que no espero contribuciones, pero si quieres
meterle mano:

1. Haz fork del repo
2. Crea tu rama: `git checkout -b feature/tu-mejora`
3. Haz tus cambios y commit: `git commit -m "feat: tu mejora"`
4. Push y abre un Pull Request

## ⚠️ Problemas conocidos

- La API de divisas puede tardar 3-5 segundos en responder la primera vez
  (las siguientes respuestas ya son rapidas por el cache de la API).
- Si cambias la moneda antes de que la API responda, la tabla se ve en pesos
  y en cuanto llega el tipo de cambio se actualiza sola.
- Si la API falla del todo, el selector USD/EUR deja los numeros en pesos
  (convertirMontos regresa el monto tal cual si no hay tipo de cambio).
- El ultimo saldo puede variar por 1 centavo respecto a otras calculadoras
  por el redondeo a 2 decimales en cada fila.
- La URL de la API esta hardcodeada en `script.js`, ya se que deberia ir en una
  variable de entorno pero para un proyecto estatico no hay backend donde
  guardarla.

## 📝 Notas del autor

Proyecto para la materia de Desarrollo Web Integral (DWI) en la UTVT.
El calculo usa la formula de la cuota fija: `M x i x (1+i)^n / ((1+i)^n - 1)`
donde `i` es la tasa mensual y `n` el numero de pagos. El IVA se aplica
unicamente sobre el interes generado en cada cuota, no sobre el pago completo.
