const apiBase = "/api/auth";
const statusEl = document.getElementById("status");

function showStatus(message, type = "error") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  setTimeout(() => {
    statusEl.className = "status";
    statusEl.textContent = "";
  }, 2500);
}

async function submitAuth(event, path) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showStatus("Please enter both email and password.");
    return;
  }

  try {
    const response = await fetch(`${apiBase}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authRole", data.role);
    localStorage.setItem("authName", data.name || "");
    localStorage.setItem("authPatientId", data.patient_id ? String(data.patient_id) : "");

    window.location.href = "/index.html";
  } catch (err) {
    showStatus(err.message || "Login failed");
  }
}

function submitUserLogin(event) {
  return submitAuth(event, "login");
}

function submitAdminLogin(event) {
  return submitAuth(event, "admin-login");
}
