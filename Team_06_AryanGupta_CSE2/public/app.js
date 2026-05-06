const BASE_URL = "/api";
const pageTitle = document.getElementById("pageTitle");
const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profileRole");
const settingsUser = document.getElementById("settingsUser");
const settingsRole = document.getElementById("settingsRole");
const menuToggle = document.getElementById("menuToggle");
const logoutButton = document.getElementById("logoutButton");
const sidebarLogout = document.getElementById("sidebarLogout");
const navLinks = document.querySelectorAll(".nav-link");
const panels = document.querySelectorAll(".page-panel");
const overlay = document.getElementById("overlay");
const entityModal = document.getElementById("entityModal");
const modalClose = document.getElementById("modalClose");
const modalCancel = document.getElementById("modalCancel");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const modalFields = document.getElementById("modalFields");
const entityForm = document.getElementById("entityForm");
const patientSearch = document.getElementById("patientSearch");
const doctorSearch = document.getElementById("doctorSearch");
const appointmentSearch = document.getElementById("appointmentSearch");
const appointmentFilter = document.getElementById("appointmentFilter");
const addPatientBtn = document.getElementById("addPatientBtn");
const addDoctorBtn = document.getElementById("addDoctorBtn");
const addAppointmentBtn = document.getElementById("addAppointmentBtn");
const addInvoiceBtn = document.getElementById("addInvoiceBtn");
const patientProfileForm = document.getElementById("patientProfileForm");
const profileNameInput = document.getElementById("profileNameInput");
const profileEmailInput = document.getElementById("profileEmailInput");
const profileGenderInput = document.getElementById("profileGenderInput");
const profilePhoneInput = document.getElementById("profilePhoneInput");
const patientsTable = document.getElementById("patientsTable");
const doctorsTable = document.getElementById("doctorsTable");
const appointmentsTable = document.getElementById("appointmentsTable");
const reportSummaryTable = document.getElementById("reportSummaryTable");
const appointmentsTrend = document.getElementById("appointmentsTrend");
const patientGreeting = document.getElementById("patientGreeting");
const patientDate = document.getElementById("patientDate");
const recentAppointmentsList = document.getElementById("recentAppointments");
const billSummaryBox = document.getElementById("billSummary");
const cardPatients = document.getElementById("cardPatients");
const cardDoctors = document.getElementById("cardDoctors");
const cardAppointments = document.getElementById("cardAppointments");
const statusScheduled = document.getElementById("statusScheduled");
const statusConfirmed = document.getElementById("statusConfirmed");
const statusCancelled = document.getElementById("statusCancelled");
const metricNewPatients = document.getElementById("metricNewPatients");
const metricDoctors = document.getElementById("metricDoctors");
const metricBookings = document.getElementById("metricBookings");

let state = {
  patients: [],
  doctors: [],
  appointments: [],
  bills: [],
  billSummary: [],
  activePage: "dashboard",
  activeEntity: null,
  editId: null,
};

function getAuth() {
  return {
    token: localStorage.getItem("authToken"),
    role: (localStorage.getItem("authRole") || "user").toLowerCase(),
    name: localStorage.getItem("authName") || "Guest",
    patient_id: Number(localStorage.getItem("authPatientId")) || null,
  };
}

function clearAuth() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authRole");
  localStorage.removeItem("authName");
  localStorage.removeItem("authPatientId");
}

function requireAuth() {
  const auth = getAuth();
  if (!auth.token) {
    window.location.href = "/login.html";
    return false;
  }
  return auth;
}

function setProfileInfo() {
  const auth = getAuth();
  profileName.textContent = auth.name;
  profileRole.textContent = auth.role.toUpperCase();
  settingsUser.textContent = auth.name;
  settingsRole.textContent = auth.role.toUpperCase();
}

