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

    // Store the fake demo session id locally so this "browser" remembers it.
    // This is a demo-only identifier created by our own server, never a real cookie.
    localStorage.setItem("demoSessionId", data.session.sessionId);
    window.location.href = "dashboard.html";
  } catch (err) {
    errorBox.textContent = "Could not reach the demo server.";
    errorBox.style.display = "block";
  }
});
