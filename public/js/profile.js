async function loadProfile() {
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

  const { user, session } = data;
  document.getElementById("avatarInitial").textContent = user.name.charAt(0);
  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileHandle").textContent = `@${user.username}`;
  document.getElementById("profileBio").textContent = user.bio;
  document.getElementById("followersVal").textContent = user.followers;
  document.getElementById("followingVal").textContent = user.following;
  document.getElementById("postsVal").textContent = user.posts;
  document.getElementById("sessionIdSmall").textContent = session.sessionId;
}

document.getElementById("logoutLink").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("demoSessionId");
  window.location.href = "login.html";
});

loadProfile();