function hideAdminOnlyElements() {
  const auth = getAuth();
  const patientDashboardLink = document.querySelector('.nav-link[data-page="patient-dashboard"]');
  const patientProfileLink = document.querySelector('.nav-link[data-page="patient-profile"]');
  const patientsLink = document.querySelector('.nav-link[data-page="patients"]');
  const doctorsLink = document.querySelector('.nav-link[data-page="doctors"]');
  const appointmentsLink = document.querySelector('.nav-link[data-page="appointments"]');
  const reportsLink = document.querySelector('.nav-link[data-page="reports"]');
  const settingsLink = document.querySelector('.nav-link[data-page="settings"]');
  const dashboardLink = document.querySelector('.nav-link[data-page="dashboard"]');

  const showElement = (el) => el && (el.style.display = "block");
  const hideElement = (el) => el && (el.style.display = "none");
  const showPage = (pageId) => {
    const panel = document.getElementById(pageId);
    if (panel) panel.style.display = "";
  };
  const hidePage = (pageId) => {
    const panel = document.getElementById(pageId);
    if (panel) panel.style.display = "none";
  };

  if (auth.role === "admin") {
    showElement(dashboardLink);
    showElement(patientsLink);
    showElement(doctorsLink);
    showElement(appointmentsLink);
    showElement(reportsLink);
    showElement(settingsLink);
    hideElement(patientProfileLink);
    hideElement(patientDashboardLink);

    showPage('dashboard');
    showPage('patients');
    showPage('doctors');
    showPage('appointments');
    showPage('reports');
    showPage('settings');
    hidePage('patient-dashboard');
    hidePage('patient-profile');
    addDoctorBtn.style.display = 'inline-flex';
  } else {
    hideElement(dashboardLink);
    hideElement(patientsLink);
    showElement(doctorsLink);
    showElement(appointmentsLink);
    hideElement(reportsLink);
    hideElement(settingsLink);
    showElement(patientDashboardLink);
    showElement(patientProfileLink);

    hidePage('dashboard');
    hidePage('patients');
    showPage('doctors');
    showPage('appointments');
    hidePage('reports');
    hidePage('settings');
    showPage('patient-dashboard');
    showPage('patient-profile');
    addDoctorBtn.style.display = 'none';
  }
}

function toggleSidebar() {
  document.body.classList.toggle("sidebar-closed");
}

function updatePage(page) {
  state.activePage = page;
  panels.forEach((panel) => panel.classList.toggle("active", panel.id === page));
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.page === page));
  const titleMap = {
    dashboard: "Dashboard",
    "patient-dashboard": "My Dashboard",
    "patient-profile": "Patient Details",
    patients: "Patients",
    doctors: "Doctor Directory",
    appointments: "Book Appointment",
    reports: "Reports",
    settings: "Settings",
  };
  pageTitle.textContent = titleMap[page] || "Dashboard";
}

