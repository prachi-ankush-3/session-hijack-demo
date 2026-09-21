# Presentation Script

A simple explanation a student can read aloud while running the demo:

> Our project demonstrates the risk of session hijacking using a
> controlled local environment.
>
> First, User A logs into our fake social-media website and receives a
> demo session ID.
>
> We then simulate that this session identifier has been compromised.
>
> Next, User B's demo browser uses this simulated session ID.
>
> Because the server accepts the valid session, the application identifies
> User B as User A.
>
> Therefore, User B can see User A's profile.
>
> This demonstrates the importance of secure session management.
>
> In the next phase of our project, our Chrome extension will detect this
> suspicious session behavior and provide protection.

## Suggested live-demo order

1. Open `attack-demo.html`.
2. Click **Start Full Demo** to show the presenter guide on-screen.
3. Log in as Alice (User A panel) — point out the fake session ID and the
   "not a real authentication token" warning.
4. Click **Simulate Session Theft**.
5. Copy the session ID.
6. Log in as Bob (User B panel) — point out Bob's own, separate session ID.
7. Paste Alice's session ID and click **Inject Demo Session**.
8. Show the result card: Alice's identity now appears in Bob's panel, the
   Before/After comparison, and the risk score jumping to 95/100 CRITICAL.
9. Scroll to the Security Events timeline to narrate what just happened.
10. Click **Revoke Session** to show the impersonation being shut down.
11. Click **Reset Demonstration** before the next run-through.

## Key talking points

- A session ID is a *bearer credential* — whoever has it is trusted.
- This is why HTTPS, `HttpOnly`/`Secure` cookies, short session lifetimes,
  session rotation on login, and IP/device binding all matter in real
  systems.
- This entire demo is local and fake: no real accounts, cookies, or
  external services were touched.
