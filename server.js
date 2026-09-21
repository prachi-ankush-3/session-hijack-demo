/**
 * SessionShield — Session Hijacking Risk Demonstration
 *
 * 🔬 EDUCATIONAL SECURITY SIMULATION.
 * Every "session" below is a fake identifier created and controlled entirely
 * by this Node.js server. Nothing here reads real browser cookies, real
 * authentication tokens, or talks to any external website.
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
// Demo data
// ---------------------------------------------------------------------------

const USERS_PATH = path.join(__dirname, "data", "users.json");
const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));

/**
 * sessionId -> {
 *   sessionId, userId, status ("ACTIVE" | "REVOKED"),
 *   simulationState ("NORMAL" | "COMPROMISED"),
 *   createdAt, lastActivity
 * }
 */
let sessions = {};

/**
 * Two simulated browser slots used by the attack-demo page:
 *   A -> Alice's demo browser
 *   B -> Bob's demo browser
 * Each points at whichever sessionId that browser is currently using —
 * this is what lets a session created for Alice be "reused" by Bob's browser.
 */
let browserSlots = { A: null, B: null };

let events = [];
function logEvent(text, level = "info") {
  events.push({ text, level, time: new Date().toISOString() });
}

function resetDemoState() {
  sessions = {};
  browserSlots = { A: null, B: null };
  events = [];
}

resetDemoState();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSessionId() {
  return "DEMO_SESSION_" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function publicUser(userId) {
  const u = users[userId];
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
}

function publicSession(session) {
  if (!session) return null;
  const { sessionId, userId, status, simulationState, createdAt, lastActivity } = session;
  return { sessionId, userId, status, simulationState, createdAt, lastActivity };
}

function isImpersonated() {
  const s = sessions[browserSlots.B];
  return !!(s && s.status === "ACTIVE" && s.userId !== "bob");
}

function currentRisk() {
  if (isImpersonated()) return { score: 95, level: "CRITICAL", delta: 85 };
  const anyCompromised = Object.values(sessions).some((s) => s.simulationState === "COMPROMISED");
  if (anyCompromised) return { score: 55, level: "ELEVATED", delta: 45 };
  return { score: 10, level: "LOW", delta: 0 };
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
    status: "ACTIVE",
    simulationState: "NORMAL",
    createdAt: now,
    lastActivity: now
  };
  sessions[sessionId] = session;

  if (browser === "A" || browser === "B") {
    browserSlots[browser] = sessionId;
  }

  logEvent(`${user.name} logged in. Demo session ${sessionId} created.`, "success");

  res.json({ success: true, user: publicUser(username), session: publicSession(session) });
});

// GET /api/session/current?sessionId=...  OR  ?browser=A|B
app.get("/api/session/current", (req, res) => {
  let sessionId = req.query.sessionId;
  if (!sessionId && req.query.browser) sessionId = browserSlots[req.query.browser];

  const session = sessions[sessionId];
  if (!session || session.status !== "ACTIVE") {
    return res.status(404).json({ success: false, error: "No active demo session" });
  }
  session.lastActivity = new Date().toISOString();

  res.json({ success: true, session: publicSession(session), user: publicUser(session.userId) });
});

// GET /api/session/:id
app.get("/api/session/:id", (req, res) => {
  const session = sessions[req.params.id];
  if (!session) return res.status(404).json({ success: false, error: "Session not found" });
  res.json({ success: true, session: publicSession(session) });
});

// GET /api/session/browser/:slot  (A or B) — convenience for the attack-demo panels
app.get("/api/session/browser/:slot", (req, res) => {
  const slot = req.params.slot;
  const session = sessions[browserSlots[slot]];
  if (!session || session.status !== "ACTIVE") {
    return res.json({ success: true, session: null, user: null });
  }
  res.json({ success: true, session: publicSession(session), user: publicUser(session.userId) });
});

// ---------------------------------------------------------------------------
// Attack simulation endpoints
// ---------------------------------------------------------------------------

// POST /api/session/simulate-compromise  { sessionId }
app.post("/api/session/simulate-compromise", (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ success: false, error: "Session not found" });
  if (session.status !== "ACTIVE") {
    return res.status(400).json({ success: false, error: "Session is not active" });
  }

  session.simulationState = "COMPROMISED";
  logEvent(`⚠ Demo session ${sessionId} (owner: ${session.userId}) marked as COMPROMISED`, "danger");

  res.json({ success: true, session: publicSession(session), risk: currentRisk() });
});

// POST /api/session/inject-demo  { browser: "A"|"B", sessionId }
app.post("/api/session/inject-demo", (req, res) => {
  const { browser, sessionId } = req.body || {};
  if (browser !== "A" && browser !== "B") {
    return res.status(400).json({ success: false, error: "Invalid browser slot" });
  }

  const session = sessions[sessionId];
  if (!session) {
    return res.status(400).json({ success: false, error: "That session ID was not issued by this demo application" });
  }
  if (session.status !== "ACTIVE") {
    return res.status(400).json({ success: false, error: "That demo session is no longer active" });
  }
  if (session.simulationState !== "COMPROMISED") {
    return res.status(400).json({ success: false, error: "Only a session marked COMPROMISED can be injected for this simulation" });
  }

  const previousUserId = browserSlots[browser] && sessions[browserSlots[browser]]
    ? sessions[browserSlots[browser]].userId
    : "(none)";

  browserSlots[browser] = sessionId;

  logEvent(`🔄 Demo session ${sessionId} (owner: ${session.userId}) reused by User ${browser}'s browser (was: ${previousUserId})`, "danger");
  logEvent(`🚨 Identity changed: ${previousUserId} → ${session.userId}`, "critical");
  logEvent(`🚨 Risk increased: 10 → 95`, "critical");

  res.json({
    success: true,
    session: publicSession(session),
    user: publicUser(session.userId),
    impersonated: true,
    previousUserId,
    risk: currentRisk()
  });
});

// POST /api/session/revoke  { sessionId }
app.post("/api/session/revoke", (req, res) => {
  const { sessionId } = req.body || {};
  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ success: false, error: "Session not found" });

  session.status = "REVOKED";
  Object.keys(browserSlots).forEach((slot) => {
    if (browserSlots[slot] === sessionId) browserSlots[slot] = null;
  });

  logEvent(`🔒 Demo session ${sessionId} revoked. It is no longer valid.`, "success");
  res.json({ success: true, session: publicSession(session), risk: currentRisk() });
});

// POST /api/demo/reset
app.post("/api/demo/reset", (req, res) => {
  resetDemoState();
  logEvent("↻ Demo reset. All sessions cleared.", "info");
  res.json({ success: true, message: "Demo Ready" });
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
  console.log(`SessionShield running at http://localhost:${PORT}`);
  console.log("🔬 EDUCATIONAL SECURITY SIMULATION — no real accounts or cookies are used.");
});
