// api.js
async function api(endpoint, method = "GET", data = null) {
  const url = "http://localhost:3000" + endpoint;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) options.body = JSON.stringify(data);

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (err) {
    console.error("API error:", err);
    alert("Something went wrong");
  }
}
