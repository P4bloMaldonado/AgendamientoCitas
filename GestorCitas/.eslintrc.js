module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
        mocha: true // 👈 Añade esto
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 12
    },
    rules: {
        'indent': ['error', 4],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-unused-vars': ['warn'],
        'no-console': 'off'
    },
    globals: {
        'window': 'readonly',
        'document': 'readonly',
        'editAppointment': 'writable',
        'deleteAppointment': 'writable',
        'editPatient': 'writable',
        'deletePatient': 'writable'
    }
};
