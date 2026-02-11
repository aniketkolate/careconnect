// ===============================
// Load Profile
// ===============================
async function getProfile() {
  try {
    const res = await api("/seeker/profile");

    if (!res.success) {
      alert(res.message || "Failed to load profile");
      return;
    }

    const user = res.data;
    const profile = user.profile || {};

    /* =========================
       FORM FIELDS
    ========================== */
    document.getElementById("fullName").value = user.name || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phone").value = user.phone || "";
    document.getElementById("address").value = profile.address || "";
    document.getElementById("age").value = profile.age || "";
    document.getElementById("gender").value = profile.gender || "";
    document.getElementById("emergency_contact").value = profile.emergency_contact || "";
    document.getElementById("profile_image").value = profile.profile_image || "";


    /* =========================
       PROFILE CARD
    ========================== */

    document.getElementById("nameText").textContent = user.name || "--";
    document.getElementById("emailText").textContent = user.email || "--";

    const avatar = document.getElementById("avatar");
    avatar.innerHTML = ''; // reset

    if (profile?.profile_image) {
      avatar.innerHTML = `<img src="${profile.profile_image}" alt="Profile" />`;
    } else {
      const firstLetter = (user.name || 'U').charAt(0).toUpperCase();
      avatar.textContent = firstLetter;
    }

    // Profile status badge
    const profileStatus = document.getElementById("profileStatus");
    const isComplete =
      profile.address &&
      profile.age &&
      profile.gender &&
      profile.emergency_contact;

    if (isComplete) {
      profileStatus.textContent = "Profile Completed";
      profileStatus.classList.remove("incomplete");
      profileStatus.classList.add("complete");
    } else {
      profileStatus.textContent = "Profile Incomplete";
      profileStatus.classList.remove("complete");
      profileStatus.classList.add("incomplete");
    }

    switchToReadOnlyMode();
  } catch (err) {
    console.error(err);
    alert("Something went wrong while loading profile");
  }
}


// ===============================
// Update Profile
// ===============================
async function updateProfile() {
  try {
    const payload = {
      name: document.getElementById("fullName").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      address: document.getElementById("address").value.trim(),
      age: Number(document.getElementById("age").value),
      gender: document.getElementById("gender").value,
      profile_image: document.getElementById("profile_image").value.trim(),
      emergency_contact: document
        .getElementById("emergency_contact")
        .value.trim(),
    };

    const res = await api("/seeker/profile", "PUT", payload);

    if (res.success) {
      alert("Profile updated successfully");
      switchToReadOnlyMode();
      getProfile(); // refresh data
    } else {
      alert("Failed to update profile");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
}

// ===============================
// UI Helpers
// ===============================
function enableEdit() {
  toggleFields(false);
  document.getElementById("editBtn").style.display = "none";
  document.getElementById("saveBtn").style.display = "inline-block";
  document.getElementById("cancelBtn").style.display = "inline-block";
}

function cancelEdit() {
  getProfile();
  switchToReadOnlyMode();
}

function switchToReadOnlyMode() {
  toggleFields(true);
  document.getElementById("editBtn").style.display = "inline-block";
  document.getElementById("saveBtn").style.display = "none";
  document.getElementById("cancelBtn").style.display = "none";
}

function toggleFields(disabled) {
  document.querySelectorAll(
    "#fullName,#phone,#age,#gender,#emergency_contact,#address,#profile_image"
  ).forEach((el) => (el.disabled = disabled));
}

// ===============================
// Logout
// ===============================
function logout() {
  localStorage.clear();
  location.href = "../../common/login.html";
}

// ===============================
// Init
// ===============================
getProfile();
