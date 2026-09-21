# Test Cases

| Field | |
|---|---|
| Test ID | |
| Test Objective | |
| Steps | |
| Expected Result | |
| Actual Result | |
| Status | |

---

### TC-01 Valid Alice Login
- **Objective:** Confirm Alice can log in with correct credentials.
- **Steps:** Go to `login.html`; enter `alice` / `alice123`; submit.
- **Expected Result:** Redirected to `dashboard.html`; a `DEMO_SESSION_*` id is shown, status `ACTIVE`.
- **Actual Result:** _fill in during test run_
- **Status:** _Pass/Fail_

### TC-02 Valid Bob Login
- **Objective:** Confirm Bob can log in with correct credentials.
- **Steps:** Enter `bob` / `bob123`; submit.
- **Expected Result:** Redirected to `dashboard.html` showing Bob's session.
- **Status:** _Pass/Fail_

### TC-03 Invalid Login
- **Objective:** Reject wrong credentials.
- **Steps:** Enter `alice` / `wrongpassword`; submit.
- **Expected Result:** Error message shown, no redirect, no session created.
- **Status:** _Pass/Fail_

### TC-04 Demo Session Creation
- **Objective:** Every successful login creates a unique session id.
- **Steps:** Log in twice (e.g., Alice, then log out, then Bob).
- **Expected Result:** Two distinct `DEMO_SESSION_*` ids exist.
- **Status:** _Pass/Fail_

### TC-05 Session ID Display
- **Objective:** Session id and "not a real token" warning are visible.
- **Steps:** View `dashboard.html` while logged in.
- **Expected Result:** Session ID shown with the ⚠ warning banner.
- **Status:** _Pass/Fail_

### TC-06 Simulated Session Compromise
- **Objective:** Marking a session compromised updates its status.
- **Steps:** On `attack-demo.html`, log in as Alice, click "Simulate Session Theft".
- **Expected Result:** Alice's panel shows status `SIMULATED COMPROMISED`; a matching event appears in the timeline.
- **Status:** _Pass/Fail_

### TC-07 Demo Session Injection
- **Objective:** A valid demo session id can be "injected" into Bob's panel.
- **Steps:** Copy Alice's session id; log in as Bob; paste id; click "Inject Demo Session".
- **Expected Result:** Request succeeds; Bob's panel now resolves to Alice's identity.
- **Status:** _Pass/Fail_

### TC-08 Alice Profile Appears
- **Objective:** After injection, User B's panel shows Alice's profile data.
- **Steps:** Complete TC-07; observe the User B panel and the result card.
- **Expected Result:** Name "Alice Sharma" / `@alice` appears where Bob's data was.
- **Status:** _Pass/Fail_

### TC-09 Risk Score Changes
- **Objective:** Risk score reflects state changes.
- **Steps:** Observe risk score before compromise, after "Simulate Session Theft", and after injection.
- **Expected Result:** `10/100 LOW` → `60/100 ELEVATED` → `95/100 CRITICAL`.
- **Status:** _Pass/Fail_

### TC-10 Session Revocation
- **Objective:** Revoking a session ends the impersonation.
- **Steps:** After TC-08, click "Revoke Session".
- **Expected Result:** Session status becomes `REVOKED`; both browser slots referencing it are cleared; success message shown.
- **Status:** _Pass/Fail_

### TC-11 Demo Reset
- **Objective:** Reset clears all state.
- **Steps:** Click "Reset Demonstration".
- **Expected Result:** All sessions, events, and browser slots clear; risk returns to `10/100 LOW`.
- **Status:** _Pass/Fail_

### TC-12 Backend Error Handling
- **Objective:** Invalid input is rejected gracefully.
- **Steps:** POST to `/api/session/inject-demo` with a made-up session id (e.g., `DEMO_SESSION_FAKE123`).
- **Expected Result:** `400` response with `success: false` and an explanatory error; no state is changed.
- **Status:** _Pass/Fail_
