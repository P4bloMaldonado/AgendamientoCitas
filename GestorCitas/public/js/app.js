// ===== FUNCIONES DE UTILIDAD =====
// Ya no se importa nada. Se espera que <script src="lib/utilidades.js"></script> esté cargado en el HTML

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

function initApp() {
    fetchPatients();
    fetchTreatments();
    fetchAppointments();

    appointmentForm?.addEventListener('submit', handleAppointmentSubmit);
    editForm?.addEventListener('submit', handleEditSubmit);
    refreshBtn?.addEventListener('click', refreshData);
    filterDate?.addEventListener('change', filterAppointments);
}

function fetchPatients() {
    fetch(`${CONFIG.API_BASE_URL}/patients`)
        .then(res => res.json())
        .then(data => {
            patients = data;
            populatePatientSelects();
        })
        .catch(error => {
            console.error('Error al obtener pacientes:', error);
            showAlert('Error al cargar pacientes.', 'error');
        });
}

function fetchTreatments() {
    fetch(`${CONFIG.API_BASE_URL}/treatments`)
        .then(res => res.json())
        .then(data => {
            treatments = data;
            populateTreatmentSelects();
        })
        .catch(error => {
            console.error('Error al obtener tratamientos:', error);
            showAlert('Error al cargar tratamientos.', 'error');
        });
}

function fetchAppointments() {
    fetch(`${CONFIG.API_BASE_URL}/appointments`)
        .then(res => res.json())
        .then(data => {
            appointments = data;
            renderAppointments();
        })
        .catch(error => {
            console.error('Error al obtener citas:', error);
            showAlert('Error al cargar citas.', 'error');
        });
}

function renderAppointments() {
    appointmentsContainer.innerHTML = '';

    const filtered = filterDate.value
        ? appointments.filter(app => app.date === filterDate.value)
        : appointments;

    if (filtered.length === 0) {
        appointmentsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times" aria-hidden="true"></i>
                <p>No hay citas programadas</p>
                <small>Las citas aparecerán aquí una vez que las crees</small>
            </div>`;
        return;
    }

    filtered.forEach(app => {
        const patient = patients.find(p => p.id === app.patientId);
        const treatment = treatments.find(t => t.id === app.treatmentId);

        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.innerHTML = `
            <div>
                <h3>${escapeHtml(patient?.name || 'Paciente Desconocido')}</h3>
                <p><strong>Tratamiento:</strong> ${escapeHtml(treatment?.name || 'N/A')}</p>
                <p><strong>Fecha:</strong> ${formatDate(app.date)}</p>
                <p><strong>Hora:</strong> ${formatTime(app.time)}</p>
                <p><strong>Estado:</strong> ${getStatusText(app.status)}</p>
            </div>
            <div>
                <button class="btn btn-small" onclick="editAppointment(${app.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;
        appointmentsContainer.appendChild(card);
    });
}

function filterAppointments() {
    renderAppointments();
}

function refreshData() {
    fetchPatients();
    fetchTreatments();
    fetchAppointments();
}

function populatePatientSelects() {
    const selects = [document.getElementById('patient-select'), document.getElementById('edit-patient-select')];
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione un paciente</option>';
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = patient.name;
            select.appendChild(option);
        });
    });
}

function populateTreatmentSelects() {
    const selects = [document.getElementById('treatment-select'), document.getElementById('edit-treatment-select')];
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione un tratamiento</option>';
        treatments.forEach(treatment => {
            const option = document.createElement('option');
            option.value = treatment.id;
            option.textContent = treatment.name;
            select.appendChild(option);
        });
    });
}

window.editAppointment = function (id) {
    const app = appointments.find(a => a.id === id);
    if (!app) return;

    document.getElementById('edit-appointment-id').value = app.id;
    document.getElementById('edit-patient-select').value = app.patientId;
    document.getElementById('edit-treatment-select').value = app.treatmentId;
    document.getElementById('edit-appointment-date').value = app.date;
    document.getElementById('edit-appointment-time').value = app.time;
    document.getElementById('edit-status').value = app.status;
    document.getElementById('edit-appointment-notes').value = app.notes || '';
    document.getElementById('edit-dentist-notes').value = app.dentistNotes || '';

    editModal.style.display = 'block';
};

document.querySelector('#edit-modal .close').addEventListener('click', () => {
    editModal.style.display = 'none';
});
document.getElementById('cancel-edit').addEventListener('click', () => {
    editModal.style.display = 'none';
});

function handleAppointmentSubmit(event) {
    event.preventDefault();
    const form = event.target;

    const newApp = {
        patientId: form['patient-select'].value,
        treatmentId: form['treatment-select'].value,
        date: form['appointment-date'].value,
        time: form['appointment-time'].value,
        notes: form['appointment-notes'].value
    };

    showLoading('appointment-form', true);

    fetch(`${CONFIG.API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
    })
        .then(res => res.json())
        .then(() => {
            showAlert('Cita creada con éxito');
            form.reset();
            refreshData();
        })
        .catch(err => {
            console.error(err);
            showAlert('Error al crear la cita', 'error');
        })
        .finally(() => {
            showLoading('appointment-form', false);
        });
}

function handleEditSubmit(event) {
    event.preventDefault();
    const form = event.target;

    const id = form['edit-appointment-id'].value;
    const updatedApp = {
        patientId: form['edit-patient-select'].value,
        treatmentId: form['edit-treatment-select'].value,
        date: form['edit-appointment-date'].value,
        time: form['edit-appointment-time'].value,
        status: form['edit-status'].value,
        notes: form['edit-appointment-notes'].value,
        dentistNotes: form['edit-dentist-notes'].value
    };

    fetch(`${CONFIG.API_BASE_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedApp)
    })
        .then(res => res.json())
        .then(() => {
            showAlert('Cita actualizada con éxito');
            editModal.style.display = 'none';
            refreshData();
        })
        .catch(err => {
            console.error(err);
            showAlert('Error al actualizar la cita', 'error');
        });
}

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

checkConnectivity();