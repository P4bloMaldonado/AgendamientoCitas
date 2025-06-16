const { pool } = require('./src/database/connection');

async function recreateTables() {
    try {
        console.log('🔄 Eliminando tablas existentes...');
        
        // Eliminar tablas en orden correcto
        await pool.query('DROP TABLE IF EXISTS appointments CASCADE');
        await pool.query('DROP TABLE IF EXISTS treatments CASCADE');
        await pool.query('DROP TABLE IF EXISTS patients CASCADE');
        
        console.log('✅ Tablas eliminadas');
        
        console.log('🔄 Creando tablas nuevas...');
        
        // Crear tabla de pacientes
        await pool.query(`
            CREATE TABLE patients (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(20),
                address TEXT,
                birth_date DATE,
                emergency_contact VARCHAR(255),
                emergency_phone VARCHAR(20),
                medical_history TEXT,
                allergies TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Crear tabla de tratamientos
        await pool.query(`
            CREATE TABLE treatments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                duration INTEGER DEFAULT 30,
                price DECIMAL(10,2) DEFAULT 0.00,
                category VARCHAR(50) DEFAULT 'preventivo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT check_category CHECK (category IN ('preventivo', 'restaurativo', 'endodoncia', 'cirugia', 'estetico', 'ortodoncia', 'periodontal'))
            )
        `);
        
        // Crear tabla de citas
        await pool.query(`
            CREATE TABLE appointments (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
                treatment_id INTEGER REFERENCES treatments(id) ON DELETE SET NULL,
                appointment_date DATE NOT NULL,
                appointment_time TIME NOT NULL,
                status VARCHAR(20) DEFAULT 'agendada',
                notes TEXT,
                dentist_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT check_status CHECK (status IN ('agendada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'))
            )
        `);
        
        console.log('✅ Tablas creadas');
        
        // Insertar datos de ejemplo
        console.log('🔄 Insertando datos de ejemplo...');
        
        // Pacientes
        await pool.query(`
            INSERT INTO patients (name, email, phone, address, birth_date, emergency_contact, emergency_phone, medical_history, allergies) VALUES 
            ('María González', 'maria.gonzalez@email.com', '555-0001', 'Av. Principal 123', '1985-03-15', 'Juan González', '555-0011', 'Hipertensión controlada', 'Penicilina'),
            ('Carlos Rodríguez', 'carlos.rodriguez@email.com', '555-0002', 'Calle Secundaria 456', '1990-07-22', 'Ana Rodríguez', '555-0022', 'Diabetes tipo 2', 'Ninguna'),
            ('Ana López', 'ana.lopez@email.com', '555-0003', 'Plaza Central 789', '1978-11-08', 'Pedro López', '555-0033', 'Ninguna', 'Latex')
        `);
        
        // Tratamientos
        await pool.query(`
            INSERT INTO treatments (name, description, duration, price, category) VALUES 
            ('Consulta General', 'Examen dental completo y diagnóstico', 30, 80.00, 'preventivo'),
            ('Limpieza Dental', 'Profilaxis y eliminación de sarro', 45, 120.00, 'preventivo'),
            ('Empaste Composite', 'Restauración dental con resina compuesta', 60, 180.00, 'restaurativo'),
            ('Endodoncia', 'Tratamiento de conducto radicular', 90, 450.00, 'endodoncia'),
            ('Extracción Simple', 'Extracción dental sin complicaciones', 30, 150.00, 'cirugia')
        `);
        
        console.log('✅ Datos de ejemplo insertados');
        console.log('🎉 ¡Tablas recreadas exitosamente!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

recreateTables();