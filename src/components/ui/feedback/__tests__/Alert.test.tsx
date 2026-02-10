import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from '../Alert';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: (props: any) => <div data-testid="x-icon" {...props} />,
  Info: (props: any) => <div data-testid="info-icon" {...props} />,
  CheckCircle: (props: any) => <div data-testid="check-icon" {...props} />,
  AlertTriangle: (props: any) => <div data-testid="alert-triangle-icon" {...props} />,
  AlertCircle: (props: any) => <div data-testid="alert-circle-icon" {...props} />,
}));

describe('Alert', () => {
  it('should render alert with message', () => {
    render(
      <Alert type="info" message="Test message" />
    );
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should have different types', () => {
    const { rerender } = render(
      <Alert type="success" message="Success" />
    );
    expect(screen.getByRole('alert')).toHaveClass('bg-emerald-50');

    rerender(<Alert type="error" message="Error" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-rose-50');

    rerender(<Alert type="warning" message="Warning" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-amber-50');
  });

  it('should call onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(
      <Alert type="info" message="Test" onClose={handleClose} />
    );

    const closeButton = screen.getByLabelText('Cerrar');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalled();
  });

  it('should be accessible', () => {
    render(<Alert type="info" message="Test" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
