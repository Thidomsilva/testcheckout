import type { Transaction } from './types';

export const mockTransactions: Transaction[] = [
  {
    id: 'txn_1704124800000',
    date: '2024-07-01T12:00:00Z',
    amount: 150.75,
    method: 'card',
    status: 'completed',
  },
  {
    id: 'txn_1704211200000',
    date: '2024-07-02T14:30:00Z',
    amount: 75.0,
    method: 'pix',
    status: 'completed',
  },
  {
    id: 'txn_1704297600000',
    date: '2024-07-03T18:45:00Z',
    amount: 320.5,
    method: 'card',
    status: 'completed',
  },
  {
    id: 'txn_1704384000000',
    date: '2024-07-04T09:15:00Z',
    amount: 50.0,
    method: 'pix',
    status: 'pending',
  },
  {
    id: 'txn_1704470400000',
    date: '2024-07-05T21:00:00Z',
    amount: 99.99,
    method: 'card',
    status: 'failed',
  },
];
