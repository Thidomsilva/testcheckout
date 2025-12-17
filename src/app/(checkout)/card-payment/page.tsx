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
import { createCreditCardPayment } from '@/app/actions/payploc';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const expiryDateRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;

const formSchema = z.object({
  cardholderName: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  cardNumber: z.string().min(19, 'Número do cartão inválido. Insira 16 dígitos.').max(19),
  expiryDate: z.string().regex(expiryDateRegex, { message: 'Data inválida (MM/AA).' }).refine(val => {
    const match = val.match(expiryDateRegex);
    if (!match) return false;
    const month = parseInt(match[1], 10);
    const year = parseInt(`20${match[2]}`, 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() é 0-indexed
    
    if (year < currentYear) return false; // Ano já passou
    if (year === currentYear && month < currentMonth) return false; // Mês já passou no ano corrente
    
    return true;
  }, { message: 'Cartão expirado.' }),
  cvc: z.string().min(3, 'CVC inválido.').max(4, 'CVC inválido.'),
  customerName: z.string().min(3, { message: "Nome do cliente é obrigatório."}),
  customerCpf: z.string().length(14, { message: 'CPF inválido. Insira 11 dígitos.' }),
  customerEmail: z.string().email({ message: "Email inválido." }),
  customerPhone: z.string().min(10, { message: 'Telefone inválido.' }),
  customerPostalCode: z.string().min(8, { message: 'CEP inválido. Insira 8 dígitos.' }),
  customerAddressNumber: z.string().min(1, { message: "Número do endereço é obrigatório."}),
});

function CardPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const amount = searchParams.get('amount');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardholderName: 'CLIENTE TESTE',
      cardNumber: '4111 1111 1111 1111',
      expiryDate: '12/30',
      cvc: '123',
      customerName: 'Cliente Teste',
      customerCpf: '123.456.789-01',
      customerEmail: 'teste@exemplo.com',
      customerPhone: '(11) 99999-9999',
      customerPostalCode: '01310-100',
      customerAddressNumber: '100',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const amountNumber = Number(amount);
    if (!amount || isNaN(amountNumber) || amountNumber <= 0) {
        toast({ title: 'Erro', description: 'Valor de pagamento inválido.', variant: 'destructive' });
        return;
    }
    
    const [expiryMonth, expiryYear] = values.expiryDate.split('/');

    try {
      const result = await createCreditCardPayment({
        amount: amountNumber,
        description: `Pagamento com Cartão - FlexiPay`,
        installments: 1,
        customer: {
            name: values.customerName,
            cpfCnpj: values.customerCpf,
            email: values.customerEmail,
            phone: values.customerPhone,
            postalCode: values.customerPostalCode,
            addressNumber: Number(values.customerAddressNumber),
        },
        card: {
            holderName: values.cardholderName,
            number: values.cardNumber,
            expiryMonth: expiryMonth,
            expiryYear: `20${expiryYear}`,
            ccv: values.cvc,
        }
      });

      if (result.status === 'paid' || result.status === 'authorized') {
        router.push(`/confirmation?amount=${amount}&method=card&transactionId=${result.transactionId}`);
      } else {
        throw new Error(`Pagamento ${result.status}`);
      }
    } catch (error: any) {
      console.error("Payment failed:", error);
      toast({
        title: 'Erro no Pagamento',
        description: error.message || 'Não foi possível processar seu pagamento. Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    }
  }

  const amountNumber = Number(amount);
  const formattedAmount = isNaN(amountNumber) ? 'R$ 0,00' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountNumber);

  if (!amount || isNaN(amountNumber) || amountNumber <= 0) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader><CardTitle>Valor Inválido</CardTitle><CardDescription>Por favor, volte e insira um valor de pagamento válido.</CardDescription></CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline"><CreditCard /> Pagamento com Cartão</CardTitle>
        <CardDescription>Valor a pagar: <span className="font-bold text-foreground">{formattedAmount}</span></CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Accordion type="single" collapsible defaultValue='item-1' className='w-full'>
              <AccordionItem value="item-1">
                <AccordionTrigger className='text-base font-semibold'>Dados do Cartão</AccordionTrigger>
                <AccordionContent className='pt-4 space-y-4'>
                  <FormField control={form.control} name="cardNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Cartão</FormLabel>
                      <FormControl><Input {...field} placeholder="0000 0000 0000 0000" onChange={e => {
                        const value = e.target.value.replace(/\D/g, '').substring(0, 16);
                        const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                        field.onChange(formatted);
                      }}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="cardholderName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome no Cartão</FormLabel>
                      <FormControl><Input {...field} placeholder="Seu Nome Completo" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="expiryDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validade</FormLabel>
                        <FormControl><Input {...field} placeholder="MM/AA" onChange={e => {
                          let value = e.target.value.replace(/\D/g, '').substring(0, 4);
                          if (value.length > 2) { value = value.substring(0, 2) + '/' + value.substring(2); }
                          field.onChange(value);
                        }}/></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="cvc" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVC</FormLabel>
                        <FormControl><Input {...field} placeholder="123" maxLength={3} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className='text-base font-semibold'>Dados do Cliente</AccordionTrigger>
                <AccordionContent className='pt-4 space-y-4'>
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                        <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} placeholder="Seu Nome" /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="customerCpf" render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl><Input {...field} placeholder="000.000.000-00" onChange={e => {
                                let value = e.target.value.replace(/\D/g, '').substring(0, 11);
                                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                field.onChange(value);
                              }}/></FormControl>
                              <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="customerEmail" render={({ field }) => (
                           <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" placeholder="seu@email.com" /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                    <FormField control={form.control} name="customerPhone" render={({ field }) => (
                        <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} placeholder="(11) 99999-9999" /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="customerPostalCode" render={({ field }) => (
                            <FormItem className="col-span-2"><FormLabel>CEP</FormLabel><FormControl><Input {...field} placeholder="00000-000" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="customerAddressNumber" render={({ field }) => (
                            <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} placeholder="123" /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Button type="submit" className="w-full h-11" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>) : (`Pagar ${formattedAmount}`)}
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