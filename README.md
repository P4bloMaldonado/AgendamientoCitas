# 🦷 Sistema de Gestión de Citas Odontológicas

Un sistema completo de gestión de citas diseñado específicamente para consultorios dentales y clínicas odontológicas..

## ✨ Características

- **📋 Gestión Completa de Citas**: Crear, editar, eliminar y visualizar citas dentales
- **👥 Administración de Pacientes**: Base de datos de pacientes con historial médico
- **🦷 Catálogo de Tratamientos**: Gestión de tratamientos odontológicos por categorías
- **📊 Dashboard con Estadísticas**: Vista general del estado de las citas
- **🔍 Filtros Avanzados**: Búsqueda por fecha, paciente o estado
- **⚠️ Alertas Médicas**: Notificaciones de alergias y condiciones especiales
- **📱 Interfaz Responsiva**: Funciona en desktop, tablet y móvil
- **⚡ Tiempo Real**: Actualizaciones instantáneas
- **🎨 Diseño Moderno**: Interfaz intuitiva específica para odontología

## 🏗️ Estructura del Proyecto

```
PROYECTO-CONSTRUCCION/
├── node_modules/              # Dependencias instaladas
├── public/                    # Archivos estáticos del frontend
│   ├── index.html            # Interfaz principal de usuario
│   ├── css/
│   │   └── styles.css        # Estilos CSS
│   └── js/
│       └── app.js           # JavaScript del frontend
├── src/                      # Código fuente del backend
│   ├── controllers/          # Lógica de negocio
│   │   └── appointmentController.js
│   ├── models/              # Modelos de datos
│   │   └── appointment.js
│   ├── routes/              # Rutas de la API
│   │   └── appointments.js
│   └── database/            # Configuración de base de datos
│       └── connection.js
├── .env                     # Variables de entorno
├── package.json             # Configuración de dependencias
├── package-lock.json        # Lock de versiones
├── server.js               # Servidor principal
└── README.md               # Este archivo└── appointment.js
│   ├── routes/              # Rutas de la API
│   │   └── appointments.js
│   └── database/            # Configuración de base de datos
│       └── connection.js
├── .env                     # Variables de entorno
├── package.json             # Configuración de dependencias
├── package-lock.json        # Lock de versiones
├── server.js               # Servidor principal
└── README.md               # Este archivo
```

## 🚀 Instalación y Configuración

### 1. Prerrequisitos

- Node.js (versión 14 o superior)
- MySQL (versión 5.7 o superior)
- NPM o Yarn

### 2. Instalación

```bash
# Clonar o descargar el proyecto
cd PROYECTO-CONSTRUCCION

# Instalar dependencias
npm install
```

### 3. Configuración de la Base de Datos

1. **Crear la base de datos en MySQL:**
```sql
CREATE DATABASE dental_appointment_management;
```

2. **Configurar variables de entorno:**
Edita el archivo `.env` con tus datos:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de la base de datos
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=dental_appointment_management
DB_PORT=3306

# JWT Secret (cambia por una clave única)
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
```

### 4. Inicializar el Proyecto

```bash
# Modo desarrollo (con recarga automática)
npm run dev

# Modo producción
npm start
```

El servidor se iniciará en `http://localhost:3000`

## 📊 Base de Datos

### Tablas Creadas Automáticamente

El sistema crea automáticamente las siguientes tablas:

#### `patients` - Pacientes
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), UNIQUE)
- `phone` (VARCHAR(20))
- `address` (TEXT)
- `birth_date` (DATE)
- `emergency_contact` (VARCHAR(255))
- `emergency_phone` (VARCHAR(20))
- `medical_history` (TEXT)
- `allergies` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `treatments` - Tratamientos Odontológicos
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `name` (VARCHAR(255), NOT NULL)
- `description` (TEXT)
- `duration` (INT, default 30 minutos)
- `price` (DECIMAL(10,2))
- `category` (ENUM: preventivo, restaurativo, endodoncia, cirugia, estetico, ortodoncia, periodontal)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `appointments` - Citas
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `patient_id` (INT, FOREIGN KEY)
- `treatment_id` (INT, FOREIGN KEY)
- `appointment_date` (DATE, NOT NULL)
- `appointment_time` (TIME, NOT NULL)
- `status` (ENUM: 'agendada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio')
- `notes` (TEXT) - Notas del paciente
- `dentist_notes` (TEXT) - Notas del dentista
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Datos de Ejemplo

