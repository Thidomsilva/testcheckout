import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para receber webhooks da Payploc.
 * A Payploc enviará atualizações de status de transação para esta URL.
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    console.log('Webhook da Payploc recebido:', JSON.stringify(event, null, 2));

    // TODO: Adicionar lógica para verificar a assinatura do webhook (usando o seu webhook secret)
    // para garantir que a requisição veio da Payploc.

    // Acessando os dados de forma segura
    const eventType = event?.eventType;
    const data = event?.data;
    
    if (eventType === 'transaction.updated' && data) {
      const { transactionId, status } = data;

      if (transactionId && status) {
        console.log(`Transação ${transactionId} atualizada para ${status}`);
        // Aqui você atualizaria o status da transação no seu banco de dados.
        // Ex: await updateTransactionStatus(transactionId, status);
      } else {
        console.warn('Webhook "transaction.updated" recebido sem transactionId ou status.');
      }
    } else {
        console.warn('Webhook recebido com formato inesperado ou sem dados:', event);
    }
    
    // Retorna uma resposta 200 para confirmar o recebimento do webhook.
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Erro ao processar webhook da Payploc:', error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
