import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from '../FormInput';

describe('FormInput', () => {
  it('should render input with label', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        type="email"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        error="Email inválido"
      />
    );

    expect(screen.getByText('Email inválido')).toBeInTheDocument();
  });

  it('should call onChange when value changes', () => {
    const handleChange = vi.fn();
    render(
      <FormInput
        label="Email"
        name="email"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        disabled
      />
    );

    expect(screen.getByLabelText('Email')).toBeDisabled();
  });

  it('should show required indicator', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