El sistema incluye datos de ejemplo que se insertan automáticamente:

**Pacientes:**
- María González (maria.gonzalez@email.com) - 38 años, Alérgica a Penicilina
- Carlos Rodríguez (carlos.rodriguez@email.com) - 34 años, Diabético
- Ana López (ana.lopez@email.com) - 46 años, Alérgica a Latex
- José Martínez (jose.martinez@email.com) - 29 años, Asmático
- Laura Herrera (laura.herrera@email.com) - 36 años, Alérgica a Ibuprofeno

**Tratamientos Odontológicos:**

**Preventivos:**
- Consulta General ($80.00, 30 min)
- Limpieza Dental ($120.00, 45 min)
- Selladores ($60.00, 30 min)

**Restaurativos:**
- Empaste Composite ($180.00, 60 min)
- Corona Dental ($800.00, 90 min)

**Endodoncia:**
- Endodoncia ($450.00, 90 min)

**Cirugía:**
- Extracción Simple ($150.00, 30 min)

**Estéticos:**
- Blanqueamiento Dental ($300.00, 60 min)

**Periodontales:**
- Limpieza Profunda ($200.00, 75 min)

**Ortodoncia:**
- Ortodoncia Consulta ($100.00, 45 min)

## 🔗 API Endpoints

### Citas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/appointments` | Obtener todas las citas |
| `GET` | `/api/appointments/:id` | Obtener cita por ID |
| `GET` | `/api/appointments/date/:date` | Obtener citas por fecha |
| `GET` | `/api/appointments/client/:clientId` | Obtener citas por cliente |
| `GET` | `/api/appointments/stats` | Obtener estadísticas |
| `POST` | `/api/appointments` | Crear nueva cita |
| `PUT` | `/api/appointments/:id` | Actualizar cita |
| `DELETE` | `/api/appointments/:id` | Eliminar cita |

### Datos Auxiliares

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/appointments/data/clients` | Obtener lista de clientes |
| `GET` | `/api/appointments/data/services` | Obtener lista de servicios |

### Ejemplo de Petición

```javascript
// Crear nueva cita odontológica
POST /api/appointments
Content-Type: application/json

