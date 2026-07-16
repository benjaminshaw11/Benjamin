import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

jest.mock('../../lib/authClient', () => ({
  apiFetch: jest.fn(),
  connectSocket: jest.fn().mockReturnValue({ on: jest.fn(), disconnect: jest.fn() }),
}));
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ token: 'fake-token' }) }));

import { apiFetch } from '../../lib/authClient';
import AdminDeposits from '../AdminDeposits';

describe('AdminDeposits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows empty state when no rows', async () => {
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ rows: [], total: 0 }) });
    render(<AdminDeposits />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('No pending manual deposits found.'));
  });

  test('approve flow removes row and shows toast', async () => {
    const row = { id: 'tx_1', user_email: 'user@example.com', provider_payment_id: 'prov_1', amount: 5000, currency: 'USD', created_at: new Date().toISOString() };
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ rows: [row], total: 1 }) });
    // subsequent approve call
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    render(<AdminDeposits />);

    // wait for row to appear
    await waitFor(() => expect(screen.getByText('tx_1')).toBeInTheDocument());

    // click approve
    const approveBtn = screen.getByRole('button', { name: /Approve tx_1/i });
    act(() => { fireEvent.click(approveBtn); });

    // modal should show
    const approveDialog = await screen.findByRole('dialog');
    expect(approveDialog).toBeInTheDocument();

    const approveConfirm = screen.getByRole('button', { name: 'Approve' });
    act(() => { fireEvent.click(approveConfirm); });

    // wait for toast
    await waitFor(() => expect(screen.getByText(/approved and wallet credited/i)).toBeInTheDocument());

    // row removed
    expect(screen.queryByText('tx_1')).not.toBeInTheDocument();
  });
});
