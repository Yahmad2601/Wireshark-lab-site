# Project: Wireshark Teaching Site

## Purpose
A **deliberately insecure** web application used **only** to teach students
packet analysis with Wireshark. Students perform an action in the browser
(log in, register, upload a file, hit an API), then locate and dissect that
exact action inside a packet capture. The site's insecurity is the entire
pedagogical point: it exposes on the wire what real apps hide, so students
can *see* the difference.

This app runs on an **isolated lab network or localhost**. It is **never**
deployed to the public internet. It holds **no real data**.

## Non-negotiable design rules
- Serve over **plain HTTP** by default (port 8080) so all traffic is
  human-readable in Wireshark.
- Also serve an **HTTPS twin** of the same routes ( self-signed cert, port
  8443 ) so students can capture the same action over HTTP and HTTPS and
  compare what Wireshark reveals.
- Use **only fake / seeded credentials**. Never store, expect, or transmit
  a real secret. Seed one demo user (e.g. `student` / `packets123`).
- Render a **persistent on-screen banner** on every page:
  "⚠ DELIBERATELY INSECURE TEACHING SITE — DO NOT ENTER REAL CREDENTIALS."
- **Startup guard:** on boot, check the bind address is private
  (127.0.0.1, 10.x, 172.16–31.x, or 192.168.x). If it is not, print a loud
  warning and refuse to start unless an explicit `--allow-public` flag is set.
- **No external calls.** No CDNs, no analytics, no telemetry, no remote
  fonts/scripts. Every asset is served locally so the only packets a student
  sees are the ones the lesson is about. This keeps captures clean.

## Stack
- **Node.js + Express** (instructor is comfortable with this stack).
- Server-rendered views (EJS or plain template strings — keep it light).
- A clean, modern, self-contained UI is welcome, but **all CSS/JS local**.
- `express-session` (or a hand-rolled cookie) for the session-cookie lesson.
- `multer` for the multipart upload lesson.
- Minimal dependencies overall.

## Routes = lessons
Each route exists to demonstrate ONE Wireshark concept. Keep them distinct.

| Route | Method | Wireshark lesson |
|---|---|---|
| `/` | GET | Landing page, banner, index of lessons |
| `/login` | GET | Render login form |
| `/login` | POST | urlencoded credentials in body → **Follow HTTP Stream** reveals user+pass in cleartext |
| `/search` | GET | Query string in the URL → why GET leaks sensitive data into URLs/logs/history |
| `/register` | GET/POST | Multiple fields (email, phone, dropdown, checkbox) → richer urlencoded body |
| `/upload` | GET/POST | `multipart/form-data` → **Export Objects → HTTP** carves the uploaded file back out |
| (post-login) | — | Server issues a **session cookie** → `Set-Cookie` then `Cookie` header on every request → session-replay / hijacking demo |
| `/api/data` | GET | Returns JSON → `Content-Type: application/json` dissection |
| `/secret` | GET | **HTTP Basic Auth** → `Authorization: Basic` is Base64, decode it live → encoding ≠ encryption |
| `/broken` | GET | 404 |
| `/redirect` | GET | 301/302 → following a redirect chain in capture |
| `/error` | GET | 500 → error signature on the wire |
| `/assets-demo` | GET | One page that loads several local CSS/JS/image assets → many parallel requests, keep-alive, filtering practice |

## HTTPS twin
- Same routes, served on 8443 with a self-signed cert.
- Provide a documented `openssl` command (and/or a `gen-cert` npm script) to
  generate `cert.pem` / `key.pem` into a `certs/` folder.
- Purpose: capture the same `/login` over HTTP (everything visible) vs HTTPS
  (only `TLSv1.x Application Data` — ciphertext), the core contrast lesson.

## Out of scope (do NOT add)
- No real user database, no password hashing for "security," no production
  hardening, no rate limiting, no CSRF protection. (Their *absence* is part
  of the lesson; do not silently add them.)
- No external network calls of any kind.

## Workflow preferences
- **Explain the plan before writing files**; I review in plan mode first.
- Build **one route at a time** so I can capture each in Wireshark and
  confirm the lesson shows up before moving on.
- Keep dependencies minimal and pinned in package.json.
- Generate a `README.md` that doubles as the instructor lab worksheet: for
  each route, give the exact Wireshark display filter and the lesson it
  teaches.
