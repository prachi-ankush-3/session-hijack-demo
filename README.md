# SessionShield — Session Hijacking Risk Demonstration

🔬 **EDUCATIONAL SECURITY SIMULATION.** No real accounts, cookies, credentials, or external websites are involved.

## Project Overview

Most web applications recognize a logged-in user by a **session identifier**
rather than asking for a password on every request. That's convenient, but
it also means: whoever presents a valid session identifier is trusted as
that user. SessionShield is a small, fully local fake social platform
("SessionShield Social") built to make that risk visible and safe to
demonstrate in a classroom setting.

## Problem Statement

If a session identifier is exposed — through an insecure network, a
cross-site scripting bug, a stolen cookie, log leakage, etc. — an attacker
who obtains it can reuse it to impersonate the victim without ever knowing
their password. Many people don't intuitively grasp this because session
identifiers are invisible in day-to-day use.

## Objective

Demonstrate, using two fake local accounts (Alice and Bob) and a session
system fully controlled by our own server, how a compromised session
identifier can lead directly to identity impersonation — and why
countermeasures like short session lifetimes, `HttpOnly`/`Secure` cookies,
session rotation, and anomaly detection matter.

## Features

- Modern dark cybersecurity-themed UI (landing, login, social app, attack lab, result page)
- Two demo accounts with realistic profiles and feeds
- A fake, server-controlled session model (`DEMO_SESSION_XXXXXXXX`)
- A dedicated **Session Hijacking Risk Lab** (`attack-demo.html`) with:
  - a 7-step visual stepper
  - two side-by-side "browser" panels for Alice and Bob
  - a **Simulate Session Theft** action
  - a **Simulate Session Injection** action (only accepts session IDs issued by this server, and only once they're marked `COMPROMISED`)
  - a dramatic Bob → Alice identity transition
  - a live Before/After comparison card
  - an animated risk meter (10/100 LOW → 95/100 CRITICAL)
  - a security event timeline
  - **Revoke Session** and **Reset Demo** controls
- A standalone `result.html` summary view

## Technology Stack

- HTML5, CSS3, vanilla JavaScript (frontend)
- Node.js + Express (backend)
- In-memory session store, JSON file for demo user accounts (no database)

## Architecture

```
Frontend (public/)
      ↓
Express Server (server.js)
      ↓
Demo Session Manager (in-memory sessions + two browser slots A/B)
      ↓
Risk Simulation (security events + risk score)
      ↓
Identity Impersonation (session reuse across browser slots)
```

See `docs/architecture.md` for the full API surface and component breakdown.

## Session Flow

```
Login → Session Creation → Session Info Displayed →
Simulated Compromise → Session Reuse → Identity Impersonation →
Risk Alert → Session Revocation → Reset
```

## Attack Simulation

See `docs/attack-flow.md` for the exact step-by-step mechanics, and
`docs/presentation.md` for a ready-to-read presenter script.

## Risk Scoring

| State | Score | Level |
|---|---|---|
| Normal | 10 / 100 | LOW |
| A session is marked COMPROMISED but not yet injected | 55 / 100 | ELEVATED |
| A compromised session has been injected into another browser slot | 95 / 100 | CRITICAL |

## Installation

```bash
npm install
npm start
```

## How to Run

1. `npm install` (only needed once, or after pulling changes)
2. `npm start`
3. Open **http://localhost:3000**
4. Click **Start Demo** on the landing page

If `npm install` fails or `node_modules` doesn't appear, see the
Troubleshooting note at the bottom of this file.

## Demo Credentials

```
USER A: alice / alice123
USER B: bob   / bob123
```

## Complete Demo Steps

1. Open SessionShield, click **Start Demo**
2. Log in as Alice
3. View Alice's profile and feed on the app page
4. Go to **Security** (attack-demo.html)
5. Log in as Alice in the **Browser A** panel
6. Click **⚠️ Simulate Session Theft**
7. Copy Alice's demo session ID
8. Log in as Bob in the **Browser B** panel — note Bob's own profile and LOW risk
9. Paste Alice's session ID into Browser B and click **🔄 Simulate Session Injection**
10. Watch Browser B's identity flip to Alice, the Before/After card update, and risk jump to 95/100 CRITICAL
11. Review the Security Event Timeline
12. Click **🔒 Revoke Compromised Session**
13. Click **↻ Reset Demo** to run it again

## Testing

See `docs/testing.md` for the full test-case checklist (TC-01 through TC-12).

## Security Limitations

This is intentionally a teaching tool, not a security product:

- Passwords are stored in plaintext in `data/users.json` — fine for two
  fixed demo accounts, never acceptable in a real system.
- Sessions live only in server memory and reset when the server restarts.
- The `/api/session/inject-demo` behavior — letting one browser slot reuse
  another's session id — is a deliberate, isolated simulation. It only
  works with session IDs this server itself issued and only after they've
  been explicitly marked `COMPROMISED`; it is not a general vulnerability
  in the rest of the app.

## Future Scope

A companion Chrome extension (**Project 2**, developed separately) will
detect the kind of suspicious session-reuse behavior demonstrated here and
alert the user — this repository intentionally does not include it.

## Team Roles

_Fill in for your submission — e.g. Frontend, Backend, Documentation, Presentation._

---

## Troubleshooting: `Cannot find module 'express'`

If `npm start` fails with `Cannot find module 'express'`, it means
`npm install` didn't finish successfully in this folder.

1. Make sure you're in the folder that directly contains `server.js` and
   `package.json` (not a nested duplicate folder).
2. Run `npm install` again and read its output for errors.
3. Confirm `node_modules\express` (Windows) or `node_modules/express`
   (Mac/Linux) exists afterward.
4. If it still fails, try `npm install express --save` directly and share
   the exact error text — it's usually a network/proxy/antivirus issue.
