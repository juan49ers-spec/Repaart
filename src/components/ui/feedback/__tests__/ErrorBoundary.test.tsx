import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock captureException del errorLogger
vi.mock('../../../../services/errorLogger', () => ({
  captureException: vi.fn(),
}));

// Mock iconos de Lucide
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    AlertTriangle: ({ ...props }: React.SVGProps<SVGSVGElement>) => <svg data-testid="alert-icon" {...props} />,
    RefreshCw: ({ ...props }: React.SVGProps<SVGSVGElement>) => <svg data-testid="refresh-icon" {...props} />,
  };
});

// Componente que lanza error intencionalmente
const Bomba = () => {
  throw new Error('Error de prueba controlado');
};

describe('ErrorBoundary (ui/feedback)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra fallback UI cuando un hijo lanza un error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Bomba />
      </ErrorBoundary>
    );

    expect(getByText('Módulo no disponible')).toBeInTheDocument();
  });

  it('llama captureException cuando un hijo lanza un error', async () => {
    const { captureException } = await import('../../../../services/errorLogger');

    render(
      <ErrorBoundary>
        <Bomba />
      </ErrorBoundary>
    );

    expect(captureException).toHaveBeenCalledOnce();
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: expect.any(Object) })
    );
  });
});
