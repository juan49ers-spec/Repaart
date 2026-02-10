import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertTriangle: (props: any) => <div data-testid="alert-triangle-icon" {...props} />,
  RefreshCw: (props: any) => <div data-testid="refresh-icon" {...props} />,
}));

// Componente que lanza error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="success-content">Success</div>;
};

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Silenciar errores de consola durante tests
    console.error = vi.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
  });

  it('should render fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const handleError = vi.fn();
    
    render(
      <ErrorBoundary onError={handleError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(handleError).toHaveBeenCalled();
    expect(handleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should render custom fallback when provided', () => {
    const CustomFallback = () => (
      <div data-testid="custom-fallback">Custom Error UI</div>
    );

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('Custom Error UI');
  });

  it('should have reset button in default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Intentar de nuevo')).toBeInTheDocument();
  });
});
