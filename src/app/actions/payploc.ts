'use server';

import { z } from 'zod';

const PAYPLOC_API_URL = 'https://sgdloeozxmbtsahygctf.supabase.co/functions/v1';
const PAYPLOC_API_KEY = process.env.PAYPLOC_API_KEY || 'pp_test_sua_chave_aqui';

// Schema para os dados do cliente
const customerSchema = z.object({
    name: z.string(),
    cpfCnpj: z.string().length(11, "CPF inválido."),
    email: z.string().email("Email inválido."),
});

// Schema para criação de pagamento PIX
const createPixPaymentSchema = z.object({
  amount: z.number().positive(),
  description: z.string(),
  customer: customerSchema,
});

export type CreatePixPaymentInput = z.infer<typeof createPixPaymentSchema>;

export async function createPixPayment(input: CreatePixPaymentInput) {
  const validation = createPixPaymentSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  try {
    const response = await fetch(`${PAYPLOC_API_URL}/create-pix-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PAYPLOC_API_KEY,
      },
      body: JSON.stringify(validation.data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar pagamento PIX.');
    }
    
    const data = await response.json();
    return {
      qrCodeImage: data.pixQrCode, // Assuming this is a Data URI for the image
      copyPasteCode: data.pixCopyPaste,
    };
  } catch (error: any) {
    console.error('Payploc PIX Error:', error);
    throw new Error(error.message || 'Falha na comunicação com o provedor de pagamento.');
  }
}

// Schema para os dados do cartão de crédito
const cardSchema = z.object({
    holderName: z.string(),
    number: z.string(),
    expiryMonth: z.string(),
    expiryYear: z.string(),
    ccv: z.string(),
});

// Schema para criação de pagamento com cartão
const createCreditCardPaymentSchema = z.object({
    amount: z.number().positive(),
    description: z.string(),
    installments: z.literal(1),
    customer: customerSchema.extend({
        phone: z.string(),
        postalCode: z.string(),
        addressNumber: z.string(),
    }),
    card: cardSchema,
});

export type CreateCreditCardPaymentInput = z.infer<typeof createCreditCardPaymentSchema>;

export async function createCreditCardPayment(input: CreateCreditCardPaymentInput) {
    const validation = createCreditCardPaymentSchema.safeParse(input);
    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    try {
        const response = await fetch(`${PAYPLOC_API_URL}/create-credit-card-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': PAYPLOC_API_KEY,
            },
            body: JSON.stringify(validation.data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao processar pagamento com cartão.');
        }

        const data = await response.json();
        return {
            status: data.status,
            transactionId: data.transactionId,
        };
    } catch (error: any) {
        console.error('Payploc Card Error:', error);
        throw new Error(error.message || 'Falha na comunicação com o provedor de pagamento.');
    }
}
