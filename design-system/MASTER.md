# Antigravity Premium Design System (MASTER)

This document defines the "Source of Truth" for the Repaart Antigravity identity. All new components and refactors must adhere to these guidelines to ensure a premium, industrial-grade experience.

## 1. Aesthetic Direction: "Industrial Glassmorphic"

- **Keywords**: Precision, Transparency, Depth, Kinetic.
- **Atmosphere**: A high-density control center that feels alive through micro-movements and layered depth.

## 2. Global Tokens

### Typography

- **Primary Sans**: `Outfit` (Geometric, modern).
- **Secondary (UI)**: `-apple-system`, `SF Pro Text` (Native feel).
- **Pairing**: Use `font-bold tracking-tight` for headers and `tracking-normal` for body.

### Surfaces (The Glass Scale)

| Class | Use Case | Implementation |
| :--- | :--- | :--- |
| `.glass-premium-v2` | Primary Cards | 65% White / 45% Slate-900 with 32px blur. |
| `.glass-glow` | Featured / Active | Purple/Indigo glow with high blur. |
| `.luxury-shadow-md` | Floating Elements | Multi-layered shadow for true depth. |

## 3. Interaction Design (The Professional Touch)

- **Cursors**: `cursor-pointer` is MANDATORY for any element that changes state on click (Cards, Buttons, Toggles).
- **Transitions**: `duration-200 cubic-bezier(0.4, 0, 0.2, 1)` for all color and transform changes.
- **Haptics**: Use `.animate-haptic` for error states or failed interactions.
- **Loading**: Use `.shimmer` or skeleton loaders. Never leave a screen blank.

## 4. Performance Standards (Vercel Best Practices)

- **Parallelism**: Use `Promise.all()` for independent data fetching (e.g., fetching user data and service list simultaneously).
- **Listeners**: Favor persistent `onSnapshot` for high-frequency data, but ensure they are cleaned up.
- **Renders**: Memoize expensive computations and components that receive large arrays (like ticket lists).

## 5. Anti-Patterns

- [ ] No Emojis as primary icons (Lucide only).
- [ ] No scale transforms that shift layout (use `box-shadow` or `outline` instead).
- [ ] No "Magic Numbers" in inline styles (use CSS variables).
- [ ] No unbounded collection listeners (always add `limit()`).
