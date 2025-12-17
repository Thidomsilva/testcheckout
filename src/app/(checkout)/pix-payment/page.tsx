'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardCopy, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createPixPayment } from '@/app/actions/payploc';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

function PixPaymentFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState<{ qrCodeImage: string; copyPasteCode: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const amount = searchParams.get('amount');
  
  useEffect(() => {
    const generatePix = async () => {
      const amountNumber = Number(amount);
      if (!amount || isNaN(amountNumber) || amountNumber <= 0) {
        setError('Valor de pagamento inválido.');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        // Mock customer data for now
        const paymentInput = {
          amount: amountNumber,
          description: `Pagamento FlexiPay no valor de R$ ${amountNumber.toFixed(2)}`,
          customer: {
            name: 'Cliente Teste',
            cpfCnpj: '12345678901', // This should be collected from the user
            email: 'teste@exemplo.com',
          },
        };
        const result = await createPixPayment(paymentInput);
        setPixData(result);

        // A confirmação real do pagamento virá através do webhook da Payploc.
        // O código de simulação foi removido.

      } catch (e: any) {
        setError(e.message || 'Não foi possível gerar o código Pix. Tente novamente.');
        toast({
          title: 'Erro ao gerar Pix',
          description: e.message || 'Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    generatePix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);
  
  const handleCopy = () => {
    if (pixData?.copyPasteCode) {
        navigator.clipboard.writeText(pixData.copyPasteCode);
        setCopied(true);
        toast({ title: 'Código Pix copiado!' });
        setTimeout(() => setCopied(false), 2000);
    }
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
        {isLoading ? (
            <div className='flex flex-col items-center justify-center gap-4 h-80'>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className='text-muted-foreground'>Gerando seu código Pix...</p>
            </div>
        ) : error ? (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : pixData && (
            <>
                <div className="p-2 bg-white rounded-lg border">
                    <Image src={pixData.qrCodeImage} alt="QR Code Pix" width={200} height={200} />
                </div>
                <p className="text-sm text-muted-foreground">Abra o app do seu banco e escaneie o QR Code.</p>
                
                <div className="w-full flex items-center gap-4 text-muted-foreground">
                    <Separator className="flex-1"/>
                    <span className="text-xs">OU</span>
                    <Separator className="flex-1"/>
                </div>
                
                <p className="text-sm text-muted-foreground">Copie o código Pix:</p>
                <div className="w-full p-3 border rounded-md bg-muted text-xs break-all text-muted-foreground text-left">
                    {pixData.copyPasteCode}
                </div>
                <Button onClick={handleCopy} className="w-full h-11" variant="outline">
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                    {copied ? 'Copiado!' : 'Copiar Código'}
                </Button>
                <div className="mt-4 text-sm text-accent-foreground animate-pulse font-medium">
                    Aguardando confirmação de pagamento...
                </div>
            </>
        )}
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
