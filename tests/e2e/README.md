# Responsive Design Testing with Playwright

This directory contains end-to-end tests for verifying responsive design across different devices and screen sizes.

## Prerequisites

Install Playwright:
```bash
npm install -D @playwright/test
```

Install browsers:
```bash
npx playwright install
```

## Running Tests

Run all tests:
```bash
npm run test:e2e
```

Run tests in headed mode (with browser UI):
```bash
npx playwright test --ui
```

Run tests for specific device:
```bash
npx playwright test --project="Mobile Chrome"
```

Run tests in debug mode:
```bash
npx playwright test --debug
```

## Test Coverage

### Dashboard Layout
- ✅ Mobile (375x667) - Stacked layout, bottom navigation
- ✅ Tablet (768x1024) - 2-column grid, adapted spacing
- ✅ Desktop (1920x1080) - Full layout, max-width containers

### Scheduler
- ✅ Grid columns adapt to screen size
- ✅ Text overflow handling
- ✅ Modal responsiveness
- ✅ Rider info column adaptation
- ✅ Shift pills minimum width

### Performance
- ✅ Load time on mobile (< 3s)
- ✅ Load time on desktop (< 2s)

## Device Viewports Tested

- Mobile: iPhone 12 (390x844), Pixel 5 (393x851)
- Tablet: iPad Pro (1024x1366)
- Desktop: Chrome (1920x1080), Firefox (1920x1080), Safari (1920x1080)

## Adding New Tests

1. Create a new test file in `tests/e2e/`
2. Import `test` and `expect` from `@playwright/test`
3. Use `test.describe()` to group related tests
4. Set viewport size with `page.setViewportSize()`
5. Verify layout with Playwright locators

Example:
```typescript
test('should handle custom screen size', async ({ page }) => {
  await page.setViewportSize({ width: 500, height: 800 });
  // Your test assertions
});
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Daily schedule

## Troubleshooting

### Tests failing with timeout
- Increase timeout in `playwright.config.ts`
- Check network conditions
- Verify server is running on correct port

### Flaky tests
- Add retries in `playwright.config.ts`
- Use `waitForLoadState('networkidle')` for better timing
- Add proper assertions and waits

### Browser not found
- Run `npx playwright install` to install browsers
- Check Playwright version compatibility

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Responsive Design Best Practices](https://web.dev/responsive-web-design-basics/)
- [Testing Library](https://testing-library.com/)
