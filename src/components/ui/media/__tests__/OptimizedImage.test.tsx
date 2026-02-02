import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizedImage } from '../OptimizedImage';

describe('OptimizedImage', () => {
  it('should render image', () => {
    render(
      <OptimizedImage
        src="/photo.jpg"
        alt="Test photo"
        width={800}
        height={600}
      />
    );
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/photo.jpg');
    expect(img).toHaveAttribute('alt', 'Test photo');
  });

  it('should have lazy loading by default', () => {
    render(
      <OptimizedImage
        src="/photo.jpg"
        alt="Test photo"
      />
    );
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should support priority loading for LCP images', () => {
    render(
      <OptimizedImage
        src="/hero.jpg"
        alt="Hero"
        priority
      />
    );
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('should generate srcSet for responsive images', () => {
    render(
      <OptimizedImage
        src="/photo.jpg"
        alt="Test photo"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    );
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('srcset');
  });

  it('should have decoding attribute', () => {
    render(
      <OptimizedImage
        src="/photo.jpg"
        alt="Test photo"
      />
    );
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('decoding');
  });
});
