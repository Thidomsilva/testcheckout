import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para receber webhooks da Payploc.
 * A Payploc enviará atualizações de status de transação para esta URL.
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    console.log('Webhook da Payploc recebido:', JSON.stringify(event, null, 2));

    // Lógica para verificar a assinatura do webhook (usando o seu webhook secret)
    // para garantir que a requisição veio da Payploc deve ser adicionada aqui.

    // Verificação segura das propriedades do evento
    const eventType = event?.eventType;
    const data = event?.data;
    
    if (eventType === 'transaction.updated' && data) {
      const transactionId = data.transactionId;
      const status = data.status;

      if (transactionId && status) {
        console.log(`Transação ${transactionId} atualizada para ${status}`);
        // Aqui você atualizaria o status da transação no seu banco de dados.
        // Ex: await updateTransactionStatus(transactionId, status);
      } else {
        console.warn('Webhook "transaction.updated" recebido, mas falta transactionId ou status.', { data });
      }
    } else {
        console.warn('Webhook recebido com formato inesperado ou sem os dados necessários.', { event });
    }
    
    // Retorna uma resposta 200 para confirmar o recebimento do webhook.
    return NextResponse.json({ received: true });

  } catch (error: any) {
    // Se o corpo estiver vazio ou não for JSON, req.json() pode falhar.
    if (error instanceof SyntaxError) {
      console.error('Erro ao processar webhook da Payploc: Corpo da requisição inválido ou não é JSON.');
      return new NextResponse('Webhook Error: Invalid request body', { status: 400 });
    }
    
    console.error('Erro interno ao processar webhook da Payploc:', error);
    // Retorna 500 para outros erros inesperados no servidor.
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
