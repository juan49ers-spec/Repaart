# Accessibility Guide (WCAG 2.1 AA Compliance)

This guide outlines accessibility standards and best practices for the Repaart platform.

## WCAG 2.1 AA Principles

### 1. Perceivable

**Alt Text**
- All images must have descriptive alt text
- Use empty alt (`alt=""`) for decorative images
- Describe the function, not just the appearance

```tsx
// ✅ Good
<img src="user-avatar.jpg" alt="Juan Pérez's profile picture" />

// ✅ Good (decorative)
<img src="decoration.png" alt="" />

// ❌ Bad
<img src="user-avatar.jpg" />
```

**Color and Contrast**
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Don't use color as the only way to convey information
- Test with tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 2. Operable

**Keyboard Navigation**
- All interactive elements must be keyboard accessible
- Provide visible focus indicators
- No keyboard traps

```tsx
// ✅ Good - Visible focus
<button className="focus:ring-2 focus:ring-blue-500">Submit</button>

// ❌ Bad - No focus indicator
<button>Submit</button>
```

**Focus Management**
- Move focus to modal when opened
- Return focus to trigger when modal closed
- Use `SkipLink` component for keyboard users

### 3. Understandable

**Labels**
- All form inputs must have associated labels
- Use `htmlFor` to associate labels with inputs

```tsx
// ✅ Good
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ❌ Bad
<input type="email" placeholder="Email" />
```

**Error Messages**
- Provide clear error messages
- Associate errors with form fields
- Use `aria-live` regions for dynamic content

```tsx
// ✅ Good
<div role="alert" aria-live="polite">
  Please enter a valid email address
</div>
```

### 4. Robust

**Semantic HTML**
- Use proper HTML elements
- Use headings in logical order (h1 → h2 → h3)
- Use landmarks (`<nav>`, `<main>`, `<aside>`, `<footer>`)

```tsx
// ✅ Good
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// ❌ Bad
<div class="navigation">
  <div class="link">Home</div>
</div>
```

**ARIA Attributes**
- Use ARIA only when HTML can't provide the necessary semantics
- Don't use ARIA to replace semantic HTML

```tsx
// ✅ Good (use native HTML when possible)
<button aria-expanded={isOpen}>Menu</button>

// ✅ Good (ARIA when necessary)
<div role="tablist" aria-label="Settings tabs">
  <button role="tab">Profile</button>
  <button role="tab">Security</button>
</div>
```

## Component-Specific Guidelines

### Buttons
- Must have accessible text or aria-label
- Focus visible indicator required
- Provide visual feedback on hover/focus

### Modals
- Trap focus within modal
- Close with ESC key
- Announce to screen readers
- Return focus to trigger when closed

### Forms
- All inputs must have labels
- Provide clear error messages
- Use autocomplete attributes when appropriate
- Validate on submit, not on every keystroke

### Tables
- Use `<caption>` for table description
- Use `<thead>`, `<tbody>`, `<tfoot>`
- Use `scope` attributes for header cells

```tsx
// ✅ Good
<table>
  <caption>Monthly expenses</caption>
  <thead>
    <tr>
      <th scope="col">Category</th>
      <th scope="col">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Food</td>
      <td>$500</td>
    </tr>
  </tbody>
</table>
```

## Testing Checklist

- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Forms have associated labels
- [ ] Error messages are clear and associated with inputs
- [ ] Heading hierarchy is logical
- [ ] Landmarks are used appropriately
- [ ] ARIA attributes are used correctly
- [ ] Dynamic content is announced to screen readers

## Tools

### Automated Testing
- **axe-core**: Integrated in `AccessibilityChecker` component
- **Lighthouse**: Built into Chrome DevTools
- **WAVE**: https://wave.webaim.org/

### Manual Testing
- Keyboard navigation test
- Screen reader test (NVDA, JAWS, VoiceOver)
- High contrast mode test
- Zoom test (up to 200%)

## Common Issues and Solutions

### Issue: No keyboard focus
**Solution**: Add `tabindex` or ensure element is focusable

### Issue: Low contrast
**Solution**: Adjust colors to meet 4.5:1 ratio

### Issue: Missing labels
**Solution**: Use `<label>` or `aria-label`/`aria-labelledby`

### Issue: Focus trap in modals
**Solution**: Use `useFocusTrap` hook

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM Resources](https://webaim.org/)
