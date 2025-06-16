// ===== VARIABLES GLOBALES =====
let appointments = [];
let patients = [];
let treatments = [];

// ===== ELEMENTOS DEL DOM =====
const appointmentForm = document.getElementById('appointment-form');
const editForm = document.getElementById('edit-form');
const editModal = document.getElementById('edit-modal');
const appointmentsContainer = document.getElementById('appointments-container');
const alertSuccess = document.getElementById('alert-success');
const alertError = document.getElementById('alert-error');
const filterDate = document.getElementById('filter-date');
const refreshBtn = document.getElementById('refresh-btn');

// ===== CONFIGURACIÓN DE LA APLICACIÓN =====
const CONFIG = {
    API_BASE_URL: '/api',
    ALERT_TIMEOUT: 5000,
    DATE_FORMAT: 'es-ES',
    TIME_FORMAT: { hour: '2-digit', minute: '2-digit', hour12: true }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🦷 Iniciando Sistema de Gestión de Citas Odontológicas...');
    initApp();
});

async function initApp() {
    try {
        showLoading(true);
        await loadInitialData();
        setupEventListeners();
        setMinDate();
        console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
        showAlert('Error al inicializar la aplicación. Por favor, recarga la página.', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadInitialData() {
    try {
        console.log('📊 Cargando datos iniciales...');
        await Promise.all([
            loadPatients(),
            loadTreatments(),
            loadAppointments(),
            loadStats()
        ]);
        console.log('✅ Datos iniciales cargados');
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        throw error;
    }
}

function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    // Formularios
    if (appointmentForm) appointmentForm.addEventListener('submit', handleCreateAppointment);
    if (editForm) editForm.addEventListener('submit', handleUpdateAppointment);
    
    // Filtros y actualización
    if (filterDate) filterDate.addEventListener('change', filterAppointments);
    if (refreshBtn) refreshBtn.addEventListener('click', refreshData);
    
    // Modal
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-edit');
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeModal();
        }
    });

    // Prevenir envío de formularios vacíos
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
                showAlert('Por favor, completa todos los campos requeridos', 'error');
            }
        });
    });
}

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = [
        document.getElementById('appointment-date'),
        document.getElementById('edit-appointment-date')
    ];
    
    dateInputs.forEach(input => {
        if (input) input.min = today;
    });
}

// ===== FUNCIONES DE API =====
async function apiRequest(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error de conexión' }));
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error en la respuesta del servidor');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error en petición API:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Error de conexión. Verifica que el servidor esté funcionando.');
        }
        
        throw error;
    }
}

async function loadPatients() {
    try {
        const data = await apiRequest('/appointments/data/patients');
        patients = data.data || [];
        populatePatientSelects();
        console.log(`👥 ${patients.length} pacientes cargados`);
    } catch (error) {
        console.error('❌ Error cargando pacientes:', error);
        showAlert('Error al cargar la lista de pacientes: ' + error.message, 'error');
    }
}

async function loadTreatments() {
    try {
        const data = await apiRequest('/appointments/data/treatments');
        treatments = data.data || [];
        populateTreatmentSelects();
        console.log(`🦷 ${treatments.length} tratamientos cargados`);
    } catch (error) {
        console.error('❌ Error cargando tratamientos:', error);
        showAlert('Error al cargar la lista de tratamientos: ' + error.message, 'error');
    }
}

async function loadAppointments() {
    try {
        const data = await apiRequest('/appointments');
        appointments = data.data || [];
        renderAppointments();
        console.log(`📅 ${appointments.length} citas cargadas`);
    } catch (error) {
        console.error('❌ Error cargando citas:', error);
        showAlert('Error al cargar las citas: ' + error.message, 'error');
    }
}

async function loadStats() {
    try {
        const data = await apiRequest('/appointments/stats');
        updateStatsDisplay(data.data);
        console.log('📊 Estadísticas actualizadas');
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        // No mostrar error al usuario para estadísticas
    }
}

// ===== FUNCIONES DE POBLACIÓN DE SELECTS =====
function populatePatientSelects() {
    const patientSelects = [
        document.getElementById('patient-select'),
        document.getElementById('edit-patient-select')
    ];
    
    patientSelects.forEach(select => {
        if (!select) return;
        
        // Limpiar opciones existentes excepto la primera
        select.innerHTML = '<option value="">Seleccione un paciente</option>';
        
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            
            let patientInfo = patient.name;
            if (patient.birth_date) {
                const age = calculateAge(patient.birth_date);
                patientInfo += ` (${age} años)`;
            }
            if (patient.allergies && patient.allergies !== 'Ninguna') {
                patientInfo += ` - ⚠️ Alergias`;
            }
            
            option.textContent = patientInfo;
            select.appendChild(option);
        });
    });
}

