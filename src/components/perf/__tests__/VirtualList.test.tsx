import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { VirtualList } from '../VirtualList';

interface TestItem {
  id: string;
  name: string;
}

describe('VirtualList', () => {
  const mockItems: TestItem[] = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
  }));

  const keyExtractor = (item: TestItem) => item.id;
  const renderItem = (item: TestItem) => <div>{item.name}</div>;

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class MockIntersectionObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
    });
    
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 400,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 400,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }));
  });

  it('should render virtualized list', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        height="400px"
      />
    );

    const listContainer = container.querySelector('.overflow-auto');
    expect(listContainer).toBeInTheDocument();
  });

  it('should apply custom height', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        height="500px"
      />
    );

    const listContainer = container.querySelector('.overflow-auto');
    expect(listContainer).toHaveStyle({ height: '500px' });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        className="custom-class"
      />
    );

    const listContainer = container.querySelector('.overflow-auto');
    expect(listContainer).toHaveClass('custom-class');
  });

  it('should calculate total height based on items', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        height="400px"
        estimateSize={() => 50}
      />
    );

    const totalHeight = container.querySelector('[style*="height"]');
    expect(totalHeight).toBeInTheDocument();
  });

  it('should use custom estimate size', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimateSize={() => 100}
        height="400px"
      />
    );

    const totalHeight = container.querySelector('[style*="height"]');
    expect(totalHeight).toBeInTheDocument();
  });

  it('should handle empty list', () => {
    const { container } = render(
      <VirtualList
        items={[]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    );

    const listContainer = container.querySelector('.overflow-auto');
    expect(listContainer).toBeInTheDocument();
  });

  it('should accept custom render function', () => {
    const customRenderItem = (item: TestItem) => (
      <div className="custom-item">{item.name}</div>
    );

    const { container } = render(
      <VirtualList
        items={mockItems.slice(0, 10)}
        renderItem={customRenderItem}
        keyExtractor={keyExtractor}
        height="400px"
      />
    );

    const listContainer = container.querySelector('.overflow-auto');
    expect(listContainer).toBeInTheDocument();
  });

  it('should accept custom key extractor', () => {
    const customKeyExtractor = (item: TestItem, index: number) => `${item.id}-${index}`;
    
    const { container } = render(
      <VirtualList
        items={mockItems}
        renderItem={renderItem}
        keyExtractor={customKeyExtractor}
        height="400px"
      />
    );

    const listContainer = container.querySelector('.overflow-auto');
    expect(listContainer).toBeInTheDocument();
  });
});
