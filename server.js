// server.js - Servidor principal
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dental_appointments';

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por ventana
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos.'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// Conexión a MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error conectando a MongoDB:', err));

// Esquemas de MongoDB
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'dentist', 'receptionist'], default: 'receptionist' },
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

const patientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    dateOfBirth: { type: Date },
    address: { type: String },
    medicalHistory: { type: String },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    patientEmail: { type: String },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:MM
    treatmentType: { 
        type: String, 
        required: true,
        enum: ['limpieza', 'revision', 'empaste', 'extraccion', 'ortodoncia', 'blanqueamiento', 'endodoncia', 'cirugia']
    },
    notes: { type: String },
    status: { 
        type: String, 
        enum: ['programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio'], 
        default: 'programada' 
    },
    dentistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    duration: { type: Number, default: 30 }, // duración en minutos
    cost: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const treatmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    treatmentType: { type: String, required: true },
    description: { type: String, required: true },
    cost: { type: Number, required: true },
    dentistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['iniciado', 'en_progreso', 'completado'], default: 'iniciado' },
    notes: { type: String }
});

// Modelos
const User = mongoose.model('User', userSchema);
const Patient = mongoose.model('Patient', patientSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Treatment = mongoose.model('Treatment', treatmentSchema);

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Usuario no válido' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// Middleware de autorización
const authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
        }
        next();
    };
};

// RUTAS DE AUTENTICACIÓN

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validaciones
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ error: 'El usuario o email ya existe' });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 12);

        // Crear usuario
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'receptionist'
        });

        await user.save();

        // Generar token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        // Buscar usuario
        const user = await User.findOne({ 
            $or: [{ username }, { email: username }],
            isActive: true
        });

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// RUTAS DE CITAS

