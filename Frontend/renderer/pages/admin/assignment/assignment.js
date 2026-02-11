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
    card.dataset.id = r.id;

    card.innerHTML = `
      <div class="card-title">Request #${r.id}</div>
      <div class="card-meta">
        ${r.care_type || "Care Service"} • 
        ${new Date(r.created_at).toDateString()}
      </div>
      <span class="badge">Created</span>
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

    alert("Caretaker assigned successfully ✅");
    location.reload();

  } catch (err) {
    alert("Assignment failed ❌");
    console.error(err);
  }
};

/* =========================
   Logout
========================= */
function logout() {
  localStorage.clear();
  location.href = "../../common/login.html";
}

/* =========================
   Init
========================= */
loadCareRequests();
loadCaretakers();