function populateTreatmentSelects() {
    const treatmentSelects = [
        document.getElementById('treatment-select'),
        document.getElementById('edit-treatment-select')
    ];
    
    treatmentSelects.forEach(select => {
        if (!select) return;
        
        // Limpiar opciones existentes excepto la primera
        select.innerHTML = '<option value="">Seleccione un tratamiento</option>';
        
        // Agrupar por categoría
        const categorizedTreatments = {};
        treatments.forEach(treatment => {
            const category = treatment.category || 'general';
            if (!categorizedTreatments[category]) {
                categorizedTreatments[category] = [];
            }
            categorizedTreatments[category].push(treatment);
        });
        
        // Crear optgroups por categoría
        Object.keys(categorizedTreatments).forEach(category => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = getCategoryName(category);
            
            categorizedTreatments[category].forEach(treatment => {
                const option = document.createElement('option');
                option.value = treatment.id;
                option.textContent = `${treatment.name} - $${parseFloat(treatment.price).toFixed(2)} (${treatment.duration}min)`;
                optgroup.appendChild(option);
            });
            
            select.appendChild(optgroup);
        });
    });
}

function updateStatsDisplay(stats) {
    const statElements = {
        'total-appointments': stats.total || 0,
        'pending-appointments': stats.agendada || 0,
        'confirmed-appointments': stats.confirmada || 0,
        'today-appointments': stats.today || 0
    };

    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            // Animación de conteo
            animateNumber(element, parseInt(element.textContent) || 0, value);
        }
    });
}

