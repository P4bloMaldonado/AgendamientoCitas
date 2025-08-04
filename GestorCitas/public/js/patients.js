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
document.addEventListener('DOMContentLoaded', function () {
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
    if (patientForm) patientForm.addEventListener('submit', handleCreatePatient);
    if (editForm) editForm.addEventListener('submit', handleUpdatePatient);
    if (searchInput) searchInput.addEventListener('input', debounce(handleSearch, 300));
    if (refreshBtn) refreshBtn.addEventListener('click', refreshData);

    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-edit');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

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

        const fields = {
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

        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = value;
        }

        editModal.style.display = 'block';

    } catch (error) {
        console.error('❌ Error cargando paciente para editar:', error);
        showAlert('Error al cargar los datos del paciente: ' + error.message, 'error');
    }
}

async function deletePatient(id) {
    const patient = patients.find(p => p.id === id);
    const name = patient?.name || 'el paciente';

    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;

    try {
        await apiRequest(`/patients/${id}`, { method: 'DELETE' });
        showAlert('✅ Paciente eliminado', 'success');
        await refreshData();
    } catch (error) {
        console.error('❌ Error eliminando paciente:', error);
        showAlert('Error al eliminar: ' + error.message, 'error');
    }
}

async function handleSearch() {
    const term = searchInput?.value?.trim();
    if (!term) return renderPatients();

    try {
        const data = await apiRequest(`/patients/search?q=${encodeURIComponent(term)}`);
        renderPatients(data.data);
    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        showAlert('Error en búsqueda: ' + error.message, 'error');
    }
}

async function refreshData() {
    try {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Actualizando...';
        refreshBtn.disabled = true;
        await loadPatients();
        updateStats();
        showAlert('✅ Datos actualizados correctamente', 'success');
    } catch (error) {
        showAlert('Error al actualizar los datos', 'error');
    } finally {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
        refreshBtn.disabled = false;
    }
}

function closeModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

// ===== FUNCIONES DE UTILIDAD =====
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function showAlert(message, type = 'success') {
    const alert = type === 'success' ? alertSuccess : alertError;
    if (!alert) return;
    alert.textContent = message;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, CONFIG.ALERT_TIMEOUT);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ===== FUNCIONES GLOBALES =====
window.editPatient = editPatient;
window.deletePatient = deletePatient;

console.log('👥 Sistema de Gestión de Pacientes cargado');
