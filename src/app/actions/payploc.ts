'use server';

import { z } from 'zod';

const PAYPLOC_API_URL = 'https://sgdloeozxmbtsahygctf.supabase.co/functions/v1';
const PAYPLOC_API_KEY = process.env.PAYPLOC_API_KEY;

// Schema para os dados do cliente para PIX
const pixCustomerSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório."),
    cpf_cnpj: z.string().length(11, "CPF inválido. Deve conter 11 dígitos."),
    email: z.string().email("Email inválido."),
});

// Schema para criação de pagamento PIX
const createPixPaymentSchema = z.object({
  amount: z.number().positive(),
  description: z.string(),
  customer: pixCustomerSchema,
});

export type CreatePixPaymentInput = z.infer<typeof createPixPaymentSchema>;

export async function createPixPayment(input: CreatePixPaymentInput) {
  const validation = createPixPaymentSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }
  
  if (!PAYPLOC_API_KEY) {
    throw new Error('A chave da API da Payploc não está configurada.');
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
        console.error('Payploc PIX Error Response:', errorData);
        throw new Error(errorData.message || 'Erro ao criar pagamento PIX.');
    }
    
    const data = await response.json();

    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.pixCopyPaste)}`;

    return {
      qrCodeImage: qrCodeImageUrl,
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
    number: z.string().length(16, 'Número do cartão inválido. Deve conter 16 dígitos.'),
    expiryMonth: z.string().length(2, "Mês de validade inválido."),
    expiryYear: z.string().length(4, "Ano de validade inválido."),
    ccv: z.string().min(3, 'CVC deve ter 3 ou 4 dígitos.').max(4, 'CVC deve ter 3 ou 4 dígitos.'),
});

// Schema para dados do endereço
const addressSchema = z.object({
    postal_code: z.string().length(8, 'CEP inválido. Deve conter 8 dígitos.'),
});

// Schema para dados do cliente para Cartão de Crédito
const creditCardCustomerSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório."),
    cpf_cnpj: z.string().length(11, "CPF inválido. Deve conter 11 dígitos."),
    email: z.string().email("Email inválido."),
    phone: z.string().min(10, 'Telefone inválido. Deve conter 10 ou 11 dígitos.'),
});

// Schema para criação de pagamento com cartão
const createCreditCardPaymentSchema = z.object({
    amount: z.number().positive(),
    description: z.string(),
    installments: z.literal(1),
    customer: creditCardCustomerSchema,
    address: addressSchema,
    card: cardSchema,
});

export type CreateCreditCardPaymentInput = z.infer<typeof createCreditCardPaymentSchema>;

export async function createCreditCardPayment(input: CreateCreditCardPaymentInput) {
    const validation = createCreditCardPaymentSchema.safeParse(input);
    if (!validation.success) {
        console.error("Erro de validação do Zod:", validation.error.flatten());
        throw new Error(validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '));
    }
    
    if (!PAYPLOC_API_KEY) {
        throw new Error('A chave da API da Payploc não está configurada.');
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
            console.error('Payploc Card Error Response:', errorData);
            throw new Error(errorData.message || JSON.stringify(errorData) || 'Erro ao processar pagamento com cartão.');
        }

        const data = await response.json();
        return {
            status: data.status,
            transactionId: data.transactionId || data.transaction_id,
        };
    } catch (error: any) {
        console.error('Payploc Card Error:', error);
        throw new Error(error.message || 'Falha na comunicação com o provedor de pagamento.');
    }
}
