# Wireshark Teaching Site — Instructor Lab Worksheet

> ⚠ **DELIBERATELY INSECURE.** This app is a teaching tool. Run it only on an
> isolated lab network or localhost. Never deploy it publicly. Never enter
> real credentials. All seeded credentials are fake.

This document is both the project README and the **instructor's lab map**.
Each route below corresponds to one Wireshark lesson, with the display filter
to use and what students should observe.

---

## Getting it onto a lab machine (students start here)

**Prerequisite:** install **Node.js LTS** (which includes `npm`) from
<https://nodejs.org>. Verify it:

```bash
node --version
npm --version
```

**1. Download the project** — either clone with Git:

```bash
git clone https://github.com/Yahmad2601/Wireshark-lab-site.git
cd Wireshark-lab-site
```

…or, if you don't have Git, download the ZIP from the GitHub repo
(green **Code** button → **Download ZIP**), extract it, and open a terminal in
the extracted folder.

**2. Install dependencies** (one time, needs internet *for this step only* —
the app itself makes no external calls once running):

```bash
npm install
```

**3. Generate the HTTPS cert** (one time, for the HTTP-vs-HTTPS lesson):

```bash
npm run gen-cert
```

**4. Start a server and open it in the browser:**

```bash
npm run start:http      # then browse to http://127.0.0.1:8080
# and/or, in a second terminal:
npm run start:https     # then browse to https://127.0.0.1:8443  (accept the self-signed warning)
```

