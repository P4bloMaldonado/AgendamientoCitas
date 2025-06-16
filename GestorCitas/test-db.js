const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
    console.log('🐘 Probando conexión a PostgreSQL...');
    
    try {
        // Configuración de conexión
        const pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'gestor_citas',
            port: process.env.DB_PORT || 5432
        });

        console.log('✅ Pool de conexiones creado');

        // Probar conexión
        const client = await pool.connect();
        console.log('✅ Conexión exitosa a PostgreSQL');

        // Probar consulta simple
        const result = await client.query('SELECT 1 + 1 AS result');
        console.log('✅ Consulta de prueba exitosa:', result.rows[0].result);

        // Verificar base de datos
        const dbResult = await client.query('SELECT current_database()');
        console.log('📊 Base de datos actual:', dbResult.rows[0].current_database);

        // Verificar si existen las tablas
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('📋 Tablas existentes:', tablesResult.rows.length);
        
        if (tablesResult.rows.length > 0) {
            tablesResult.rows.forEach(table => {
                console.log('  - ' + table.table_name);
            });
        } else {
            console.log('ℹ️  No hay tablas aún (se crearán al iniciar el servidor)');
        }

        // Verificar versión de PostgreSQL
        const versionResult = await client.query('SELECT version()');
        console.log('🐘 Versión PostgreSQL:', versionResult.rows[0].version.split(' ')[1]);

        client.release();
        await pool.end();
        console.log('✅ Test de conexión completado exitosamente');
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        
        // Ayuda específica según el error
        if (error.code === '28P01') {
            console.log('💡 Solución: Verifica usuario y contraseña en .env');
        } else if (error.code === '3D000') {
            console.log('💡 Solución: La base de datos no existe, créala con:');
            console.log('   CREATE DATABASE gestor_citas;');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('💡 Solución: PostgreSQL no está ejecutándose, inicia el servicio');
        } else if (error.code === 'ENOTFOUND') {
            console.log('💡 Solución: Verifica que el host sea correcto en .env');
        }
        
        process.exit(1);
    }
}

testConnection();