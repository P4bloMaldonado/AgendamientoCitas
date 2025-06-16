const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión a PostgreSQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestor_citas',
    port: process.env.DB_PORT || 5432,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Crear el pool de conexiones
const pool = new Pool(dbConfig);

// Función para inicializar la base de datos y crear las tablas
async function initializeDatabase() {
    try {
        console.log('🔄 Inicializando base de datos PostgreSQL...');
        
        // Crear tabla de pacientes
        const createPatientsTable = `
            CREATE TABLE IF NOT EXISTS patients (
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
        `;

        // Crear tabla de tratamientos dentales
        const createTreatmentsTable = `
            CREATE TABLE IF NOT EXISTS treatments (
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
        `;

        // Crear tabla de citas
        const createAppointmentsTable = `
            CREATE TABLE IF NOT EXISTS appointments (
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
                CONSTRAINT check_status CHECK (status IN ('agendada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio')),
                CONSTRAINT unique_appointment UNIQUE (appointment_date, appointment_time)
            )
        `;

        // Crear función para actualizar updated_at automáticamente
        const createUpdateFunction = `
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `;

        // Crear triggers para updated_at
        const createTriggers = `
            DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
            CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            DROP TRIGGER IF EXISTS update_treatments_updated_at ON treatments;
            CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
            DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
            CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;

        // Ejecutar las consultas
        await pool.query(createPatientsTable);
        await pool.query(createTreatmentsTable);
        await pool.query(createAppointmentsTable);
        await pool.query(createUpdateFunction);
        await pool.query(createTriggers);

        console.log('✅ Base de datos PostgreSQL inicializada correctamente');
        
        // Insertar datos de ejemplo si las tablas están vacías
        await insertSampleData();
        
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error);
        throw error;
    }
}

// Función para insertar datos de ejemplo
async function insertSampleData() {
    try {
        // Verificar si ya hay datos
        const patientsResult = await pool.query('SELECT COUNT(*) as count FROM patients');
        const treatmentsResult = await pool.query('SELECT COUNT(*) as count FROM treatments');
        
        if (parseInt(patientsResult.rows[0].count) === 0) {
            // Insertar pacientes de ejemplo
            const insertPatients = `
                INSERT INTO patients (name, email, phone, address, birth_date, emergency_contact, emergency_phone, medical_history, allergies) VALUES 
                ('María González', 'maria.gonzalez@email.com', '555-0001', 'Av. Principal 123', '1985-03-15', 'Juan González', '555-0011', 'Hipertensión controlada', 'Penicilina'),
                ('Carlos Rodríguez', 'carlos.rodriguez@email.com', '555-0002', 'Calle Secundaria 456', '1990-07-22', 'Ana Rodríguez', '555-0022', 'Diabetes tipo 2', 'Ninguna'),
                ('Ana López', 'ana.lopez@email.com', '555-0003', 'Plaza Central 789', '1978-11-08', 'Pedro López', '555-0033', 'Ninguna', 'Latex'),
                ('José Martínez', 'jose.martinez@email.com', '555-0004', 'Calle Norte 321', '1995-01-30', 'Carmen Martínez', '555-0044', 'Asma leve', 'Ninguna'),
                ('Laura Herrera', 'laura.herrera@email.com', '555-0005', 'Av. Sur 654', '1988-09-12', 'Miguel Herrera', '555-0055', 'Ninguna', 'Ibuprofeno')
            `;
            await pool.query(insertPatients);
            console.log('✅ Pacientes de ejemplo insertados');
        }

        if (parseInt(treatmentsResult.rows[0].count) === 0) {
            // Insertar tratamientos odontológicos de ejemplo
            const insertTreatments = `
                INSERT INTO treatments (name, description, duration, price, category) VALUES 
                ('Consulta General', 'Examen dental completo y diagnóstico', 30, 80.00, 'preventivo'),
                ('Limpieza Dental', 'Profilaxis y eliminación de sarro', 45, 120.00, 'preventivo'),
                ('Empaste Composite', 'Restauración dental con resina compuesta', 60, 180.00, 'restaurativo'),
                ('Endodoncia', 'Tratamiento de conducto radicular', 90, 450.00, 'endodoncia'),
                ('Extracción Simple', 'Extracción dental sin complicaciones', 30, 150.00, 'cirugia'),
                ('Blanqueamiento Dental', 'Aclaramiento del color dental', 60, 300.00, 'estetico'),
                ('Corona Dental', 'Restauración completa del diente', 90, 800.00, 'restaurativo'),
                ('Limpieza Profunda', 'Raspado y alisado radicular', 75, 200.00, 'periodontal'),
                ('Ortodoncia Consulta', 'Evaluación ortodóncica inicial', 45, 100.00, 'ortodoncia'),
                ('Selladores', 'Aplicación de selladores de fosas y fisuras', 30, 60.00, 'preventivo')
            `;
            await pool.query(insertTreatments);
            console.log('✅ Tratamientos dentales de ejemplo insertados');
        }
        
    } catch (error) {
        console.error('❌ Error al insertar datos de ejemplo:', error);
    }
}

// Función para probar la conexión
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Conexión a PostgreSQL establecida:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a PostgreSQL:', error);
        return false;
    }
}

// Función para cerrar el pool de conexiones
async function closePool() {
    try {
        await pool.end();
        console.log('✅ Pool de conexiones PostgreSQL cerrado');
    } catch (error) {
        console.error('❌ Error al cerrar el pool:', error);
    }
}

module.exports = {
    pool,
    initializeDatabase,
    testConnection,
    closePool
};