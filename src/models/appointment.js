const { pool } = require('../database/connection');

class Appointment {
    constructor(data) {
        this.id = data.id;
        this.patient_id = data.patient_id;
        this.treatment_id = data.treatment_id;
        this.appointment_date = data.appointment_date;
        this.appointment_time = data.appointment_time;
        this.status = data.status || 'agendada';
        this.notes = data.notes;
        this.dentist_notes = data.dentist_notes;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Crear una nueva cita
    static async create(appointmentData) {
        try {
            const query = `
                INSERT INTO appointments (patient_id, treatment_id, appointment_date, appointment_time, status, notes, dentist_notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;
            
            const values = [
                appointmentData.patient_id,
                appointmentData.treatment_id,
                appointmentData.appointment_date,
                appointmentData.appointment_time,
                appointmentData.status || 'agendada',
                appointmentData.notes || null,
                appointmentData.dentist_notes || null
            ];

            const result = await pool.query(query, values);
            
            // Obtener la cita recién creada con información completa
            return await this.findById(result.rows[0].id);
            
        } catch (error) {
            console.error('Error al crear cita:', error);
            throw new Error('No se pudo crear la cita: ' + error.message);
        }
    }

    // Obtener todas las citas con información de pacientes y tratamientos
    static async findAll() {
        try {
            const query = `
                SELECT 
                    a.*,
                    p.name as patient_name,
                    p.email as patient_email,
                    p.phone as patient_phone,
                    p.birth_date as patient_birth_date,
                    p.allergies as patient_allergies,
                    t.name as treatment_name,
                    t.description as treatment_description,
                    t.duration as treatment_duration,
                    t.price as treatment_price,
                    t.category as treatment_category
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id
                LEFT JOIN treatments t ON a.treatment_id = t.id
                ORDER BY a.appointment_date DESC, a.appointment_time DESC
            `;
            
            const result = await pool.query(query);
            return result.rows;
            
        } catch (error) {
            console.error('Error al obtener citas:', error);
            throw new Error('No se pudieron obtener las citas');
        }
    }

    // Buscar cita por ID
    static async findById(id) {
        try {
            const query = `
                SELECT 
                    a.*,
                    p.name as patient_name,
                    p.email as patient_email,
                    p.phone as patient_phone,
                    p.birth_date as patient_birth_date,
                    p.allergies as patient_allergies,
                    p.medical_history as patient_medical_history,
                    t.name as treatment_name,
                    t.description as treatment_description,
                    t.duration as treatment_duration,
                    t.price as treatment_price,
                    t.category as treatment_category
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id
                LEFT JOIN treatments t ON a.treatment_id = t.id
                WHERE a.id = $1
            `;
            
            const result = await pool.query(query, [id]);
            return result.rows.length > 0 ? result.rows[0] : null;
            
        } catch (error) {
            console.error('Error al buscar cita por ID:', error);
            throw new Error('No se pudo encontrar la cita');
        }
    }

    // Buscar citas por fecha
    static async findByDate(date) {
        try {
            const query = `
                SELECT 
                    a.*,
                    p.name as patient_name,
                    p.email as patient_email,
                    p.phone as patient_phone,
                    p.birth_date as patient_birth_date,
                    p.allergies as patient_allergies,
                    t.name as treatment_name,
                    t.description as treatment_description,
                    t.duration as treatment_duration,
                    t.price as treatment_price,
                    t.category as treatment_category
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id
                LEFT JOIN treatments t ON a.treatment_id = t.id
                WHERE a.appointment_date = $1
                ORDER BY a.appointment_time ASC
            `;
            
            const result = await pool.query(query, [date]);
            return result.rows;
            
        } catch (error) {
            console.error('Error al buscar citas por fecha:', error);
            throw new Error('No se pudieron obtener las citas de la fecha especificada');
        }
    }

    // Buscar citas por paciente
    static async findByPatient(patientId) {
        try {
            const query = `
                SELECT 
                    a.*,
                    p.name as patient_name,
                    p.email as patient_email,
                    p.phone as patient_phone,
                    p.birth_date as patient_birth_date,
                    p.allergies as patient_allergies,
                    t.name as treatment_name,
                    t.description as treatment_description,
                    t.duration as treatment_duration,
                    t.price as treatment_price,
                    t.category as treatment_category
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id
                LEFT JOIN treatments t ON a.treatment_id = t.id
                WHERE a.patient_id = $1
                ORDER BY a.appointment_date DESC, a.appointment_time DESC
            `;
            
            const result = await pool.query(query, [patientId]);
            return result.rows;
            
        } catch (error) {  
            console.error('Error al buscar citas por paciente:', error);
            throw new Error('No se pudieron obtener las citas del paciente');
        }
    }

    // Actualizar una cita
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Construir la consulta dinámicamente
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(updateData[key]);
                    paramCount++;
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay datos para actualizar');
            }

            values.push(id);
            
            const query = `
                UPDATE appointments 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${paramCount}
            `;

            const result = await pool.query(query, values);
            
            if (result.rowCount === 0) {
                throw new Error('Cita no encontrada');
            }

            return await this.findById(id);
            
        } catch (error) {
            console.error('Error al actualizar cita:', error);
            throw new Error('No se pudo actualizar la cita: ' + error.message);
        }
    }

    // Eliminar una cita
    static async delete(id) {
        try {
            const query = 'DELETE FROM appointments WHERE id = $1';
            const result = await pool.query(query, [id]);
            
            if (result.rowCount === 0) {
                throw new Error('Cita no encontrada');
            }
            
            return { message: 'Cita eliminada correctamente' };
            
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            throw new Error('No se pudo eliminar la cita: ' + error.message);
        }
    }

    // Verificar disponibilidad de horario
    static async checkAvailability(date, time, excludeId = null) {
        try {
            let query = `
                SELECT id FROM appointments 
                WHERE appointment_date = $1 AND appointment_time = $2
                AND status != 'cancelada'
            `;
            
            const values = [date, time];
            
            if (excludeId) {
                query += ' AND id != $3';
                values.push(excludeId);
            }
            
            const result = await pool.query(query, values);
            return result.rows.length === 0;
            
        } catch (error) {
            console.error('Error al verificar disponibilidad:', error);
            throw new Error('No se pudo verificar la disponibilidad');
        }
    }

    // Obtener estadísticas de citas
    static async getStats() {
        try {
            const queries = {
                total: 'SELECT COUNT(*) as count FROM appointments',
                agendada: 'SELECT COUNT(*) as count FROM appointments WHERE status = $1',
                confirmada: 'SELECT COUNT(*) as count FROM appointments WHERE status = $1',
                completada: 'SELECT COUNT(*) as count FROM appointments WHERE status = $1',
                cancelada: 'SELECT COUNT(*) as count FROM appointments WHERE status = $1',
                today: 'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURRENT_DATE'
            };

            const stats = {};
            
            // Ejecutar consultas
            stats.total = (await pool.query(queries.total)).rows[0].count;
            stats.agendada = (await pool.query(queries.agendada, ['agendada'])).rows[0].count;
            stats.confirmada = (await pool.query(queries.confirmada, ['confirmada'])).rows[0].count;
            stats.completada = (await pool.query(queries.completada, ['completada'])).rows[0].count;
            stats.cancelada = (await pool.query(queries.cancelada, ['cancelada'])).rows[0].count;
            stats.today = (await pool.query(queries.today)).rows[0].count;

            // Convertir a números
            Object.keys(stats).forEach(key => {
                stats[key] = parseInt(stats[key]);
            });

            return stats;
            
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw new Error('No se pudieron obtener las estadísticas');
        }
    }
}

module.exports = Appointment;