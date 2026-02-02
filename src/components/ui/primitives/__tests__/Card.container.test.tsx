import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ResponsiveCard } from '../Card';

describe('ResponsiveCard Container Queries', () => {
  it('should have @container class on root element', () => {
    const { container } = render(
      <ResponsiveCard>Test Content</ResponsiveCard>
    );

    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass('@container');
  });

  it('should use fluid padding that adapts to container size', () => {
    const { container } = render(
      <ResponsiveCard>Test Content</ResponsiveCard>
    );

    const rootElement = container.firstChild as HTMLElement;
    // Should have responsive padding classes
    expect(rootElement.className).toMatch(/@xs:p-3|@sm:p-4|@md:p-6|p-4/);
  });

  it('should not have hardcoded max-width', () => {
    const { container } = render(
      <ResponsiveCard>Test Content</ResponsiveCard>
    );

    const rootElement = container.firstChild as HTMLElement;
    // Should not have max-w-screen-xl or similar hardcoded widths
    expect(rootElement.className).not.toMatch(/max-w-screen-(xl|2xl|lg)/);
  });

  it('should support noPadding prop', () => {
    const { container } = render(
      <ResponsiveCard noPadding>Test Content</ResponsiveCard>
    );

    const contentDiv = container.querySelector('.relative.z-10');
    // When noPadding is true, the inner content should not have padding
    expect(contentDiv?.parentElement?.className).not.toContain('p-6');
  });

  it('should handle onClick callback', () => {
    const handleClick = () => {};
    const { container } = render(
      <ResponsiveCard onClick={handleClick}>Test Content</ResponsiveCard>
    );

    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass('cursor-pointer');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ResponsiveCard className="custom-class">Test Content</ResponsiveCard>
    );

    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass('custom-class');
  });
});
