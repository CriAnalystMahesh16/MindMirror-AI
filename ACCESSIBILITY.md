# MindMirror AI — Accessibility Architecture (WCAG 2.1 Compliance)

This document describes the high-accessibility layouts, keyboard support, and screen-reader integrations created to achieve WCAG AA compliance.

---

## ♿ Deployed Accessibility Features

### 1. Semantic DOM Landmark Structure
The system is built on modern semantic boundaries to optimize screen reader navigation:
- `<header>`: High navigation branding, global reset, and exam context indicators.
- `<main>`: Main layout grid wrapper.
- `<section>`: Focus group layouts separating the daily check-in form and the AI Emotional Twin Report.
- `<footer>`: Meta-information and secure regulatory guidelines.

### 2. Standard Label and Input Binding
- Every form slider, custom exam text box, and reflecting text area is tightly bound to `<label>` elements via the `htmlFor` property matching the corresponding input `id`.
- This ensures any focus triggers correctly vocalize the prompt to screen-reader users.

### 3. Clear ARIA Descriptions (`aria-label`)
- Add descriptive `aria-label` tags for range slider components to clarify scale steps (e.g., "General mental mood range selector", "Study hours range slider", "Sleep hours range slider").
- Explicitly set `aria-pressed` values on candidate exam selection buttons so active selection states are recognized.

### 4. Interactive Live Updates (`aria-live="polite"`)
- The AI results container `/src/components/ReportDashboard.tsx` is configured with `aria-live="polite"`.
- When a student registers their check-in and the Gemini model returns a new well-being analysis, the synthesized results are vocalized to the user automatically.

### 5. Invisible Screen Reader Summary (`sr-only`)
- Added a screen-reader-only accessible block summarizing the calculated well-being indicators, burnout percentages, and triggers. This serves as an immediate verbal brief for visually impaired students.

### 6. Visible Focus States
- Interactive form modules include high-contrast Indigo rings (`focus:ring-2 focus:ring-indigo-900`) for visual keyboard path outlines.
