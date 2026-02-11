let assignedData = [];

function formatDate(date) {
  return date ? new Date(date).toDateString() : "-";
}

function calculateDuration(start, end) {
  if (!start || !end) return null;
  const hrs = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
  return `${hrs} hrs`;
}

async function loadAssignedCaretakers() {
  const res = await api("/seeker/assigned-caretakers", "GET");

  assignedData = res.data || [];
  renderRequestList();

  if (assignedData.length) showDetails(0);
}

function renderRequestList() {
  const list = document.getElementById("requestList");
  list.innerHTML = "";

  if (!assignedData || assignedData.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        No care requests or assigned caretakers yet.<br/>
      </div>
    `;
    return;
  }

  assignedData.forEach((item, index) => {
    if (!item) return;

    const div = document.createElement("div");
    div.className = "request-item" + (index === 0 ? " active" : "");
    div.onclick = () => showDetails(index);

    div.innerHTML = `
      <div><b>${item.care_type}</b></div>
      <div style="font-size:12px">${formatDate(item.start_time)}</div>
      <span class="status ${item.status}">${item.status=="PENDING_ACCEPTANCE"?"PENDING":item.status}</span>
    `;

    list.appendChild(div);
  });
}



function showDetails(index) {
  document.querySelectorAll(".request-item")
    .forEach(i => i.classList.remove("active"));

  document.querySelectorAll(".request-item")[index]
    .classList.add("active");

  const item = assignedData[index];
  const { caretaker, assignment } = item;
  const duration = calculateDuration(item.start_time, item.end_time);

  document.getElementById("detailsPanel").innerHTML = `
    <div class="details-card">

      <!-- Header -->
      <div class="card-header">
        <h4>Care Request #${item.id}</h4>
        <span class="status-badge ${item.status}">
          ${item.status.replaceAll("_", " ")}
        </span>
      </div>

      <!-- Request Info -->
      <div class="section">
        <h5 class="section-title">Request Details</h5>

        <div class="info-grid">
          <div class="info">
            <div class="label">Care Type</div>
            <div class="value">${item.care_type}</div>
          </div>

          <div class="info">
            <div class="label">Duration</div>
            <div class="value">${duration ?? "N/A"}</div>
          </div>

          <div class="info">
            <div class="label">Start Time</div>
            <div class="value">${formatDate(item.start_time)}</div>
          </div>

          <div class="info">
            <div class="label">End Time</div>
            <div class="value">${formatDate(item.end_time)}</div>
          </div>

          <div class="info">
            <div class="label">Status</div>
            <div class="value">${item.status}</div>
          </div>

          <div class="info">
            <div class="label">Duration (Days)</div>
            <div class="value">${item.duration_days}</div>
          </div>
        </div>
      </div>

      <!-- Assignment Info -->
      <div class="section">
        <h5 class="section-title">Assignment Details</h5>

        <div class="info-grid">
          <div class="info">
            <div class="label">Assigned At</div>
            <div class="value">${formatDate(assignment.assigned_at)}</div>
          </div>

          <div class="info">
            <div class="label">Payment Amount</div>
            <div class="value">
              ${assignment.amount ? `₹ ${assignment.amount}` : "Not billed yet"}
            </div>
          </div>
        </div>
      </div>

      <!-- Caretaker -->
      <div class="section">
        <h5 class="section-title">Assigned Caretaker</h5>

        <div class="caretaker-card">
          <div class="avatar">
            ${caretaker.profile_image
      ? `<img src="${caretaker.profile_image}" />`
      : caretaker.name.charAt(0).toUpperCase()}
          </div>

          <div class="caretaker-info">
            <div class="caretaker-header">
              <h3>${caretaker.name}</h3>
              ${caretaker.is_profile_completed
      ? `<span class="verified">✔ Verified</span>`
      : ""}
            </div>

            <div class="caretaker-meta">
              <span>📞 ${caretaker.phone}</span>
              <span>✉️ ${caretaker.email}</span>
            </div>

            <div class="caretaker-extra">
              <span><b>Experience:</b> ${caretaker.experience_years} yrs</span>
              <span><b>Hourly Rate:</b> ₹${caretaker.hourly_rate}</span>
              <span><b>Skills:</b> ${caretaker.skills || "—"}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}



loadAssignedCaretakers();

function logout() {
  localStorage.clear();
  location.href = "../../common/login/login.html";
}
