// This page simulates TWO separate demo browsers (A = Alice, B = Bob) by
// tracking their session slots entirely on the server. Nothing here reads
// or writes real browser cookies.

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initials(name) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function setStep(stepNum, state) {
  // state: "pending" | "done" | "warn"
  const chip = document.querySelector(`.step-chip[data-step="${stepNum}"]`);
  chip.classList.remove("done", "warn", "active");
  if (state === "done") chip.classList.add("done");
  if (state === "warn") chip.classList.add("warn");
}

let stateA = null; // { session, user }
let stateB = null;

async function refreshPanelA() {
  const res = await fetch("/api/session/browser/A");
  const data = await res.json();
  stateA = data.session ? data : null;

  const loggedOut = document.getElementById("a-loggedOut");
  const loggedIn = document.getElementById("a-loggedIn");

  if (!data.session) {
    loggedOut.style.display = "block";
    loggedIn.style.display = "none";
    setStep(1, "pending");
    setStep(2, "pending");
    return;
  }
  loggedOut.style.display = "none";
  loggedIn.style.display = "block";
  setStep(1, "done");
  setStep(2, "done");

  const compromised = data.session.simulationState === "COMPROMISED";
  document.getElementById("a-simState").textContent = compromised ? "🔴 COMPROMISED" : "🟢 NORMAL";
  document.getElementById("a-sessionId").textContent = data.session.sessionId;
  document.getElementById("simulateTheftBtn").disabled = compromised;
  document.getElementById("compromiseNotice").style.display = compromised ? "block" : "none";
  setStep(3, compromised ? "warn" : "pending");
}

async function refreshPanelB() {
  const res = await fetch("/api/session/browser/B");
  const data = await res.json();
  stateB = data.session ? data : null;

  const loggedOut = document.getElementById("b-loggedOut");
  const loggedIn = document.getElementById("b-loggedIn");

  if (!data.session) {
    loggedOut.style.display = "block";
    loggedIn.style.display = "none";
    setStep(4, "pending");
    return;
  }
  loggedOut.style.display = "none";
  loggedIn.style.display = "block";
  setStep(4, "done");

  const impersonated = data.user.username !== "bob";

  document.getElementById("b-name").textContent = data.user.name;
  document.getElementById("b-handle").textContent = `@${data.user.username}`;
  document.getElementById("b-identity").textContent = data.user.name.split(" ")[0];
  document.getElementById("b-avatarLetter").textContent = initials(data.user.name);
  document.getElementById("b-avatarLetter").className = "avatar " + (impersonated ? "avatar-alice" : "avatar-bob");

  setStep(5, impersonated ? "done" : "pending");
  setStep(6, impersonated ? "warn" : "pending");
  setStep(7, impersonated ? "warn" : "pending");

  if (impersonated) {
    showTransition(data.user);
    showUserBScreen(data.user);
    updateBeforeAfter(data.user, true);
    document.getElementById("revokeBtn").disabled = false;
  } else {
    document.getElementById("transitionCard").style.display = "none";
    document.getElementById("userBScreenCard").style.display = "none";
    updateBeforeAfter(data.user, false);
  }
}

function showTransition(userAfter) {
  document.getElementById("transitionCard").style.display = "block";
}

function showUserBScreen(userAfter) {
  const card = document.getElementById("userBScreenCard");
  card.style.display = "block";
  document.getElementById("userBScreenTitle").textContent = "🚨 SESSION IDENTITY CHANGED";
  document.getElementById("ub-avatar").textContent = initials(userAfter.name);
  document.getElementById("ub-avatar").className = "avatar " + (userAfter.username === "alice" ? "avatar-alice" : "avatar-bob");
  document.getElementById("ub-welcome").textContent = `Welcome, ${userAfter.name.split(" ")[0]} 👋`;
  document.getElementById("ub-handle").textContent = `@${userAfter.username}`;
  document.getElementById("ub-name").textContent = userAfter.name;
  document.getElementById("ub-bio").textContent = userAfter.bio;
  document.getElementById("ub-followers").textContent = userAfter.followers;
  document.getElementById("ub-following").textContent = userAfter.following;
  document.getElementById("ub-posts").textContent = userAfter.posts;
}

function updateBeforeAfter(user, impersonated) {
  const statusEl = document.getElementById("ba-afterStatus");
  const idEl = document.getElementById("ba-afterIdentity");
  const profileEl = document.getElementById("ba-afterProfile");
  const riskBadge = document.getElementById("ba-afterRiskBadge");

  statusEl.textContent = impersonated ? "COMPROMISED" : "NORMAL";
  idEl.textContent = user.name.split(" ")[0];
  profileEl.textContent = `@${user.username}`;

  if (impersonated) {
    riskBadge.textContent = "95 / 100 CRITICAL";
    riskBadge.className = "badge badge-critical";
  } else {
    riskBadge.textContent = "10 / 100 LOW";
    riskBadge.className = "badge badge-low";
  }
}

async function refreshRisk() {
  const res = await fetch("/api/security/risk");
  const data = await res.json();
  const { score, level, delta } = data.risk;

  document.getElementById("riskScoreVal").textContent = `${score} / 100`;
  document.getElementById("riskDeltaVal").textContent = delta ? `+${delta} risk increase` : "";

  const badge = document.getElementById("riskLevelBadge");
  badge.textContent = level;
  badge.className = "badge " + (level === "CRITICAL" ? "badge-critical" : level === "ELEVATED" ? "badge-elevated" : "badge-low");

  const fill = document.getElementById("riskMeterFill");
  fill.style.width = score + "%";
  fill.style.background = level === "CRITICAL" ? "var(--danger)" : level === "ELEVATED" ? "var(--warning)" : "var(--success)";

  if (stateB && stateB.session) {
    document.getElementById("b-riskInline").textContent = `${score} / 100 — ${level}`;
  }
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
  await Promise.all([refreshPanelA(), refreshPanelB()]);
  await Promise.all([refreshRisk(), refreshEvents()]);
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
  if (!stateA || !stateA.session) return;
  await fetch("/api/session/simulate-compromise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: stateA.session.sessionId })
  });
  refreshAll();
});

document.getElementById("copyAliceSessionBtn").addEventListener("click", async () => {
  const sessionId = document.getElementById("a-sessionId").textContent;
  try {
    await navigator.clipboard.writeText(sessionId);
  } catch (e) {
    // Clipboard API may be unavailable; ignore for demo purposes.
  }
  const msg = document.getElementById("copiedAliceMsg");
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
    alert(data.error || "That session ID could not be injected.");
    return;
  }
  refreshAll();
});

document.getElementById("revokeBtn").addEventListener("click", async () => {
  const sessionId = stateA && stateA.session ? stateA.session.sessionId : null;
  if (!sessionId) return;
  await fetch("/api/session/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId })
  });
  document.getElementById("revokeMsg").style.display = "block";
  document.getElementById("transitionCard").style.display = "none";
  document.getElementById("userBScreenCard").style.display = "none";
  refreshAll();
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  await fetch("/api/demo/reset", { method: "POST" });
  document.getElementById("transitionCard").style.display = "none";
  document.getElementById("userBScreenCard").style.display = "none";
  document.getElementById("revokeMsg").style.display = "none";
  document.getElementById("resetMsg").style.display = "block";
  setTimeout(() => (document.getElementById("resetMsg").style.display = "none"), 2500);
  refreshAll();
});

refreshAll();
