# Unstuck

Unstuck turns a messy brain dump into one small next step at a time, sized to the minutes and energy you have right now. It is a single-screen Next.js app with a Claude Haiku triage endpoint and a deterministic engine sitting behind it, so it still returns a usable step when no API key is configured.

Built for the Design4Future hackathon. The hosted build at https://unstuck-theta.vercel.app runs on the deterministic engine, because that deployment is configured without an API key.

## Install

Node 20, the version CI runs.

```bash
npm install
npm run dev      # http://localhost:3000
```

No keys are needed for local development. To send triage through Claude, copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. The key is read server-side in `lib/triage.ts` and never reaches the browser. Setting `NEXT_PUBLIC_OFFLINE_DEMO=1` adds the banner the hosted build shows, which tells visitors the model is off and the suggestions are the simpler deterministic ones.

## Run

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint
npm run test:safety  # crisis-regex test; no key, no network
npm run test:e2e     # Playwright; builds and starts a local server first
npm run eval         # 28-fixture triage eval against a running server
```

The eval harness talks to a server on `http://localhost:3000` and needs `ANTHROPIC_API_KEY` in the environment. Start that server with a raised limit so the run does not trip the rate limiter:

```bash
RATE_LIMIT_MAX=300 npm start   # one shell
npm run eval                   # another
```

Point the end-to-end suite at a deployment with `E2E_BASE_URL=https://... npm run test:e2e`. By default it builds and serves locally, so it never bills production.

## Method

The premise is that a long list is itself what produces the freeze, so the default view is a single card: one action, the reason it fits, and a meter that fills as items are cleared. An organized mode is one tap away for people who do want to see everything.

```mermaid
flowchart LR
  U[Brain-dump textarea] -->|"POST /api/triage<br/>+ time / energy"| R[Route handler]
  R --> C[Claude triage, Haiku 4.5<br/>server-side, key hidden]
  C -.->|on any error| F[Deterministic engine<br/>lib/fallback.ts]
  R -->|"TriageItem[]"| V[One focus card]
  V --> M[Momentum meter]
  V <--> L[(localStorage)]
```

`POST /api/triage` takes the dump plus the minutes and energy the user has and the client's local clock. The request is zod-validated and rate limited per IP at 20 requests a minute, which `RATE_LIMIT_MAX` overrides. Triage then runs two passes against `claude-haiku-4-5` with `tool_choice` pinned to a single `record_triage` tool, so the model can only ever emit the triage schema. The first pass splits the dump into items and writes a 2 to 5 minute first step, a one-line reason, a larger 10 to 15 minute step for the effort slider, and, when an item states a clock time of its own, a local ISO start that the card turns into a calendar entry. The second pass is a skeptic. It sees the original dump alongside the draft and rewrites busywork the user has obviously already done, steps that are really the whole task, and reasons that are circular or preachy. Set `DISABLE_SKEPTIC=1` to skip it.

Anything that goes wrong returns null and drops to `lib/fallback.ts`, a keyword-matched deterministic engine that produces the same shape offline. That covers a missing key, an API error, output that fails the schema, and an empty result. Since the fallback is what the public deployment actually serves, it was written to give a genuinely usable step rather than a stub.

Crisis handling runs on both sides. The model sets `needsSupport`, and the route ORs that with a narrow regex in `lib/safety.ts`. The regex is deliberately high precision: every form of "suicide" fires, while the ordinary overwhelm idioms ("this deadline is killing me", "can't go on") do not. When either side fires, the UI puts the task flow aside and shows crisis lines (988 and 741741).

That regex has been wrong in both directions. A stale word boundary once dropped every form of "suicide", and a broader version fired on ordinary hyperbole. Both failures are now pinned by `evals/safety.test.mjs`, which reads the regex literals straight out of `lib/safety.ts` so the test cannot drift from the code it guards.

Session state lives in `localStorage` and nowhere else. It is untrusted input on every page load, so it is zod-validated on read, and it carries a 12 hour TTL so an old session does not hijack the landing screen.

Three of the interaction rules trace to published work: one card at a time to cognitive load theory (Sweller, 1988), the smallest concrete physical action to implementation intentions (Gollwitzer, 1999), and the momentum meter to the progress principle (Amabile and Kramer, 2011).

## Interface

Warm ivory canvas with faint paper grain, one clay accent, and Newsreader for display type against Geist for body text. Under `prefers-reduced-motion` the ambient and entrance animation stops; the completion confetti still fires, on purpose, but as a shorter and gentler burst. Production security headers and the CSP live in `next.config.ts`.

## Repository layout

| Path | Contents |
|---|---|
| `app/` | App Router pages and the two API routes, `/api/triage` and `/api/health`. |
| `components/` | Brain dump, focus card, effort slider, momentum meter, support card, organized list, and the Web Speech dictation hook. |
| `lib/` | Claude triage client, deterministic fallback, crisis regex, rate limiter, localStorage session, `.ics` calendar export, nudges, copy. |
| `evals/` | The 28-fixture golden set, the eval harness, the no-key safety test, and the generated report. |
| `e2e/` | Seven Playwright specs covering the demo path and its edge cases. |

## Results

From `evals/REPORT.md`, produced by `npm run eval` over the 28 golden fixtures.

| Measure | Result |
|---|---|
| Fixtures passing every applicable hard check | 28 of 28 |
| Crisis dumps routed to the support card | 4 of 4 |
| Overwhelm hyperbole correctly not flagged | 5 of 5 |
| Gibberish dumps degrading without an error | 2 of 2 |

The judge-rated quality column in that report is empty. The run that produced it had no key for the judge model, so mean next-action quality is simply unmeasured.

`npm run test:safety` is separate and needs no key: 16 crisis phrases must fire and 11 hyperbole phrases must not. CI runs lint, that safety test, and the production build on every push.

## Scope

In: the brain dump to one-action to momentum loop, the time and energy calibration, the offline fallback, and local persistence. Out, deliberately: accounts, calendar or email sync, a native app, collaboration, and server-side notifications. The nudge feature is honest about this last one. It fires a browser notification while the tab is open and otherwise surfaces a due reminder the next time you open the app, because real background push would need a service worker and infrastructure this does not have.

## License

No license file is included yet, so default copyright applies.
