// Select your input elements
const name = document.getElementById("name");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");
const role = document.getElementById("role");

// Login function
async function login() {

  const data = {
    email: email.value,
    password: password.value
  };
  // const data = {
  //    "email": "seeker@test.com",
  // "password": "seekerseeker"
  // };

  //   const data = {
  //   email: "taker@test.com",//email.value,
  //   password: "takertaker"//password.value
  // };


  //   const data = {
  //   email: "admin@test.com",//email.value,
  //   password: "adminadmin"//password.value
  // };

  const res = await api("/auth/login", "POST", data);

  if (res?.success && res?.token && res?.role) {
    // Store token & role
    localStorage.setItem("token", res.token);
    localStorage.setItem("role", res.role);

    switch (res.role) {
      case "ADMIN":
        location.href = "../admin/dashboard/dashboard.html";
        break;

      case "CARE_SEEKER":
        location.href = "../careseeker/dashboard/dashboard.html";
        break;

      case "CARE_TAKER":
        location.href = "../caretaker/dashboard/dashboard.html";
        break;

      default:
        alert("Unauthorized role");
        localStorage.clear();
    }
  } else {
    if (res?.message == "Account is deactivated") {
      location.href = "../common/deactivated-users.html";
    } else {
      alert(res?.message || "Invalid email or password");
    }

  }
}

// Register function
async function register() {
  try {
    const payload = {
      name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      role: role.value,
      password: password.value
    };

    const confirmPassword = document.getElementById("confirmPassword").value;

    // -------- VALIDATIONS --------
    if (!payload.name || !payload.email || !payload.phone || !payload.role || !payload.password || !confirmPassword) {
      alert("All fields are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      alert("Please enter a valid email");
      return;
    }

    if (payload.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (payload.password !== confirmPassword) {
      alert("Password and Confirm Password do not match");
      return;
    }

    // Disable button to avoid double click
    const btn = document.querySelector(".register-btn");
    btn.disabled = true;

    // -------- API CALL --------
    await api("/auth/register", "POST", payload);

    alert("Registration successful 🎉");
    location.href = "login.html";

  } catch (err) {
    console.error(err);
    alert(err?.message || "Something went wrong. Please try again.");
  } finally {
    const btn = document.querySelector(".register-btn");
    btn.disabled = false;
  }
}


