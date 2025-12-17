import { CreditCard, QrCode, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockTransactions } from '@/lib/mock-data';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const paymentMethodDetails = {
  pix: { name: 'Pix', icon: <QrCode className="h-5 w-5 text-muted-foreground" /> },
  card: { name: 'Cartão', icon: <CreditCard className="h-5 w-5 text-muted-foreground" /> },
};

const statusDetails: { [key in Transaction['status']]: { name: string; icon: JSX.Element; className: string } } = {
  completed: { name: 'Concluído', icon: <CheckCircle className="h-4 w-4" />, className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800' },
  pending: { name: 'Pendente', icon: <Clock className="h-4 w-4" />, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' },
  failed: { name: 'Falhou', icon: <XCircle className="h-4 w-4" />, className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800' },
};


function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { id, date, amount, method, status } = transaction;

  const methodInfo = paymentMethodDetails[method];
  const statusInfo = statusDetails[status];
  
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
   const formattedTime = new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <li className="flex items-center justify-between py-4">
      <div className="flex items-start gap-4">
        <div className="p-3 mt-1 rounded-full bg-muted/50 border">
            {methodInfo.icon}
        </div>
        <div>
          <p className="font-semibold text-foreground">{formattedAmount}</p>
          <p className="text-sm text-muted-foreground">{methodInfo.name} • {formattedDate} às {formattedTime}</p>
        </div>
      </div>
      <Badge variant="outline" className={cn('gap-1.5', statusInfo.className)}>
        {statusInfo.icon}
        {statusInfo.name}
      </Badge>
    </li>
  );
}

export default function HistoryPage() {
  const sortedTransactions = [...mockTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Histórico de Transações</CardTitle>
          <CardDescription>Veja aqui todos os seus pagamentos.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTransactions.length > 0 ? (
            <ul className="space-y-0">
              {sortedTransactions.map((tx, index) => (
                <div key={tx.id}>
                  <TransactionItem transaction={tx} />
                  {index < sortedTransactions.length - 1 && <Separator />}
                </div>
              ))}
            </ul>
          ) : (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="font-medium">Nenhuma transação encontrada.</p>
              <p className="text-sm">Seus pagamentos aparecerão aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
