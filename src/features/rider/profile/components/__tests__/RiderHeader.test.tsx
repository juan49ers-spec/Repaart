import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RiderHeader from '../RiderHeader';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  User: (props: any) => <div data-testid="user-icon" {...props} />,
  Settings: (props: any) => <div data-testid="settings-icon" {...props} />,
  Edit3: (props: any) => <div data-testid="edit-icon" {...props} />,
}));

describe('RiderHeader', () => {
    const defaultProps = {
        displayName: 'John Doe',
        photoURL: 'https://example.com/avatar.jpg',
        role: 'rider',
        onEditProfile: vi.fn(),
        onSettings: vi.fn(),
    };

    it('renders user display name', () => {
        render(<RiderHeader {...defaultProps} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders role badge', () => {
        render(<RiderHeader {...defaultProps} />);
        expect(screen.getByText('PROFESIONAL LOGÍSTICA')).toBeInTheDocument();
    });

    it('renders avatar with photoURL', () => {
        render(<RiderHeader {...defaultProps} />);
        const avatar = screen.getByRole('img', { name: 'John Doe' });
        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders default avatar when photoURL is not provided', () => {
        render(<RiderHeader {...defaultProps} photoURL={undefined} />);
        const avatar = screen.queryByRole('img');
        expect(avatar).not.toBeInTheDocument();
    });

    it('calls onEditProfile when edit button is clicked', () => {
        const onEditProfile = vi.fn();
        render(<RiderHeader {...defaultProps} onEditProfile={onEditProfile} />);
        const editButton = screen.getByLabelText('Editar perfil');
        editButton.click();
        expect(onEditProfile).toHaveBeenCalledTimes(1);
    });

    it('calls onSettings when settings button is clicked', () => {
        const onSettings = vi.fn();
        render(<RiderHeader {...defaultProps} onSettings={onSettings} />);
        const settingsButton = screen.getByLabelText('Configuración');
        settingsButton.click();
        expect(onSettings).toHaveBeenCalledTimes(1);
    });

    it('renders online status indicator', () => {
        render(<RiderHeader {...defaultProps} />);
        const statusIndicator = document.querySelector('.animate-pulse');
        expect(statusIndicator).toBeInTheDocument();
    });
});