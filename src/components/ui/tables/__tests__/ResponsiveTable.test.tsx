import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsiveTable } from '../ResponsiveTable';

describe('ResponsiveTable Container Queries', () => {
  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' }
  ];

  const mockColumns = [
    { key: 'name', title: 'Name', responsive: { '@xs': false, '@sm': true } },
    { key: 'email', title: 'Email', responsive: { '@xs': false, '@sm': true } },
    { key: 'role', title: 'Role', responsive: { '@xs': true, '@sm': true } }
  ];

  it('should have @container class on table wrapper', () => {
    const { container } = render(
      <ResponsiveTable data={mockData} columns={mockColumns} />
    );

    const tableWrapper = container.querySelector('.responsive-table-wrapper');
    expect(tableWrapper).toHaveClass('@container');
  });

  it('should have horizontal scroll on mobile', () => {
    const { container } = render(
      <ResponsiveTable data={mockData} columns={mockColumns} />
    );

    const tableWrapper = container.querySelector('.responsive-table-wrapper');
    expect(tableWrapper).toHaveClass('overflow-x-auto');
  });

  it('should render all data rows', () => {
    render(
      <ResponsiveTable data={mockData} columns={mockColumns} />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(
      <ResponsiveTable data={mockData} columns={mockColumns} />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('should have table headers', () => {
    const columnsWithoutResponsive = [
      { key: 'name', title: 'Name' },
      { key: 'email', title: 'Email' },
      { key: 'role', title: 'Role' }
    ];
    
    const { container } = render(
      <ResponsiveTable data={mockData} columns={columnsWithoutResponsive} />
    );

    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(3);
    expect(headers[0]).toHaveTextContent('Name');
    expect(headers[1]).toHaveTextContent('Email');
    expect(headers[2]).toHaveTextContent('Role');
  });

  it('should have responsive cell padding', () => {
    const { container } = render(
      <ResponsiveTable data={mockData} columns={mockColumns} />
    );

    const cells = container.querySelectorAll('td');
    cells.forEach(cell => {
      expect(cell.className).toMatch(/px-2|px-3|px-4|@xs:px-2|@sm:px-3|@md:px-4/);
    });
  });

  it('should render empty state when no data', () => {
    render(
      <ResponsiveTable data={[]} columns={mockColumns} emptyText="No data available" />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should support striped rows', () => {
    const { container } = render(
      <ResponsiveTable data={mockData} columns={mockColumns} striped />
    );

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('should support hover effect on rows', () => {
    const { container } = render(
      <ResponsiveTable data={mockData} columns={mockColumns} hover />
    );

    const rows = container.querySelectorAll('tbody tr');
    rows.forEach(row => {
      expect(row.className).toMatch(/hover:/);
    });
  });
});