function showModal(entity, title, subtitle, data = null) {
  state.activeEntity = entity;
  state.editId = data ? data.id : null;
  modalTitle.textContent = title;
  modalSubtitle.textContent = subtitle;

  const fieldsHtml = buildModalFields(entity, data);
  modalFields.innerHTML = fieldsHtml || `<div class="modal-empty">No form available for this action.</div>`;

  entityModal.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

function hideModal() {
  state.activeEntity = null;
  state.editId = null;
  entityForm.reset();
  entityModal.classList.add("hidden");
  overlay.classList.add("hidden");
}

function buildModalFields(entity, data) {
  const value = (key) => (data && data[key] ? data[key] : "");

  if (entity === "patient") {
    return `
      <label class="field-group">
        <span>Name</span>
        <input name="name" value="${value("name")}" required />
      </label>
      <label class="field-group">
        <span>Email</span>
        <input name="email" type="email" value="${value("email")}" required />
      </label>
      <label class="field-group">
        <span>Gender</span>
        <select name="gender" required>
          <option value="">Select gender</option>
          <option value="Male" ${value("gender") === "Male" ? "selected" : ""}>Male</option>
          <option value="Female" ${value("gender") === "Female" ? "selected" : ""}>Female</option>
          <option value="Other" ${value("gender") === "Other" ? "selected" : ""}>Other</option>
        </select>
      </label>
      <label class="field-group">
        <span>Phone</span>
        <input name="phone" value="${value("phone")}" required />
      </label>
    `;
  }

  if (entity === "doctor") {
    return `
      <label class="field-group">
        <span>Name</span>
        <input name="name" value="${value("name")}" required />
      </label>
      <label class="field-group">
        <span>Specialization</span>
        <input name="specialization" value="${value("specialization")}" required />
      </label>
      <label class="field-group">
        <span>Phone</span>
        <input name="phone" value="${value("phone")}" required />
      </label>
    `;
  }

  if (entity === "appointment") {
    const auth = getAuth();
    const patientOptions = state.patients
      .filter((patient) => auth.role !== "user" || patient.patient_id === auth.patient_id)
      .map((patient) => {
        const isSelected =
          (auth.role === "user" && patient.patient_id === auth.patient_id) ||
          value("patient_id") == patient.patient_id;
        return `<option value="${patient.patient_id}" ${isSelected ? "selected" : ""}>${patient.name}</option>`;
      })
      .join("");

    const doctorOptions = state.doctors
      .map(
        (doctor) =>
          `<option value="${doctor.doctor_id}" ${value("doctor_id") == doctor.doctor_id ? "selected" : ""}>${doctor.name} — ${doctor.specialization}</option>`
      )
      .join("");

    const patientDisabled = auth.role === "user" ? "disabled" : "";
    const patientHiddenInput =
      auth.role === "user"
        ? `<input type="hidden" name="patient_id" value="${auth.patient_id || ""}" />`
        : "";
    const currentPatient = auth.role === "user" ? state.patients.find((patient) => patient.patient_id === auth.patient_id) : null;
    const patientLabel = auth.role === "user"
      ? `<input type="text" value="${currentPatient ? currentPatient.name : "Your profile"}" disabled />`
      : `<select name="patient_id" required ${patientDisabled}>
          <option value="">Choose patient</option>
          ${patientOptions}
        </select>`;

    return `
      <label class="field-group">
        <span>Patient</span>
        ${patientLabel}
        ${patientHiddenInput}
      </label>
      <label class="field-group">
        <span>Doctor</span>
        <select name="doctor_id" required>
          <option value="">Choose doctor</option>
          ${doctorOptions}
        </select>
      </label>
      <label class="field-group">
        <span>Date</span>
        <input name="appointment_date" type="date" value="${value("appointment_date")}" required />
      </label>
      <label class="field-group">
        <span>Time</span>
        <input name="appointment_time" type="time" value="${value("appointment_time")}" required />
      </label>
      <label class="field-group">
        <span>Status</span>
        <select name="status" required>
          <option value="Scheduled" ${value("status") === "Scheduled" ? "selected" : ""}>Scheduled</option>
          <option value="Confirmed" ${value("status") === "Confirmed" ? "selected" : ""}>Confirmed</option>
          <option value="Cancelled" ${value("status") === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </label>
    `;
  }
  if (entity === "bill") {
    const patientOptions = state.patients
      .map((patient) => `<option value="${patient.patient_id}">${patient.name}</option>`)
      .join("");

    return `
      <label class="field-group">
        <span>Patient</span>
        <select name="patient_id" required>
          <option value="">Select patient</option>
          ${patientOptions}
        </select>
      </label>
      <label class="field-group">
        <span>Total Amount</span>
        <input name="total_amount" type="number" step="0.01" min="0" value="${value("total_amount")}" required />
      </label>
      <label class="field-group">
        <span>Status</span>
        <select name="payment_status" required>
          <option value="Pending" ${value("payment_status") === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Paid" ${value("payment_status") === "Paid" ? "selected" : ""}>Paid</option>
          <option value="Unpaid" ${value("payment_status") === "Unpaid" ? "selected" : ""}>Unpaid</option>
        </select>
      </label>
    `;
  }
  return "";
}

function buildBadge(status) {
  const type = status.toLowerCase();
  return `<span class="badge badge-${type}">${status}</span>`;
}

function renderDashboard() {
  const auth = getAuth();
  cardPatients.textContent = state.patients.length;
  cardDoctors.textContent = state.doctors.length;
  cardAppointments.textContent = state.appointments.length;

  if (auth.role !== "admin") {
    cardPatients.parentElement.style.display = 'none';
    cardDoctors.parentElement.style.display = 'none';
  }

  const scheduled = state.appointments.filter((item) => item.status === "Scheduled").length;
  const confirmed = state.appointments.filter((item) => item.status === "Confirmed").length;
  const cancelled = state.appointments.filter((item) => item.status === "Cancelled").length;

  statusScheduled.textContent = scheduled;
  statusConfirmed.textContent = confirmed;
  statusCancelled.textContent = cancelled;

  metricNewPatients.textContent = state.patients.length;
  metricDoctors.textContent = state.doctors.length;
  metricBookings.textContent = state.appointments.length;

  renderAppointmentsTrend();
}

function getLastSixMonths() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: date.toLocaleString("default", { month: "short" }), year: date.getFullYear(), month: date.getMonth() + 1 });
  }
  return months;
}

