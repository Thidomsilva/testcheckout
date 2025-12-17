import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Endpoint para receber webhooks da Payploc.
 * A Payploc enviará atualizações de status de transação para esta URL.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.PAYPLOC_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('PAYPLOC_WEBHOOK_SECRET não está configurado.');
    // É importante retornar 200 para não indicar o erro de configuração ao mundo externo
    return NextResponse.json({ received: true, error: 'Internal configuration error' });
  }

  const signature = req.headers.get('x-payploc-signature');
  if (!signature) {
    console.warn('Webhook recebido sem assinatura.');
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

    const event = JSON.parse(rawBody);

    console.log('Webhook da Payploc verificado e recebido:', JSON.stringify(event, null, 2));

    const eventType = event?.eventType;
    const data = event?.data;
    
    if (eventType === 'transaction.updated' && data) {
      const transactionId = data.transactionId;
      const status = data.status;

      if (transactionId && status) {
        console.log(`Transação ${transactionId} atualizada para ${status}`);
        // TODO: Aqui você atualizaria o status da transação no seu banco de dados.
        // Ex: await updateTransactionStatusInDb(transactionId, status);
      } else {
        console.warn('Webhook "transaction.updated" recebido, mas falta transactionId ou status.', { data });
      }
    } else {
        console.warn('Webhook recebido com formato inesperado ou sem os dados necessários.', { event });
    }
    
    return NextResponse.json({ received: true });

  } catch (error: any) {
    if (error instanceof SyntaxError) {
      console.error('Erro ao processar webhook da Payploc: Corpo da requisição inválido ou não é JSON.');
      return new NextResponse('Webhook Error: Invalid request body', { status: 400 });
    }
    
    console.error('Erro interno ao processar webhook da Payploc:', error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
