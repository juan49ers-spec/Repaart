import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsiveModal } from '../ResponsiveModal';

describe('ResponsiveModal Container Queries', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Modal Title',
    children: <div data-testid="modal-content">Modal Content</div>
  };

  it('should have @container class on modal wrapper', () => {
    const { container } = render(
      <ResponsiveModal {...defaultProps} />
    );

    const modalWrapper = container.querySelector('.responsive-modal-wrapper');
    expect(modalWrapper).toHaveClass('@container');
  });

  it('should use responsive max-width classes', () => {
    const { container } = render(
      <ResponsiveModal {...defaultProps} />
    );

    const modalContent = container.querySelector('.responsive-modal-content');
    // Should not have hardcoded max-w-2xl
    expect(modalContent?.className).not.toMatch(/max-w-\d+xl/);
    // Should have responsive width classes
    expect(modalContent?.className).toMatch(/@xs:max-w-sm|@sm:max-w-md|@md:max-w-lg|@lg:max-w-xl/);
  });

  it('should use fluid padding', () => {
    const { container } = render(
      <ResponsiveModal {...defaultProps} />
    );

    const modalContent = container.querySelector('.responsive-modal-content');
    // Should have responsive padding
    expect(modalContent?.className).toMatch(/p-4|@xs:p-5|@sm:p-6|@md:p-8/);
  });

  it('should render title with fluid typography', () => {
    render(
      <ResponsiveModal {...defaultProps} />
    );

    const title = screen.getByText('Modal Title');
    expect(title).toHaveClass('text-fluid-xl');
  });

  it('should have safe area padding', () => {
    const { container } = render(
      <ResponsiveModal {...defaultProps} />
    );

    const modalWrapper = container.querySelector('.responsive-modal-wrapper');
    expect(modalWrapper).toHaveClass('p-safe');
  });

  it('should render children content', () => {
    render(
      <ResponsiveModal {...defaultProps} />
    );

    expect(screen.getByTestId('modal-content')).toHaveTextContent('Modal Content');
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <ResponsiveModal {...defaultProps} isOpen={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should call onClose when clicking overlay', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <ResponsiveModal {...defaultProps} onClose={handleClose} />
    );

    const overlay = container.querySelector('.responsive-modal-overlay');
    overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    expect(handleClose).toHaveBeenCalled();
  });

  it('should have touch-friendly close button', () => {
    const { container } = render(
      <ResponsiveModal {...defaultProps} />
    );

    const closeButton = container.querySelector('button[title="Cerrar"]');
    expect(closeButton).toHaveClass('min-h-touch');
    expect(closeButton).toHaveClass('min-w-touch');
  });
});
