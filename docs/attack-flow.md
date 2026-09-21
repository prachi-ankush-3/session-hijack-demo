# Attack Flow

```
USER A (Alice)
     ↓
Login
     ↓
Alice's Session Created
     ↓
Alice's Profile
     ↓
⚠️ Simulate Session Compromise
     ↓
Demo Session ID exposed
     ↓
USER B (Bob)
     ↓
Bob logs in normally
     ↓
Bob sees Bob's profile
     ↓
Paste Alice's DEMO session ID
     ↓
Simulate Session Injection
     ↓
🚨 USER B IS NOW TREATED AS USER A
     ↓
Bob's screen changes
     ↓
Alice's profile appears inside User B's session
     ↓
🚨 CRITICAL RISK
```

## Step-by-step (matches attack-demo.html)

1. **① Alice Login** — `POST /api/login` with `browser: "A"` creates
   `DEMO_SESSION_XXXXXXXX` and assigns it to browser slot `A`.
2. **② Session Created** — the session id is shown in the Browser A panel,
   status `🟢 NORMAL`.
3. **③ Session Compromised** — clicking "Simulate Session Theft" calls
   `POST /api/session/simulate-compromise`, flipping `simulationState` to
   `COMPROMISED`. The session id itself doesn't change — this mirrors how
   a real leaked session id is still perfectly valid from the server's
   point of view.
4. **④ Bob Login** — `POST /api/login` with `browser: "B"` creates Bob's
   own separate, normal session. The "before" state (Bob as Bob, 10/100
   LOW) is now visible in Browser B.
5. **⑤ Session Reused** — the presenter pastes Alice's session id into
   Browser B and clicks "Simulate Session Injection". `POST
   /api/session/inject-demo` checks that the id (a) was issued by this
   server and (b) is marked `COMPROMISED`, then overwrites browser slot
   `B`'s active session with Alice's session id.
6. **⑥ Identity Changed** — `GET /api/session/browser/B` now resolves to
   Alice's account. The UI shows the Bob → Alice transition animation, the
   full "session identity changed" screen with Alice's profile, and the
   Before/After card.
7. **⑦ Risk Detected** — the risk score climbs from `10/100 LOW` to
   `95/100 CRITICAL`, and the event timeline logs the identity change and
   risk increase.
8. **Revoke** — `POST /api/session/revoke` sets `status: "REVOKED"` and
   clears both browser slots pointing at that session; the impersonation
   stops immediately.
9. **Reset** — `POST /api/demo/reset` clears all sessions, slots, and
   events so the whole flow can be repeated.

## Core educational point

A session identifier is a *bearer token*: whoever presents it is trusted.
This app intentionally lets a **compromised** session id be reused by a
different browser slot, only inside the isolated `/attack-demo` flow, to
make that risk visible. It never generalizes this behavior elsewhere —
`app.html` always resolves identity strictly from the session id that was
actually issued at login.
