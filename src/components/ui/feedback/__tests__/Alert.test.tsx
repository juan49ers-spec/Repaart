import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from '../Alert';

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
