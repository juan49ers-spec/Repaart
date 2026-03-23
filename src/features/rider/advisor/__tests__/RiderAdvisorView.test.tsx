// src/features/rider/advisor/__tests__/RiderAdvisorView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../../lib/gemini', () => ({
  sendRiderMessage: vi.fn(),
}));

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'rider-1', displayName: 'Carlos López', franchiseId: 'f-1' },
  }),
}));

vi.mock('../../../../store/useRiderStore', () => ({
  useRiderStore: () => ({ myShifts: [] }),
}));

vi.mock('../../../support/SupportService', () => ({
  supportService: { createTicket: vi.fn().mockResolvedValue('ticket-1') },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Send: (props: Record<string, unknown>) => <svg data-testid="icon-send" {...props} />,
    Bot: (props: Record<string, unknown>) => <svg data-testid="icon-bot" {...props} />,
    Ticket: (props: Record<string, unknown>) => <svg data-testid="icon-ticket" {...props} />,
  };
});

import { RiderAdvisorView } from '../RiderAdvisorView';
import { sendRiderMessage } from '../../../../lib/gemini';
import { supportService } from '../../../support/SupportService';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('RiderAdvisorView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders greeting with rider first name', () => {
    render(<RiderAdvisorView />, { wrapper });
    expect(screen.getByText(/Carlos/)).toBeInTheDocument();
  });

  it('shows quick suggestion chips before first message', () => {
    render(<RiderAdvisorView />, { wrapper });
    expect(screen.getByText('¿Cuándo trabajo esta semana?')).toBeInTheDocument();
    expect(screen.getByText('¿Qué hago si tengo un accidente?')).toBeInTheDocument();
    expect(screen.getByText('Tengo un problema con la app')).toBeInTheDocument();
  });

  it('hides suggestions after first message is sent', async () => {
    (sendRiderMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      text: 'El lunes a las 20h.',
      suggestTicket: false,
      updatedHistory: [
        { role: 'user', parts: [{ text: '¿Cuándo trabajo esta semana?' }] },
        { role: 'model', parts: [{ text: 'El lunes a las 20h.' }] },
      ],
    });
    render(<RiderAdvisorView />, { wrapper });
    fireEvent.click(screen.getByText('¿Cuándo trabajo esta semana?'));
    await waitFor(() => {
      expect(screen.queryByText('¿Qué hago si tengo un accidente?')).not.toBeInTheDocument();
    });
  });

  it('shows AI response after sending a message via input', async () => {
    (sendRiderMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      text: 'El lunes a las 20h.',
      suggestTicket: false,
      updatedHistory: [],
    });
    render(<RiderAdvisorView />, { wrapper });
    const input = screen.getByPlaceholderText(/pregunta/i);
    fireEvent.change(input, { target: { value: '¿Cuándo trabajo?' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => {
      expect(screen.getByText('El lunes a las 20h.')).toBeInTheDocument();
    });
  });

  it('shows create ticket button when suggestTicket is true', async () => {
    (sendRiderMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      text: 'Parece un problema técnico.',
      suggestTicket: true,
      updatedHistory: [],
    });
    render(<RiderAdvisorView />, { wrapper });
    const input = screen.getByPlaceholderText(/pregunta/i);
    fireEvent.change(input, { target: { value: 'La app no abre' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ticket/i })).toBeInTheDocument();
    });
  });

  it('calls supportService.createTicket when ticket button clicked', async () => {
    (sendRiderMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      text: 'Parece un problema técnico.',
      suggestTicket: true,
      updatedHistory: [{ role: 'user', parts: [{ text: 'La app no abre' }] }],
    });
    render(<RiderAdvisorView />, { wrapper });
    const input = screen.getByPlaceholderText(/pregunta/i);
    fireEvent.change(input, { target: { value: 'La app no abre' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => screen.getByRole('button', { name: /ticket/i }));
    fireEvent.click(screen.getByRole('button', { name: /ticket/i }));
    await waitFor(() => {
      expect(supportService.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'rider-1', category: 'technical' })
      );
    });
  });
});