// Obtener todas las citas
app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { date, status, page = 1, limit = 50 } = req.query;
        
        let filter = {};
        if (date) filter.date = date;
        if (status) filter.status = status;

        const appointments = await Appointment.find(filter)
            .populate('patientId', 'name phone email')
            .populate('dentistId', 'username')
            .sort({ date: 1, time: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Appointment.countDocuments(filter);

        res.json({
            appointments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error obteniendo citas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Crear nueva cita
app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const {
            patientName,
            patientPhone,
            patientEmail,
            date,
            time,
            treatmentType,
            notes,
            dentistId,
            duration,
            cost
        } = req.body;

        // Validaciones
        if (!patientName || !patientPhone || !date || !time || !treatmentType) {
            return res.status(400).json({ error: 'Campos requeridos faltantes' });
        }

        // Verificar disponibilidad de horario
        const existingAppointment = await Appointment.findOne({
            date,
            time,
            status: { $ne: 'cancelada' }
        });

        if (existingAppointment) {
            return res.status(400).json({ error: 'Ya existe una cita para esta fecha y hora' });
        }

        // Buscar o crear paciente
        let patient = await Patient.findOne({ phone: patientPhone });
        if (!patient) {
            patient = new Patient({
                name: patientName,
                phone: patientPhone,
                email: patientEmail
            });
            await patient.save();
        }

        // Crear cita
        const appointment = new Appointment({
            patientId: patient._id,
            patientName,
            patientPhone,
            patientEmail,
            date,
            time,
            treatmentType,
            notes,
            dentistId,
            duration,
            cost,
            createdBy: req.user._id
        });

        await appointment.save();

        // Poblar datos para respuesta
        await appointment.populate('patientId', 'name phone email');
        await appointment.populate('dentistId', 'username');

        res.status(201).json({
            message: 'Cita creada exitosamente',
            appointment
        });
    } catch (error) {
        console.error('Error creando cita:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar cita
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Si se cambia fecha/hora, verificar disponibilidad
        if (updateData.date && updateData.time) {
            const existingAppointment = await Appointment.findOne({
                _id: { $ne: id },
                date: updateData.date,
                time: updateData.time,
                status: { $ne: 'cancelada' }
            });

            if (existingAppointment) {
                return res.status(400).json({ error: 'Ya existe una cita para esta fecha y hora' });
            }
        }

        updateData.updatedAt = new Date();

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('patientId', 'name phone email')
        .populate('dentistId', 'username');

        if (!appointment) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        res.json({
            message: 'Cita actualizada exitosamente',
            appointment
        });
    } catch (error) {
        console.error('Error actualizando cita:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar cita
app.delete('/api/appointments/:id', authenticateToken, authorize(['admin', 'dentist']), async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findByIdAndDelete(id);

        if (!appointment) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        res.json({ message: 'Cita eliminada exitosamente' });
    } catch (error) {
        console.error('Error eliminando cita:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Cambiar estado de cita
app.patch('/api/appointments/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status, updatedAt: new Date() },
            { new: true }
        ).populate('patientId', 'name phone email');

        if (!appointment) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        res.json({
            message: 'Estado de cita actualizado',
            appointment
        });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// RUTAS DE PACIENTES

// Obtener todos los pacientes
app.get('/api/patients', authenticateToken, async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        
        let filter = {};
        if (search) {
            filter = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const patients = await Patient.find(filter)
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Patient.countDocuments(filter);

        res.json({
            patients,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error obteniendo pacientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener paciente por ID
app.get('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        
        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        // Obtener historial de citas del paciente
        const appointments = await Appointment.find({ patientId: patient._id })
            .sort({ date: -1, time: -1 })
            .populate('dentistId', 'username');

        res.json({
            patient,
            appointments
        });
    } catch (error) {
        console.error('Error obteniendo paciente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Crear paciente
app.post('/api/patients', authenticateToken, async (req, res) => {
    try {
        const patient = new Patient(req.body);
        await patient.save();

        res.status(201).json({
            message: 'Paciente creado exitosamente',
            patient
        });
    } catch (error) {
        console.error('Error creando paciente:', error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'Ya existe un paciente con este teléfono' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

// Actualizar paciente
app.put('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        res.json({
            message: 'Paciente actualizado exitosamente',
            patient
        });
    } catch (error) {
        console.error('Error actualizando paciente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// RUTAS DE ESTADÍSTICAS

// Dashboard con estadísticas
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

        // Citas de hoy
        const todayAppointments = await Appointment.countDocuments({
            date: today,
            status: { $ne: 'cancelada' }
        });

        // Citas del mes
        const monthAppointments = await Appointment.countDocuments({
            date: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $ne: 'cancelada' }
        });

        // Total de pacientes
        const totalPatients = await Patient.countDocuments();

        // Citas por estado
        const appointmentsByStatus = await Appointment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Tratamientos más comunes
        const commonTreatments = await Appointment.aggregate([
            {
                $group: {
                    _id: '$treatmentType',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Ingresos del mes (si hay costos registrados)
        const monthlyRevenue = await Appointment.aggregate([
            {
                $match: {
                    date: { $gte: startOfMonth, $lte: endOfMonth },
                    status: 'completada',
                    cost: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$cost' }
                }
            }
        ]);

        res.json({
            todayAppointments,
            monthAppointments,
            totalPatients,
            appointmentsByStatus,
            commonTreatments,
            monthlyRevenue: monthlyRevenue[0]?.total || 0
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Horarios disponibles para una fecha
app.get('/api/available-slots/:date', authenticateToken, async (req, res) => {
    try {
        const { date } = req.params;
        
        // Obtener citas existentes para esa fecha
        const existingAppointments = await Appointment.find({
            date,
            status: { $ne: 'cancelada' }
        }).select('time duration');

        // Horarios de trabajo (configurable)
        const workingHours = {
            start: '08:00',
            end: '18:00',
            slotDuration: 30 // minutos
        };

        // Generar slots disponibles
        const availableSlots = generateAvailableSlots(workingHours, existingAppointments);

        res.json({ availableSlots });
    } catch (error) {
        console.error('Error obteniendo horarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función auxiliar para generar slots disponibles
function generateAvailableSlots(workingHours, existingAppointments) {
    const slots = [];
    const start = parseTime(workingHours.start);
    const end = parseTime(workingHours.end);
    const duration = workingHours.slotDuration;

    for (let time = start; time < end; time += duration) {
        const timeString = formatTime(time);
        const isOccupied = existingAppointments.some(apt => apt.time === timeString);
        
        if (!isOccupied) {
            slots.push(timeString);
        }
    }

    return slots;
}

function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Manejo de errores globales
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    
    // Crear usuario admin por defecto si no existe
    createDefaultAdmin();
});

async function createDefaultAdmin() {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 12);
            const admin = new User({
                username: 'admin',
                email: 'admin@dental.com',
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('Usuario admin creado - usuario: admin, contraseña: admin123');
        }
    } catch (error) {
        console.error('Error creando admin por defecto:', error);
    }
}

module.exports = app;