// Get input field elements from HTML
const name = document.getElementById("name");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");
const role = document.getElementById("role");


// ================= LOGIN FUNCTION =================
async function login() {

  // Prepare data to send to backend
  const data = {
    email: email.value,
    password: password.value
  };

  // Call login API
  const res = await api("/auth/login", "POST", data);

  // If login is successful and response contains required data
  if (res?.success && res?.token && res?.role) {

    // Save token and role in localStorage
    // Token is used for authentication in future API calls
    localStorage.setItem("token", res.token);
    localStorage.setItem("role", res.role);

    // Redirect user based on their role
    switch (res.role) {

      case "ADMIN":
        // Redirect admin to admin dashboard
        redirectWithLoader("../../admin/dashboard/dashboard.html");
        break;

      case "CARE_SEEKER":
        // Redirect care seeker to their dashboard
        redirectWithLoader("../../careseeker/dashboard/dashboard.html");
        break;

      case "CARE_TAKER":
        // Redirect care taker to their dashboard
        redirectWithLoader("../../caretaker/dashboard/dashboard.html");
        break;

      default:
        // If role is not valid or not allowed
        showToast("Unauthorized role", "error");
        localStorage.clear(); // Clear stored data for safety
    }

  } else {

    // If account is deactivated, redirect to deactivated page
    if (res?.message == "Account is deactivated") {
      redirectWithLoader("../../common/deactivated-users.html");

    } else {
      // If email or password is wrong
      showToast("Invalid email or password", "error");
    }

  }
}


// ================= REGISTER FUNCTION =================
async function register() {

  try {

    // Prepare registration data
    const payload = {
      name: name.value.trim(),       // Remove extra spaces
      email: email.value.trim(),
      phone: phone.value.trim(),
      role: role.value,
      password: password.value
    };

    // Get confirm password value
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Check if any field is empty
    if (!payload.name || !payload.email || !payload.phone || !payload.role || !payload.password || !confirmPassword) {
      showToast("All fields are required", "warning");
      return;
    }

    // Validate email format using regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      showToast("Please enter a valid email", "warning");
      return;
    }

    // Check password length
    if (payload.password.length < 6) {
      showToast("Password must be at least 6 characters", "warning");
      return;
    }

    // Check if password and confirm password match
    if (payload.password !== confirmPassword) {
      showToast("Password and Confirm Password do not match", "warning");
      return;
    }

    // Disable register button to prevent double clicking
    const btn = document.querySelector(".register-btn");
    btn.disabled = true;

    // -------- CALL REGISTER API --------
    await api("/auth/register", "POST", payload);

    // Show success message
    showToast("Registration successful", "success");

    // Redirect to login page after short delay
    setTimeout(() => {
      location.href = "../login/login.html";
    }, 1200);

  } catch (err) {

    // If any error occurs during API call
    console.error(err);

    // Show error message
    showToast(err?.message || "Something went wrong. Please try again.", "error");

  } finally {

    // Enable button again (whether success or error)
    const btn = document.querySelector(".register-btn");
    btn.disabled = false;
  }
}
