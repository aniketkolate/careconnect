const BASE_URL = "http://localhost:5000/api";

async function api(endpoint, method, data) {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE_URL + endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: data ? JSON.stringify(data) : null
  });

  return res.json();
} 
