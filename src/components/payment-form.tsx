'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CreditCard, QrCode } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from './logo';

const formSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Por favor, insira um valor válido.' })
    .positive({ message: 'O valor deve ser maior que zero.' }),
});

export function PaymentForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseFloat(rawValue.replace(/[^0-9]/g, '')) / 100;

    if (!isNaN(numericValue)) {
        form.setValue('amount', numericValue, { shouldValidate: true });
        e.target.value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
    } else {
        form.setValue('amount', 0, { shouldValidate: true });
        e.target.value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0);
    }
  };
  
  const handlePaymentMethod = async (method: 'card' | 'pix') => {
    const isValid = await form.trigger('amount');
    if (isValid) {
      const amountValue = form.getValues('amount');
      const url = `/${method}-payment?amount=${amountValue}`;
      router.push(url);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.14)-1px)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Pagamento Flexível</CardTitle>
          <CardDescription>Insira o valor e escolha como pagar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Valor do Pagamento</FormLabel>
                    <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          className="text-3xl h-16 text-center font-bold"
                          onChange={handleAmountChange}
                          autoComplete="off"
                          inputMode='decimal'
                        />
                    </FormControl>
                    <FormMessage className='text-center'/>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4">
                <Button type="button" size="lg" variant="secondary" className="h-12 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handlePaymentMethod('pix')}>
                  <QrCode className="mr-2" />
                  Pagar com Pix
                </Button>
                <Button type="button" size="lg" className="h-12" onClick={() => handlePaymentMethod('card')}>
                  <CreditCard className="mr-2" />
                  Pagar com Cartão
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">Seus pagamentos são processados com segurança.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
