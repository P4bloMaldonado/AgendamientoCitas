// ===== VARIABLES GLOBALES =====
let patients = [];

// ===== ELEMENTOS DEL DOM =====
const patientForm = document.getElementById('patient-form');
const editForm = document.getElementById('edit-form');
const editModal = document.getElementById('edit-modal');
const patientsContainer = document.getElementById('patients-container');
const alertSuccess = document.getElementById('alert-success');
const alertError = document.getElementById('alert-error');
const searchInput = document.getElementById('search-patients');
const refreshBtn = document.getElementById('refresh-btn');

// ===== CONFIGURACIÓN =====
const CONFIG = {
    API_BASE_URL: '/api',
    ALERT_TIMEOUT: 5000
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('👥 Iniciando Gestión de Pacientes...');
    initApp();
});

async function initApp() {
    try {
        await loadPatients();
        setupEventListeners();
        updateStats();
        console.log('✅ Gestión de pacientes inicializada');
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        showAlert('Error al inicializar la aplicación', 'error');
    }
}

function setupEventListeners() {
    // Formularios
    if (patientForm) patientForm.addEventListener('submit', handleCreatePatient);
    if (editForm) editForm.addEventListener('submit', handleUpdatePatient);
    
    // Búsqueda en tiempo real
    if (searchInput) searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Botones
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

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error en la petición');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error en petición API:', error);
        throw error;
    }
}

async function loadPatients() {
    try {
        const data = await apiRequest('/patients');
        patients = data.data || [];
        renderPatients();
        console.log(`👥 ${patients.length} pacientes cargados`);
    } catch (error) {
        console.error('❌ Error cargando pacientes:', error);
        showAlert('Error al cargar los pacientes: ' + error.message, 'error');
    }
}

