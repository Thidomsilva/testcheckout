'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  cardholderName: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  cardNumber: z.string()
    .refine((val) => val.replace(/\s/g, '').length === 16 && /^\d+$/.test(val.replace(/\s/g, '')), {
      message: 'Número do cartão inválido. Insira 16 dígitos.',
    }),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Data inválida (MM/AA).' })
    .refine(val => {
        const [month, year] = val.split('/');
        const expiryDate = new Date(parseInt(`20${year}`), parseInt(month) - 1);
        const currentDate = new Date();
        currentDate.setHours(0,0,0,0);
        return expiryDate >= currentDate;
    }, { message: 'Cartão expirado.' }),
  cvc: z.string().regex(/^\d{3,4}$/, { message: 'CVC inválido.' }),
});

function CardPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const amount = searchParams.get('amount');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvc: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const transactionId = `txn_${Date.now()}`;
      router.push(`/confirmation?amount=${amount}&method=card&transactionId=${transactionId}`);
    } catch (error) {
      toast({
        title: 'Erro no Pagamento',
        description: 'Não foi possível processar seu pagamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  }

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
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <CreditCard />
          Pagamento com Cartão
        </CardTitle>
        <CardDescription>
          Valor a pagar: <span className="font-bold text-foreground">{formattedAmount}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do Cartão</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0000 0000 0000 0000" onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 16);
                      const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                      field.onChange(formatted);
                    }}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="cardholderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome no Cartão</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Seu Nome Completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="MM/AA" onChange={e => {
                        let value = e.target.value.replace(/\D/g, '').substring(0, 4);
                        if (value.length > 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2);
                        }
                        field.onChange(value);
                      }}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cvc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVC</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123" maxLength={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                `Pagar ${formattedAmount}`
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function CardPaymentPage() {
  return (
    <Suspense fallback={<Card className="w-full h-96 animate-pulse"/>}>
      <CardPaymentForm />
    </Suspense>
  )
}
