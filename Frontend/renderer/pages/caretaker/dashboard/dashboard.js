async function loadDashboard() {
  try {
    const response = await api('/taker/dashboard', 'GET');

    if (!response.success) return;

    const {
      pendingAssignments,
      activeAssignments,
      completedAssignments,
      monthlyEarnings
    } = response.data;

    const totalAssignments =
      pendingAssignments + activeAssignments + completedAssignments;

    document.getElementById('totalAssignments').innerText = totalAssignments;
    document.getElementById('activeAssignments').innerText = activeAssignments;
    document.getElementById('completedAssignments').innerText = completedAssignments;
    document.getElementById('monthlyEarnings').innerText = `₹${monthlyEarnings}`;
  } catch (error) {
    console.error('Dashboard load failed:', error);
  }
}

async function loadPendingAssignments() {
  const tbody = document.getElementById("pendingAssignmentsBody");

  try {
    const res = await api(
      "/taker/assignments?status=PENDING_ACCEPTANCE",
      "GET"
    );

    if (!res.success || !res.data || res.data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; color:#777;">
            🎉 No pending assignment requests
          </td>
        </tr>
      `;
      return;
    }

    // Show only first 3
    const pendingList = res.data.slice(0, 3);

    tbody.innerHTML = pendingList
      .map(
        (item) => `
        <tr>
          <td>${item.seeker_name}</td>
          <td>${item.care_type}</td>
          <td>
            <span class="status pending">Pending</span>
          </td>
          <td>
            <button class="btn btn-success"
              onclick="handleAction(${item.id}, 'ACCEPT', this.closest('tr'))">
              Accept
            </button>
            <button class="btn btn-warning"
              onclick="handleAction(${item.id}, 'REJECT', this.closest('tr'))">
              Reject
            </button>
          </td>
        </tr>
      `
      )
      .join("");

    /* =========================
       VIEW ALL LINK
    ========================= */
    if (res.data.length > 3) {
      tbody.innerHTML += `
        <tr>
          <td colspan="4" style="text-align:center;">
            <a href="../assigned-requests/assigned-requests.html"
               style="
                 color:#4e8cff;
                 font-weight:500;
                 text-decoration:none;
                 cursor:pointer;
               ">
              View all
            </a>
          </td>
        </tr>
      `;
    }

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; color:red;">
          Failed to load pending assignments
        </td>
      </tr>
    `;
  }
}


async function handleAction(assignmentId, action, row) {
  try {
    // disable buttons while processing
    const buttons = row.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);

    const response = await api(`/taker/assignments/${assignmentId}/respond`, 'POST', {
      action: action.toUpperCase()
    });

    if (response.success) {
      // optionally remove the row or update status
      if (action.toUpperCase() === 'ACCEPT') {
        row.querySelector('.btn-success').innerText = 'Accepted';
        row.querySelector('.btn-success').disabled = true;
        alert("Care request accepted successfully");
        loadPendingAssignments();
      }
      if (action.toUpperCase() === 'REJECT') {
        alert("Care request rejected successfully");
        loadPendingAssignments();
      }
    } else {
      alert('Action failed: ' + response.message);
      buttons.forEach(btn => btn.disabled = false);
    }

  } catch (err) {
    console.error(err);
    alert('Something went wrong!');
    const buttons = row.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = false);
  }
}


async function loadTodaySchedule() {
  const container = document.getElementById("todaySchedule");

  try {
    const response = await api("/taker/assignments/today", "GET");

    if (!response.success || response.data.length === 0) {
      container.innerHTML = `
  <p style="
    display: flex;
    justify-content: center;
    align-items: center;
    color: #666;
    font-size: 0.9rem;
    min-height: 150px;
    margin: 0;
  ">
    No care scheduled for today 🌤️
  </p>
`;

      return;
    }

    container.innerHTML = "";

    response.data.forEach(item => {
      container.innerHTML += `
        <div class="task">
          <strong>${item.seeker_name}</strong>
          <span>
            ${formatTime(item.start_time)} – 
            ${formatTime(item.end_time)} · 
            ${item.care_type}
          </span>
        </div>
      `;
    });

  } catch (err) {
    console.error("Failed to load today schedule", err);
    container.innerHTML = `
      <p style="color:red; font-size:0.9rem;">
        Failed to load today’s schedule
      </p>
    `;
  }
}

/* =========================
   Time Formatter (IST)
========================= */
function formatTime(isoString) {
  const date = new Date(isoString);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function logout() {
  localStorage.clear();
  location.href = "../../common/login/login.html";
}


// call on page load
loadDashboard();
loadPendingAssignments();
loadTodaySchedule();

