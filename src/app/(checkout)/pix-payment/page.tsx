'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QrCode, ClipboardCopy, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

function PixPaymentFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const amount = searchParams.get('amount');
  
  const pixCode = '00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5913FlexiPay User6009SAO PAULO62070503***6304E2D5';

  useEffect(() => {
    if (!amount) return;
    
    const timer = setTimeout(() => {
      const transactionId = `txn_${Date.now()}`;
      router.push(`/confirmation?amount=${amount}&method=pix&transactionId=${transactionId}`);
    }, 8000);

    return () => clearTimeout(timer);
  }, [amount, router]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({ title: 'Código Pix copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const amountNumber = Number(amount);
  const formattedAmount = isNaN(amountNumber)
    ? 'R$ 0,00'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountNumber);
  
  if (!amount || isNaN(amountNumber) || amountNumber <= 0) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>Valor Inválido</CardTitle>
          <CardDescription>Por favor, volte e insira um valor de pagamento válido.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg text-center">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 font-headline">
          Pague com Pix
        </CardTitle>
        <CardDescription>
          Valor: <span className="font-bold text-foreground">{formattedAmount}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-lg border">
            <QrCode className="h-48 w-48 text-black" />
        </div>
        <p className="text-sm text-muted-foreground">Abra o app do seu banco e escaneie o QR Code.</p>
        
        <div className="w-full flex items-center gap-4 text-muted-foreground">
            <Separator className="flex-1"/>
            <span className="text-xs">OU</span>
            <Separator className="flex-1"/>
        </div>
        
        <p className="text-sm text-muted-foreground">Copie o código Pix:</p>
        <div className="w-full p-3 border rounded-md bg-muted text-xs break-all text-muted-foreground text-left">
            {pixCode}
        </div>
        <Button onClick={handleCopy} className="w-full h-11" variant="outline">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar Código'}
        </Button>
        <div className="mt-4 text-sm text-accent-foreground animate-pulse font-medium">
            Aguardando confirmação de pagamento...
        </div>
      </CardContent>
    </Card>
  );
}

export default function PixPaymentPage() {
    return (
      <Suspense fallback={<Card className="w-full h-96 animate-pulse"/>}>
        <PixPaymentFlow />
      </Suspense>
    )
  }
