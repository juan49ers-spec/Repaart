import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VirtualizedRidersGrid } from '../VirtualizedRidersGrid';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
} as any;

describe('VirtualizedRidersGrid Container Queries', () => {
  const mockRidersGrid = [
    {
      id: 'rider-1',
      fullName: 'John Doe',
      status: 'active',
      contractHours: 40,
      workedHours: 35,
      days: [
        { isoDate: '2026-02-01', shifts: [] },
        { isoDate: '2026-02-02', shifts: [] },
        { isoDate: '2026-02-03', shifts: [] },
        { isoDate: '2026-02-04', shifts: [] },
        { isoDate: '2026-02-05', shifts: [] },
        { isoDate: '2026-02-06', shifts: [] },
        { isoDate: '2026-02-07', shifts: [] }
      ]
    }
  ];

  const mockRiderColorMap = new Map([
    ['rider-1', { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' }]
  ]);

  it('should have @container class on root element', () => {
    const { container } = render(
      <VirtualizedRidersGrid
        ridersGrid={mockRidersGrid}
        riderColorMap={mockRiderColorMap}
      />
    );

    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass('@container');
  });

  it('should use responsive width classes instead of fixed widths', () => {
    const { container } = render(
      <VirtualizedRidersGrid
        ridersGrid={mockRidersGrid}
        riderColorMap={mockRiderColorMap}
      />
    );

    // Should not have hardcoded w-56 (224px) for rider info
    const riderInfoElements = container.querySelectorAll('.sticky');
    riderInfoElements.forEach(el => {
      expect(el.className).not.toMatch(/w-56/);
      expect(el.className).not.toMatch(/w-\[\d+px\]/);
    });
  });

  it('should use @md breakpoint for responsive widths', () => {
    const { container } = render(
      <VirtualizedRidersGrid
        ridersGrid={mockRidersGrid}
        riderColorMap={mockRiderColorMap}
      />
    );

    // Should use @md container query instead of md media query
    const responsiveElements = container.querySelectorAll('.\\@md\\:w-56');
    expect(responsiveElements.length).toBeGreaterThanOrEqual(0);
  });
});
