let selectedRequest = null;
let selectedCaretaker = null;

/* =========================
   Load Care Requests
========================= */
async function loadCareRequests() {
  const container = document.getElementById("requests");
  container.innerHTML = "";

  const res = await api("/admin/care-requests?status=CREATED");
  const data = res.data || [];

  if (!data.length) {
    container.innerHTML = `<div class="empty">No pending requests</div>`;
    return;
  }

  data.forEach(r => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = r.care_request_id;

    const profileImage = r.seeker_profile_image
      ? r.seeker_profile_image
      : "https://ui-avatars.com/api/?name=" + encodeURIComponent(r.seeker_name);

    card.innerHTML = `
  <div class="request-header">
    <div>
      <div class="request-id">Request #${r.care_request_id}</div>
      <div class="request-type">${r.care_type}</div>
    </div>
    <span class="status-badge status-${r.request_status.toLowerCase()}">
      ${r.request_status}
    </span>
  </div>

  <div class="request-section">
    <div class="section-title">Service Details</div>
    <div class="row">
      <div><strong>Description:</strong> ${r.description}</div>
    </div>
    <div class="row two-col">
      <div><strong>Start:</strong> ${new Date(r.start_time).toLocaleString()}</div>
      <div><strong>End:</strong> ${new Date(r.end_time).toLocaleString()}</div>
    </div>
    <div class="row">
      <div><strong>Created:</strong> ${new Date(r.request_created_at).toLocaleString()}</div>
    </div>
  </div>

  <div class="request-section seeker-section">
    <div class="section-title">Care Seeker Details</div>

    <div class="seeker-header">
      <img src="${r.seeker_profile_image ||
      "https://ui-avatars.com/api/?name=" + encodeURIComponent(r.seeker_name)}" 
        class="seeker-avatar" />
      <div>
        <div class="seeker-name">${r.seeker_name}</div>
        <div class="seeker-email">${r.seeker_email}</div>
        <div class="seeker-phone">${r.seeker_phone}</div>
      </div>
    </div>

    <div class="row two-col">
      <div><strong>Age:</strong> ${r.seeker_age || "-"}</div>
      <div><strong>Gender:</strong> ${r.seeker_gender || "-"}</div>
    </div>

    <div class="row">
      <div><strong>Address:</strong> ${r.seeker_address || "-"}</div>
    </div>

    <div class="row">
      <div><strong>Emergency Contact:</strong> ${r.seeker_emergency_contact || "-"}</div>
    </div>

    <div class="profile-status ${r.is_profile_completed ? 'complete' : 'incomplete'}">
      ${r.is_profile_completed ? "Profile Complete" : "Profile Incomplete"}
    </div>
  </div>
`;

    card.onclick = () => selectRequest(card);
    container.appendChild(card);
  });
}

/* =========================
   Load Available Caretakers
========================= */
async function loadCaretakers() {
  const container = document.getElementById("caretakers");
  container.innerHTML = "";

  const res = await api("/admin/available-caretakers");
  const data = res.data || [];

  if (!data.length) {
    container.innerHTML = `<div class="empty">No caretakers available today</div>`;
    return;
  }

  data.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = c.caretaker_id;

    const profileImage =
      c.profile_image
        ? c.profile_image
        : "https://ui-avatars.com/api/?name=" + encodeURIComponent(c.name);

    const firstLetter = c.name?.charAt(0).toUpperCase() || "?";

    const avatarHtml = c.profile_image
      ? `<div class="avatar"><img src="${c.profile_image}" alt="${c.name}"></div>`
      : `<div class="avatar">${firstLetter}</div>`;

    card.innerHTML = `
  <div class="caretaker-header">
    ${avatarHtml}

    <div class="caretaker-info">
  <div class="card-title">${c.name}</div>
  <div class="card-meta">📧 ${c.email}</div>
  <div class="card-meta">📞 ${c.phone}</div>
    </div>
  </div>

  <div class="card-meta">⭐ ${c.experience_years || 0} yrs experience</div>
  <div class="card-meta">💰 ₹${c.hourly_rate}/hr</div>
  <div class="card-meta">🧠 ${c.skills || "General Care"}</div>

  <div style="margin-top:8px;">
    <span class="badge">${c.available_day}</span>
    ${c.is_profile_completed
        ? `<span class="badge" style="background:#22c55e;">Profile Complete</span>`
        : `<span class="badge" style="background:#ef4444;">Profile Incomplete</span>`
      }
  </div>
`;



    card.onclick = () => selectCaretaker(card);
    container.appendChild(card);
  });
}

/* =========================
   Selection Handling
========================= */
function selectRequest(card) {
  document.querySelectorAll("#requests .card")
    .forEach(c => c.classList.remove("active"));

  card.classList.add("active");
  selectedRequest = Number(card.dataset.id);
  updateAssignBtn();
}

function selectCaretaker(card) {
  document.querySelectorAll("#caretakers .card")
    .forEach(c => c.classList.remove("active"));

  card.classList.add("active");
  selectedCaretaker = Number(card.dataset.id);
  updateAssignBtn();
}

function updateAssignBtn() {
  document.getElementById("assignBtn").disabled =
    !(selectedRequest && selectedCaretaker);
}

/* =========================
   Assign Caretaker
========================= */
document.getElementById("assignBtn").onclick = async () => {
  try {
    const btn = document.getElementById("assignBtn");
    btn.disabled = true;
    btn.innerText = "Assigning...";

    await api("/admin/assign-caretaker", "POST", {
      requestId: selectedRequest,
      caretakerId: selectedCaretaker
    });

    showToast("Caretaker assigned successfully", 'success');
    setTimeout(() => {
      location.reload();
    }, 2000)

  } catch (err) {
    showToast("Assignment failed", "error");
    console.error(err);
  }
};

/* =========================
   Logout
========================= */
function logout() {
  localStorage.clear();
  location.href = "../../common/login/login.html";
}

/* =========================
   Init
========================= */
loadCareRequests();
loadCaretakers();
