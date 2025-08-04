// ===== ALERTAS =====
window.showAlert = function(message, type = 'success', duration = 5000) {
    const alertDiv = document.getElementById(type === 'success' ? 'alert-success' : 'alert-error');
    if (!alertDiv) return;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';

    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, duration);
};

// ===== CARGA EN BOTÓN =====
window.showLoading = function(formId, show = true) {
    const form = document.getElementById(formId);
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');
    const text = btn.querySelector('#btn-text');
    const loading = btn.querySelector('#btn-loading');

    if (show) {
        btn.disabled = true;
        if (text) text.style.display = 'none';
        if (loading) loading.style.display = 'inline-block';
    } else {
        btn.disabled = false;
        if (text) text.style.display = 'inline';
        if (loading) loading.style.display = 'none';
    }
};

// ===== FORMATEADORES =====
window.formatDate = function(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES');
};

window.formatTime = function(timeStr) {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    return `${hour}:${minute}`;
};

window.getStatusText = function(status) {
    const map = {
        PENDING: 'Pendiente',
        CONFIRMED: 'Confirmada',
        CANCELED: 'Cancelada',
        COMPLETED: 'Completada'
    };
    return map[status] || 'Desconocido';
};

window.getCategoryName = function(cat) {
    const map = {
        ORTHODONTICS: 'Ortodoncia',
        SURGERY: 'Cirugía',
        CLEANING: 'Limpieza',
        RESTORATION: 'Restauración'
    };
    return map[cat] || 'Otro';
};

// ===== UTILIDADES GENERALES =====
window.calculateAge = function(birthDateStr) {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

window.escapeHtml = function(str) {
    if (!str) return '';
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

window.validateEmail = function(email) {
    const regex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
};

window.validateTime = function(time) {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
};

window.validateDate = function(date) {
    return !isNaN(new Date(date).getTime());
};

// ===== DEBOUNCE =====
window.debounce = function(func, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};
