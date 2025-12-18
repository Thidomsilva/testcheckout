'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, CreditCard, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function ConfirmationDetails() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount');
  const method = searchParams.get('method');
  const transactionId = searchParams.get('transactionId');

  const amountNumber = Number(amount);
  const formattedAmount = isNaN(amountNumber)
    ? 'R$ 0,00'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountNumber);

  const paymentMethodDetails = {
    pix: { name: 'Pix', icon: <QrCode className="h-5 w-5" /> },
    card: { name: 'Cartão de Crédito', icon: <CreditCard className="h-5 w-5" /> },
  };
  
  const paymentMethodInfo = paymentMethodDetails[method as keyof typeof paymentMethodDetails] || { name: 'Desconhecido', icon: null };

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.14)-1px)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader className="items-center">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-headline">Pagamento Aprovado!</CardTitle>
          <CardDescription>Sua transação foi concluída com sucesso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-4xl font-bold text-foreground">{formattedAmount}</div>
          <Separator />
          <div className="space-y-2 text-left text-sm text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>Método:</span>
              <span className="font-medium text-foreground flex items-center gap-2">
                {paymentMethodInfo.icon}
                {paymentMethodInfo.name}
              </span>
            </div>
            {transactionId && (
              <div className="flex justify-between items-center">
                <span>ID da Transação:</span>
                <span className="font-mono text-xs font-medium text-foreground bg-muted px-2 py-1 rounded-md break-all">{transactionId}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-4 pt-6">
          <Button asChild className="w-full" variant="outline">
            <Link href="/">Fazer Novo Pagamento</Link>
          </Button>
          <Button asChild className="w-full">
            <Link href="/history">Ver Histórico</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<Card className="w-full max-w-md h-[500px] animate-pulse" />}>
            <ConfirmationDetails />
        </Suspense>
    )
}
