/**
 * SocialShield Demo — Session Hijacking Risk Demonstration
 *
 * EDUCATIONAL / LOCAL DEMO ONLY.
 * All "sessions" below are fake identifiers created and controlled entirely
 * by this Node.js application. Nothing here touches real browser cookies,
 * real authentication tokens, or any external website.
 */

const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// In-memory demo state
// ---------------------------------------------------------------------------

const USERS_PATH = path.join(__dirname, "data", "users.json");
const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));

/** sessionId -> { sessionId, userId, username, createdAt, lastActivity, status } */
let sessions = {};

/**
 * Two simulated "browser slots" used only on the attack-demo page:
 *   A -> Alice's demo browser
 *   B -> Bob's demo browser
 * Each slot points at whichever sessionId that browser is currently using.
 * This is what lets us demonstrate a session ID being reused by a different
 * browser/user.
 */
let browserContext = { A: null, B: null };

let events = [];
function logEvent(text, level = "info") {
  events.push({ text, level, time: new Date().toISOString() });
}

function resetDemoState() {
  sessions = {};
  browserContext = { A: null, B: null };
  events = [];
  logEvent("Demo reset. All sessions cleared.", "info");
}

resetDemoState();
events = []; // start with a clean timeline for the first run

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSessionId() {
  return "DEMO_SESSION_" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

function publicUser(userId) {
  const u = users[userId];
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
}

function publicSession(session) {
  if (!session) return null;
  return {
    sessionId: session.sessionId,
    userId: session.userId,
    username: session.username,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    status: session.status
  };
}

function currentRisk() {
  const compromisedActive = Object.values(sessions).some(
    (s) => s.status === "SIMULATED_COMPROMISED"
  );
  const injected = browserContext.B && sessions[browserContext.B] &&
    sessions[browserContext.B].userId !== "bob" &&
    sessions[browserContext.B].status !== "REVOKED";

  if (injected) return { score: 95, level: "CRITICAL" };
  if (compromisedActive) return { score: 60, level: "ELEVATED" };
  return { score: 10, level: "LOW" };
}

// ---------------------------------------------------------------------------
// Auth / session endpoints
// ---------------------------------------------------------------------------

// POST /api/login  { username, password, browser: "A" | "B" (optional) }
app.post("/api/login", (req, res) => {
  const { username, password, browser } = req.body || {};
  const user = users[username];

  if (!user || user.password !== password) {
    logEvent(`Failed login attempt for "${username}"`, "warn");
    return res.status(401).json({ success: false, error: "Invalid username or password" });
  }

  const sessionId = makeSessionId();
  const now = new Date().toISOString();
  const session = {
    sessionId,
    userId: username,
    username,
    createdAt: now,
    lastActivity: now,
    status: "ACTIVE"
  };
  sessions[sessionId] = session;

  if (browser === "A" || browser === "B") {
    browserContext[browser] = sessionId;
  }

  logEvent(`${user.name} logged in. Demo session ${sessionId} created.`, "success");

  res.json({
    success: true,
    user: publicUser(username),
    session: publicSession(session)
  });
});

// GET /api/session/current?sessionId=...   OR ?browser=A|B
app.get("/api/session/current", (req, res) => {
  let sessionId = req.query.sessionId;
  if (!sessionId && req.query.browser) {
    sessionId = browserContext[req.query.browser];
  }
  const session = sessions[sessionId];
  if (!session || session.status === "REVOKED") {
    return res.status(404).json({ success: false, error: "No active demo session" });
  }
  session.lastActivity = new Date().toISOString();
  res.json({
    success: true,
    session: publicSession(session),
    user: publicUser(session.userId)
  });
});

// GET /api/session/:id
app.get("/api/session/:id", (req, res) => {
  const session = sessions[req.params.id];
  if (!session) return res.status(404).json({ success: false, error: "Session not found" });
  res.json({ success: true, session: publicSession(session) });
});

// GET /api/session/browser/:slot  (A or B) — convenience for attack-demo UI
app.get("/api/session/browser/:slot", (req, res) => {
  const slot = req.params.slot;
  const sessionId = browserContext[slot];
  const session = sessions[sessionId];
  if (!session) {
    return res.json({ success: true, session: null, user: null });
  }
  res.json({
    success: true,
    session: publicSession(session),
    user: publicUser(session.userId)
  });
});

// ---------------------------------------------------------------------------
// Attack simulation endpoints
// ---------------------------------------------------------------------------

// POST /api/session/simulate-compromise  { sessionId }
app.post("/api/session/simulate-compromise", (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ success: false, error: "Session not found" });

  session.status = "SIMULATED_COMPROMISED";
  logEvent(`Demo session ${sessionId} (owner: ${session.username}) marked SIMULATED COMPROMISED`, "danger");

  res.json({ success: true, session: publicSession(session) });
});

// POST /api/session/inject-demo  { browser: "B", sessionId }
app.post("/api/session/inject-demo", (req, res) => {
  const { browser, sessionId } = req.body || {};
  if (browser !== "A" && browser !== "B") {
    return res.status(400).json({ success: false, error: "Invalid browser slot" });
  }
  const session = sessions[sessionId];
  if (!session) {
    return res.status(400).json({
      success: false,
      error: "That session ID was not issued by this demo application"
    });
  }
  if (session.status === "REVOKED") {
    return res.status(400).json({ success: false, error: "That demo session has been revoked" });
  }

  const previousUser = browserContext[browser] && sessions[browserContext[browser]]
    ? sessions[browserContext[browser]].username
    : "(none)";

  browserContext[browser] = sessionId;

  const impersonated = session.username;
  logEvent(
    `Demo session ${sessionId} (owner: ${impersonated}) reused by User ${browser}'s demo browser (was: ${previousUser})`,
    "danger"
  );
  logEvent(`🚨 Identity impersonation detected: User ${browser}'s browser is now treated as ${impersonated}`, "critical");

  res.json({
    success: true,
    session: publicSession(session),
    user: publicUser(session.userId),
    impersonated: true,
    risk: currentRisk()
  });
});

// POST /api/session/revoke  { sessionId }
app.post("/api/session/revoke", (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ success: false, error: "Session not found" });

  session.status = "REVOKED";
  Object.keys(browserContext).forEach((slot) => {
    if (browserContext[slot] === sessionId) browserContext[slot] = null;
  });

  logEvent(`Demo session ${sessionId} revoked. It is no longer valid.`, "success");
  res.json({ success: true, session: publicSession(session) });
});

// POST /api/demo/reset
app.post("/api/demo/reset", (req, res) => {
  resetDemoState();
  res.json({ success: true, message: "Demo reset successfully" });
});

// ---------------------------------------------------------------------------
// Security dashboard endpoints
// ---------------------------------------------------------------------------

app.get("/api/security/events", (req, res) => {
  res.json({ success: true, events });
});

app.get("/api/security/risk", (req, res) => {
  res.json({ success: true, risk: currentRisk() });
});

// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`SocialShield Demo running at http://localhost:${PORT}`);
  console.log("EDUCATIONAL LOCAL DEMONSTRATION — no real accounts or cookies are used.");
});
