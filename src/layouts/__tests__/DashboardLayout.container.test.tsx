import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';

// Mock the dependencies
vi.mock('../../store/useAppStore', () => ({
  useAppStore: () => ({
    isChatOpen: false,
    toggleChat: vi.fn()
  })
}));

vi.mock('../../components/ImpersonationBanner', () => ({
  default: () => <div data-testid="impersonation-banner">Banner</div>
}));

vi.mock('../components/Header', () => ({
  default: () => <header data-testid="header">Header</header>
}));

vi.mock('../components/BottomTabBar', () => ({
  default: () => <nav data-testid="bottom-tab-bar">TabBar</nav>
}));

vi.mock('../components/ChatAssistant', () => ({
  default: () => <div data-testid="chat-assistant">Chat</div>
}));

vi.mock('../../components/ui/modals/PageHelpModal', () => ({
  default: () => <div data-testid="page-help-modal">Help</div>
}));

vi.mock('../../components/ui/CommandPalette', () => ({
  default: () => <div data-testid="command-palette">Command</div>
}));

describe('DashboardLayout Container Queries', () => {
  const defaultProps = {
    isAdmin: true,
    isFranchise: false,
    onExport: vi.fn()
  };

  it('should have @container class on main element', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardLayout {...defaultProps}>
          <div data-testid="content">Test Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('@container');
  });

  it('should not have hardcoded max-width classes', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardLayout {...defaultProps}>
          <div data-testid="content">Test Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const mainElement = container.querySelector('main');
    const contentWrapper = mainElement?.querySelector('.content-wrapper');
    
    // Should not have hardcoded max-width like max-w-[1920px]
    expect(contentWrapper?.className).not.toMatch(/max-w-\[\d+px\]/);
  });

  it('should have responsive padding classes', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardLayout {...defaultProps}>
          <div data-testid="content">Test Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const mainElement = container.querySelector('main');
    const contentWrapper = mainElement?.querySelector('.content-wrapper');
    
    // Should have responsive padding (py-2 md:pt-4 md:pb-8)
    expect(contentWrapper).toHaveClass('py-2');
    expect(contentWrapper).toHaveClass('md:pt-4');
    expect(contentWrapper).toHaveClass('md:pb-8');
  });

  it('should render children content correctly', () => {
    render(
      <MemoryRouter>
        <DashboardLayout {...defaultProps}>
          <div data-testid="content">Test Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('content')).toHaveTextContent('Test Content');
  });

  it('should render all layout components', () => {
    render(
      <MemoryRouter>
        <DashboardLayout {...defaultProps}>
          <div>Content</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('impersonation-banner')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-tab-bar')).toBeInTheDocument();
    expect(screen.getByTestId('chat-assistant')).toBeInTheDocument();
    expect(screen.getByTestId('command-palette')).toBeInTheDocument();
  });
});
