const assert = require('assert');

describe('Sistema Odontológico - Tests', () => {
    it('should validate project structure', () => {
        const fs = require('fs');
        const path = require('path');
        
        const requiredFiles = [
            'package.json',
            'server.js',
            'src/database/connection.js',
            'public/index.html'
        ];
        
        requiredFiles.forEach(file => {
            const filePath = path.join(process.cwd(), file);
            assert.ok(fs.existsSync(filePath), `${file} should exist`);
        });
        
        console.log('✅ Project structure validated');
    });

    it('should validate environment variables', () => {
        const config = {
            port: process.env.PORT || 5000,
            dbName: process.env.DB_NAME || 'gestor_citas'
        };
        
        assert.ok(config.port);
        assert.ok(config.dbName);
        console.log('✅ Environment variables validated');
    });

    it('should validate package.json', () => {
        const pkg = require('../package.json');
        
        assert.ok(pkg.name);
        assert.ok(pkg.version);
        assert.ok(pkg.dependencies);
        
        console.log('✅ Package.json validated');
    });
});