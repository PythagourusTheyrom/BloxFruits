## 2026-03-12 - [XSS] Fix innerHTML XSS Vulnerability
**Vulnerability:** The application was using `innerHTML` to render dynamic user input, such as chat messages, directly into the DOM. This allowed for Cross-Site Scripting (XSS) where malicious users could inject executable JavaScript payloads.
**Learning:** Chat features and any user-provided content that is broadcasted or displayed should never use `innerHTML`. Using `innerHTML` bypassing native DOM escaping mechanisms.
**Prevention:** Always use safe DOM manipulation APIs like `document.createElement` and `textContent` or `innerText` when updating the UI with user input, instead of `innerHTML`.
