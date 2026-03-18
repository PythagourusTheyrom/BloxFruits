## Missing Input Validation on Registration Username

**Vulnerability:**
The registration endpoint `/api/register` accepted any username string length and character, potentially leading to long username DOS attacks, or injection attacks on other parts of the system if names are rendered unescaped or used unsafely in other contexts.

**Learning:**
Always validate both the *length* and *character set* of user-provided input strings like usernames before accepting them and pushing them into the database. Regular expressions are a secure way to enforce an allowlist of permitted characters (e.g. `^[a-zA-Z0-9_]+$`).

**Prevention:**
Implement an `isValidUsername()` function containing strict boundaries for string inputs, and reject non-conforming requests with `400 Bad Request`. Compiling the regex pattern once globally at the package level (`regexp.MustCompile`) avoids recompilation overhead on high traffic endpoints.
