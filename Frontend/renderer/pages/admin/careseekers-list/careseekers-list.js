let allCareSeekers = [];

async function loadCareSeekers() {
  const tbody = document.getElementById("careSeekersBody");
  tbody.innerHTML = "";

  const res = await api("/admin/users?role=CARE_SEEKER");
  allCareSeekers = res.data || [];

  if (!allCareSeekers.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No care seekers found</td></tr>`;
    return;
  }

  renderTable(allCareSeekers);
}

function renderTable(data) {
  const tbody = document.getElementById("careSeekersBody");
  tbody.innerHTML = "";

  data.forEach(u => {
    tbody.innerHTML += `
      <tr>
        <td>${u.name || "-"}</td>
        <td>${u.email}</td>
        <td>${u.phone || "-"}</td>
        <td>
          <span class="status ${u.is_active ? "active" : "inactive"}">
            ${u.is_active ? "Active" : "Inactive"}
          </span>
        </td>
        <td>
          <div class="action-btn-wrapper">
            <button class="action-btn" onclick="viewCareSeeker(${u.id})">View</button>
            <button class="action-btn ${u.is_active ? "active" : "inactive"}" onclick="toggleStatus(${u.id}, ${u.is_active})">
              ${u.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}


document.getElementById("search").addEventListener("input", e => {
  const value = e.target.value.toLowerCase();
  const filtered = allCareSeekers.filter(u =>
    (u.name || "").toLowerCase().includes(value) ||
    (u.email || "").toLowerCase().includes(value)
  );
  renderTable(filtered);
});

function viewCareSeeker(id) {
  localStorage.setItem("selectedUserId", id);
  location.href = "../user-profile-view/user-profile-view.html";
}

function logout() {
  localStorage.clear();
  location.href = "../../common/login/login.html";
}

async function toggleStatus(userId, currentStatus) {
  const confirmMsg = currentStatus
    ? "Are you sure you want to deactivate this user?"
    : "Are you sure you want to activate this user?";

  if (!confirm(confirmMsg)) return;

  try {
    await api(`/admin/users/${userId}/status`, "PATCH", {
      status: !currentStatus
    });

    showToast(`User has been ${!currentStatus ? "activated" : "deactivated"} successfully.`, "success");

    loadCareSeekers(); // reload table
  } catch (err) {
    console.error(err);
    showToast(err.message || "Something went wrong while updating status.", "error");
  }
}


loadCareSeekers();
