# Architecture

## Overview

```
Frontend (public/)
      ↓
Express Server (server.js)
      ↓
Demo Session Manager
      ↓
Risk Simulation
      ↓
Identity Impersonation
```

## Frontend (`public/`)

Plain HTML/CSS/JS. No build step, no frameworks. Every page talks to the
backend's JSON API with `fetch()`.

- `index.html` — landing page, feature cards, "How it works" explainer
- `login.html` — login form with demo credentials shown inline
- `app.html` — the fake social app: profile card, session panel, feed
- `attack-demo.html` — the Session Hijacking Risk Lab (the main demo page)
- `result.html` — standalone risk score + event timeline summary

## Backend (`server.js`)

An Express app exposing a small JSON API. All state lives in memory for
the life of the process:

- `users` — loaded once from `data/users.json` (fixed demo accounts)
- `sessions` — `sessionId -> session record` (see model below)
- `browserSlots` — two slots, `A` and `B`, simulating two independent
  browsers. This is what lets a session created for Alice be "reused" by
  Bob's browser on the attack-demo page.
- `events` — an append-only list rendered as the security timeline
- `currentRisk()` — derives a 0–100 score and level from the current state

## Session Model

```json
{
  "sessionId": "DEMO_SESSION_A8F92K1B",
  "userId": "alice",
  "status": "ACTIVE",
  "simulationState": "NORMAL",
  "createdAt": "2026-01-01T21:42:00.000Z",
  "lastActivity": "2026-01-01T21:45:00.000Z"
}
```

`status` is `ACTIVE` or `REVOKED`. `simulationState` is `NORMAL` or
`COMPROMISED` and only changes via the attack-demo flow.

## API Surface

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/login` | Authenticate a demo user, create a fake session |
| GET | `/api/session/current` | Resolve the active session (by id or browser slot) |
| GET | `/api/session/:id` | Look up a specific session record |
| GET | `/api/session/browser/:slot` | Convenience lookup for the A/B attack-demo panels |
| POST | `/api/session/simulate-compromise` | Mark a session's `simulationState` as `COMPROMISED` |
| POST | `/api/session/inject-demo` | Point a browser slot at another (compromised) session's id |
| POST | `/api/session/revoke` | Set a session's `status` to `REVOKED` |
| POST | `/api/demo/reset` | Clear all sessions/events/risk back to the start |
| GET | `/api/security/events` | Return the event timeline |
| GET | `/api/security/risk` | Return the current risk score |

## Why this is safe

- Session identifiers are application-level strings generated with
  `crypto.randomBytes`, never browser cookies, and the app never reads or
  writes the real cookie jar.
- No outbound network requests are made to any external site.
- `/api/session/inject-demo` only accepts an id that (a) exists in the
  server's own `sessions` object and (b) has `simulationState ===
  "COMPROMISED"` — an arbitrary or real-world value is always rejected.
