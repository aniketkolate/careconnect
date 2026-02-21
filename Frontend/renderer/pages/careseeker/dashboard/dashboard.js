async function loadDashboard() {
  const res = await api("/seeker/dashboard", "GET");

  if (!res?.success || !res.message) {
    console.error("Failed to load dashboard stats");
    return;
  }

  const stats = res.message;

  const statElems = document.querySelectorAll(".stats .stat h4");
  if (statElems.length >= 3) {
    statElems[0].innerText = stats.totalRequests || 0;
    statElems[1].innerText = stats.activeRequests || 0;
    statElems[2].innerText = stats.completedRequests || 0;
  }
}

// 2️⃣ Load Recent Requests
async function loadRecentRequests() {
  const res = await api("/seeker/recent-requests", "GET");

  const tbody = document.querySelector(".card table tbody");
  if (!tbody) return;

  // Clear existing rows
  tbody.innerHTML = "";

  if (!res?.success || !res.data || res.data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="height:140px; text-align:center;color:#666;">No recent requests found</td>
      </tr>
    `;
    return;
  }

  // Map API response to table rows
  res.data.slice(0, 4).forEach(req => {
    // Duration: calculate days / months if needed, here we'll just show start-end
    const startDate = new Date(req.start_time);
    const endDate = new Date(req.end_time);

    let duration = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    // Status mapping for UI classes
    let statusClass = "";
    switch (req.status.toUpperCase()) {
      case "CREATED":
        statusClass = "created";
        break;
      case "ASSIGNED":
        statusClass = "active"; // light blue
        break;
      case "PENDING_ACCEPTANCE":
        statusClass = "pending"; // we’ll define orange in CSS
        break;
      case "ONGOING":
        statusClass = "active"; // green
        break;
      case "COMPLETED":
        statusClass = "completed"; // purple
        break;
      case "CANCELLED":
        statusClass = "cancelled"; // red
        break;
      default:
        statusClass = "";
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${req.care_type}</td>
      <td>${duration}</td>
      <td><span class="status ${statusClass}">${req.status}</span></td>
      <td>${startDate.toLocaleDateString()}</td>
    `;
    tbody.appendChild(row);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadRecentRequests();
  loadNotifications();
});

function go(url) {
  window.location.href = url;
}

function logout() {
  localStorage.clear();
  location.href = "../../common/login/login.html";
}


async function loadNotifications() {
  const notifWrapper = document.getElementById('notificationsBody');
  if (!notifWrapper) return;

  try {
    const res = await api('/seeker/notifications', 'GET');

    if (!res?.success || !res.data || res.data.length === 0) {
      notifWrapper.innerHTML = '<div class="no-notification">No notifications to display</div>';
      return;
    }

    notifWrapper.innerHTML = '';

    res.data.forEach(item => {
      notifWrapper.innerHTML += `
        <div class="notification ">
          <div class="notif-content">
            <div class="notif-title">${item.title}</div>
            <div class="notif-desc">${item.message}</div>
            <button class="btn-pay" onclick="go('../make-payment/make-payment.html')">
              Pay Now
            </button>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error('Failed to load notifications:', err);
    notifWrapper.innerHTML = '<div class="no-notification">Failed to load notifications</div>';
  }
}
