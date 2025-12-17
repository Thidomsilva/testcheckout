import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para receber webhooks da Payploc.
 * A Payploc enviará atualizações de status de transação para esta URL.
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    // TODO: Adicionar lógica para verificar a assinatura do webhook (usando o seu webhook secret)
    // para garantir que a requisição veio da Payploc.

    console.log('Webhook da Payploc recebido:', JSON.stringify(event, null, 2));

    // Exemplo de como você poderia processar o evento:
    const { eventType, data } = event;

    if (eventType === 'transaction.updated') {
      const { transactionId, status } = data;
      console.log(`Transação ${transactionId} atualizada para ${status}`);
      // Aqui você atualizaria o status da transação no seu banco de dados.
    }
    
    // Retorna uma resposta 200 para confirmar o recebimento do webhook.
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Erro ao processar webhook da Payploc:', error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
