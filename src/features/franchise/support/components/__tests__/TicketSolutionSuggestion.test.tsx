import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

vi.mock('../../../../../lib/gemini', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../lib/gemini')>();
  return {
    ...actual,
    suggestSupportSolution: vi.fn(),
  };
});

import { TicketSolutionSuggestion } from '../TicketSolutionSuggestion';
import { suggestSupportSolution } from '../../../../../lib/gemini';

vi.useFakeTimers();

describe('TicketSolutionSuggestion', () => {
  const onResolved = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('renders nothing when description is shorter than 20 chars', () => {
    const { container } = render(
      <TicketSolutionSuggestion subject="test" description="short" onResolved={onResolved} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(suggestSupportSolution).not.toHaveBeenCalled();
  });

  it('shows suggestion card when isSolvable is true', async () => {
    (suggestSupportSolution as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      suggestion: 'Reinicia el datáfono 10 segundos.',
      confidence: 85,
      isSolvable: true,
    });

    render(
      <TicketSolutionSuggestion
        subject="Datáfono no conecta"
        description="El datáfono no se conecta a la red y no funciona"
        onResolved={onResolved}
      />
    );

    await act(async () => { vi.advanceTimersByTime(1100); });
    await waitFor(() => {
      expect(screen.getByText('Reinicia el datáfono 10 segundos.')).toBeInTheDocument();
    });
  });

  it('renders nothing when isSolvable is false', async () => {
    (suggestSupportSolution as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      suggestion: '',
      confidence: 10,
      isSolvable: false,
    });

    const { container } = render(
      <TicketSolutionSuggestion
        subject="Consulta general"
        description="Tengo una pregunta sobre la facturación mensual"
        onResolved={onResolved}
      />
    );

    await act(async () => { vi.advanceTimersByTime(1100); });
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('renders nothing when API returns null', async () => {
    (suggestSupportSolution as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const { container } = render(
      <TicketSolutionSuggestion
        subject="Test"
        description="Esta descripcion tiene mas de veinte caracteres"
        onResolved={onResolved}
      />
    );
    await act(async () => { vi.advanceTimersByTime(1100); });
    await waitFor(() => { expect(container).toBeEmptyDOMElement(); });
  });

  it('calls onResolved when "Marcar como resuelto" is clicked', async () => {
    (suggestSupportSolution as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      suggestion: 'Reinicia la app.',
      confidence: 80,
      isSolvable: true,
    });

    render(
      <TicketSolutionSuggestion
        subject="App"
        description="La aplicacion del rider no carga los turnos correctamente"
        onResolved={onResolved}
      />
    );

    await act(async () => { vi.advanceTimersByTime(1100); });
    await waitFor(() => { screen.getByText('Reinicia la app.'); });

    screen.getByRole('button', { name: /resuelto/i }).click();
    expect(onResolved).toHaveBeenCalledOnce();
  });
});
