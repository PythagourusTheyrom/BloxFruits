## 2026-03-22 - [Disabled States on Async Forms]
**Learning:** During network-heavy authentication flows, the lack of visual feedback causes users to repeatedly click "Login" or "Guest". Without disabled states on `.neon-btn`, this not only creates a confusing UX but can accidentally trigger multiple requests if debouncing isn't handled. Additionally, some HTML templates contain duplicate closing buttons with conflicting scopes that cause accessibility and semantic errors.
**Action:** Always pair `loading-spinner` visibility with explicit `disabled` attributes on the triggering action buttons during async `fetch` calls. Utilize `finally` blocks to guarantee the re-enablement of buttons even if network requests fail or are manually mocked offline.
## 2026-04-05 - [Action UI Slots Accessibility]
**Learning:** For action UI slots like hotbars or skills, using semantic `<button>` elements with explicit `aria-label`s and `title` attributes (e.g., indicating the keyboard shortcut) significantly enhances accessibility and natural discoverability.
**Action:** Use `<button>` elements with `aria-label` and `title` for action UI slots.
