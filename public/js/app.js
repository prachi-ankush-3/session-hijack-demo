function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initials(name) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

async function loadApp() {
  const sessionId = localStorage.getItem("sessionShieldSessionId");
  if (!sessionId) {
    window.location.href = "login.html";
    return;
  }

  const res = await fetch(`/api/session/current?sessionId=${encodeURIComponent(sessionId)}`);
  const data = await res.json();

  if (!data.success) {
    localStorage.removeItem("sessionShieldSessionId");
    window.location.href = "login.html";
    return;
  }

  const { session, user } = data;

  document.getElementById("welcomeText").textContent = `Welcome, ${user.name.split(" ")[0]} 👋`;

  const statusBadge = document.getElementById("statusBadge");
  const isNormal = session.simulationState === "NORMAL";
  statusBadge.textContent = isNormal ? "● ACTIVE" : "● COMPROMISED";
  statusBadge.className = "badge " + (isNormal ? "badge-active" : "badge-compromised");

  const avatar = document.getElementById("avatarInitial");
  avatar.textContent = initials(user.name);
  avatar.className = "avatar " + (user.username === "alice" ? "avatar-alice" : "avatar-bob");

  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileHandle").textContent = `@${user.username}`;
  document.getElementById("profileBio").textContent = user.bio;
  document.getElementById("followersVal").textContent = user.followers;
  document.getElementById("followingVal").textContent = user.following;
  document.getElementById("postsVal").textContent = user.posts;

  document.getElementById("sessStatus").textContent = isNormal ? "● ACTIVE" : "⚠ COMPROMISED";
  document.getElementById("sessAuthAs").textContent = user.name;
  document.getElementById("sessId").textContent = session.sessionId;
  document.getElementById("sessCreated").textContent = fmtTime(session.createdAt);
  document.getElementById("sessLastActivity").textContent = fmtTime(session.lastActivity);

  const feed = document.getElementById("feedContainer");
  feed.innerHTML = (user.feed || [])
    .map(
      (post) => `
      <div class="post-card">
        <div class="post-head">
          <div class="avatar ${user.username === "alice" ? "avatar-alice" : "avatar-bob"}">${initials(user.name)}</div>
          <div>
            <strong>${user.name}</strong>
            <div class="post-meta">@${user.username}</div>
          </div>
        </div>
        <div>${post}</div>
      </div>`
    )
    .join("");
}

document.getElementById("copySessionBtn").addEventListener("click", async () => {
  const sessionId = document.getElementById("sessId").textContent;
  try {
    await navigator.clipboard.writeText(sessionId);
  } catch (e) {
    // Clipboard API may be unavailable in some environments; ignore for demo purposes.
  }
  const msg = document.getElementById("copiedMsg");
  msg.style.display = "block";
  setTimeout(() => (msg.style.display = "none"), 2000);
});

document.getElementById("logoutLink").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("sessionShieldSessionId");
  window.location.href = "login.html";
});

loadApp();
