document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("loginError");
  errorBox.style.display = "none";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!data.success) {
      errorBox.textContent = data.error || "Login failed";
      errorBox.style.display = "block";
      return;
    }

    // Fake demo session id, created by our own server — never a real cookie.
    localStorage.setItem("sessionShieldSessionId", data.session.sessionId);
    window.location.href = "app.html";
  } catch (err) {
    errorBox.textContent = "Could not reach the demo server.";
    errorBox.style.display = "block";
  }
});
