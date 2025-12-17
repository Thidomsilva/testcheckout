export type Transaction = {
  id: string;
  date: string;
  amount: number;
  method: 'pix' | 'card';
  status: 'completed' | 'pending' | 'failed';
};
