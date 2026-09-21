# Attack Flow

```
USER A
Alice
  ↓
Login
  ↓
Session A Created
  ↓
Session ID exposed in demo
  ↓
Simulated Session Compromise
  ↓
Session ID reused
  ↓
USER B
Bob
  ↓
Application accepts Session A
  ↓
🚨 Identity Impersonation
  ↓
Bob sees Alice's profile
```

## Step-by-step (matches the attack-demo.html UI)

1. **Login as Alice** — `POST /api/login` creates `DEMO_SESSION_XXXX` and
   assigns it to browser slot `A`.
2. **Session exposed** — the session id is shown on-screen and can be
   copied, exactly as a leaked/logged session id might be found in a proxy
   log, browser history, or an XSS payload in a real system.
3. **Simulate Session Theft** — `POST /api/session/simulate-compromise`
   flips the session's `status` to `SIMULATED_COMPROMISED`. Nothing about
   the session id itself changes — this mirrors how a real leaked session
   id is still perfectly valid from the server's point of view.
4. **Login as Bob** — creates Bob's own separate session on browser slot
   `B`, so the "before" state (Bob logged in as Bob, LOW risk) is visible.
5. **Inject Demo Session** — the presenter pastes Alice's session id into
   Bob's panel. `POST /api/session/inject-demo` overwrites browser slot
   `B`'s active session with Alice's session id, after checking that the id
   was actually issued by this server.
6. **Identity impersonation** — `GET /api/session/browser/B` now resolves
   to Alice's account. The UI shows Alice's name/profile inside what was
   Bob's panel, and the Before/After + risk score make the change obvious.
7. **Risk score** climbs from `10/100 LOW` to `95/100 CRITICAL`.
8. **Revoke Session** — `POST /api/session/revoke` invalidates the session;
   the impersonation stops working immediately.
9. **Reset Demonstration** — `POST /api/demo/reset` clears all state so the
   whole flow can be repeated for another audience.

## Core educational point

A session identifier is a bearer token: whoever presents it is trusted.
This app intentionally lets a *valid* session id be reused by a different
browser context, in the isolated `/attack-demo` flow only, to make that
risk visible. It never generalizes this behavior to the rest of the app —
`dashboard.html` and `profile.html` always resolve identity strictly from
the session id that was actually issued at login.
