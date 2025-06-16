const Appointment = require('../models/appointment');
const { pool } = require('../database/connection');

class AppointmentController {
    
    // Obtener todas las citas
    static async getAllAppointments(req, res) {
        try {
            const appointments = await Appointment.findAll();
            
            res.status(200).json({
                success: true,
                message: 'Citas obtenidas correctamente',
                data: appointments,
                count: appointments.length
            });
            
        } catch (error) {
            console.error('Error en getAllAppointments:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las citas',
                error: error.message
            });
        }
    }

    // Obtener una cita por ID
    static async getAppointmentById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de cita inválido'
                });
            }

            const appointment = await Appointment.findById(id);
            
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Cita encontrada',
                data: appointment
            });
            
        } catch (error) {
            console.error('Error en getAppointmentById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la cita',
                error: error.message
            });
        }
    }

    // Crear una nueva cita
    static async createAppointment(req, res) {
        try {
            const { patient_id, treatment_id, appointment_date, appointment_time, notes, dentist_notes } = req.body;

            // Validaciones básicas
            if (!patient_id || !treatment_id || !appointment_date || !appointment_time) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios: patient_id, treatment_id, appointment_date, appointment_time'
                });
            }

            // Validar formato de fecha (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(appointment_date)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de fecha inválido. Use YYYY-MM-DD'
                });
            }

            // Validar formato de hora (HH:MM)
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(appointment_time)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de hora inválido. Use HH:MM (24 horas)'
                });
            }

            // Verificar que la fecha no sea en el pasado
            const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);
            const now = new Date();
            
            if (appointmentDateTime < now) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pueden agendar citas en el pasado'
                });
            }

            // Verificar disponibilidad del horario
            const isAvailable = await Appointment.checkAvailability(appointment_date, appointment_time);
            if (!isAvailable) {
                return res.status(409).json({
                    success: false,
                    message: 'El horario seleccionado no está disponible'
                });
            }

            // Verificar que el paciente existe
            const patientResult = await pool.query('SELECT id FROM patients WHERE id = $1', [patient_id]);
            if (patientResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            // Verificar que el tratamiento existe
            const treatmentResult = await pool.query('SELECT id FROM treatments WHERE id = $1', [treatment_id]);
            if (treatmentResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tratamiento no encontrado'
                });
            }

            // Crear la cita
            const appointmentData = {
                patient_id,
                treatment_id,
                appointment_date,
                appointment_time,
                notes: notes || null,
                dentist_notes: dentist_notes || null,
                status: 'agendada'
            };

            const newAppointment = await Appointment.create(appointmentData);

            res.status(201).json({
                success: true,
                message: 'Cita creada exitosamente',
                data: newAppointment
            });
            
        } catch (error) {
            console.error('Error en createAppointment:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear la cita',
                error: error.message
            });
        }
    }

    // Actualizar una cita
    static async updateAppointment(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de cita inválido'
                });
            }

            // Verificar que la cita existe
            const existingAppointment = await Appointment.findById(id);
            if (!existingAppointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }

            // Validar datos si se están actualizando
            if (updateData.appointment_date) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(updateData.appointment_date)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Formato de fecha inválido. Use YYYY-MM-DD'
                    });
                }
            }

            if (updateData.appointment_time) {
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(updateData.appointment_time)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Formato de hora inválido. Use HH:MM (24 horas)'
                    });
                }
            }

            // Si se está cambiando la fecha/hora, verificar disponibilidad
            if (updateData.appointment_date || updateData.appointment_time) {
                const checkDate = updateData.appointment_date || existingAppointment.appointment_date;
                const checkTime = updateData.appointment_time || existingAppointment.appointment_time;
                
                const isAvailable = await Appointment.checkAvailability(checkDate, checkTime, id);
                if (!isAvailable) {
                    return res.status(409).json({
                        success: false,
                        message: 'El horario seleccionado no está disponible'
                    });
                }
            }

            // Validar estado si se está actualizando
            if (updateData.status) {
                const validStatuses = ['agendada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'];
                if (!validStatuses.includes(updateData.status)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Estado inválido. Estados válidos: ' + validStatuses.join(', ')
                    });
                }
            }

            const updatedAppointment = await Appointment.update(id, updateData);

            res.status(200).json({
                success: true,
                message: 'Cita actualizada exitosamente',
                data: updatedAppointment
            });
            
        } catch (error) {
            console.error('Error en updateAppointment:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la cita',
                error: error.message
            });
        }
    }

    // Eliminar una cita
    static async deleteAppointment(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de cita inválido'
                });
            }

            // Verificar que la cita exists
            const existingAppointment = await Appointment.findById(id);
            if (!existingAppointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }

            await Appointment.delete(id);

            res.status(200).json({
                success: true,
                message: 'Cita eliminada exitosamente'
            });
            
        } catch (error) {
            console.error('Error en deleteAppointment:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar la cita',
                error: error.message
            });
        }
    }

    // Obtener citas por fecha
    static async getAppointmentsByDate(req, res) {
        try {
            const { date } = req.params;

            // Validar formato de fecha
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de fecha inválido. Use YYYY-MM-DD'
                });
            }

            const appointments = await Appointment.findByDate(date);

            res.status(200).json({
                success: true,
                message: `Citas para el ${date}`,
                data: appointments,
                count: appointments.length
            });
            
        } catch (error) {
            console.error('Error en getAppointmentsByDate:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las citas por fecha',
                error: error.message
            });
        }
    }

    // Obtener citas por paciente
    static async getAppointmentsByPatient(req, res) {
        try {
            const { patientId } = req.params;

            if (!patientId || isNaN(patientId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }

            const appointments = await Appointment.findByPatient(patientId);

            res.status(200).json({
                success: true,
                message: `Citas del paciente ${patientId}`,
                data: appointments,
                count: appointments.length
            });
            
        } catch (error) {
            console.error('Error en getAppointmentsByPatient:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las citas del paciente',
                error: error.message
            });
        }
    }

    // Obtener estadísticas de citas
    static async getAppointmentStats(req, res) {
        try {
            const stats = await Appointment.getStats();

            res.status(200).json({
                success: true,
                message: 'Estadísticas obtenidas correctamente',
                data: stats
            });
            
        } catch (error) {
            console.error('Error en getAppointmentStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las estadísticas',
                error: error.message
            });
        }
    }

    // Obtener pacientes (para el formulario)
    static async getPatients(req, res) {
        try {
            const result = await pool.query('SELECT id, name, email, phone, birth_date, allergies FROM patients ORDER BY name');
            
            res.status(200).json({
                success: true,
                message: 'Pacientes obtenidos correctamente',
                data: result.rows
            });
            
        } catch (error) {
            console.error('Error en getPatients:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los pacientes',
                error: error.message
            });
        }
    }

    // Obtener tratamientos (para el formulario)
    static async getTreatments(req, res) {
        try {
            const result = await pool.query('SELECT id, name, description, duration, price, category FROM treatments ORDER BY category, name');
            
            res.status(200).json({
                success: true,
                message: 'Tratamientos obtenidos correctamente',
                data: result.rows
            });
            
        } catch (error) {
            console.error('Error en getTreatments:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los tratamientos',
                error: error.message
            });
        }
    }
}

module.exports = AppointmentController;