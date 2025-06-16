const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');

// Middleware para logging de requests
router.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});

// === RUTAS PRINCIPALES DE CITAS ===

// GET /api/appointments - Obtener todas las citas
router.get('/', AppointmentController.getAllAppointments);

// GET /api/appointments/stats - Obtener estadísticas de citas
router.get('/stats', AppointmentController.getAppointmentStats);

// GET /api/appointments/date/:date - Obtener citas por fecha
router.get('/date/:date', AppointmentController.getAppointmentsByDate);

// GET /api/appointments/patient/:patientId - Obtener citas por paciente
router.get('/patient/:patientId', AppointmentController.getAppointmentsByPatient);

// GET /api/appointments/:id - Obtener una cita por ID
router.get('/:id', AppointmentController.getAppointmentById);

// POST /api/appointments - Crear una nueva cita
router.post('/', AppointmentController.createAppointment);

// PUT /api/appointments/:id - Actualizar una cita
router.put('/:id', AppointmentController.updateAppointment);

// DELETE /api/appointments/:id - Eliminar una cita
router.delete('/:id', AppointmentController.deleteAppointment);

// === RUTAS AUXILIARES ===

// GET /api/appointments/data/patients - Obtener lista de pacientes
router.get('/data/patients', AppointmentController.getPatients);

// GET /api/appointments/data/treatments - Obtener lista de tratamientos
router.get('/data/treatments', AppointmentController.getTreatments);

// === MIDDLEWARE DE MANEJO DE ERRORES ===

// Middleware para manejar rutas no encontradas en este router
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        availableEndpoints: [
            'GET /api/appointments - Obtener todas las citas',
            'GET /api/appointments/:id - Obtener cita por ID',
            'GET /api/appointments/date/:date - Obtener citas por fecha (YYYY-MM-DD)',
            'GET /api/appointments/patient/:patientId - Obtener citas por paciente',
            'GET /api/appointments/stats - Obtener estadísticas',
            'GET /api/appointments/data/patients - Obtener pacientes',
            'GET /api/appointments/data/treatments - Obtener tratamientos',
            'POST /api/appointments - Crear nueva cita',
            'PUT /api/appointments/:id - Actualizar cita',
            'DELETE /api/appointments/:id - Eliminar cita'
        ]
    });
});

module.exports = router;