
const tabs = document.querySelectorAll(".tab");
const tbody = document.getElementById("tableBody");

const STATUS_MAP = {
  pending: 'PENDING_ACCEPTANCE',
  ongoing: 'ONGOING',
  completed: 'COMPLETED'
};

function formatDuration(start, end) {
  if (!start || !end) return '-';

  const startTime = new Date(start);
  const endTime = new Date(end);

  const diffMs = endTime - startTime;
  const hours = diffMs / (1000 * 60 * 60);

  return `${hours} hrs`;
}

function getActions(item) {
  const status = item.status;
  const id = item.care_request_id;

  if (status === 'ONGOING') {
    return `
      <button class="btn btn-view" onclick='openViewModal(${JSON.stringify(item)})'>
      View
    </button>
      <button class="btn btn-success" onclick="openCompleteModal(${id})">Complete</button>
    `;
  }

  if (status === 'PENDING_ACCEPTANCE') {
    return `
      <button class="btn btn-view" onclick='openViewModal(${JSON.stringify(item)})'>
      View
    </button>
      <button class="btn btn-success" onclick="handleAction(${id}, 'ACCEPT', this.closest('tr'))">Accept</button>
      <button class="btn btn-warning" onclick="handleAction(${id}, 'REJECT', this.closest('tr'))">Reject</button>
    `;
  }
  if (status === 'COMPLETED') {
    let reminderBtn = '';

    if (item.payment_status === 'PENDING') {
      reminderBtn = `
      <button class="btn btn-warning btn-sm"
        onclick="sendPaymentReminder(${id}, this)">
        Send Reminder
      </button>
    `;
    }

    return `
    <button class="btn btn-view"
      onclick='openViewModal(${JSON.stringify(item)})'>
      View
    </button>
    ${reminderBtn}
  `;
  }


  return '';
}


async function loadTable(uiStatus) {
  try {
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

    const apiStatus = STATUS_MAP[uiStatus];
    const response = await api(`/taker/assignments?status=${apiStatus}`, 'GET');

    tbody.innerHTML = '';

    if (!response.success || response.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-rec-fnd">No records found</td></tr>';
      return;
    }

    response.data.forEach(item => {
      tbody.innerHTML += `
           <tr>
              <td>${item.seeker_name}</td>
              <td>${item.care_type}</td>
              <td>${formatDuration(item.start_time, item.end_time)}</td>
              <td>${getPaymentCell(item)}</td>
              <td>${getActions(item)}</td>
            </tr>
          `;
    });

  } catch (error) {
    console.error('Failed to load assignments:', error);
    tbody.innerHTML = '<tr><td colspan="5">Something went wrong</td></tr>';
  }
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    loadTable(tab.dataset.tab);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // Activate pending tab
  tabs.forEach(t => t.classList.remove("active"));

  const pendingTab = document.querySelector('.tab[data-tab="pending"]');
  if (pendingTab) pendingTab.classList.add("active");

  // Load pending assignments
  loadTable('pending');
});


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
        // ✅ reload CURRENT ACTIVE TAB
        const activeTab = getActiveTab();
        loadTable(activeTab);
      }
      if (action.toUpperCase() === 'REJECT') {
        alert("Care request rejected successfully");
        // ✅ reload CURRENT ACTIVE TAB
        const activeTab = getActiveTab();
        loadTable(activeTab);
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

function openViewModal(item) {
  document.getElementById("modalSeeker").innerText = item.seeker_name;
  document.getElementById("modalType").innerText = item.care_type;
  document.getElementById("modalStart").innerText =
    new Date(item.start_time).toLocaleString();
  document.getElementById("modalEnd").innerText =
    new Date(item.end_time).toLocaleString();

  const statusEl = document.getElementById("modalStatus");
  statusEl.innerText = item.status == "PENDING_ACCEPTANCE" ? "PENDING" : item.status.toLowerCase().replace('_', ' ');

  document.getElementById("viewModal").style.display = "flex";
}

function closeViewModal() {
  document.getElementById("viewModal").style.display = "none";
}

/* Close on backdrop click */
document.getElementById("viewModal").addEventListener("click", e => {
  if (e.target.id === "viewModal") closeViewModal();
});


function getActiveTab() {
  const activeTab = document.querySelector(".tab.active");
  return activeTab ? activeTab.dataset.tab : "pending";
}

let completingAssignmentId = null;

function openCompleteModal(assignmentId) {
  completingAssignmentId = assignmentId;

  const modal = document.getElementById("completeModal");
  const amountInput = document.getElementById("completeAmount");
  const btn = modal.querySelector(".btn-success");

  // reset state
  amountInput.value = "";
  btn.disabled = false;
  btn.innerText = "Mark as Complete";

  modal.style.display = "flex";

  // 👇 force focus (VERY IMPORTANT)
  setTimeout(() => {
    amountInput.focus();
  }, 0);
}


function closeCompleteModal() {
  document.getElementById("completeModal").style.display = "none";
  completingAssignmentId = null;
}

async function markAsComplete() {
  try {
    const amountInput = document.getElementById("completeAmount");
    const amount = Number(amountInput.value);

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      amountInput.focus();
      return;
    }


    if (!completingAssignmentId) {
      alert("Invalid assignment");
      return;
    }

    // Disable button to avoid double submit
    const btn = document.querySelector(
      "#completeModal .btn-success"
    );
    btn.disabled = true;
    btn.innerText = "Processing...";

    const res = await api(
      `/taker/assignments/${completingAssignmentId}/status`,
      "PUT",
      {
        status: "COMPLETED",
        amount: amount
      }
    );

    if (res.success) {
      alert("Care request marked as completed");
      closeCompleteModal();

      // reload current active tab
      const activeTab = getActiveTab();
      loadTable(activeTab);
    } else {
      alert(res.message || "Failed to complete request");
    }

    btn.disabled = false;
    btn.innerText = "Mark as Complete";

  } catch (err) {
    console.error(err);
    alert("Something went wrong");
    const btn = document.querySelector(
      "#completeModal .btn-success"
    );
    btn.disabled = false;
    btn.innerText = "Mark as Complete";
  }
}

/* Close on backdrop click */
document.getElementById("completeModal").addEventListener("click", e => {
  if (e.target.id === "completeModal") closeCompleteModal();
});


function getPaymentCell(item) {
  if (item.status !== 'COMPLETED') return '-';

  if (item.payment_status === 'PAID') {
    return `<span class="status paid">Paid</span>`;
  }

  return `<span class="status pending">Pending</span>`;
}


async function sendPaymentReminder(careRequestId) {
  try {
    const res = await api(
      `/taker/payments/${careRequestId}/reminder`,
      'POST'
    );

    if (res.success) {
      alert('Payment reminder sent to care seeker');
    } else {
      alert(res.message || 'Failed to send reminder');
    }
  } catch (err) {
    console.error(err);
    alert('Something went wrong');
  }
}



function logout() {
  localStorage.clear();
  location.href = "../../common/login.html";
}