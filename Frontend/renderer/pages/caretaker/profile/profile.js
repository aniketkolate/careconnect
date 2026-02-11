let profileData = null;

document.addEventListener("DOMContentLoaded", loadProfile);

async function loadProfile() {
  const res = await api("/taker/profile", "GET");
  if (!res.success) return alert("Failed to load profile");

  profileData = res.data;
  const profile = profileData.profile || {};

  document.getElementById("nameText").innerText = profileData.name;
  document.getElementById("emailText").innerText = profileData.email;

  document.getElementById("nameInput").value = profileData.name || "";
  document.getElementById("phoneInput").value = profileData.phone || "";

  const avatar = document.getElementById("avatar");
  avatar.innerHTML = profile.profile_image
    ? `<img src="${profile.profile_image}" />`
    : profileData.name.charAt(0).toUpperCase();

  document.getElementById("experience").value = profile.experience_years || "";
  document.getElementById("skills").value = profile.skills || "";
  document.getElementById("hourlyRate").value = profile.hourly_rate || "";
  document.getElementById("profileImage").value = profile.profile_image || "";

  const badge = document.getElementById("profileBadge");
  badge.className = profile.is_profile_completed
    ? "badge complete"
    : "badge incomplete";
  badge.innerText = profile.is_profile_completed
    ? "Profile Completed"
    : "Profile Incomplete";
}

function enableEdit() {
  document.getElementById("profileForm").classList.remove("readonly");
  document.getElementById("actionBar").classList.add("show");
  document.getElementById("editBtn").style.display = "none";
}

function cancelEdit() {
  location.reload();
}

async function saveProfile() {
  const payload = {
    name: document.getElementById("nameInput").value,
    phone: document.getElementById("phoneInput").value,
    experience_years: Number(document.getElementById("experience").value),
    skills: document.getElementById("skills").value,
    hourly_rate: Number(document.getElementById("hourlyRate").value),
    profile_image: document.getElementById("profileImage").value
  };

  const res = await api("/taker/profile", "PUT", payload);

  if (res.success) {
    alert("Profile updated successfully ✅");
    location.reload();
  } else {
    alert(res.message || "Update failed");
  }
}

function logout() {
  localStorage.clear();
  location.href = "../../common/login/login.html";
}
