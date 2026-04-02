## 2024-05-18 - Added ARIA labels to form inputs with only placeholders
**Learning:** Found an accessibility issue pattern where inputs used for authentication (username, password), lobby connection, and admin commands only rely on `placeholder` attributes for context, making them difficult for screen readers. Using `aria-label`s on elements like `X` close buttons and custom `input` groups provides a non-intrusive way to ensure complete accessibility without altering visual design.
**Action:** In custom input groups relying on icons or placeholder text, ensure `aria-label` attributes are consistently applied.

## 2024-05-19 - Fixed unstyled and redundant close buttons
**Learning:** Discovered an issue pattern where `close-btn` elements had undefined CSS classes, leading them to use unstyled browser defaults that lacked focus indicators and visual coherence with the design system. Furthermore, multiple "X" buttons were rendered redundantly for the same actions. Reusing existing generic classes like `.neon-btn.secondary` fixes both accessibility (adding hover and focus states) and visual harmony.
**Action:** Avoid adding new specific CSS classes for small buttons. Instead, utilize existing utility classes and ensure elements aren't duplicated unnecessarily.

## 2024-03-24 - [Action Slot Keybindings and Accessibility]
**Learning:** Players often forget or miss hotbar and skill bindings when they are only implicitly taught or absent from tooltips. Additionally, using non-semantic `<div>` elements for these interactable action slots hurts keyboard accessibility and screen reader support.
**Action:** When designing action bars (hotbars/skills), always use semantic `<button>` elements, provide explicit `aria-label`s, and inject the exact keyboard shortcut directly into the `title` tooltip so players can naturally discover them through interaction.
