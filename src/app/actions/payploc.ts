'use server';

import 'dotenv/config';
import { z } from 'zod';

const PAYPLOC_API_URL = 'https://sgdloeozxmbtsahygctf.supabase.co/functions/v1';
const PAYPLOC_API_KEY = process.env.PAYPLOC_API_KEY || process.env.NEXT_PUBLIC_PAYPLOC_API_KEY;

// Schema para os dados do cliente para PIX
const pixCustomerSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório."),
    cpf_cnpj: z.string().length(11, "CPF inválido. Deve conter 11 dígitos."),
    email: z.string().email("Email inválido."),
    phone: z.string().min(10, "Telefone é obrigatório."),
});

// Schema para criação de pagamento PIX
const createPixPaymentSchema = z.object({
  amount: z.number().positive(),
  description: z.string(),
  customer: pixCustomerSchema,
});

export type CreatePixPaymentInput = z.infer<typeof createPixPaymentSchema>;

export async function createPixPayment(input: CreatePixPaymentInput) {
  console.log('=== INICIANDO PAGAMENTO PIX V3 (ESTRUTURA ORIGINAL) ===');
  
  const validation = createPixPaymentSchema.safeParse(input);
  if (!validation.success) {
    console.error('Erro de validação:', validation.error.flatten());
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }
  
  if (!PAYPLOC_API_KEY) {
    throw new Error('A chave da API da Payploc não está configurada.');
  }

  console.log('Criando pagamento PIX com dados:', JSON.stringify(validation.data, null, 2));

  try {
    const response = await fetch(`${PAYPLOC_API_URL}/create-pix-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PAYPLOC_API_KEY,
      },
      body: JSON.stringify(validation.data),
    });

    console.log('PayPloc PIX Response Status:', response.status);
    
    const responseText = await response.text();
    console.log('PayPloc PIX Response Body:', responseText);
    console.log('PayPloc PIX Response Headers:', JSON.stringify([...response.headers.entries()], null, 2));

    if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }
        console.error('Payploc PIX Error Response:', errorData);
        console.error('Payploc PIX Error Details:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
        throw new Error(errorData.message || errorData.error || 'Erro ao criar pagamento PIX.');
    }
    
    const data = JSON.parse(responseText);
    console.log('PayPloc PIX Success:', data);

    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.pix_copy_paste)}`;

    return {
      qrCodeImage: qrCodeImageUrl,
      copyPasteCode: data.pix_copy_paste,
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


// Schema para dados do cliente para Cartão de Crédito
const creditCardCustomerSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório."),
    cpf_cnpj: z.string().length(11, "CPF inválido. Deve conter 11 dígitos."),
    email: z.string().email("Email inválido."),
    phone: z.string().min(10, 'Telefone inválido. Deve conter 10 ou 11 dígitos.'),
    postal_code: z.string().length(8, "CEP é obrigatório. Deve conter 8 dígitos."),
    street: z.string().optional(),
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
});

// Schema para endereço do cliente
const addressSchema = z.object({
    postal_code: z.string().length(8, "CEP inválido. Deve conter 8 dígitos."),
    street: z.string().optional(),
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
});

// Schema para criação de pagamento com cartão
const createCreditCardPaymentSchema = z.object({
    amount: z.number().positive(),
    description: z.string(),
    installments: z.number().min(1).max(12),
    customer: creditCardCustomerSchema,
    card: cardSchema,
});

export type CreateCreditCardPaymentInput = z.infer<typeof createCreditCardPaymentSchema>;

export async function createCreditCardPayment(input: CreateCreditCardPaymentInput) {
    console.log('=== INICIANDO PAGAMENTO CARTÃO V6 (SEM ADDRESS ANINHADO) ===');
    console.log('Input recebido:', JSON.stringify(input, null, 2));
    
    const validation = createCreditCardPaymentSchema.safeParse(input);
    if (!validation.success) {
        console.error("Erro de validação do Zod:", validation.error.flatten());
        throw new Error(validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '));
    }
    
    console.log('Validação OK, dados:', JSON.stringify(validation.data, null, 2));
    
    if (!PAYPLOC_API_KEY) {
        throw new Error('A chave da API da Payploc não está configurada.');
    }
    
    // Formata o CEP com hífen (XXXXX-XXX)
    const postalCode = validation.data.customer.postal_code;
    const formattedPostalCode = postalCode.length === 8 
        ? `${postalCode.substring(0, 5)}-${postalCode.substring(5)}` 
        : postalCode;
    
    // Envia os dados sem aninhar address (API espera campos no nível do customer)
    const payloadData = {
        amount: validation.data.amount,
        description: validation.data.description,
        installments: validation.data.installments,
        customer: {
            name: validation.data.customer.name,
            cpf_cnpj: validation.data.customer.cpf_cnpj,
            email: validation.data.customer.email,
            phone: validation.data.customer.phone,
            postal_code: formattedPostalCode,
            street: validation.data.customer.street || 'Avenida Paulista',
            number: validation.data.customer.number || '1578',
            neighborhood: validation.data.customer.neighborhood || 'Bela Vista',
            city: validation.data.customer.city || 'São Paulo',
            state: validation.data.customer.state || 'SP',
        },
        card: validation.data.card,
    };
    
    try {
        const payload = JSON.stringify(payloadData);
        console.log('Chamando API PayPloc...');
        console.log('Payload enviado:', payload);
        const response = await fetch(`${PAYPLOC_API_URL}/create-credit-card-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': PAYPLOC_API_KEY,
            },
            body: payload,
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { message: responseText };
            }
            console.error('Payploc Card Error Response:', errorData);
            throw new Error(errorData.message || errorData.error || 'Erro ao processar pagamento com cartão.');
        }

        const data = JSON.parse(responseText);
        console.log('Pagamento aprovado:', data);
        return {
            status: data.status,
            transactionId: data.transaction_id,
        };
    } catch (error: any) {
        console.error('Payploc Card Error:', error);
        throw new Error(error.message || 'Falha na comunicação com o provedor de pagamento.');
    }
}
