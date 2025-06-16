const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patientController');

// Middleware para logging de requests
router.use((req, res, next) => {
    console.log(`👥 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});

// GET /api/patients/search - Buscar pacientes
router.get('/search', PatientController.searchPatients);

// GET /api/patients - Obtener todos los pacientes
router.get('/', PatientController.getAllPatients);

// GET /api/patients/:id - Obtener un paciente por ID
router.get('/:id', PatientController.getPatientById);

// POST /api/patients - Crear un nuevo paciente
router.post('/', PatientController.createPatient);

// PUT /api/patients/:id - Actualizar un paciente
router.put('/:id', PatientController.updatePatient);

// DELETE /api/patients/:id - Eliminar un paciente
router.delete('/:id', PatientController.deletePatient);

// Middleware para manejar rutas no encontradas
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        availableEndpoints: [
            'GET /api/patients - Obtener todos los pacientes',
            'GET /api/patients/:id - Obtener paciente por ID',
            'GET /api/patients/search?q=término - Buscar pacientes',
            'POST /api/patients - Crear nuevo paciente',
            'PUT /api/patients/:id - Actualizar paciente',
            'DELETE /api/patients/:id - Eliminar paciente'
        ]
    });
});

module.exports = router;