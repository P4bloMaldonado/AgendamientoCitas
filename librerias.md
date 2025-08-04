# 📦 Librería personalizada: utilidades.js

## 📍 Ubicación

Frontend:
- `GestorCitas/public/js/lib/utilidades.js`

Backend:
- `libreriaUtilidades/index.js`

---

## 📄 Descripción

Se desarrolló una librería modular y reutilizable con funciones auxiliares para formatear datos comunes en el sistema de gestión de citas odontológicas. Esta librería ayuda a mejorar la legibilidad del código y a evitar duplicación de lógica.

---

## 🛠️ Funciones disponibles

| Función           | Descripción                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| `formatCurrency`  | Formatea un número como una cadena con formato monetario (`$12.34`)         |
| `capitalize`      | Convierte la primera letra de un texto a mayúscula                          |
| `isWeekend`       | Retorna `true` si una fecha corresponde a sábado o domingo (`Date string`)  |

---

## 💻 Ejemplo de uso en frontend

```js
// app.js o patients.js
import { formatCurrency, capitalize, isWeekend } from './lib/utilidades.js';

console.log(formatCurrency(45.678));      // $45.68
console.log(capitalize("odontología"));   // Odontología
console.log(isWeekend("2025-08-10"));     // true (es domingo)
