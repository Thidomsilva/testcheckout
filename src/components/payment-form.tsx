'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CreditCard, QrCode } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from './logo';

const formSchema = z.object({
  amount: z.string().refine(
    (value) => {
      const num = parseFloat(value.replace('.', '').replace(',', '.'));
      return !isNaN(num) && num > 0;
    },
    {
      message: 'Por favor, insira um valor válido e maior que zero.',
    }
  ),
});

export function PaymentForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      amount: '',
    },
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, ''); // Remove non-digits
    
    // Pad with zeros if needed
    value = value.padStart(3, '0');

    value = value.replace(/(\d+)(\d{2})$/, '$1,$2'); // Add comma for cents
    if(value.length > 7) { // 1.234,56
        value = value.replace(/^(\d+)(\d{3}),(\d{2})$/, '$1.$2,$3');
    }
    
    form.setValue('amount', value);
  };
  
  const handlePaymentMethod = async (method: 'card' | 'pix') => {
    const isValid = await form.trigger('amount');
    if (isValid) {
      const amountValue = form.getValues('amount').replace('.', '').replace(',', '.');
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
                          {...field}
                          placeholder="0,00"
                          className="pl-12 text-3xl h-16 text-right font-bold"
                          onChange={handleAmountChange}
                          autoComplete="off"
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
