## 2024-05-20 - [Critical DOM XSS in Chat Interface]
**Vulnerability:** A critical Cross-Site Scripting (XSS) vulnerability was found in the frontend chat system (`client/js/script.js`). The chat logic dynamically concatenated user IDs and message content into `innerHTML` to display messages, allowing arbitrary JavaScript execution via malicious input.
**Learning:** The application heavily relies on raw DOM manipulation without a modern reactive framework (like React or Vue) that would otherwise automatically sanitize input. This pattern creates a high risk for XSS anywhere user input is reflected in the UI.
**Prevention:** Strict enforcement of safe DOM APIs (`document.createElement`, `textContent`, `appendChild`) is required over `innerHTML`. Any future chat or UI elements that render user-provided data must be validated or safely escaped.
## 2026-03-12 - [XSS] Fix innerHTML XSS Vulnerability
**Vulnerability:** The application was using `innerHTML` to render dynamic user input, such as chat messages, directly into the DOM. This allowed for Cross-Site Scripting (XSS) where malicious users could inject executable JavaScript payloads.
**Learning:** Chat features and any user-provided content that is broadcasted or displayed should never use `innerHTML`. Using `innerHTML` bypassing native DOM escaping mechanisms.
**Prevention:** Always use safe DOM manipulation APIs like `document.createElement` and `textContent` or `innerText` when updating the UI with user input, instead of `innerHTML`.
## 2024-03-24 - [Insecure Token Generation]
**Vulnerability:** The application was generating insecure tokens by using only 16 bytes of entropy and falling back to a predictable time-based ID if entropy generation failed.
**Learning:** Using a predictable time-based ID as a token fallback allows an attacker to easily guess session tokens, leading to potential account takeover and unauthorized access.
**Prevention:** Always generate tokens with sufficient entropy (e.g., 32 bytes) and ensure that the application fails securely (returning an error) rather than falling back to an insecure, predictable token.
