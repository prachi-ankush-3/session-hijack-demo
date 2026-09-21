// This page simulates TWO separate demo browsers (A = Alice, B = Bob) by
// tracking their session slots entirely on the server ("browserContext").
// Nothing here reads or writes real browser cookies.

let lastCompromisedSessionId = null;

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function refreshPanelA() {
  const res = await fetch("/api/session/browser/A");
  const data = await res.json();
  const loggedOut = document.getElementById("panelA-loggedOut");
  const loggedIn = document.getElementById("panelA-loggedIn");

  if (!data.session) {
    loggedOut.style.display = "block";
    loggedIn.style.display = "none";
    return;
  }
  loggedOut.style.display = "none";
  loggedIn.style.display = "block";

  document.getElementById("a-username").textContent = `@${data.user.username}`;
  const statusEl = document.getElementById("a-status");
  statusEl.textContent = data.session.status.replace("_", " ");
  document.getElementById("a-sessionId").textContent = data.session.sessionId;

  document.getElementById("simulateTheftBtn").disabled = data.session.status !== "ACTIVE";
}

async function refreshPanelB() {
  const res = await fetch("/api/session/browser/B");
  const data = await res.json();
  const loggedOut = document.getElementById("panelB-loggedOut");
  const loggedIn = document.getElementById("panelB-loggedIn");

  if (!data.session) {
    loggedOut.style.display = "block";
    loggedIn.style.display = "none";
    return;
  }
  loggedOut.style.display = "none";
  loggedIn.style.display = "block";

  document.getElementById("b-username").textContent = `@${data.user.username}`;
  document.getElementById("b-sessionId").textContent = data.session.sessionId;
  document.getElementById("b-profile").textContent = data.user.name;

  const impersonated = data.user.username !== "bob";
  if (impersonated) {
    showResult(data);
  }
}

function showResult(dataB) {
  document.getElementById("resultCard").style.display = "block";
  document.getElementById("resOwner").textContent = "Alice";
  document.getElementById("resCurrent").textContent = dataB.user.name.split(" ")[0];
  document.getElementById("revokeBtn").disabled = false;
}

async function refreshRisk() {
  const res = await fetch("/api/security/risk");
  const data = await res.json();
  const { score, level } = data.risk;

  document.getElementById("riskScoreVal").textContent = `${score} / 100`;
  const badge = document.getElementById("riskLevelBadge");
  badge.textContent = level;
  badge.className = "badge " + (level === "CRITICAL" ? "badge-critical" : level === "ELEVATED" ? "badge-elevated" : "badge-low");

  const fill = document.getElementById("riskMeterFill");
  fill.style.width = score + "%";
  fill.style.background = level === "CRITICAL" ? "var(--danger)" : level === "ELEVATED" ? "var(--warning)" : "var(--success)";
}

async function refreshEvents() {
  const res = await fetch("/api/security/events");
  const data = await res.json();
  const list = document.getElementById("eventsTimeline");
  if (!data.events.length) {
    list.innerHTML = `<li><span class="time">—</span> No events yet.</li>`;
    return;
  }
  list.innerHTML = data.events
    .slice()
    .reverse()
    .map((ev) => {
      const icon = ev.level === "critical" ? "🚨" : ev.level === "danger" ? "⚠" : ev.level === "success" ? "✓" : "•";
      return `<li><span class="time">${fmtTime(ev.time)}</span> ${icon} ${ev.text}</li>`;
    })
    .join("");
}

async function refreshAll() {
  await Promise.all([refreshPanelA(), refreshPanelB(), refreshRisk(), refreshEvents()]);
}

// --- Actions ---

document.getElementById("loginAliceBtn").addEventListener("click", async () => {
  await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alice", password: "alice123", browser: "A" })
  });
  refreshAll();
});

document.getElementById("loginBobBtn").addEventListener("click", async () => {
  await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "bob", password: "bob123", browser: "B" })
  });
  refreshAll();
});

document.getElementById("simulateTheftBtn").addEventListener("click", async () => {
  const sessionId = document.getElementById("a-sessionId").textContent;
  const res = await fetch("/api/session/simulate-compromise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId })
  });
  const data = await res.json();
  if (data.success) {
    lastCompromisedSessionId = sessionId;
  }
  refreshAll();
});

document.getElementById("copySessionBtn").addEventListener("click", async () => {
  const sessionId = document.getElementById("a-sessionId").textContent;
  try {
    await navigator.clipboard.writeText(sessionId);
  } catch (e) {
    // clipboard API may be unavailable; ignore silently for demo purposes
  }
  const msg = document.getElementById("copiedMsg");
  msg.style.display = "block";
  setTimeout(() => (msg.style.display = "none"), 2000);
});

document.getElementById("injectBtn").addEventListener("click", async () => {
  const pasted = document.getElementById("injectInput").value.trim();
  if (!pasted) return;
  const res = await fetch("/api/session/inject-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ browser: "B", sessionId: pasted })
  });
  const data = await res.json();
  if (!data.success) {
    alert(data.error || "That session ID was not issued by this demo application.");
    return;
  }
  refreshAll();
});

document.getElementById("revokeBtn").addEventListener("click", async () => {
  const sessionId = lastCompromisedSessionId || document.getElementById("a-sessionId").textContent;
  await fetch("/api/session/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId })
  });
  document.getElementById("revokeMsg").style.display = "block";
  document.getElementById("resultCard").style.display = "none";
  refreshAll();
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  await fetch("/api/demo/reset", { method: "POST" });
  lastCompromisedSessionId = null;
  document.getElementById("resultCard").style.display = "none";
  document.getElementById("revokeMsg").style.display = "none";
  document.getElementById("resetMsg").style.display = "block";
  setTimeout(() => (document.getElementById("resetMsg").style.display = "none"), 2500);
  refreshAll();
});

document.getElementById("startFullDemoBtn").addEventListener("click", () => {
  const guide = document.getElementById("demoGuideCard");
  guide.style.display = guide.style.display === "none" ? "block" : "none";
});

refreshAll();
