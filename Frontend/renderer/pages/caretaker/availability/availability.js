const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const slots = ["MORNING", "AFTERNOON", "EVENING"];

let isEditMode = false;

document.addEventListener("DOMContentLoaded", () => {
  renderTable();
  loadAvailability();
  setEditMode(false);

  document.getElementById("editBtn").addEventListener("click", enableEdit);
  document.getElementById("saveBtn").addEventListener("click", saveAvailability);
  document.getElementById("cancelBtn").addEventListener("click", cancelEdit);
});

/* =========================
   Render table once
========================= */
function renderTable() {
  const tbody = document.getElementById("availabilityBody");

  tbody.innerHTML = days.map(day => `
    <tr>
      <td>${day.charAt(0) + day.slice(1).toLowerCase()}</td>
      <td>
        <label class="switch">
          <input type="checkbox" data-day="${day}">
          <span class="slider"></span>
        </label>
      </td>
    </tr>
  `).join("");
}


/* =========================
   Edit Mode Toggle
========================= */
function setEditMode(edit) {
  isEditMode = edit;

  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.disabled = !edit;
  });

  document.getElementById("editBtn").style.display = edit ? "none" : "inline-block";
  document.getElementById("saveBtn").style.display = edit ? "inline-block" : "none";
  document.getElementById("cancelBtn").style.display = edit ? "inline-block" : "none";
}

function enableEdit() {
  setEditMode(true);
}

function cancelEdit() {
  setEditMode(false);
  loadAvailability();
}

/* =========================
   Load Availability (GET)
========================= */
async function loadAvailability() {
  try {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });

    const res = await api("/taker/availability", "GET");

    if (!res?.success || !Array.isArray(res.data)) return;

    res.data.forEach(({ day }) => {
      const checkbox = document.querySelector(
        `input[data-day="${day}"]`
      );
      if (checkbox) checkbox.checked = true;
    });

  } catch (err) {
    console.error(err);
    alert("Failed to load availability");
  }
}


/* =========================
   Save Availability (POST)
========================= */
async function saveAvailability() {
  try {
    const availability = [];

    document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      availability.push(
         cb.dataset.day,
      );
    });

    const res = await api("/taker/availability", "POST", { availability });

    if (res.success) {
      alert("Availability saved successfully ✅");
      setEditMode(false);
      loadAvailability();
    } else {
      alert("Failed to save availability");
    }

  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
}

/* =========================
   Logout
========================= */
function logout() {
  localStorage.clear();
  location.href = "../../common/login/login.html";
}
