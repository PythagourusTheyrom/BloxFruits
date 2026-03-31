## 2026-03-22 - [Disabled States on Async Forms]
**Learning:** During network-heavy authentication flows, the lack of visual feedback causes users to repeatedly click "Login" or "Guest". Without disabled states on `.neon-btn`, this not only creates a confusing UX but can accidentally trigger multiple requests if debouncing isn't handled. Additionally, some HTML templates contain duplicate closing buttons with conflicting scopes that cause accessibility and semantic errors.
**Action:** Always pair `loading-spinner` visibility with explicit `disabled` attributes on the triggering action buttons during async `fetch` calls. Utilize `finally` blocks to guarantee the re-enablement of buttons even if network requests fail or are manually mocked offline.

## 2026-03-31 - Add keyboard accessibility to interactive cards
**Learning:** The application extensively uses `div` elements with `onclick` handlers for main interactive components (e.g., team cards, dashboard actions, server items, shop items, hotbar slots). This creates an accessibility blocker as they lack keyboard focus and keyboard activation support.
**Action:** Add `role="button"` and `tabindex="0"` to make them focusable, and attach a `keydown` listener (checking for 'Enter' or ' ') to trigger a `.click()` event to polyfill button behavior.
