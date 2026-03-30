## 2026-03-22 - [Disabled States on Async Forms]
**Learning:** During network-heavy authentication flows, the lack of visual feedback causes users to repeatedly click "Login" or "Guest". Without disabled states on `.neon-btn`, this not only creates a confusing UX but can accidentally trigger multiple requests if debouncing isn't handled. Additionally, some HTML templates contain duplicate closing buttons with conflicting scopes that cause accessibility and semantic errors.
**Action:** Always pair `loading-spinner` visibility with explicit `disabled` attributes on the triggering action buttons during async `fetch` calls. Utilize `finally` blocks to guarantee the re-enablement of buttons even if network requests fail or are manually mocked offline.

## 2026-03-30 - [Restoring Button Text on Async Form Failures]
**Learning:** While disabling buttons during network requests prevents multi-clicks, failing to restore their original text content (e.g. changing from "LOGGING IN..." back to "LOGIN TO PLAY") leaves the UI in an unrecoverable "stuck" visual state if the request fails, confusing users about whether the process is still ongoing.
**Action:** When updating button text content for async states, always re-assign the original text state in the `finally` block alongside re-enabling the button.