{
    "patient_id": 1,
    "treatment_id": 2,
    "appointment_date": "2024-12-20",
    "appointment_time": "10:30",
    "notes": "Paciente reporta dolor en muela superior derecha",
    "dentist_notes": "Evaluación inicial para posible endodoncia"
}
```

### Ejemplo de Respuesta

```javascript
{
    "success": true,
    "message": "Cita creada exitosamente",
    "data": {
        "id": 15,
        "patient_id": 1,
        "treatment_id": 2,
        "appointment_date": "2024-12-20",
        "appointment_time": "10:30:00",
        "status": "agendada",
        "notes": "Paciente reporta dolor en muela superior derecha",
        "dentist_notes": "Evaluación inicial para posible endodoncia",
        "patient_name": "María González",
        "patient_email": "maria.gonzalez@email.com",
        "patient_allergies": "Penicilina",
        "treatment_name": "Empaste Composite",
        "treatment_category": "restaurativo",
        "treatment_price": "180.00",
        "created_at": "2024-12-15T14:30:00.000Z"
    }
}
```

## 🎯 Uso del Sistema

### Panel Principal

1. **Dashboard de Estadísticas**: Vista general con contadores de citas odontológicas
2. **Formulario de Nueva Cita**: Crear citas dentales de manera rápida
3. **Lista de Citas**: Visualizar todas las citas programadas con información del paciente
4. **Filtros**: Buscar citas por fecha específica
5. **Alertas de Alergias**: Notificaciones visuales para pacientes con alergias

### Gestión de Citas Odontológicas

- **Crear**: Llenar el formulario con paciente, tratamiento, fecha y hora
- **Editar**: Hacer clic en "Editar" en cualquier cita para modificar datos
- **Eliminar**: Confirmar eliminación con el botón "Eliminar"
- **Estados**: Agendada → Confirmada → En Curso → Completada (o Cancelada/No Asistió)
- **Notas Médicas**: Separación entre notas del paciente y del dentista

### Estados de Citas Odontológicas

- 🟡 **Agendada**: Cita recién creada, esperando confirmación
- 🔵 **Confirmada**: Paciente confirmó asistencia
- 🟠 **En Curso**: Tratamiento dental en progreso
- 🟢 **Completada**: Tratamiento finalizado exitosamente
- 🔴 **Cancelada**: Cita cancelada por cualquier motivo
- ⚫ **No Asistió**: Paciente no se presentó a la cita

### Categorías de Tratamientos

- **🛡️ Preventivo**: Consultas, limpiezas, selladores
- **🔧 Restaurativo**: Empastes, coronas, incrustaciones
- **🦷 Endodoncia**: Tratamientos de conducto
- **⚔️ Cirugía**: Extracciones, implantes
- **✨ Estético**: Blanqueamientos, carillas
- **📐 Ortodoncia**: Brackets, alineadores
- **🩺 Periodontal**: Tratamiento de encías

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js**: Entorno de ejecución
- **Express.js**: Framework web
- **MySQL2**: Base de datos relacional
- **dotenv**: Gestión de variables de entorno
- **cors**: Manejo de CORS
- **bcryptjs**: Encriptación (preparado para futuras funciones)
- **jsonwebtoken**: Tokens JWT (preparado para autenticación)

### Frontend
- **HTML5**: Estructura
- **CSS3**: Estilos con gradientes y animaciones
- **JavaScript ES6+**: Lógica del cliente
- **Font Awesome**: Iconografía
- **Fetch API**: Comunicación con el backend

## 🔧 Scripts Disponibles

```bash
# Iniciar en modo desarrollo (con nodemon)
npm run dev

# Iniciar en modo producción
npm start

# Instalar dependencias
npm install
```

## 📈 Características Avanzadas

- **Validación de Datos**: Validación completa en frontend y backend
- **Manejo de Errores**: Sistema robusto de manejo de errores
- **Interfaz Responsiva**: Adaptable a todos los dispositivos
- **Feedback Visual**: Alertas y estados de carga
- **Prevención de Conflictos**: No permite citas duplicadas en el mismo horario
- **Formato de Datos**: Fechas y horas en formato local
- **Performance**: Carga optimizada de datos

## 🚨 Solución de Problemas

### Error de Conexión a la Base de Datos
```bash
# Verificar que MySQL esté ejecutándose
sudo service mysql start

# Verificar credenciales en .env
# Verificar que la base de datos existe
```

### Puerto en Uso
```bash
# Cambiar el puerto en .env
PORT=3001
```

### Dependencias
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## 🔮 Futuras Mejoras Odontológicas

- [ ] **Sistema de Expedientes**: Historial clínico completo por paciente
- [ ] **Radiografías Digitales**: Upload y visualización de imágenes
- [ ] **Recordatorios SMS/Email**: Notificaciones automáticas de citas
- [ ] **Odontograma Digital**: Mapa dental interactivo
- [ ] **Facturación Integrada**: Sistema de cobros y seguros
- [ ] **Agenda Multi-Dentista**: Gestión de varios profesionales
- [ ] **Tratamientos Múltiples**: Plan de tratamiento por etapas
- [ ] **Estadísticas Clínicas**: Reportes de tratamientos más frecuentes
- [ ] **Integración con Laboratorio**: Comunicación con laboratorio dental
- [ ] **App Móvil para Pacientes**: Confirmación de citas desde móvil

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.

## 👨‍⚕️ Autor

Desarrollado específicamente para la gestión eficiente de citas en consultorios dentales y clínicas odontológicas.

---

**¿Necesitas ayuda?** Revisa la documentación o consulta los logs del servidor para más información sobre errores específicos.

## 🦷 Nota Importante para Odontólogos

Este sistema está diseñado para facilitar la gestión administrativa de consultorios dentales. No reemplaza el criterio profesional ni los sistemas de diagnóstico médico. Siempre consulte las regulaciones locales sobre manejo de datos médicos y privacidad de pacientes.