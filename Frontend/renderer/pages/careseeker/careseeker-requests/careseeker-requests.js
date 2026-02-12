// Map API status to UI classes
const statusClasses = {
  'CREATED': 'pending',           // light orange
  'ASSIGNED': 'assigned',         // green
  'PENDING_ACCEPTANCE': 'pending', // orange
  'ONGOING': 'assigned',          // green
  'COMPLETED': 'completed',       // blue
  'CANCELLED': 'pending'          // red-ish, can add separate class if needed
};


// Load all requests dynamically
async function loadRequests(status = '') {
  try {
    const res = await api(`/seeker/care-request${status ? '?status=' + status : ''}`, 'GET');
    if (!res.success) throw new Error(res.message);

    const tbody = document.querySelector("table tbody");
    tbody.innerHTML = '';

    // 👇 NO RECORDS CASE
    if (!res.data || res.data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="no-records">
            No care requests found
          </td>
        </tr>
      `;
      return;
    }

    // 👇 NORMAL DATA RENDER
    res.data.forEach(req => {
      const tr = document.createElement('tr');

      const requestId = `#REQ${req.id}`;
      const careType = req.care_type;
      const duration = getDuration(req.start_time, req.end_time);
      const statusClass = statusClasses[req.status] || 'pending';
      const statusLabel = req.status.replace('_', ' ');

      tr.innerHTML = `
        <td>${requestId}</td>
        <td>${careType}</td>
        <td>${duration}</td>
        <td><span class="status ${statusClass}">${statusLabel}</span></td>
        <td>
          <button class="action-btn" onclick="viewRequest(${req.id})">View</button>
          <button class="action-btn delete-btn" onclick="deleteRequest(${req.id})">Delete</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    showToast("Failed to load requests: " + err.message, "error");
  }
}


// Helper to calculate duration in hours/days
function getDuration(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const diffMs = endDate - startDate;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) return diffHours + ' Hours';
  const diffDays = Math.ceil(diffHours / 24);
  return diffDays + ' Days';
}

// Handle view button
const modal = document.getElementById("requestModal");

async function viewRequest(id) {
  try {
    modal.style.display = "flex";
    const res = await api(`/seeker/care-request/${id}`, "GET");
    if (!res.success) throw new Error("Failed to fetch request");
    const data = res.message; // API sends data in `message`
    document.getElementById("m-id").textContent = `#REQ${data.id}`;
    document.getElementById("m-careType").textContent = data.care_type;
    document.getElementById("m-description").textContent = data.description || "N/A";
    document.getElementById("m-status").textContent = data.status.replace('_', ' ');
    document.getElementById("m-created").textContent =
      new Date(data.created_at).toLocaleString();
    document.getElementById("m-start").textContent =
      data.start_time ? new Date(data.start_time).toLocaleString() : "N/A";
    document.getElementById("m-end").textContent =
      data.end_time ? new Date(data.end_time).toLocaleString() : "N/A";
    document.getElementById("m-duration").textContent =
      data.duration_label || getDuration(data.start_time, data.end_time);
  } catch (err) {
    console.error(err);
    showToast("Unable to load request details", "error");
    closeModal();
  }
}

let deleteRequestId = null;

// Open confirmation popup
function deleteRequest(id) {
  deleteRequestId = id;
  document.getElementById("deleteConfirmModal").style.display = "flex";

  // attach once
  document.getElementById("confirmDeleteBtn").onclick = confirmDelete;
}

// Close popup
function closeDeleteModal() {
  deleteRequestId = null;
  document.getElementById("deleteConfirmModal").style.display = "none";
}

// Call DELETE API
async function confirmDelete() {
  if (!deleteRequestId) return;

  try {
    const res = await api(`/seeker/care-request/${deleteRequestId}`, "DELETE");

    if (!res.success) {
      showToast(res.message || "Failed to delete request", "error");
      closeDeleteModal();
      return;
    }

    closeDeleteModal();
    showToast("Request deleted successfully", "success");
    loadRequests(); // reload table
  } catch (err) {
    console.error(err);
    showToast("Something went wrong while deleting", "error");
  }
}


function closeModal() {
  document.getElementById("requestModal").style.display = "none";
}

// Load all requests on page load
window.addEventListener('DOMContentLoaded', () => loadRequests());

function logout() {
  localStorage.clear();
  location.href = "../../common/login/login.html";
}
