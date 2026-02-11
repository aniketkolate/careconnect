async function loadUserProfile() {
  try {
    const userId = localStorage.getItem("selectedUserId");
    if (!userId) return alert("No user selected");

    const res = await api(`/admin/users/${userId}`, "GET");
    if (!res.success) throw new Error("Failed to load");

    const { name, email, phone, role, is_active, created_at, profile } = res.data;

    document.getElementById("nameText").textContent = name;
    document.getElementById("email").textContent = email;
    document.getElementById("phone").textContent = phone;
    document.getElementById("roleText").textContent = role.replace("_", " ");
    document.getElementById("createdAt").textContent = new Date(created_at).toLocaleDateString();

    const avatar = document.getElementById("avatar");
    if (profile?.profile_image) {
      avatar.innerHTML = `<img src="${profile.profile_image}" />`;
    } else {
      avatar.textContent = name.charAt(0).toUpperCase();
    }

    const status = document.getElementById("statusBadge");
    status.textContent = is_active ? "Active" : "Inactive";
    status.className = `status ${is_active ? "active" : "inactive"}`;

    const section = document.getElementById("profileSection");

    if (role === "CARE_SEEKER") {
      section.innerHTML = `
        <h4>Care Seeker Details</h4>
        <div class="info-grid">
          <div class="info"><div class="label">Address</div><div class="value">${profile?.address || "-"}</div></div>
          <div class="info"><div class="label">Age</div><div class="value">${profile?.age || "-"}</div></div>
          <div class="info"><div class="label">Gender</div><div class="value">${profile?.gender || "-"}</div></div>
          <div class="info"><div class="label">Emergency Contact</div><div class="value">${profile?.emergency_contact || "-"}</div></div>
        </div>
      `;
    }

    if (role === "CARE_TAKER") {
      section.innerHTML = `
        <h4>Care Taker Details</h4>
        <div class="info-grid">
          <div class="info"><div class="label">Experience</div><div class="value">${profile?.experience_years || "-"} Years</div></div>
          <div class="info"><div class="label">Hourly Rate</div><div class="value">₹${profile?.hourly_rate || "-"}</div></div>
          <div class="info"><div class="label">Skills</div><div class="value">${profile?.skills || "-"}</div></div>
          <div class="info"><div class="label">Profile Completed</div><div class="value">${profile?.is_profile_completed ? "Yes" : "No"}</div></div>
        </div>
      `;
    }

  } catch (err) {
    console.error(err);
    alert("Unable to load profile");
  }
}

function logout() {
  localStorage.clear();
  location.href = "../../common/login.html";
}

document.addEventListener("DOMContentLoaded", loadUserProfile);
