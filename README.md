# Wireshark Teaching Site — Instructor Lab Worksheet

> ⚠ **DELIBERATELY INSECURE.** This app is a teaching tool. Run it only on an
> isolated lab network or localhost. Never deploy it publicly. Never enter
> real credentials. All seeded credentials are fake.

This document is both the project README and the **instructor's lab map**.
Each route below corresponds to one Wireshark lesson, with the display filter
to use and what students should observe.

---

## Running it

```bash
npm install

# Plain HTTP (the main teaching surface) — port 8080
npm run start:http

# HTTPS twin (for the contrast lesson) — port 8443
npm run gen-cert     # one-time: creates certs/key.pem + certs/cert.pem
npm run start:https
```

Seeded demo login: **username** `student` · **password** `packets123`
(fake — for demonstration only).

Capture on the interface carrying lab traffic. On localhost, capture on the
loopback adapter; on a lab LAN, capture on the relevant Ethernet/WiFi NIC.

---

## The core contrast (do this first)

Have students log in **once over HTTP** and **once over HTTPS**, capturing both.

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
  Discuss how URLs land in server logs, browser history, and `Referer`
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
  header riding on every later request. Copy the value and discuss session
  hijacking: anyone who captures this can impersonate the session.

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

## Challenge prompts for students
- "Log in, then find your password in the capture. Which filter got you there?"
- "Find the session cookie and report its value."
- "Which frame uploaded the file? Export it and confirm its contents."
- "Decode the Basic Auth header. What does this prove about Base64?"
- "Capture the HTTPS login. What can you still learn about it despite TLS?"

---

## Safety notes
- Startup guard refuses to bind to non-private addresses without
  `--allow-public`. Leave that flag off.
- No external calls are made by the app, so every packet you capture belongs
  to a lesson — captures stay clean and easy to read.
- Credentials are seeded and fake. Reinforce to students that they should
  never type a real password into an HTTP form, in this lab or anywhere.
