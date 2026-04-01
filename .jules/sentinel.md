## 2024-05-20 - [Critical DOM XSS in Chat Interface]
**Vulnerability:** A critical Cross-Site Scripting (XSS) vulnerability was found in the frontend chat system (`client/js/script.js`). The chat logic dynamically concatenated user IDs and message content into `innerHTML` to display messages, allowing arbitrary JavaScript execution via malicious input.
**Learning:** The application heavily relies on raw DOM manipulation without a modern reactive framework (like React or Vue) that would otherwise automatically sanitize input. This pattern creates a high risk for XSS anywhere user input is reflected in the UI.
**Prevention:** Strict enforcement of safe DOM APIs (`document.createElement`, `textContent`, `appendChild`) is required over `innerHTML`. Any future chat or UI elements that render user-provided data must be validated or safely escaped.
## 2026-03-12 - [XSS] Fix innerHTML XSS Vulnerability
**Vulnerability:** The application was using `innerHTML` to render dynamic user input, such as chat messages, directly into the DOM. This allowed for Cross-Site Scripting (XSS) where malicious users could inject executable JavaScript payloads.
**Learning:** Chat features and any user-provided content that is broadcasted or displayed should never use `innerHTML`. Using `innerHTML` bypassing native DOM escaping mechanisms.
**Prevention:** Always use safe DOM manipulation APIs like `document.createElement` and `textContent` or `innerText` when updating the UI with user input, instead of `innerHTML`.
## 2024-05-24 - [HIGH] Add rate limiting to authentication endpoints
**Vulnerability:** Sensitive authentication endpoints (`/api/register`, `/api/login`, `/api/guest`) lacked rate limiting.
**Learning:** This missing protection could allow brute-force attacks or Denial of Service (DoS) by spamming these endpoints, bypassing authentication mechanisms. Rate limits for sensitive endpoints should be implemented by default to protect user security and application stability.
**Prevention:** Always implement a rate limiter on endpoints that involve user authentication, token generation, or sensitive actions. Use standard middleware, such as `github.com/gofiber/fiber/v2/middleware/limiter`, to easily achieve this.
## 2025-02-18 - String truncation using rune slice
**Vulnerability:** DoS using long messages
**Learning:** Corrupting multi-byte UTF-8 characters
**Prevention:** Using []rune for truncation
