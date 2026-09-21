# Presentation Script

A simple explanation to read aloud while running the demo (approx. 3–5 minutes):

> Our project, SessionShield, demonstrates the risk of session hijacking
> using a controlled local environment.
>
> First, Alice — User A — logs into our fake social platform and receives
> a demo session ID.
>
> We simulate that this session identifier has become compromised — for
> example, exposed through an insecure network or a logging mistake.
>
> Next, Bob — User B — logs in normally to his own account, and we paste
> Alice's compromised session ID into Bob's browser.
>
> Because the server accepts that valid session identifier, the
> application now treats Bob's browser as Alice.
>
> Bob's screen changes to show Alice's profile, and our risk score jumps
> from 10 out of 100 — low risk — to 95 out of 100 — critical risk.
>
> This demonstrates why secure session management — short session
> lifetimes, secure cookies, and session rotation — matters.
>
> In the next phase of our project, a companion Chrome extension will
> detect this kind of suspicious session behavior and alert the user.

## Presenter flow (matches the UI)

1. Open SessionShield
2. Log in as Alice, show her profile on the app page
3. Open the **Security** / Risk Lab page
4. Log in as Alice in Browser A, point out her demo session ID
5. Click **Simulate Session Theft** — show the session marked COMPROMISED
6. Log in as Bob in Browser B — show his normal profile, LOW risk
7. Paste Alice's session ID and click **Simulate Session Injection**
8. Point out: Bob's screen now shows Alice's profile — 🚨 identity impersonation
9. Show the risk score at 95/100 CRITICAL
10. Show the Before → After comparison card
11. Scroll to the Security Event Timeline
12. Click **Revoke Compromised Session**
13. Click **Reset Demo** before the next run-through

## Key talking points

- A session ID is a *bearer credential* — whoever has it is trusted.
- This is why HTTPS, `HttpOnly`/`Secure` cookies, short session lifetimes,
  session rotation on login, and anomaly/IP-binding checks all matter in
  real systems.
- Everything in this demo is local and fake — no real accounts, cookies,
  or external services were touched.
