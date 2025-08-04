# 📦 Librería Personalizada: libreria-utilidades

Librería independiente con funciones reutilizables para proyectos JavaScript.

## Funciones

- `formatCurrency(valor)` – Convierte un número a formato de moneda (`$`)
- `capitalize(texto)` – Pone en mayúscula la primera letra del texto
- `isWeekend(fecha)` – Devuelve `true` si la fecha es sábado o domingo

## Ejemplo de uso

```js
const { formatCurrency } = require('./index');
console.log(formatCurrency(15)); // $15.00
