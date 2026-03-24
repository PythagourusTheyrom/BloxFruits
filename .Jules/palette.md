## 2026-03-24 - Prevent Duplicate Submissions via Loading States
**Learning:** Found that the app lacked loading and disabled states for critical asynchronous actions like login and registration, which can lead to multiple form submissions, poor UX, and confusion. Providing visual feedback (e.g. "LOGGING IN...") and disabling the button improves accessibility by clearly conveying state changes to all users.
**Action:** Always verify asynchronous UI components have explicit disabled/loading states and visual cues when performing network requests.