function animateNumber(element, start, end) {
    const duration = 800;
    const increment = (end - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// ===== RENDERIZADO DE CITAS =====
function renderAppointments(appointmentsToRender = appointments) {
    if (!appointmentsContainer) return;

    if (!appointmentsToRender || appointmentsToRender.length === 0) {
        appointmentsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No hay citas programadas</p>
                <small>Las citas aparecerán aquí una vez que las crees</small>
            </div>
        `;
        return;
    }

    appointmentsContainer.innerHTML = appointmentsToRender.map(appointment => {
        const patientName = appointment.patient_name || 'Paciente no especificado';
        const treatmentName = appointment.treatment_name || 'Tratamiento no especificado';
        const treatmentPrice = parseFloat(appointment.treatment_price || 0).toFixed(2);
        const category = appointment.treatment_category || 'general';
        const duration = appointment.treatment_duration || 30;
        
        return `
            <div class="appointment-item" data-id="${appointment.id}">
                <div class="appointment-header">
                    <div class="appointment-client">${escapeHtml(patientName)}</div>
                    <span class="appointment-status status-${appointment.status}">
                        ${getStatusText(appointment.status)}
                    </span>
                </div>
                
                <div class="appointment-details">
                    <div class="appointment-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(appointment.appointment_date)}</span>
                    </div>
                    <div class="appointment-detail">
                        <i class="fas fa-clock"></i>
                        <span>${formatTime(appointment.appointment_time)}</span>
                    </div>
                    <div class="appointment-detail">
                        <i class="fas fa-tooth"></i>
                        <span>${escapeHtml(treatmentName)}</span>
                    </div>
                    <div class="appointment-detail">
                        <i class="fas fa-dollar-sign"></i>
                        <span>$${treatmentPrice}</span>
                    </div>
                    <div class="appointment-detail">
                        <i class="fas fa-tag"></i>
                        <span>${getCategoryName(category)}</span>
                    </div>
                    <div class="appointment-detail">
                        <i class="fas fa-hourglass-half"></i>
                        <span>${duration} min</span>
                    </div>
                </div>
                
                ${appointment.patient_allergies && appointment.patient_allergies !== 'Ninguna' ? `
                    <div class="allergy-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span><strong>Alergias:</strong> ${escapeHtml(appointment.patient_allergies)}</span>
                    </div>
                ` : ''}
                
                ${appointment.notes ? `
                    <div class="appointment-detail" style="margin-top: 10px; grid-column: 1 / -1;">
                        <i class="fas fa-sticky-note"></i>
                        <span style="font-style: italic;"><strong>Notas:</strong> ${escapeHtml(appointment.notes)}</span>
                    </div>
                ` : ''}
                
                ${appointment.dentist_notes ? `
                    <div class="dentist-notes">
                        <i class="fas fa-user-md"></i>
                        <span><strong>Notas del dentista:</strong> ${escapeHtml(appointment.dentist_notes)}</span>
                    </div>
                ` : ''}
                
                <div class="appointment-actions">
                    <button onclick="editAppointment(${appointment.id})" class="btn btn-small">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="deleteAppointment(${appointment.id})" class="btn btn-danger btn-small">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== MANEJADORES DE EVENTOS =====
async function handleCreateAppointment(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    
    try {
        // Mostrar estado de carga
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline-block';
        if (submitBtn) submitBtn.disabled = true;
        
        const appointmentData = {
            patient_id: document.getElementById('patient-select')?.value,
            treatment_id: document.getElementById('treatment-select')?.value,
            appointment_date: document.getElementById('appointment-date')?.value,
            appointment_time: document.getElementById('appointment-time')?.value,
            notes: document.getElementById('appointment-notes')?.value || ''
        };

        // Validaciones adicionales
        if (!appointmentData.patient_id || !appointmentData.treatment_id || 
            !appointmentData.appointment_date || !appointmentData.appointment_time) {
            throw new Error('Todos los campos obligatorios deben estar completos');
        }

        // Validar que la fecha no sea en el pasado
        const appointmentDateTime = new Date(`${appointmentData.appointment_date}T${appointmentData.appointment_time}`);
        if (appointmentDateTime < new Date()) {
            throw new Error('No se pueden agendar citas en el pasado');
        }

        await apiRequest('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });

        showAlert('✅ Cita creada exitosamente', 'success');
        appointmentForm.reset();
        await refreshData();
        
    } catch (error) {
        console.error('❌ Error creando cita:', error);
        showAlert('Error al crear la cita: ' + error.message, 'error');
    } finally {
        // Ocultar estado de carga
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function handleUpdateAppointment(e) {
    e.preventDefault();
    
    try {
        const appointmentId = document.getElementById('edit-appointment-id')?.value;
        
        if (!appointmentId) {
            throw new Error('ID de cita no válido');
        }

        const updateData = {
            patient_id: document.getElementById('edit-patient-select')?.value,
            treatment_id: document.getElementById('edit-treatment-select')?.value,
            appointment_date: document.getElementById('edit-appointment-date')?.value,
            appointment_time: document.getElementById('edit-appointment-time')?.value,
            status: document.getElementById('edit-status')?.value,
            notes: document.getElementById('edit-appointment-notes')?.value || '',
            dentist_notes: document.getElementById('edit-dentist-notes')?.value || ''
        };

        // Validaciones
        if (!updateData.patient_id || !updateData.treatment_id || 
            !updateData.appointment_date || !updateData.appointment_time || !updateData.status) {
            throw new Error('Todos los campos obligatorios deben estar completos');
        }

        await apiRequest(`/appointments/${appointmentId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        showAlert('✅ Cita actualizada exitosamente', 'success');
        closeModal();
        await refreshData();
        
    } catch (error) {
        console.error('❌ Error actualizando cita:', error);
        showAlert('Error al actualizar la cita: ' + error.message, 'error');
    }
}

async function editAppointment(id) {
    try {
        showLoading(true);
        const data = await apiRequest(`/appointments/${id}`);
        const appointment = data.data;
        
        if (!appointment) {
            throw new Error('Cita no encontrada');
        }
        
        // Poblar formulario de edición
        const formFields = {
            'edit-appointment-id': appointment.id,
            'edit-patient-select': appointment.patient_id,
            'edit-treatment-select': appointment.treatment_id,
            'edit-appointment-date': appointment.appointment_date,
            'edit-appointment-time': appointment.appointment_time,
            'edit-status': appointment.status,
            'edit-appointment-notes': appointment.notes || '',
            'edit-dentist-notes': appointment.dentist_notes || ''
        };

        Object.entries(formFields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
        
        // Mostrar modal
        if (editModal) editModal.style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error cargando cita para editar:', error);
        showAlert('Error al cargar los datos de la cita: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteAppointment(id) {
    if (!confirm('⚠️ ¿Está seguro de que desea eliminar esta cita?\n\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        showLoading(true);
        await apiRequest(`/appointments/${id}`, {
            method: 'DELETE'
        });
        
        showAlert('✅ Cita eliminada exitosamente', 'success');
        await refreshData();
        
    } catch (error) {
        console.error('❌ Error eliminando cita:', error);
        showAlert('Error al eliminar la cita: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function filterAppointments() {
    const selectedDate = filterDate?.value;
    
    if (!selectedDate) {
        renderAppointments();
        return;
    }
    
    const filteredAppointments = appointments.filter(appointment => 
        appointment.appointment_date === selectedDate
    );
    
    renderAppointments(filteredAppointments);
    
    // Mostrar información del filtro
    if (filteredAppointments.length === 0) {
        showAlert(`No hay citas programadas para el ${formatDate(selectedDate)}`, 'error');
    } else {
        showAlert(`Mostrando ${filteredAppointments.length} cita(s) para el ${formatDate(selectedDate)}`, 'success');
    }
}

async function refreshData() {
    try {
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Actualizando...';
            refreshBtn.disabled = true;
        }
        
        await loadInitialData();
        showAlert('✅ Datos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error actualizando datos:', error);
        showAlert('Error al actualizar los datos: ' + error.message, 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
            refreshBtn.disabled = false;
        }
    }
}

function closeModal() {
    if (editModal) editModal.style.display = 'none';
    if (editForm) editForm.reset();
}

// ===== FUNCIONES DE UTILIDAD =====
function showAlert(message, type = 'success') {
    const alertElement = type === 'success' ? alertSuccess : alertError;
    
    if (!alertElement) {
        console.warn('Elemento de alerta no encontrado');
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    alertElement.textContent = message;
    alertElement.style.display = 'block';
    
    // Auto-ocultar después del tiempo configurado
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, CONFIG.ALERT_TIMEOUT);
}

function showLoading(show) {
    // Aquí podrías implementar un spinner global si lo deseas
    if (show) {
        document.body.style.cursor = 'wait';
    } else {
        document.body.style.cursor = 'default';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Fecha no válida';
    
    try {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString(CONFIG.DATE_FORMAT, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return dateString;
    }
}

function formatTime(timeString) {
    if (!timeString) return 'Hora no válida';
    
    try {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        
        return date.toLocaleTimeString(CONFIG.DATE_FORMAT, CONFIG.TIME_FORMAT);
    } catch (error) {
        console.error('Error formateando hora:', error);
        return timeString;
    }
}

function getStatusText(status) {
    const statusMap = {
        'agendada': 'Agendada',
        'confirmada': 'Confirmada',
        'en_curso': 'En Curso',
        'completada': 'Completada',
        'cancelada': 'Cancelada',
        'no_asistio': 'No Asistió'
    };
    return statusMap[status] || status;
}

function getCategoryName(category) {
    const categoryMap = {
        'preventivo': 'Preventivo',
        'restaurativo': 'Restaurativo',
        'endodoncia': 'Endodoncia',
        'cirugia': 'Cirugía',
        'estetico': 'Estético',
        'ortodoncia': 'Ortodoncia',
        'periodontal': 'Periodontal',
        'general': 'General'
    };
    return categoryMap[category] || category;
}

function calculateAge(birthDate) {
    if (!birthDate) return '';
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== FUNCIONES DE VALIDACIÓN =====
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateTime(time) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
}

function validateDate(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
}

// ===== MANEJO DE ERRORES GLOBALES =====
window.addEventListener('error', (e) => {
    console.error('❌ Error global:', e.error);
    showAlert('Se produjo un error inesperado. Por favor, recarga la página.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Promise rechazada no manejada:', e.reason);
    showAlert('Error de conexión. Verifica tu conexión a internet.', 'error');
    e.preventDefault();
});

// ===== FUNCIONES EXPUESTAS GLOBALMENTE =====
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;

// ===== FUNCIONES DE DESARROLLO (solo en modo desarrollo) =====
if (window.location.hostname === 'localhost') {
    window.appDebug = {
        appointments,
        patients,
        treatments,
        loadAppointments,
        loadPatients,
        loadTreatments,
        refreshData
    };
    
    console.log('🔧 Modo desarrollo activado. Funciones de debug disponibles en window.appDebug');
}

// ===== FUNCIONES DE PERFORMANCE =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimizar filtros con debounce
if (filterDate) {
    const debouncedFilter = debounce(filterAppointments, 300);
    filterDate.removeEventListener('change', filterAppointments);
    filterDate.addEventListener('change', debouncedFilter);
}

// ===== MENSAJES DE CONSOLA =====
console.log(`
🦷 Sistema de Gestión de Citas Odontológicas v1.0
📋 Funcionalidades disponibles:
  • Crear, editar y eliminar citas dentales
  • Gestión de pacientes con historial médico
  • Catálogo de tratamientos odontológicos
  • Filtrar citas por fecha
  • Ver estadísticas en tiempo real
  • Alertas de alergias de pacientes
  
🛠️ Desarrollado con:
  • Frontend: HTML5, CSS3, JavaScript ES6+
  • Backend: Node.js, Express, MySQL
  • Iconos: Font Awesome
  
🦷 Especializado para consultorios dentales
📞 Soporte técnico disponible en los logs de la consola
`);

// ===== VERIFICACIÓN DE CONECTIVIDAD =====
function checkConnectivity() {
    if (navigator.onLine) {
        console.log('🌐 Conexión a internet: ✅ Online');
    } else {
        console.warn('🌐 Conexión a internet: ❌ Offline');
        showAlert('Sin conexión a internet. Algunas funcionalidades pueden no estar disponibles.', 'error');
    }
}

window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada');
    showAlert('Conexión a internet restaurada', 'success');
    refreshData();
});

window.addEventListener('offline', () => {
    console.warn('🌐 Conexión perdida');
    showAlert('Se perdió la conexión a internet', 'error');
});

// Verificar conectividad al cargar
checkConnectivity();