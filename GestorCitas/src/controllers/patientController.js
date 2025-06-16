const { pool } = require('../database/connection');

class PatientController {
    
    // Obtener todos los pacientes
    static async getAllPatients(req, res) {
        try {
            const result = await pool.query(`
                SELECT 
                    id, name, email, phone, address, birth_date, 
                    emergency_contact, emergency_phone, medical_history, 
                    allergies, created_at
                FROM patients 
                ORDER BY name
            `);
            
            res.status(200).json({
                success: true,
                message: 'Pacientes obtenidos correctamente',
                data: result.rows,
                count: result.rows.length
            });
            
        } catch (error) {
            console.error('Error en getAllPatients:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los pacientes',
                error: error.message
            });
        }
    }

    // Obtener un paciente por ID
    static async getPatientById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }

            const result = await pool.query(`
                SELECT * FROM patients WHERE id = $1
            `, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Paciente encontrado',
                data: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error en getPatientById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el paciente',
                error: error.message
            });
        }
    }

    // Crear un nuevo paciente
    static async createPatient(req, res) {
        try {
            const { 
                name, email, phone, address, birth_date, 
                emergency_contact, emergency_phone, medical_history, allergies 
            } = req.body;

            // Validaciones básicas
            if (!name || name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del paciente es obligatorio'
                });
            }

            // Validar email si se proporciona
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de email inválido'
                });
            }

            // Validar fecha de nacimiento si se proporciona
            if (birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de fecha de nacimiento inválido. Use YYYY-MM-DD'
                });
            }

            // Verificar que el email no esté duplicado
            if (email) {
                const emailCheck = await pool.query('SELECT id FROM patients WHERE email = $1', [email]);
                if (emailCheck.rows.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'Ya existe un paciente con este email'
                    });
                }
            }

            // Insertar el paciente
            const result = await pool.query(`
                INSERT INTO patients (
                    name, email, phone, address, birth_date, 
                    emergency_contact, emergency_phone, medical_history, allergies
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                name.trim(),
                email || null,
                phone || null,
                address || null,
                birth_date || null,
                emergency_contact || null,
                emergency_phone || null,
                medical_history || null,
                allergies || null
            ]);

            res.status(201).json({
                success: true,
                message: 'Paciente creado exitosamente',
                data: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error en createPatient:', error);
            
            // Manejar error de email duplicado
            if (error.code === '23505' && error.constraint === 'patients_email_key') {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un paciente con este email'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error al crear el paciente',
                error: error.message
            });
        }
    }

    // Actualizar un paciente
    static async updatePatient(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }

            // Verificar que el paciente existe
            const existingPatient = await pool.query('SELECT id FROM patients WHERE id = $1', [id]);
            if (existingPatient.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            // Construir la consulta de actualización dinámicamente
            const fields = [];
            const values = [];
            let paramCount = 1;

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(updateData[key]);
                    paramCount++;
                }
            });

            if (fields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay datos para actualizar'
                });
            }

            values.push(id);
            
            const query = `
                UPDATE patients 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(query, values);

            res.status(200).json({
                success: true,
                message: 'Paciente actualizado exitosamente',
                data: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error en updatePatient:', error);
            
            // Manejar error de email duplicado
            if (error.code === '23505' && error.constraint === 'patients_email_key') {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe otro paciente con este email'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el paciente',
                error: error.message
            });
        }
    }

    // Eliminar un paciente
    static async deletePatient(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }

            // Verificar si el paciente tiene citas
            const appointmentsCheck = await pool.query(
                'SELECT COUNT(*) as count FROM appointments WHERE patient_id = $1', 
                [id]
            );

            if (parseInt(appointmentsCheck.rows[0].count) > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'No se puede eliminar el paciente porque tiene citas programadas'
                });
            }

            // Eliminar el paciente
            const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING name', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: `Paciente "${result.rows[0].name}" eliminado exitosamente`
            });
            
        } catch (error) {
            console.error('Error en deletePatient:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el paciente',
                error: error.message
            });
        }
    }

    // Buscar pacientes
    static async searchPatients(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Término de búsqueda requerido'
                });
            }

            const searchTerm = `%${q.trim()}%`;
            
            const result = await pool.query(`
                SELECT id, name, email, phone, allergies
                FROM patients 
                WHERE 
                    name ILIKE $1 OR 
                    email ILIKE $1 OR 
                    phone ILIKE $1
                ORDER BY name
                LIMIT 20
            `, [searchTerm]);

            res.status(200).json({
                success: true,
                message: 'Búsqueda completada',
                data: result.rows,
                count: result.rows.length
            });
            
        } catch (error) {
            console.error('Error en searchPatients:', error);
            res.status(500).json({
                success: false,
                message: 'Error en la búsqueda',
                error: error.message
            });
        }
    }
}

module.exports = PatientController;