'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardCopy, Check, Loader2, QrCode } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createPixPayment } from '@/app/actions/payploc';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  customerName: z.string().min(3, { message: 'Nome do cliente é obrigatório.' }),
  customerCpf: z.string().refine((val) => val.replace(/[^\d]/g, '').length === 11, { message: 'CPF inválido. Insira 11 dígitos.' }),
  customerEmail: z.string().email({ message: 'Email inválido.' }),
});

function PixPaymentFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState<{ qrCodeImage: string; copyPasteCode: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = searchParams.get('amount');
  const amountNumber = Number(amount);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: 'Cliente Teste',
      customerCpf: '12345678901',
      customerEmail: 'teste@exemplo.com',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!amount || isNaN(amountNumber) || amountNumber <= 0) {
      setError('Valor de pagamento inválido.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const paymentInput = {
        amount: amountNumber,
        description: `Pagamento FlexiPay no valor de R$ ${amountNumber.toFixed(2)}`,
        customer: {
          name: values.customerName,
          cpfCnpj: values.customerCpf,
          email: values.customerEmail,
        },
      };
      const result = await createPixPayment(paymentInput);
      setPixData(result);
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
  }

  const handleCopy = () => {
    if (pixData?.copyPasteCode) {
      navigator.clipboard.writeText(pixData.copyPasteCode);
      setCopied(true);
      toast({ title: 'Código Pix copiado!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  if (pixData) {
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
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline"><QrCode /> Pagar com Pix</CardTitle>
        <CardDescription>
          Confirme seus dados para gerar o código Pix no valor de <span className="font-bold text-foreground">{formattedAmount}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <FormField control={form.control} name="customerName" render={({ field }) => (
                <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} placeholder="Seu Nome" /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="customerCpf" render={({ field }) => (
                    <FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} placeholder="Apenas números" maxLength={11} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="customerEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" placeholder="seu@email.com" /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando Pix...</>) : (`Gerar Pix`)}
            </Button>
          </form>
        </Form>
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
