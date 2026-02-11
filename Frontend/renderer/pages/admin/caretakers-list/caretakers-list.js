let caretakers = [];

async function loadCaretakers() {
  try {
    const res = await api("/admin/users?role=CARE_TAKER", "GET");
    caretakers = res.data || [];
    renderTable(caretakers);
  } catch (err) {
    console.error("Failed to load caretakers", err);
  }
}

function renderTable(data) {
  const tbody = document.getElementById("caretakerTable");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6">No caretakers found</td></tr>`;
    return;
  }

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
            <button class="action-btn" onclick="viewCareTaker(${u.id})">View</button>
            <button class="action-btn ${u.is_active ? "active" : "inactive"}" onclick="toggleStatus(${u.id}, ${u.is_active})">
              ${u.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

document.getElementById("searchInput").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  renderTable(
    caretakers.filter(c =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.specialization || "").toLowerCase().includes(q)
    )
  );
});

function viewCareTaker(id) {
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

    alert(
      `User has been ${!currentStatus ? "activated" : "deactivated"} successfully.`
    );

    loadCaretakers(); // reload table
  } catch (err) {
    console.error(err);
    alert(err.message || "Something went wrong while updating status.");
  }
}

loadCaretakers();