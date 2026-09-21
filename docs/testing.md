# Test Cases

### TC-01 Valid Alice Login
- **Objective:** Confirm Alice can log in with correct credentials.
- **Steps:** Go to `login.html`; enter `alice` / `alice123`; submit.
- **Expected Result:** Redirected to `app.html`; a `DEMO_SESSION_*` id shown, status ACTIVE.
- **Status:** _Pass/Fail_

### TC-02 Valid Bob Login
- **Objective:** Confirm Bob can log in with correct credentials.
- **Steps:** Enter `bob` / `bob123`; submit.
- **Expected Result:** Redirected to `app.html` showing Bob's session and feed.
- **Status:** _Pass/Fail_

### TC-03 Invalid Login
- **Objective:** Reject wrong credentials.
- **Steps:** Enter `alice` / `wrongpassword`; submit.
- **Expected Result:** Error message shown, no redirect, no session created.
- **Status:** _Pass/Fail_

### TC-04 Demo Session Creation
- **Objective:** Every successful login creates a unique session id.
- **Steps:** Log in as Alice, then as Bob (separate browser slots on attack-demo.html).
- **Expected Result:** Two distinct `DEMO_SESSION_*` ids exist.
- **Status:** _Pass/Fail_

### TC-05 Session ID Display
- **Objective:** Session id and "demo only" warning are visible.
- **Steps:** View `app.html` while logged in.
- **Expected Result:** Session ID shown with the ⚠️ "not a real token" banner.
- **Status:** _Pass/Fail_

### TC-06 Simulated Session Compromise
- **Objective:** Marking a session compromised updates its state.
- **Steps:** On `attack-demo.html`, log in as Alice (Browser A), click "Simulate Session Theft".
- **Expected Result:** Browser A shows 🔴 COMPROMISED; step ③ marks warn; a matching event appears in the timeline.
- **Status:** _Pass/Fail_

### TC-07 Session Injection Rejected Before Compromise
- **Objective:** Injection must require `simulationState === COMPROMISED`.
- **Steps:** Log in as Alice (Browser A) but do NOT click "Simulate Session Theft". Copy her session id, log in as Bob (Browser B), paste and click "Simulate Session Injection".
- **Expected Result:** Request fails with an explanatory error; Bob's identity is unchanged.
- **Status:** _Pass/Fail_

### TC-08 Demo Session Injection (after compromise)
- **Objective:** A compromised demo session id can be "injected" into Bob's panel.
- **Steps:** Complete TC-06, then copy Alice's session id, log in as Bob, paste id, click "Simulate Session Injection".
- **Expected Result:** Request succeeds; Bob's panel now resolves to Alice's identity.
- **Status:** _Pass/Fail_

### TC-09 Alice Profile Appears in User B
- **Objective:** After injection, User B's screen shows Alice's full profile.
- **Steps:** Complete TC-08; observe the transition card and "session identity changed" screen.
- **Expected Result:** Name "Alice Sharma" / `@alice`, her bio, and stats appear where Bob's data was.
- **Status:** _Pass/Fail_

### TC-10 Risk Score Changes
- **Objective:** Risk score reflects state changes.
- **Steps:** Observe risk score before compromise, after "Simulate Session Theft", and after injection.
- **Expected Result:** `10/100 LOW` → `55/100 ELEVATED` → `95/100 CRITICAL`.
- **Status:** _Pass/Fail_

### TC-11 Session Revocation
- **Objective:** Revoking a session ends the impersonation.
- **Steps:** After TC-09, click "Revoke Compromised Session".
- **Expected Result:** Session status becomes REVOKED; both browser slots referencing it clear; success message shown.
- **Status:** _Pass/Fail_

### TC-12 Demo Reset
- **Objective:** Reset clears all state.
- **Steps:** Click "Reset Demo".
- **Expected Result:** All sessions, events, and browser slots clear; risk returns to `10/100 LOW`; "Demo Ready" message shown.
- **Status:** _Pass/Fail_