// ===== RENDERIZADO =====
function renderPatients(patientsToRender = patients) {
    if (!patientsContainer) return;

    if (!patientsToRender || patientsToRender.length === 0) {
        patientsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-times"></i>
                <p>No hay pacientes registrados</p>
                <small>Los pacientes aparecerán aquí una vez que los agregues</small>
            </div>
        `;
        return;
    }

    patientsContainer.innerHTML = patientsToRender.map(patient => {
        const age = patient.birth_date ? calculateAge(patient.birth_date) : 'N/A';
        const hasAllergies = patient.allergies && patient.allergies !== 'Ninguna';
        
        return `
            <div class="patient-item">
                <div class="patient-header">
                    <div class="patient-name">
                        <i class="fas fa-user"></i>
                        ${escapeHtml(patient.name)}
                        ${age !== 'N/A' ? `<span class="patient-age">(${age} años)</span>` : ''}
                    </div>
                    ${hasAllergies ? `
                        <span class="allergy-badge">
                            <i class="fas fa-exclamation-triangle"></i> Alergias
                        </span>
                    ` : ''}
                </div>
                
                <div class="patient-details">
                    ${patient.email ? `
                        <div class="patient-detail">
                            <i class="fas fa-envelope"></i>
                            <span>${escapeHtml(patient.email)}</span>
                        </div>
                    ` : ''}
                    
                    ${patient.phone ? `
                        <div class="patient-detail">
                            <i class="fas fa-phone"></i>
                            <span>${escapeHtml(patient.phone)}</span>
                        </div>
                    ` : ''}
                    
                    ${patient.emergency_contact ? `
                        <div class="patient-detail">
                            <i class="fas fa-user-shield"></i>
                            <span>Emergencia: ${escapeHtml(patient.emergency_contact)}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${hasAllergies ? `
                    <div class="allergy-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span><strong>Alergias:</strong> ${escapeHtml(patient.allergies)}</span>
                    </div>
                ` : ''}
                
                ${patient.medical_history ? `
                    <div class="patient-detail" style="margin-top: 10px;">
                        <i class="fas fa-notes-medical"></i>
                        <span><strong>Historia médica:</strong> ${escapeHtml(patient.medical_history)}</span>
                    </div>
                ` : ''}
                
                <div class="patient-actions">
                    <button onclick="editPatient(${patient.id})" class="btn btn-small">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="deletePatient(${patient.id})" class="btn btn-danger btn-small">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== MANEJADORES DE EVENTOS =====
async function handleCreatePatient(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    
    try {
        // Mostrar estado de carga
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline-block';
        if (submitBtn) submitBtn.disabled = true;
        
        const patientData = {
            name: document.getElementById('patient-name')?.value?.trim(),
            email: document.getElementById('patient-email')?.value?.trim() || null,
            phone: document.getElementById('patient-phone')?.value?.trim() || null,
            address: document.getElementById('patient-address')?.value?.trim() || null,
            birth_date: document.getElementById('patient-birth-date')?.value || null,
            emergency_contact: document.getElementById('emergency-contact')?.value?.trim() || null,
            emergency_phone: document.getElementById('emergency-phone')?.value?.trim() || null,
            medical_history: document.getElementById('medical-history')?.value?.trim() || null,
            allergies: document.getElementById('allergies')?.value?.trim() || null
        };

        // Validación básica
        if (!patientData.name) {
            throw new Error('El nombre del paciente es obligatorio');
        }

        await apiRequest('/patients', {
            method: 'POST',
            body: JSON.stringify(patientData)
        });

        showAlert('✅ Paciente agregado exitosamente', 'success');
        patientForm.reset();
        await refreshData();
        
    } catch (error) {
        console.error('❌ Error creando paciente:', error);
        showAlert('Error al agregar el paciente: ' + error.message, 'error');
    } finally {
        // Ocultar estado de carga
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function handleUpdatePatient(e) {
    e.preventDefault();
    
    try {
        const patientId = document.getElementById('edit-patient-id')?.value;
        
        if (!patientId) {
            throw new Error('ID de paciente no válido');
        }

        const updateData = {
            name: document.getElementById('edit-patient-name')?.value?.trim(),
            email: document.getElementById('edit-patient-email')?.value?.trim() || null,
            phone: document.getElementById('edit-patient-phone')?.value?.trim() || null,
            address: document.getElementById('edit-patient-address')?.value?.trim() || null,
            birth_date: document.getElementById('edit-patient-birth-date')?.value || null,
            emergency_contact: document.getElementById('edit-emergency-contact')?.value?.trim() || null,
            emergency_phone: document.getElementById('edit-emergency-phone')?.value?.trim() || null,
            medical_history: document.getElementById('edit-medical-history')?.value?.trim() || null,
            allergies: document.getElementById('edit-allergies')?.value?.trim() || null
        };

        if (!updateData.name) {
            throw new Error('El nombre del paciente es obligatorio');
        }

        await apiRequest(`/patients/${patientId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        showAlert('✅ Paciente actualizado exitosamente', 'success');
        closeModal();
        await refreshData();
        
    } catch (error) {
        console.error('❌ Error actualizando paciente:', error);
        showAlert('Error al actualizar el paciente: ' + error.message, 'error');
    }
}

async function editPatient(id) {
    try {
        const data = await apiRequest(`/patients/${id}`);
        const patient = data.data;
        
        // Poblar formulario de edición
        const formFields = {
            'edit-patient-id': patient.id,
            'edit-patient-name': patient.name || '',
            'edit-patient-email': patient.email || '',
            'edit-patient-phone': patient.phone || '',
            'edit-patient-address': patient.address || '',
            'edit-patient-birth-date': patient.birth_date || '',
            'edit-emergency-contact': patient.emergency_contact || '',
            'edit-emergency-phone': patient.emergency_phone || '',
            'edit-medical-history': patient.medical_history || '',
            'edit-allergies': patient.allergies || ''
        };

        Object.entries(formFields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
        
        // Mostrar modal
        if (editModal) editModal.style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error cargando paciente para editar:', error);
        showAlert('Error al cargar los datos del paciente: ' + error.message, 'error');
    }
}

async function deletePatient(id) {
    const patient = patients.find(p => p.id === id);
    const patientName = patient ? patient.name : 'este paciente';
    
    if (!confirm(`⚠️ ¿Está seguro de que desea eliminar a ${patientName}?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        await apiRequest(`/patients/${id}`, {
            method: 'DELETE'
        });
        
        showAlert('✅ Paciente eliminado exitosamente', 'success');
        await refreshData();
        
    } catch (error) {
        console.error('❌ Error eliminando paciente:', error);
        showAlert('Error al eliminar el paciente: ' + error.message, 'error');
    }
}

async function handleSearch() {
    const searchTerm = searchInput?.value?.trim();
    
    if (!searchTerm) {
        renderPatients();
        return;
    }
    
    try {
        const data = await apiRequest(`/patients/search?q=${encodeURIComponent(searchTerm)}`);
        renderPatients(data.data);
    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        showAlert('Error en la búsqueda: ' + error.message, 'error');
    }
}

async function refreshData() {
    try {
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Actualizando...';
            refreshBtn.disabled = true;
        }
        
        await loadPatients();
        updateStats();
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
function updateStats() {
    const totalPatients = patients.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Pacientes nuevos este mes
    const newThisMonth = patients.filter(patient => {
        const createdDate = new Date(patient.created_at);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;
    
    // Pacientes con alergias
    const withAllergies = patients.filter(patient => 
        patient.allergies && patient.allergies !== 'Ninguna' && patient.allergies.trim() !== ''
    ).length;
    
    // Cumpleaños este mes
    const birthdaysThisMonth = patients.filter(patient => {
        if (!patient.birth_date) return false;
        const birthDate = new Date(patient.birth_date);
        return birthDate.getMonth() === currentMonth;
    }).length;
    
    // Actualizar estadísticas
    const stats = {
        'total-patients': totalPatients,
        'new-patients-month': newThisMonth,
        'patients-with-allergies': withAllergies,
        'birthdays-this-month': birthdaysThisMonth
    };

    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
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

function showAlert(message, type = 'success') {
    const alertElement = type === 'success' ? alertSuccess : alertError;
    
    if (!alertElement) {
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    alertElement.textContent = message;
    alertElement.style.display = 'block';
    
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, CONFIG.ALERT_TIMEOUT);
}

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

// ===== FUNCIONES EXPUESTAS GLOBALMENTE =====
window.editPatient = editPatient;
window.deletePatient = deletePatient;

console.log('👥 Sistema de Gestión de Pacientes cargado');