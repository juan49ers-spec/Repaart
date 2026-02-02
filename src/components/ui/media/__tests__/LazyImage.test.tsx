import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LazyImage } from '../LazyImage';

describe('LazyImage', () => {
  it('should render image with src', () => {
    render(
      <LazyImage 
        src="/test-image.jpg" 
        alt="Test image"
      />
    );
    
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('src', '/test-image.jpg');
  });

  it('should have lazy loading attribute', () => {
    render(
      <LazyImage 
        src="/test-image.jpg" 
        alt="Test image"
      />
    );
    
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should render placeholder while loading', () => {
    render(
      <LazyImage 
        src="/test-image.jpg" 
        alt="Test image"
        placeholder="blur"
      />
    );
    
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LazyImage 
        src="/test-image.jpg" 
        alt="Test image"
        className="custom-class"
      />
    );
    
    // La clase se aplica al contenedor, no a la imagen
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle error state', async () => {
    render(
      <LazyImage 
        src="/invalid-image.jpg" 
        alt="Test image"
        fallbackSrc="/fallback.jpg"
      />
    );
    
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    // Simular error
    img.dispatchEvent(new Event('error'));
    
    // Esperar a que el componente actualice el estado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(img.src).toContain('/fallback.jpg');
  });
});
