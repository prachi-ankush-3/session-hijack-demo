function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function loadDashboard() {
  const sessionId = localStorage.getItem("demoSessionId");
  if (!sessionId) {
    window.location.href = "login.html";
    return;
  }

  const res = await fetch(`/api/session/current?sessionId=${encodeURIComponent(sessionId)}`);
  const data = await res.json();

  if (!data.success) {
    localStorage.removeItem("demoSessionId");
    window.location.href = "login.html";
    return;
  }

  const { session, user } = data;
  document.getElementById("welcomeText").textContent = `Welcome, ${user.name.split(" ")[0]} 👋`;

  const statusBadge = document.getElementById("statusBadge");
  const isActive = session.status === "ACTIVE";
  statusBadge.textContent = isActive ? "● ACTIVE" : `● ${session.status.replace("_", " ")}`;
  statusBadge.className = "badge " + (isActive ? "badge-active" : "badge-compromised");

  document.getElementById("accountVal").textContent = `@${user.username}`;
  document.getElementById("statusVal").textContent = session.status.replace("_", " ");
  document.getElementById("sessionIdVal").textContent = session.sessionId;
  document.getElementById("createdVal").textContent = fmtTime(session.createdAt);
  document.getElementById("lastActivityVal").textContent = fmtTime(session.lastActivity);
}

function logout() {
  localStorage.removeItem("demoSessionId");
  window.location.href = "login.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("logoutLink").addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

loadDashboard();
