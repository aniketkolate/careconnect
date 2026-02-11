// 1️ Select your form elements
const careType = document.querySelector(".form-grid select");
const duration = document.querySelectorAll(".form-grid input")[0]; // Duration input
const startDate = document.querySelectorAll(".form-grid input")[1]; // Start Date
const dailyHours = document.querySelectorAll(".form-grid input")[2]; // Daily Hours
const address = document.querySelectorAll("textarea")[0]; // Address
const notes = document.querySelectorAll("textarea")[1]; // Special instructions


//  Submit request function
async function submitRequest() {
  try {
    // Validate only required fields
    if (!careType.value || !address.value) {
      alert("Please fill all required fields.");
      return;
    }

    let start_time = null;
    let end_time = null;
    let duration_label = null;

    // Calculate start & end only if both exist
    if (startDate.value && dailyHours.value) {
      const hours = parseInt(dailyHours.value);

      if (!isNaN(hours)) {
        start_time = new Date(startDate.value);
        end_time = new Date(start_time.getTime() + hours * 60 * 60 * 1000);
        duration_label = `${hours} Hours`;
      }
    }

    // Prepare request body
    const data = {
      userId: JSON.parse(localStorage.getItem("user"))?.id,
      care_type: careType.value,
      description: notes.value || "No additional notes",
      start_time: start_time ? start_time.toISOString() : null,
      end_time: end_time ? end_time.toISOString() : null,
      duration_label: duration_label, // null if not calculated
      address: address.value
    };

    console.log("Create Care Request Payload:", data);

    // Call API
    const res = await api("/seeker/care-request", "POST", data);

    if (res.success) {
      alert("Care request created successfully!");
      location.href = "../careseeker-requests/careseeker-requests.html";
    } else {
      alert("Failed to create request: " + res.message);
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  }
}


function logout() {
  localStorage.clear();
  location.href = "../../common/login.html";
}