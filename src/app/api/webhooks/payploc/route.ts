'use server';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Endpoint para receber webhooks da Payploc.
 * A Payploc enviará atualizações de status de transação para esta URL.
 */
export async function POST(req: NextRequest) {
  console.log('Webhook da Payploc recebido.');

  const webhookSecret = process.env.PAYPLOC_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('PAYPLOC_WEBHOOK_SECRET não está configurado.');
    // Retorna 200 para não indicar o erro de configuração ao mundo externo,
    // mas loga o erro internamente.
    return NextResponse.json({ received: true, error: 'Internal configuration error' }, { status: 200 });
  }

  const signature = req.headers.get('x-payploc-signature');
  if (!signature) {
    console.warn('Webhook recebido sem assinatura (x-payploc-signature).');
    return new NextResponse('Signature missing', { status: 401 });
  }

  try {
    const rawBody = await req.text();

    // Verificando a assinatura do webhook
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('Assinatura de webhook inválida.');
      return new NextResponse('Invalid signature', { status: 403 });
    }
    
    console.log('Assinatura do webhook verificada com sucesso.');

    // Agora que a assinatura é válida, podemos processar o evento.
    const event = JSON.parse(rawBody);

    // Log do evento completo para depuração
    console.log('Evento da Payploc:', JSON.stringify(event, null, 2));

    // Lógica para lidar com o evento 'transaction.updated'
    if (event?.eventType === 'transaction.updated' && event?.data) {
      const { transactionId, status } = event.data;

      if (transactionId && status) {
        console.log(`[Webhook] Transação ${transactionId} atualizada para ${status}`);
        // TODO: Implementar a lógica para atualizar o status da transação no seu banco de dados.
        // Ex: await updateTransactionStatusInDb(transactionId, status);

        if (status === 'paid' || status === 'authorized') {
            console.log(`[Webhook] Pagamento para a transação ${transactionId} foi confirmado.`);
        }

      } else {
        console.warn('[Webhook] Evento "transaction.updated" recebido, mas falta transactionId ou status.', { data: event.data });
      }
    } else {
        console.warn('[Webhook] Evento recebido com formato inesperado ou tipo de evento não tratado.', { eventType: event?.eventType });
    }
    
    // Responda com 200 para confirmar o recebimento.
    return NextResponse.json({ received: true });

  } catch (error: any) {
    if (error instanceof SyntaxError) {
      console.error('Erro ao processar webhook da Payploc: Corpo da requisição inválido (não é JSON).');
      return new NextResponse('Webhook Error: Invalid request body', { status: 400 });
    }
    
    console.error('Erro interno ao processar webhook da Payploc:', error);
    // Em caso de outros erros, é melhor retornar 500 para que a Payploc possa tentar novamente.
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