Log in with the seeded demo user **`student` / `packets123`** (fake creds). To
reach the site from a *different* device on the lab network, see
[Accessing it from other devices](#accessing-it-from-other-devices-on-the-lab-lan)
below.

---

## Running it

Once installed (see
[setup](#getting-it-onto-a-lab-machine-students-start-here)), the day-to-day
commands are:

```bash
# Plain HTTP (the main teaching surface) — port 8080
npm run start:http

# HTTPS twin (for the contrast lesson) — port 8443
npm run gen-cert     # one-time: creates certs/key.pem + certs/cert.pem
npm run start:https
```

Seeded demo login: **username** `student` · **password** `packets123`
(fake — for demonstration only).

On startup the server prints every URL it's reachable at — the loopback address
plus each LAN address — so just copy the one you need from the terminal.

---

## Starting your Wireshark capture

The browser and server are only half the lab — the packets are the point. Set up
the capture **before** you perform the action you want to study.

1. **Launch Wireshark.** The welcome screen lists your capture interfaces.
2. **Pick the interface that matches where the traffic flows:**
   - **Browser and server on the same machine** (you're visiting `127.0.0.1`) →
     choose the **loopback** interface:
     - **Windows:** *"Adapter for loopback traffic capture"* (provided by Npcap —
       install Npcap *with* loopback support; it ships with the Wireshark
       installer).
     - **Linux:** *"Loopback: lo"*.
     - **macOS:** *"Loopback: lo0"*.
   - **Traffic from another device** over the LAN → choose your real **Wi-Fi or
     Ethernet** adapter instead (loopback won't see that traffic).
3. **Optionally pre-filter to keep the capture clean.** In the green *capture
   filter* bar on the welcome screen, type `tcp port 8080` (HTTP) or
   `tcp port 8443` (HTTPS). Note: *capture* filters use BPF syntax
   (`tcp port 8080`) — different from the *display* filters used later
   (`http`, `tcp.port == 8080`).
4. **Start the capture:** double-click the interface, or select it and click the
   blue **shark-fin** (▶). Packets begin scrolling.
5. **Do the action in the browser** — e.g. submit the `/login` form.
6. **Stop the capture** with the red **square** (■) so the trace doesn't keep
   growing.
7. **Apply a display filter** to zoom in (e.g.
   `http.request.method == "POST" && http.request.uri == "/login"`), then
   right-click a packet → **Follow → HTTP Stream**.

> **Seeing nothing on loopback?** Usual causes: wrong interface selected; Npcap
> installed without loopback support (re-run the Npcap installer and tick it); or
> the browser answered from cache — hard-refresh with **Ctrl+F5** to force a real
> request. Confirm the server is actually on `127.0.0.1:8080` (it prints this on
> startup).

---

## Accessing it from other devices on the lab LAN

**This works out of the box — no extra flags.** By default both servers bind to
`0.0.0.0` (every IPv4 interface), which serves loopback **and** the LAN at once.
On startup the terminal lists the reachable URLs, e.g.:

```
http://127.0.0.1:8080      <- this machine
http://192.168.1.5:8080    <- other devices on the same network
```

From the other device, just browse to the LAN URL shown (`http://<lan-ip>:8080`
or `https://<lan-ip>:8443`). The other device must be on the **same** network
(some routers/hotspots isolate clients — disable "AP/Client Isolation" if peers
can't reach each other).

To **restrict** or **pin** the bind, set the `HOST` env var:

```powershell
$env:HOST="127.0.0.1"; npm run start:http   # loopback only (no LAN access)
$env:HOST="192.168.1.5"; npm run start:http  # pin one specific LAN interface
```

```bash
# macOS / Linux equivalent
HOST=127.0.0.1   npm run start:http
HOST=192.168.1.5 npm run start:http
```

Notes:
- The guard permits private binds (`10.x`, `172.16–31.x`, `192.168.x`) and the
  default `0.0.0.0` wildcard on an all-private machine. If the machine has a
  **public** address, the guard refuses to start unless you pass the explicit
  `--allow-public` flag.
- `npm run gen-cert` automatically adds every private IPv4 on this machine to
  the certificate's SAN, so the HTTPS twin validates over the LAN without a
  name-mismatch warning. **Re-run `gen-cert` if your LAN IP changes** (DHCP
  leases move).
- The first time Node binds to a non-loopback interface, Windows may prompt to
  allow it through the firewall — allow it for your current network profile,
  or it stays unreachable.

---

## The core contrast (do this first)

Log in **once over HTTP** and **once over HTTPS**, capturing both.

- **HTTP:** filter `http`, find the `POST /login`, right-click → Follow → HTTP
  Stream. Username and password are in plain sight in the request body.
- **HTTPS:** filter `tls`, find the same login. You see the TLS handshake
  (Client Hello, Server Hello, certificate) but the credentials are inside
  `Application Data` — ciphertext. **Same action, same network position,
  completely different visibility.** That is the whole lesson about why HTTPS
  exists, and equally what it does *not* hide (destination IP, SNI, timing).

---

## Route-by-route lesson map

### 1. `POST /login` — credentials in cleartext
- **Filter:** `http.request.method == "POST" && http.request.uri == "/login"`
- **Do:** Follow → HTTP Stream.
- **See:** `username=...&password=...` in the urlencoded body. The headline
  "you can literally read my password" moment.

### 2. `GET /search` — sensitive data in the URL
- **Filter:** `http.request.uri contains "/search"`
- **See:** the query sits in the request line itself (`GET /search?q=...`).
  Understand how URLs land in server logs, browser history, and `Referer`
  headers — so GET is even worse than POST for secrets.

### 3. `POST /register` — richer form body
- **Filter:** `http.request.uri == "/register"`
- **See:** every form field as a `key=value` pair in the urlencoded body.
  Expand **HTML Form URL Encoded** in the detail pane to see them parsed.

### 4. `POST /upload` — multipart and file carving
- **Filter:** `http.request.uri == "/upload"`
- **See:** `Content-Type: multipart/form-data` with boundary markers — a
  visibly different encoding. Then **File → Export Objects → HTTP** to carve
  the uploaded file straight back out of the capture.

### 5. Session cookie — `Set-Cookie` and replay
- **Filter:** `http.cookie || http.set_cookie`
- **See:** the server's `Set-Cookie` in the login response, then the `Cookie`
  header riding on every later request. Copy the value to understand session hijacking: anyone who captures this can impersonate the session.

### 6. `GET /api/data` — content-type dissection
- **Filter:** `http.request.uri == "/api/data"`
- **See:** `Content-Type: application/json` and the JSON body dissected by
  Wireshark. Contrast with HTML and image responses.

### 7. `GET /secret` — Basic Auth is Base64, not encryption
- **Filter:** `http.authorization`
- **See:** `Authorization: Basic c3R1ZGVudDpwYWNrZXRzMTIz`. Decode the Base64
  live (it's the seeded creds). Lesson: **encoding ≠ encryption.**

### 8. `/broken` (404), `/redirect` (301/302), `/error` (500)
- **Filter:** `http.response.code == 404` (swap the code as needed)
- **See:** each status code's distinct signature; follow the redirect chain
  request-to-request.

### 9. `GET /assets-demo` — concurrency and filtering practice
- **Filter:** start with `http`, then narrow with `http.request` vs
  `http.response`, and `ip.addr == <server>`.
- **See:** one page load fans out into many parallel requests for CSS/JS/
  images over keep-alive connections — practice finding signal in noise.

---

## Suggested lab sequence
1. Plain `/login` over HTTP → Follow Stream (the hook).
2. Same `/login` over HTTPS → ciphertext (the contrast).
3. `/search` GET vs `/login` POST → where data hides.
4. `/register` and `/upload` → form encodings + Export Objects.
5. Session cookie → replay/hijacking.
6. `/secret` Basic Auth → encoding vs encryption.
7. Status codes + `/assets-demo` → reading real-world request flows.

## Challenge prompts

Using the **prompt** and the **guide** (the filter/steps to get there) find and report the results. Filters are display filters
unless noted. (Assume HTTP on `:8080` over loopback.)

### A. Reading cleartext

**A1.** *"Log in, then find your password in the capture. Which filter got you
there?"*
- **Guide:** `http.request.method == "POST" && http.request.uri == "/login"` →
  right-click → **Follow → HTTP Stream**.

**A2.** *"Without using Follow Stream, read the `secret` value someone typed into
`/search`."*
- **Guide:** `http.request.uri contains "/search"`; look at the **request line /
  `http.request.uri`** in the packet detail.

**A3.** *"What `Content-Type` did `/api/data` return, and what's the value of the
`you` field?"*
- **Guide:** `http.request.uri == "/api/data"`; expand the response's
  **JavaScript Object Notation** tree.

### B. Cookies & sessions

**B1.** *"Find the session cookie and report its value."*
- **Guide:** `http.set_cookie` for the issuing response, then `http.cookie` for
  the replays.

**B2.** *"Prove the cookie alone is enough to impersonate the session (no
password)."*
- **Guide:** copy the `lab.sid` value from the capture and replay a request with
  it, e.g.
  `curl -H "Cookie: lab.sid=<value>" http://127.0.0.1:8080/api/data`.

### C. Encodings & file carving

**C1.** *"On `/register`, find the email field on the wire. How is the `@`
encoded, and what happens to the newsletter checkbox when unticked?"*
- **Guide:** `http.request.uri == "/register"` → Follow HTTP Stream, or expand
  **HTML Form URL Encoded** in the detail pane.

**C2.** *"Which frame uploaded the file? Export it and confirm its contents."*
- **Guide:** `http.request.method == "POST" && http.request.uri == "/upload"` →
  **File → Export Objects → HTTP** → select the request → **Save**.

**C3.** *"Decode the Basic Auth header. What does this prove about Base64?"*
- **Guide:** `http.authorization`; Wireshark also shows a decoded **Credentials**
  field under the Authorization header, or decode the Base64 by hand.

### D. Status codes & flow

**D1.** *"List every hop when you visit `/redirect`: each status code and its
`Location`."*
- **Guide:** `http.response.code >= 300 && http.response.code < 400` plus the
  final 200.

**D2.** *"Find the 404 and the 500. How do their response lines differ?"*
- **Guide:** `http.response.code == 404 || http.response.code == 500`.

**D3.** *"On `/assets-demo`, how many requests under `/public/` does one page load
make, and do they reuse TCP connections?"*
- **Guide:** `http.request.uri contains "/public/"` to count; check the
  **tcp.stream** index / look for keep-alive (no new handshake per asset).

### E. TCP & TLS

**E1.** *"Identify the TCP 3-way handshake just before the `/login` POST. How many
packets and which flags?"*
- **Guide:** `tcp.port == 8080 && tcp.flags.syn == 1` to spot the SYNs; then read
  the three frames in order.

**E2.** *"Capture the HTTPS login. What can you still learn about it despite
TLS?"*
- **Guide:** `tls && tcp.port == 8443`; inspect the **Client Hello**, the
  certificate, and the packet sizes/timing.

**E3.** *"Compare the same `/login` over HTTP vs HTTPS side by side. One sentence:
what changed and what didn't?"*
- **Guide:** capture `/login` once on `:8080` (filter `http`) and once on
  `:8443` (filter `tls`); compare what's readable in the request/response.

---

## Safety notes
- Startup guard refuses to bind to non-private addresses without
  `--allow-public`. Leave that flag off.
- No external calls are made by the app, so every packet you capture belongs
  to a lesson — captures stay clean and easy to read.
- Credentials are seeded and fake. Reinforce to students that they should
  never type a real password into an HTTP form, in this lab or anywhere.
