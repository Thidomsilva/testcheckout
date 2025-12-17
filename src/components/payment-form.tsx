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
    defaultValues: {
      amount: 0,
    },
  });
  
  const [displayValue, setDisplayValue] = React.useState('0,00');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setDisplayValue(rawValue);

    // Convert BRL string to a float number for the form
    const numericValue = parseFloat(rawValue.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(numericValue)) {
      form.setValue('amount', numericValue, { shouldValidate: true });
    } else {
        form.setValue('amount', 0, { shouldValidate: true });
    }
  };

  const handleBlur = () => {
    const value = form.getValues('amount');
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
    }).format(value || 0);
    setDisplayValue(formatted);
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
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-lg text-muted-foreground">
                          R$
                        </span>
                        <Input
                          placeholder="0,00"
                          className="pl-12 text-3xl h-16 text-right font-bold"
                          onChange={handleAmountChange}
                          onBlur={handleBlur}
                          onFocus={(e) => {
                            // When user focuses, show the raw number for editing
                            if (e.target.value === '0,00') {
                                setDisplayValue('');
                            } else {
                                const value = form.getValues('amount');
                                setDisplayValue(String(value));
                            }
                          }}
                          value={displayValue}
                          autoComplete="off"
                          inputMode='decimal'
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
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
