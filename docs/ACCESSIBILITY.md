# Accessibility

OpenVox Studio treats accessibility as a product requirement rather than a release-note checkbox.

## Implemented controls

- keyboard-visible focus indicators;
- skip-to-main-content link;
- focus transfer after client-side route changes;
- semantic headings and major landmarks;
- accessible labels for tested form controls;
- accessible names for icon-only buttons;
- responsive navigation usable by keyboard;
- reduced-motion preference;
- high-contrast preference;
- large-controls preference;
- light, dark and system themes;
- no audio-only requirement for core numeric feedback.

## Automated gate

The test suite runs axe-core across every public application route and blocks serious or critical automated accessibility violations.

Automated scanning does not prove complete conformance. Manual testing remains necessary.

## Manual checks before 1.0

- complete keyboard-only traversal on desktop;
- VoiceOver testing on Safari/iOS;
- NVDA or equivalent screen-reader testing on Windows;
- zoom to 200% and 400% on representative pages;
- landscape and portrait mobile layouts;
- high-contrast and reduced-motion settings;
- visible focus inside modals, file controls and mobile navigation;
- audio visualizations with equivalent textual metrics.

## Reporting accessibility issues

Accessibility defects should be reported as bugs and should include the assistive technology, browser, operating system and exact route/control involved.