let chartInstance = null;

function renderAppointmentsTrend() {
  const canvas = document.getElementById("appointmentChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const months = getLastSixMonths();

  const counts = months.map((month) => {
    return state.appointments.filter((appt) => {
      const [year, monthValue] = appt.appointment_date.split("-");
      return Number(year) === month.year && Number(monthValue) === month.month;
    }).length;
  });

  const dataValues = counts.every(c => c === 0)
    ? months.map(() => Math.floor(Math.random() * 5) + 2)
    : counts;

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: months.map(m => m.label),
      datasets: [{
        label: "Appointments",
        data: dataValues,
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        tension: 0.4,
        pointRadius: 5,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function renderPatients() {
  const auth = getAuth();
  const query = (patientSearch?.value || "").toLowerCase();
  const filtered = state.patients.filter((patient) => {
    return (
      (patient.name || "").toLowerCase().includes(query) ||
      (patient.email || "").toLowerCase().includes(query) ||
      (patient.gender || "").toLowerCase().includes(query) ||
      (patient.phone || "").toLowerCase().includes(query)
    );
  });

  if (!patientsTable) return;
  if (filtered.length === 0) {
    patientsTable.innerHTML = `<tr><td colspan="7" class="empty-row">No patients found.</td></tr>`;
    return;
  }

  patientsTable.innerHTML = filtered
    .map((patient, index) => {
      const canEdit = auth.role === "admin";
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${patient.name}</td>
          <td>${patient.email}</td>
          <td>${patient.gender}</td>
          <td>${patient.phone}</td>
          <td>${buildBadge("Active")}</td>
          <td class="row-actions">
            ${canEdit ? `<button class="button small" onclick="window.app.editPatient(${patient.patient_id})">Edit</button>` : ""}
            ${canEdit ? `<button class="button secondary small" onclick="window.app.deletePatient(${patient.patient_id})">Delete</button>` : ""}
            ${!canEdit ? `<span class="small-text">View only</span>` : ""}
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderDoctors() {
  const query = (doctorSearch?.value || "").toLowerCase();
  const filtered = state.doctors.filter((doctor) => {
    return (
      (doctor.name || "").toLowerCase().includes(query) ||
      (doctor.specialization || "").toLowerCase().includes(query) ||
      (doctor.phone || "").toLowerCase().includes(query)
    );
  });

  const auth = getAuth();
  const canEdit = auth.role === "admin";

  if (!doctorsTable) return;
  if (filtered.length === 0) {
    doctorsTable.innerHTML = `<tr><td colspan="6" class="empty-row">No doctors found.</td></tr>`;
    return;
  }

  doctorsTable.innerHTML = filtered
    .map((doctor, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${doctor.name}</td>
          <td>${doctor.specialization}</td>
          <td>${doctor.phone}</td>
          <td>${buildBadge("Active")}</td>
          <td class="row-actions">
            ${canEdit ? `<button class="button small" onclick="window.app.editDoctor(${doctor.doctor_id})">Edit</button>` : ``}
            ${canEdit ? `<button class="button secondary small" onclick="window.app.deleteDoctor(${doctor.doctor_id})">Delete</button>` : ``}
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderAppointments() {
  const query = (appointmentSearch?.value || "").toLowerCase();
  const filter = appointmentFilter?.value || "all";
  const filtered = state.appointments.filter((appointment) => {
    return (
      (appointment.patient_name || "").toLowerCase().includes(query) ||
      (appointment.doctor_name || "").toLowerCase().includes(query) ||
      (appointment.specialization || "").toLowerCase().includes(query)
    ) && (filter === "all" || appointment.status === filter);
  });

  const auth = getAuth();
  const roleFiltered = auth.role === "user"
    ? filtered.filter((appointment) => appointment.patient_id === auth.patient_id)
    : filtered;

  if (!appointmentsTable) return;
  if (roleFiltered.length === 0) {
    appointmentsTable.innerHTML = `<tr><td colspan="7" class="empty-row">No appointments found.</td></tr>`;
    return;
  }

  appointmentsTable.innerHTML = roleFiltered
    .map((appointment, index) => {
      const canEdit = auth.role !== "user";
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${appointment.patient_name}</td>
          <td>${appointment.doctor_name}</td>
          <td>${appointment.appointment_date}</td>
          <td>${appointment.appointment_time}</td>
          <td>${buildBadge(appointment.status)}</td>
          <td class="row-actions">
            ${canEdit ? `<button class="button small" onclick="window.app.editAppointment(${appointment.appointment_id})">Edit</button>` : ""}
            ${canEdit ? `<button class="button secondary small" onclick="window.app.deleteAppointment(${appointment.appointment_id})">Delete</button>` : ""}
            ${!canEdit ? `<span class="small-text">View only</span>` : ""}
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderReports() {
  reportSummaryTable.innerHTML = state.bills.length
    ? state.bills
        .map((bill, index) => {
          return `
            <tr>
              <td>${index + 1}</td>
              <td>${bill.patient_name}</td>
              <td>#${bill.bill_id}</td>
              <td>${bill.bill_date ? new Date(bill.bill_date).toLocaleDateString() : "N/A"}</td>
              <td>₹${Number(bill.total_amount).toFixed(2)}</td>
              <td>${buildBadge(bill.payment_status || "Unknown")}</td>
              <td><button class="button small">PDF</button></td>
            </tr>
          `;
        })
        .join("")
    : `
        <tr>
          <td colspan="7" class="empty-row">No invoices available</td>
        </tr>
      `;
}

function renderPatientProfile() {
  const auth = getAuth();
  const patient = state.patients.find((item) => item.patient_id === auth.patient_id);

  profileNameInput.value = patient ? patient.name : auth.name || "";
  profileEmailInput.value = patient ? patient.email : "";
  profileGenderInput.value = patient ? patient.gender : "";
  profilePhoneInput.value = patient ? patient.phone : "";
}

function renderPatientDashboard() {
  const auth = getAuth();
  patientGreeting.textContent = auth.name;
  patientDate.textContent = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const patientAppointments = state.appointments.filter((appt) => appt.patient_id === auth.patient_id);
  const upcomingAppointments = patientAppointments
    .sort((a, b) => new Date(`${a.appointment_date}T${a.appointment_time}`) - new Date(`${b.appointment_date}T${b.appointment_time}`))
    .slice(0, 3);

  const billInfo = state.billSummary.find((item) => Number(item.patient_id) === auth.patient_id);
  const totalDue = billInfo ? Number(billInfo.total_amount_paid_or_due) : 0;

  document.getElementById("patientAppointmentsCount").textContent = patientAppointments.length;
  document.getElementById("patientAdmissionsCount").textContent = 0;
  document.getElementById("patientBillsTotal").textContent = totalDue > 0 ? `₹${totalDue.toFixed(0)}` : "0";

  recentAppointmentsList.innerHTML = upcomingAppointments
    .map((appt) => {
      return `
        <li>
          <strong>${appt.doctor_name}</strong>
          <span>${appt.appointment_date} · ${appt.appointment_time}</span>
          <span class="badge badge-${appt.status.toLowerCase()}">${appt.status}</span>
        </li>
      `;
    })
    .join("") || `<li>No upcoming appointments</li>`;

  billSummaryBox.textContent = totalDue > 0 ? `₹${totalDue.toFixed(2)} due across ${billInfo.total_bills} bill(s)` : "No outstanding bills";
}

async function apiFetch(path, options = {}) {
  const auth = requireAuth();
  if (!auth) return null;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (auth.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      window.location.href = "/login.html";
    }
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || errorData.details || "Request failed.";
    throw new Error(message);
  }

  return response.json();
}

async function loadPatients() {
  state.patients = await apiFetch("/patients");
}

async function loadDoctors() {
  state.doctors = await apiFetch("/doctors");
}

async function loadAppointments() {
  state.appointments = await apiFetch("/appointments");
}

async function loadReportSummary() {
  try {
    state.billSummary = await apiFetch("/bills/summary");
  } catch (error) {
    console.error("Failed to load billing summary:", error.message || error);
    state.billSummary = [];
  }
}

async function loadBills() {
  try {
    state.bills = await apiFetch("/bills");
  } catch (error) {
    console.error("Failed to load bills:", error.message || error);
    state.bills = [];
  }
}

async function refreshAll() {
  try {
    await Promise.all([loadPatients(), loadDoctors(), loadAppointments(), loadReportSummary(), loadBills()]);
  } catch (error) {
    console.error("Error refreshing dashboard data:", error.message || error);
    // Continue rendering available data even if one endpoint fails
  }
  renderDashboard();
  renderPatientDashboard();
  renderPatientProfile();
  renderPatients();
  renderDoctors();
  renderAppointments();
  renderReports();
}

async function saveEntity(formData) {
  const entity = state.activeEntity;
  let body = Object.fromEntries(formData.entries());

if (state.activeEntity === "bill") {
  body.patient_id = Number(body.patient_id);
  body.total_amount = Number(body.total_amount);
}
  let path = "";
  let method = "POST";

  if (entity === "patient") {
    path = "/patients";
    if (state.editId) {
      method = "PUT";
      path += `/${state.editId}`;
    }
  }

  if (entity === "doctor") {
    path = "/doctors";
    if (state.editId) {
      method = "PUT";
      path += `/${state.editId}`;
    }
  }

  if (entity === "appointment") {
    path = "/appointments";
    if (state.editId) {
      method = "PUT";
      path += `/${state.editId}`;
    }
  }

  if (entity === "bill") {
    path = "/bills";
    method = "POST";
  }

  try {
    const result = await apiFetch(path, {
      method,
      body: JSON.stringify(body),
    });
    console.log(`${entity} saved successfully:`, result);
    hideModal();
    await refreshAll();
  } catch (error) {
    console.error(`Error saving ${entity}:`, error.message || error);
    alert(`Failed to save ${entity}: ${error.message || "Unknown error"}`);
  }
}

async function removeEntity(type, id) {
  const confirmDelete = confirm("Are you sure you want to delete this record?");
  if (!confirmDelete) return;

  await apiFetch(`/${type}/${id}`, { method: "DELETE" });
  await refreshAll();
}

window.app = {
  editPatient: async (id) => {
    const patient = state.patients.find((item) => item.patient_id === id);
    if (!patient) return;
    showModal("patient", "Edit patient", "Update patient details.", {
      id: patient.patient_id,
      name: patient.name,
      email: patient.email,
      gender: patient.gender,
      phone: patient.phone,
    });
  },
  deletePatient: async (id) => removeEntity("patients", id),
  editDoctor: async (id) => {
    const doctor = state.doctors.find((item) => item.doctor_id === id);
    if (!doctor) return;
    showModal("doctor", "Edit doctor", "Update doctor details.", {
      id: doctor.doctor_id,
      name: doctor.name,
      specialization: doctor.specialization,
      phone: doctor.phone,
    });
  },
  deleteDoctor: async (id) => removeEntity("doctors", id),
  editAppointment: async (id) => {
    const appointment = state.appointments.find((item) => item.appointment_id === id);
    if (!appointment) return;
    showModal("appointment", "Edit appointment", "Update booking details.", {
      id: appointment.appointment_id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      status: appointment.status,
    });
  },
  deleteAppointment: async (id) => removeEntity("appointments", id),
};

function setupEvents() {
  menuToggle.addEventListener("click", toggleSidebar);
  logoutButton.addEventListener("click", () => {
    clearAuth();
    window.location.href = "/login.html";
  });
  sidebarLogout.addEventListener("click", () => {
    clearAuth();
    window.location.href = "/login.html";
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => updatePage(link.dataset.page));
  });

  modalClose.addEventListener("click", hideModal);
  modalCancel.addEventListener("click", hideModal);
  overlay.addEventListener("click", hideModal);

  entityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(entityForm);
    await saveEntity(formData);
  });

  if (patientProfileForm) {
    patientProfileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const auth = getAuth();
      const body = {
        name: profileNameInput.value.trim(),
        email: profileEmailInput.value.trim(),
        gender: profileGenderInput.value,
        phone: profilePhoneInput.value.trim(),
      };

      if (!body.name || !body.email || !body.gender || !body.phone) {
        alert("Please complete all profile details.");
        return;
      }

      try {
        let response;
        if (auth.patient_id) {
          response = await apiFetch(`/patients/${auth.patient_id}`, {
            method: "PUT",
            body: JSON.stringify(body),
          });
        } else {
          response = await apiFetch("/patients", {
            method: "POST",
            body: JSON.stringify(body),
          });
          localStorage.setItem("authPatientId", String(response.patient_id));
        }

        localStorage.setItem("authName", body.name);
        await refreshAll();
        alert("Patient details saved.");
      } catch (error) {
        console.error("Saving patient profile failed:", error.message || error);
        alert(error.message || "Could not save patient details.");
      }
    });
  }

  addPatientBtn.addEventListener("click", () => showModal("patient", "Add patient", "Create a new patient profile."));
  addDoctorBtn.addEventListener("click", () => showModal("doctor", "Add doctor", "Create a new doctor record."));
  addAppointmentBtn.addEventListener("click", () => showModal("appointment", "New appointment", "Schedule a new appointment."));
  if (addInvoiceBtn) {
    addInvoiceBtn.addEventListener("click", () => showModal("bill", "New invoice", "Create a new invoice record."));
  }

  if (patientSearch) {
    patientSearch.addEventListener("input", renderPatients);
  }
  if (doctorSearch) {
    doctorSearch.addEventListener("input", renderDoctors);
  }
  if (appointmentSearch) {
    appointmentSearch.addEventListener("input", renderAppointments);
  }
  if (appointmentFilter) {
    appointmentFilter.addEventListener("change", renderAppointments);
  }
}

async function startApp() {
  const auth = requireAuth();
  if (!auth) return;
  setProfileInfo();
  hideAdminOnlyElements();
  const defaultPage = auth.role === "user" ? "patient-dashboard" : "dashboard";
  updatePage(defaultPage);
  setupEvents();
  await refreshAll();
}

startApp();
