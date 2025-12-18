import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Webhook endpoint usando Pages Router (mais compatível com webhooks externos)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // Responder OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET para testar
  if (req.method === 'GET') {
    console.log('GET request to webhook endpoint');
    return res.status(200).json({
      status: 'ok',
      message: 'Webhook endpoint is working',
      timestamp: new Date().toISOString()
    });
  }

  // POST - receber webhook
  if (req.method === 'POST') {
    console.log('========================================');
    console.log('✅ Webhook POST da Payploc recebido!');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    try {
      const event = req.body;
      
      const eventType = event?.type || event?.eventType || event?.event;
      const eventData = event?.data || event;

      console.log('Event Type:', eventType);
      console.log('Event Data:', JSON.stringify(eventData, null, 2));

      // Buscar transaction ID
      const transactionId = eventData?.transactionId || 
                           eventData?.transaction_id || 
                           eventData?.id ||
                           event?.transactionId ||
                           event?.transaction_id ||
                           event?.id;
      
      const status = eventData?.status || event?.status;

      console.log('Transaction ID extraído:', transactionId);
      console.log('Status extraído:', status);

      if (transactionId) {
        console.log(`[Webhook] ✅ Transação ${transactionId} - Status: ${status || 'N/A'}`);
        
        if (status === 'paid' || status === 'authorized' || status === 'confirmed') {
          console.log(`[Webhook] 💰 Pagamento confirmado para transação ${transactionId}`);
          // TODO: Atualizar banco de dados
        }
      } else {
        console.warn('[Webhook] ⚠️ Transaction ID não encontrado no payload');
      }

      console.log('========================================');
      
      return res.status(200).json({ 
        received: true,
        transactionId,
        status 
      });

    } catch (error: any) {
      console.error('❌ Erro ao processar webhook:', error);
      console.error('Stack:', error.stack);
      console.log('========================================');
      
      return res.status(200).json({ 
        error: error.message || 'Unknown error',
        received: false 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
