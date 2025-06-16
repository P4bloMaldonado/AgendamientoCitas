const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Importar la conexión a la base de datos
const { initializeDatabase, testConnection } = require('./src/database/connection');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Importar rutas
const appointmentRoutes = require('./src/routes/appointments');
const patientRoutes = require('./src/routes/patients');

// Usar las rutas
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para manejar errores 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        message: 'La ruta solicitada no existe'
    });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'Algo salió mal en el servidor'
    });
});

// Inicializar el servidor y la base de datos
async function startServer() {
    try {
        // Probar conexión a la base de datos
        const dbConnected = await testConnection();
        if (!dbConnected) {
            throw new Error('No se pudo conectar a la base de datos');
        }

        // Inicializar la base de datos (crear tablas si no existen)
        await initializeDatabase();

        // Iniciar el servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`🦷 Sistema de Gestión de Citas Odontológicas`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`💾 Base de datos: ${process.env.DB_NAME || 'gestor_citas'}`);
            console.log(`👥 Rutas disponibles:`);
            console.log(`   • http://localhost:${PORT}/api/appointments`);
            console.log(`   • http://localhost:${PORT}/api/patients`);
        });
        
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Manejar el cierre graceful del servidor
process.on('SIGTERM', () => {
    console.log('🔄 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Cerrando servidor...');
    process.exit(0);
});

// Iniciar el servidor
startServer();

module.exports = app;